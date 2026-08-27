// GET /api/verifications/:id/status
// Returns a safe, normalized status for the calling user's transaction.
// The frontend polls this after payment to learn the normalized outcome.
// Returns only sanitized data — no raw Paystack/Ninja responses.

import { requireFirebaseUser, resolveConvexUser } from "../../_lib/auth.js";
import { callConvexQuery } from "../../_lib/convexClient.js";
import { ApiError, ERRORS, ok, sendError } from "../../_lib/errors.js";

// Map the internal two-axis state to a single normalized status the client sees.
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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const firebaseClaims = await requireFirebaseUser(req);
    const convexUser = await resolveConvexUser(firebaseClaims);
    if (!convexUser) {
      throw new ApiError(ERRORS.AUTHENTICATION_ERROR, "Account not found.", 404);
    }

    const { id } = req.query;
    if (!id) throw new ApiError(ERRORS.VALIDATION_ERROR, "Missing transaction id.", 400);

    // `id` is the Convex transaction id (e.g. verifications:abc...).
    const tx = await callConvexQuery("verifications:getById", { txId: id });
    if (!tx) throw new ApiError("NOT_FOUND", "Transaction not found.", 404);

    // Authorization: only the owner may read.
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
  } catch (err) {
    return sendError(res, err);
  }
}
