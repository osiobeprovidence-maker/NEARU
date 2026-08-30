// GET /api/admin/stats
// Real dashboard aggregates computed from the LALOA database.

import { adminContext } from "../_lib/adminAuth.js";
import { callConvexQuery } from "../_lib/convexClient.js";
import { ok, sendError } from "../_lib/errors.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const stats = await callConvexQuery("admin:getDashboardStats", ctx);
    return ok(res, { stats });
  } catch (err) {
    return sendError(res, err);
  }
}