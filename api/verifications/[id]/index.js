// GET /api/verifications/:id
// Returns a sanitized detail view of the calling user's verification
// transaction. Does not expose raw NIN, Paystack/Ninja secrets, or internal
// provider costs to non-admins.

import { requireFirebaseUser, resolveConvexUser } from "../../_lib/auth.js";
import { callConvexQuery } from "../../_lib/convexClient.js";
import { ApiError, ERRORS, ok, sendError } from "../../_lib/errors.js";

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

    const tx = await callConvexQuery("verifications:getById", { txId: id });
    if (!tx) throw new ApiError("NOT_FOUND", "Transaction not found.", 404);

    if (tx.userId !== convexUser._id) {
      throw new ApiError(ERRORS.AUTHENTICATION_ERROR, "Unauthorized.", 403);
    }

    return ok(res, {
      transactionId: tx._id,
      status:
        tx.verificationStatus === "VERIFIED"
          ? "VERIFIED"
          : tx.verificationStatus,
      paymentStatus: tx.paymentStatus,
      amount: tx.customerAmountKobo,
      currency: tx.currency,
      createdAt: tx.createdAt,
      paidAt: tx.paidAt || null,
      verifiedAt: tx.verifiedAt || null,
    });
  } catch (err) {
    return sendError(res, err);
  }
}
