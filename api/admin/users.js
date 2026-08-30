// GET /api/admin/users
// Real user directory for the Admin CRM. Data is already redacted server-side.

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
    if (req.query.q) args.query = String(req.query.q);
    if (req.query.status) args.status = String(req.query.status);
    if (req.query.accountType) args.accountType = String(req.query.accountType);
    const users = await callConvexQuery("admin:listUsers", args);
    return ok(res, { users });
  } catch (err) {
    return sendError(res, err);
  }
}