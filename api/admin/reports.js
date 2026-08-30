// GET /api/admin/reports
// Real user/RALLY report queue from the Convex reports table.

import { adminContext } from "../_lib/adminAuth.js";
import { callConvexQuery } from "../_lib/convexClient.js";
import { ok, sendError } from "../_lib/errors.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const args = {
      ...ctx,
      limit: Number(req.query.limit) || 200,
    };
    if (req.query.status) args.status = String(req.query.status);
    const reports = await callConvexQuery("admin:listReports", args);
    return ok(res, { reports });
  } catch (err) {
    return sendError(res, err);
  }
}