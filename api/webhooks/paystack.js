// POST /api/webhooks/paystack
// The authoritative payment-confirmation trigger.
//
// Flow:
//   1. Validate the Paystack webhook signature (HMAC SHA512 of the raw body).
//   2. Identify the internal transaction by payment reference.
//   3. Verify event/status/amount/currency.
//   4. Idempotently mark PAYMENT_SUCCESS.
//   5. Run the Ninja verification (synchronous fallback; structured so it can
//      be moved to a queue later).
//
// Idempotency: a repeated successful webhook for the same reference is ignored
// (no second Ninja call).

import { createHmac } from "crypto";
import { callConvexMutation, callConvexQuery } from "../_lib/convexClient.js";
import { serverSecret } from "../_lib/config.js";
import { ApiError, ERRORS, sendError } from "../_lib/errors.js";
import { getNinVerificationProvider } from "../_lib/ninja.js";

export const config = {
  api: {
    bodyParser: false, // capture raw body for signature verification
  },
};

// Read the raw request body.
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", (err) => reject(err));
  });
}

function verifySignature(rawBody, signature, secret) {
  if (!signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto_timingSafeEqual(a, b);
}

function crypto_timingSafeEqual(a, b) {
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// ---------- Ninja verification (synchronous fallback) ----------
// Extractable for later async/queue migration. Idempotent: never verifies a
// transaction that is already VERIFIED.
async function runNinVerification({ txId, ninjaProvider }) {
  // Load the transaction to read the identity details we stored at creation.
  const tx = await callConvexQuery("verifications:getById", { txId });
  if (!tx) throw new Error("TRANSACTION_NOT_FOUND");

  if (tx.verificationStatus === "VERIFIED") {
    // Already verified — never re-verify.
    return { skipped: true, status: "VERIFIED" };
  }

  if (tx.verificationStatus !== "VERIFICATION_PENDING" &&
      tx.verificationStatus !== "NOT_STARTED") {
    // Don't retry permanent failures (VERIFICATION_FAILED, PROVIDER_ERROR)
    // automatically.
    return { skipped: true, status: tx.verificationStatus };
  }

  await callConvexMutation("verifications:startVerification", {
    txId,
    serverSecret: serverSecret(),
  });

  try {
    // `pendingNin` holds the raw NIN only during the pending window; it is
    // scrubbed after processing to minimize retention.
    const result = await ninjaProvider.verify({
      nin: tx.pendingNin,
      firstName: tx.verifiedFirstName || "",
      lastName: tx.verifiedLastName || "",
      dateOfBirth: tx.verifiedDob || undefined,
    });

    await callConvexMutation("verifications:completeVerification", {
      txId,
      ninjaReference: result.ninjaReference || undefined,
      resultData: result.data,
      serverSecret: serverSecret(),
    });
    return { status: "VERIFIED" };
  } catch (err) {
    const providerError =
      err.code === ERRORS.NIN_PROVIDER_ERROR ||
      err.code === ERRORS.TIMEOUT_ERROR;
    await callConvexMutation("verifications:failVerification", {
      txId,
      failureReason: providerError ? "PROVIDER_ERROR" : "VERIFICATION_FAILED",
      providerError: providerError ? true : false,
      serverSecret: serverSecret(),
    });
    return { status: providerError ? "PROVIDER_ERROR" : "VERIFICATION_FAILED" };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      throw new ApiError(ERRORS.WEBHOOK_ERROR, "Webhook not configured.", 503);
    }

    const rawBody = await readRawBody(req);
    const signature = req.headers["x-paystack-signature"];

    if (!verifySignature(rawBody, signature, secret)) {
      throw new ApiError(ERRORS.WEBHOOK_ERROR, "Invalid webhook signature.", 401);
    }

    const event = JSON.parse(rawBody);
    const data = event.data || {};

    if (event.event !== "charge.success") {
      // Non-success events are acknowledged but not processed.
      return res.status(200).json({ received: true });
    }

    const paymentReference = data.reference;
    if (!paymentReference) {
      throw new ApiError(ERRORS.WEBHOOK_ERROR, "Missing payment reference.", 400);
    }

    // Identify internal transaction.
    const tx = await callConvexQuery("verifications:getByPaymentReference", {
      paymentReference,
    });
    if (!tx) {
      // Unknown reference — still acknowledge to Paystack (do not mark failed).
      return res.status(200).json({ received: true, status: "UNKNOWN_REFERENCE" });
    }

    // Confirm amount is exactly ₦150 and currency is NGN.
    const expectedAmount = tx.customerAmountKobo; // stored server-side at creation
    const actualAmount = Number(data.amount);
    const currency = String(data.currency || "").toUpperCase();
    if (actualAmount !== expectedAmount || (currency !== "NGN" && tx.currency !== "NGN")) {
      // Do not verify a wrong-amount payment. Mark failed for review.
      await callConvexMutation("verifications:markPaymentFailed", {
        paymentReference,
        failureReason: "AMOUNT_MISMATCH",
        serverSecret: serverSecret(),
      });
      return res.status(200).json({ received: true, status: "AMOUNT_MISMATCH" });
    }

    // Idempotency — if already successfully paid & verified/settled, ignore.
    if (tx.paymentStatus === "PAYMENT_SUCCESS") {
      return res.status(200).json({ received: true, status: "ALREADY_PROCESSED" });
    }

    // Confirm payment + start verification in one guarded step.
    await callConvexMutation("verifications:confirmPayment", {
      paymentReference,
      serverSecret: serverSecret(),
    });

    // Run Ninja verification synchronously (extractable to a queue).
    const ninjaProvider = getNinVerificationProvider();
    const result = await runNinVerification({ txId: tx._id, ninjaProvider });

    return res.status(200).json({ received: true, status: result.status });
  } catch (err) {
    // For webhooks, always ack (even on processing errors) so Paystack stops
    // retrying a doomed event; the state machine remains recoverable server-side.
    if (err && (err.code === ERRORS.WEBHOOK_ERROR || err.statusCode === 401)) {
      return sendError(res, err);
    }
    console.error("[webhook] processing error:", err);
    return res.status(200).json({ received: true });
  }
}
