// GET /api/admin/notifications/audience-counts
// Real audience counts for the broadcast compose form (no hardcoded 12,482).

import { adminContext } from "../../../_lib/adminAuth.js";
import { callConvexQuery } from "../../../_lib/convexClient.js";
import { ok, sendError } from "../../../_lib/errors.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const counts = await callConvexQuery("admin:getAudienceCounts", ctx);
    return ok(res, { counts });
  } catch (err) {
    return sendError(res, err);
  }
}