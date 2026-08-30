// POST /api/admin/rallies/[id]/moderation
// Moderation action on a real RALLY/POST: APPROVE / HIDE / REMOVE / FLAG.
// Persists to Convex and writes an audit log entry.

import { adminContext } from "../../../_lib/adminAuth.js";
import { callConvexMutation } from "../../../_lib/convexClient.js";
import { ok, sendError } from "../../../_lib/errors.js";

const ACTIONS = ["APPROVE", "HIDE", "REMOVE", "FLAG"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const { id } = req.query;
    const { action, reason } = req.body || {};
    if (!id || !ACTIONS.includes(action)) {
      return res.status(400).json({ error: "Invalid action", code: "VALIDATION_ERROR" });
    }
    const result = await callConvexMutation("admin:setRallyModeration", {
      ...ctx,
      rallyId: id,
      action,
      reason: reason || undefined,
    });
    return ok(res, result);
  } catch (err) {
    return sendError(res, err);
  }
}