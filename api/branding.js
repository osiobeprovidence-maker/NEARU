// Public branding endpoint — serves cosmetic fields (logo, favicon, font,
// primary color, platform name) to the user-facing app without authentication.
// Cost: none — no secret, no PII, just presentation overrides.

import { callConvexQuery } from "./_lib/convexClient.js";
import { ok, sendError } from "./_lib/errors.js";

// Cosmetic fallback so the app never depends on branding to load. These are
// presentation-only defaults (no stored settings, no secrets). If Convex is
// reachable but has real customization, that always wins.
const DEFAULT_BRANDING = {
  platformName: "lalao",
  brandLogoUrl: null,
  brandIconUrl: null,
  faviconUrl: null,
  brandFont: "system",
  primaryColor: "#4f46e5",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }
  try {
    const branding = await callConvexQuery("admin:getPublicBranding", {});
    return ok(res, { branding });
  } catch (err) {
    // Branding is optional/absent configuration only. If we cannot read it,
    // log the real cause server-side and serve safe defaults rather than
    // failing the whole app boot with a 500.
    console.error("[api:branding] Falling back to defaults:", err?.message || err);
    return ok(res, { branding: DEFAULT_BRANDING });
  }
}