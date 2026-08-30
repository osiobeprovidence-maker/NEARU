// POST /api/admin/users/[id]/role
// Change a real user's role (admin / moderator / user). Persists to Convex.

import { adminContext } from "../../../_lib/adminAuth.js";
import { callConvexMutation } from "../../../_lib/convexClient.js";
import { ok, sendError } from "../../../_lib/errors.js";

const ALLOWED_ROLES = ["admin", "moderator", "user"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const { id } = req.query;
    const { role } = req.body || {};
    if (!id || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role", code: "VALIDATION_ERROR" });
    }
    const result = await callConvexMutation("admin:setUserRole", {
      ...ctx,
      userId: id,
      role,
    });
    return ok(res, result);
  } catch (err) {
    return sendError(res, err);
  }
}