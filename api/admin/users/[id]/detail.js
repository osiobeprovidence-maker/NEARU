// GET /api/admin/users/[id]/detail
// Real aggregated user detail (activity, ratings, follows, spending).

import { adminContext } from "../../../_lib/adminAuth.js";
import { callConvexQuery } from "../../../_lib/convexClient.js";
import { ok, sendError } from "../../../_lib/errors.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Missing user id", code: "VALIDATION_ERROR" });
    }
    const user = await callConvexQuery("admin:getUserDetail", {
      ...ctx,
      userId: id,
    });
    if (!user) {
      return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    }
    return ok(res, { user });
  } catch (err) {
    return sendError(res, err);
  }
}