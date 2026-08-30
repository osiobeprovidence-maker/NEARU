// GET /api/admin/verifications/report
// Internal financial reporting for NIN verification.
// Customer payment, provider cost, gross margin. Non-admin access forbidden.

import { requireSuperAdmin } from "../../_lib/auth.js";
import { callConvexQuery } from "../../_lib/convexClient.js";
import { serverSecret } from "../../_lib/config.js";
import { ok, sendError } from "../../_lib/errors.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { convexUser } = await requireSuperAdmin(req);
    const report = await callConvexQuery("verifications:adminReport", {
      requestingAdminId: convexUser._id,
      serverSecret: serverSecret(),
    });
    return ok(res, {
      report: {
        totalTransactions: report.totalTransactions,
        totalSuccessfulPayments: report.totalSuccessfulPayments,
        totalSuccessfulVerifications: report.totalSuccessfulVerifications,
        failedVerifications: report.failedVerifications,
        providerErrors: report.providerErrors,
        totalRevenue: report.totalRevenueKobo / 100,
        totalProviderCost: report.totalProviderCostKobo / 100,
        grossMargin: report.grossMarginKobo / 100,
        unit: "NGN",
        note: "Gross margin is not net profit (payments fees, refunds, taxes and operational costs may apply).",
      },
    });
  } catch (err) {
    return sendError(res, err);
  }
}
