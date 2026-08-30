// POST /api/admin/users/[id]/status
// Moderation action on a real user: activate / suspend / ban. Persists to Convex.

import { adminContext } from "../../../_lib/adminAuth.js";
import { callConvexMutation } from "../../../_lib/convexClient.js";
import { ok, sendError } from "../../../_lib/errors.js";

const STATUS_MAP = { activate: "ACTIVE", suspend: "SUSPENDED", ban: "BANNED" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const { id } = req.query;
    const { action, reason } = req.body || {};
    const status = STATUS_MAP[action];
    if (!id || !status) {
      return res.status(400).json({ error: "Invalid action", code: "VALIDATION_ERROR" });
    }
    const result = await callConvexMutation("admin:setUserStatus", {
      ...ctx,
      userId: id,
      status,
      reason: reason || undefined,
    });
    return ok(res, result);
  } catch (err) {
    return sendError(res, err);
  }
}