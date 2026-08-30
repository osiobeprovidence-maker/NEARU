// GET /api/admin/analytics
// Real aggregated analytics. Empty series are returned as-is so the UI can
// show empty states instead of fabricated growth numbers.

import { adminContext } from "../_lib/adminAuth.js";
import { callConvexQuery } from "../_lib/convexClient.js";
import { ok, sendError } from "../_lib/errors.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const analytics = await callConvexQuery("admin:getAnalytics", ctx);
    return ok(res, { analytics });
  } catch (err) {
    return sendError(res, err);
  }
}