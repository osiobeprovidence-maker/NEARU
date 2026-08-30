// Consolidated GET/POST /api/verifications/* router.
//
// Replaces api/verifications/nin/payment.js, api/verifications/[id]/index.js and
// api/verifications/[id]/status.js with a single catch-all function (Hobby plan
// function-limit compliance). URLs are unchanged for callers.

import { requireFirebaseUser, resolveConvexUser } from "../_lib/auth.js";
import { callConvexQuery, callConvexMutation } from "../_lib/convexClient.js";
import { NIN_CONFIG, serverSecret, grossMarginKobo } from "../_lib/config.js";
import { ApiError, ERRORS, ok, sendError, validationError } from "../_lib/errors.js";
import { rateLimit } from "../_lib/rateLimit.js";
import { createHash, randomBytes } from "crypto";

function methodNotAllowed(req, res) {
  return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
}

function hashNin(nin) {
  return createHash("sha256").update(`nin:${nin}`).digest("hex");
}

async function requireUser(req) {
  const firebaseClaims = await requireFirebaseUser(req);
  const convexUser = await resolveConvexUser(firebaseClaims);
  if (!convexUser) {
    throw new ApiError(ERRORS.AUTHENTICATION_ERROR, "Account not found.", 404);
  }
  return { firebaseClaims, convexUser };
}

function normalizeStatus(tx) {
  if (tx.verificationStatus === "VERIFIED") return "VERIFIED";
  if (tx.verificationStatus === "PROVIDER_ERROR") return "PROVIDER_ERROR";
  if (tx.verificationStatus === "VERIFICATION_FAILED") return "VERIFICATION_FAILED";
  if (tx.paymentStatus === "PAYMENT_SUCCESS") return "PAYMENT_SUCCESS";
  if (tx.paymentStatus === "PAYMENT_FAILED") return "PAYMENT_FAILED";
  if (tx.paymentStatus === "PAYMENT_PENDING" || tx.paymentStatus === "CREATED")
    return "PENDING";
  return "PENDING";
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const segments = url.pathname.split("/").filter(Boolean); // ["api", "verifications", ...]
    const q = url.searchParams;
    const route = q.get("r") || segments.slice(2).join("/");
    const rest = route.split("/").filter(Boolean);
    const [head, id] = rest;
    const method = req.method;

    // -------- POST /api/verifications/nin/payment --------
    if (head === "nin" && id === "payment" && method === "POST") {
      const { convexUser, firebaseClaims } = await requireUser(req);

      const rl = rateLimit(req, { userId: convexUser._id, max: 5, windowMs: 60000 });
      if (rl) throw rl;

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

      const amountKobo = NIN_CONFIG.customerAmountKobo;
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        throw new ApiError(ERRORS.PAYMENT_ERROR, "Payment service not configured.", 503);
      }

      const internalRef = `RALLYNIN-${Date.now()}-${randomBytes(6).toString("hex")}`;
      const paymentRef = `RALLY-NIN-${randomBytes(12).toString("hex")}`;

      const txId = await callConvexMutation("verifications:createPaymentTransaction", {
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
      });

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${paystackSecret}`,
        },
        body: JSON.stringify({
          email: convexUser.email || firebaseClaims.email,
          amount: amountKobo,
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
        try {
          await callConvexMutation("verifications:markPaymentFailed", {
            paymentReference: paymentRef,
            failureReason: "PAYSTACK_INITIALIZE_FAILED",
            serverSecret: serverSecret(),
          });
        } catch {}
        throw new ApiError(ERRORS.PAYMENT_ERROR, "Could not start payment. Please try again.", 502);
      }

      try {
        await callConvexMutation("verifications:markPaymentPending", {
          paymentReference: paymentRef,
          paystackReference: paystackBody.data.reference,
          serverSecret: serverSecret(),
        });
      } catch {}

      return ok(res, {
        transactionId: txId,
        paymentReference: paymentRef,
        amount: amountKobo,
        currency: "NGN",
        access_code: paystackBody.data.access_code,
        authorization_url: paystackBody.data.authorization_url,
        paystackReference: paystackBody.data.reference,
      });
    }

    // -------- GET /api/verifications/:id --------
    if (head && head !== "nin" && !id && method === "GET") {
      const { convexUser } = await requireUser(req);
      const tx = await callConvexQuery("verifications:getById", { txId: head });
      if (!tx) throw new ApiError("NOT_FOUND", "Transaction not found.", 404);
      if (tx.userId !== convexUser._id) {
        throw new ApiError(ERRORS.AUTHENTICATION_ERROR, "Unauthorized.", 403);
      }
      return ok(res, {
        transactionId: tx._id,
        status:
          tx.verificationStatus === "VERIFIED" ? "VERIFIED" : tx.verificationStatus,
        paymentStatus: tx.paymentStatus,
        amount: tx.customerAmountKobo,
        currency: tx.currency,
        createdAt: tx.createdAt,
        paidAt: tx.paidAt || null,
        verifiedAt: tx.verifiedAt || null,
      });
    }

    // -------- GET /api/verifications/:id/status --------
    if (head && head !== "nin" && id === "status" && method === "GET") {
      const { convexUser } = await requireUser(req);
      const tx = await callConvexQuery("verifications:getById", { txId: head });
      if (!tx) throw new ApiError("NOT_FOUND", "Transaction not found.", 404);
      if (tx.userId !== convexUser._id) {
        throw new ApiError(ERRORS.AUTHENTICATION_ERROR, "Unauthorized.", 403);
      }
      const status = normalizeStatus(tx);
      return ok(res, {
        status,
        verificationStatus: tx.verificationStatus,
        paymentStatus: tx.paymentStatus,
        verifiedAt: tx.verifiedAt || null,
      });
    }

    return methodNotAllowed(req, res);
  } catch (err) {
    return sendError(res, err);
  }
}