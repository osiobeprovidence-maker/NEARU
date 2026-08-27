// POST /api/verifications/nin/payment
// Initiates a paid NIN verification: creates an internal verification
// transaction and a Paystack charge for exactly ₦150. The frontend never
// supplies the amount and never touches Ninja.

import { requireFirebaseUser, resolveConvexUser } from "../../_lib/auth.js";
import { callConvexMutation } from "../../_lib/convexClient.js";
import { NIN_CONFIG, serverSecret, grossMarginKobo } from "../../_lib/config.js";
import { ApiError, ERRORS, ok, sendError, validationError } from "../../_lib/errors.js";
import { rateLimit } from "../../_lib/rateLimit.js";
import { createHash, randomBytes } from "crypto";

function hashNin(nin) {
  return createHash("sha256").update(`nin:${nin}`).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    // 1. Authenticate the caller.
    const firebaseClaims = await requireFirebaseUser(req);
    const convexUser = await resolveConvexUser(firebaseClaims);
    if (!convexUser) {
      throw new ApiError(ERRORS.AUTHENTICATION_ERROR, "Account not found.", 404);
    }

    // 2. Rate limit per user.
    const rl = rateLimit(req, { userId: convexUser._id, max: 5, windowMs: 60000 });
    if (rl) throw rl;

    // 3. Validate the supplied NIN data.
    const { nin, firstName, lastName, dateOfBirth } = req.body || {};
    const cleanNIN = String(nin || "").replace(/\D/g, "");
    if (cleanNIN.length !== 11) {
      throw validationError("Please enter a valid 11-digit NIN.");
    }
    if (!firstName || !String(firstName).trim()) {
      throw validationError("First name is required.");
    }
    if (!lastName || !String(lastName).trim()) {
      throw validationError("Last name is required.");
    }

    // 4. Backend determines the price — never trust the client.
    const amountKobo = NIN_CONFIG.customerAmountKobo; // ₦150
    const price = amountKobo / 100; // Paystack expects naira value with 2 dp
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      throw new ApiError(ERRORS.PAYMENT_ERROR, "Payment service not configured.", 503);
    }

    // 5. Create a unique internal payment reference + internal transaction.
    const internalRef = `RALLYNIN-${Date.now()}-${randomBytes(6).toString("hex")}`;
    const paymentRef = `RALLY-NIN-${randomBytes(12).toString("hex")}`;

    const txId = await callConvexMutation(
      "verifications:createPaymentTransaction",
      {
        userId: convexUser._id,
        type: NIN_CONFIG.type,
        provider: NIN_CONFIG.provider,
        amountKobo,
        currency: NIN_CONFIG.currency,
        customerAmountKobo: NIN_CONFIG.customerAmountKobo,
        providerCostKobo: NIN_CONFIG.providerCostKobo,
        grossMarginKobo: grossMarginKobo(),
        paymentReference: paymentRef,
        ninHash: hashNin(cleanNIN),
        pendingNin: cleanNIN,
        verifiedFirstName: String(firstName).trim(),
        verifiedLastName: String(lastName).trim(),
        verifiedDob: dateOfBirth ? String(dateOfBirth) : undefined,
        serverSecret: serverSecret(),
      }
    );

    // 6. Initiate the Paystack transaction.
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paystackSecret}`,
      },
      body: JSON.stringify({
        email: convexUser.email || firebaseClaims.email,
        amount: amountKobo, // kobo
        currency: "NGN",
        reference: paymentRef,
        metadata: {
          verificationTxId: txId,
          internalRef,
        },
      }),
    });

    const paystackBody = await paystackRes.json().catch(() => ({}));

    if (!paystackRes.ok || !paystackBody.status || !paystackBody.data) {
      // Payment init failed — mark the transaction payment-pending/failed.
      try {
        await callConvexMutation("verifications:markPaymentFailed", {
          paymentReference: paymentRef,
          failureReason: "PAYSTACK_INITIALIZE_FAILED",
          serverSecret: serverSecret(),
        });
      } catch {}
      throw new ApiError(ERRORS.PAYMENT_ERROR, "Could not start payment. Please try again.", 502);
    }

    // 7. Persist paystack reference + payment-pending state.
    try {
      await callConvexMutation("verifications:markPaymentPending", {
        paymentReference: paymentRef,
        paystackReference: paystackBody.data.reference,
        serverSecret: serverSecret(),
      });
    } catch {}

    // 8. Return only what the frontend needs to open Paystack checkout.
    return ok(res, {
      transactionId: txId,
      paymentReference: paymentRef,
      amount: amountKobo,
      currency: "NGN",
      access_code: paystackBody.data.access_code,
      authorization_url: paystackBody.data.authorization_url,
      paystackReference: paystackBody.data.reference,
    });
  } catch (err) {
    return sendError(res, err);
  }
}
