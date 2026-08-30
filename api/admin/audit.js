// GET /api/admin/audit
// Real admin action trail (moderation, settings, broadcasts).

import { adminContext } from "../_lib/adminAuth.js";
import { callConvexQuery } from "../_lib/convexClient.js";
import { ok, sendError } from "../_lib/errors.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const logs = await callConvexQuery("admin:listAuditLogs", {
      ...ctx,
      limit: Number(req.query.limit) || 100,
    });
    return ok(res, { logs });
  } catch (err) {
    return sendError(res, err);
  }
}