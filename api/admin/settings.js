// GET/POST /api/admin/settings
// Real system configuration stored in Convex. Write is admin-gated.

import { adminContext } from "../_lib/adminAuth.js";
import { callConvexQuery, callConvexMutation } from "../_lib/convexClient.js";
import { ok, sendError } from "../_lib/errors.js";

export default async function handler(req, res) {
  try {
    const ctx = await adminContext(req);

    if (req.method === "GET") {
      const settings = await callConvexQuery("admin:getSystemSettings", ctx);
      return ok(res, { settings });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const allowed = [
        "platformName",
        "defaultRadiusKm",
        "supportedCities",
        "autoApproveRallies",
        "requireEmailVerification",
        "autoVerifyPhone",
        "maintenanceMode",
      ];
      const args = { ...ctx };
      for (const key of allowed) {
        if (body[key] !== undefined) args[key] = body[key];
      }
      const result = await callConvexMutation("admin:updateSystemSettings", args);
      return ok(res, result);
    }

    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  } catch (err) {
    return sendError(res, err);
  }
}