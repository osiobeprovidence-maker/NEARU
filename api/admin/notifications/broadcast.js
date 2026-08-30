// POST /api/admin/notifications/broadcast
// Send a real broadcast: fans out in-app notifications to the chosen audience
// and records a broadcast batch. Persists after refresh.

import { adminContext } from "../../../_lib/adminAuth.js";
import { callConvexMutation } from "../../../_lib/convexClient.js";
import { ok, sendError } from "../../../_lib/errors.js";

const AUDIENCES = ["ALL", "VERIFIED", "PLUS", "SPECIFIC"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ctx = await adminContext(req);
    const body = req.body || {};
    const audience = (body.audience || "ALL").toUpperCase();
    if (!AUDIENCES.includes(audience)) {
      return res.status(400).json({ error: "Invalid audience", code: "VALIDATION_ERROR" });
    }
    const result = await callConvexMutation("admin:sendBroadcast", {
      ...ctx,
      title: String(body.title || ""),
      body: String(body.body || ""),
      type: body.type || undefined,
      audience,
      targetUserIds: audience === "SPECIFIC" && Array.isArray(body.targetUserIds)
        ? body.targetUserIds
        : undefined,
    });
    return ok(res, result);
  } catch (err) {
    return sendError(res, err);
  }
}