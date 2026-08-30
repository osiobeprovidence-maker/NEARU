// GET /api/admin/verifications
// Lists verification transactions for the Admin CRM.
// Masks sensitive identity data. Never exposes Ninja wallet/credentials.

import { requireSuperAdmin } from "../_lib/auth.js";
import { callConvexQuery } from "../_lib/convexClient.js";
import { serverSecret } from "../_lib/config.js";
import { ok, sendError } from "../_lib/errors.js";

function maskNin(ninHash) {
  if (!ninHash) return null;
  // Only show a short hash fragment — never the raw NIN.
  return `nin:${ninHash.slice(0, 10)}…`;
}

function sanitize(tx) {
  return {
    transactionId: tx._id,
    userId: tx.userId,
    type: tx.type,
    provider: tx.provider,
    amount: tx.customerAmountKobo,
    currency: tx.currency,
    paymentStatus: tx.paymentStatus,
    verificationStatus: tx.verificationStatus,
    paymentReference: tx.paymentReference,
    paystackReference: tx.paystackReference || null,
    ninjaReference: tx.ninjaReference || null,
    ninHashMasked: maskNin(tx.ninHash),
    failureReason: tx.failureReason || null,
    createdAt: tx.createdAt,
    paidAt: tx.paidAt || null,
    verifiedAt: tx.verifiedAt || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { convexUser } = await requireSuperAdmin(req);
    const limit = Number(req.query.limit) || 200;
    const list = await callConvexQuery("verifications:listAll", {
      limit,
      requestingAdminId: convexUser._id,
      serverSecret: serverSecret(),
    });
    const sanitized = (list || []).map(sanitize);
    return ok(res, { verifications: sanitized });
  } catch (err) {
    return sendError(res, err);
  }
}
