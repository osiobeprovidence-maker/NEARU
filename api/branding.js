// Public branding endpoint — serves cosmetic fields (logo, favicon, font,
// primary color, platform name) to the user-facing app without authentication.
// Cost: none — no secret, no PII, just presentation overrides.

import { callConvexQuery } from "./_lib/convexClient.js";
import { ok, sendError } from "./_lib/errors.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
    }
    const branding = await callConvexQuery("admin:getPublicBranding", {});
    return ok(res, { branding });
  } catch (err) {
    return sendError(res, err);
  }
}