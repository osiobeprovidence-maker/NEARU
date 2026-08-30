// POST /api/admin/reports/[id]/act
// Moderation on a real report: resolve / dismiss / escalate / assign.
// Actions persist to Convex and stay resolved after refresh.

import { adminContext } from "../../../_lib/adminAuth.js";
import { callConvexMutation } from "../../../_lib/convexClient.js";
import { ok, sendError } from "../../../_lib/errors.js";

const ACTIONS = ["resolve", "dismiss", "escalate", "assign", "note"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const { id } = req.query;
    const { action, assigneeId, note } = req.body || {};
    if (!id || !ACTIONS.includes(action)) {
      return res.status(400).json({ error: "Invalid action", code: "VALIDATION_ERROR" });
    }
    const result = await callConvexMutation("admin:actOnReport", {
      ...ctx,
      reportId: id,
      action,
      assigneeId: assigneeId || undefined,
      note: note || undefined,
    });
    return ok(res, result);
  } catch (err) {
    return sendError(res, err);
  }
}