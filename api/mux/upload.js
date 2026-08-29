// GET /api/mux/upload
// Creates a Mux direct upload so the browser can PUT a video file directly to
// Mux (no video bytes pass through our server). Requires a signed-in Firebase
// user. Returns { uploadId, url }.

import { requireFirebaseUser, resolveConvexUser } from "../../_lib/auth.js";
import { createDirectUpload } from "../../_lib/mux.js";
import { ApiError, ok, sendError } from "../../_lib/errors.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const firebaseClaims = await requireFirebaseUser(req);
    const convexUser = await resolveConvexUser(firebaseClaims);
    if (!convexUser) {
      throw new ApiError("AUTHENTICATION_ERROR", "Account not found.", 404);
    }

    const origin = req.headers.origin || req.headers.referer || null;
    const { uploadId, url } = await createDirectUpload(origin || "*");

    return ok(res, { uploadId, url });
  } catch (err) {
    return sendError(res, err);
  }
}
