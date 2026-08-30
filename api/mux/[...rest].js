// Consolidated GET /api/mux/* router.
//
// Replaces api/mux/upload.js and api/mux/status.js with a single catch-all
// function (Hobby plan function-limit compliance). URLs are unchanged.

import { requireFirebaseUser, resolveConvexUser } from "../_lib/auth.js";
import { createDirectUpload, getUpload, getPlaybackId } from "../_lib/mux.js";
import { ApiError, ok, sendError } from "../_lib/errors.js";

function methodNotAllowed(req, res) {
  return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
}

function notFound(res) {
  return res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const segments = url.pathname.split("/").filter(Boolean); // ["api", "mux", ...]
    const rest = segments.slice(2);
    const [head] = rest;
    const method = req.method;

    if (method !== "GET") return methodNotAllowed(req, res);

    const firebaseClaims = await requireFirebaseUser(req);
    const convexUser = await resolveConvexUser(firebaseClaims);
    if (!convexUser) {
      throw new ApiError("AUTHENTICATION_ERROR", "Account not found.", 404);
    }

    // -------- GET /api/mux/upload --------
    if (head === "upload") {
      const origin = req.headers.origin || req.headers.referer || null;
      const { uploadId, url: uploadUrl } = await createDirectUpload(origin || "*");
      return ok(res, { uploadId, url: uploadUrl });
    }

    // -------- GET /api/mux/status?uploadId=<id> --------
    if (head === "status") {
      const uploadId = url.searchParams.get("uploadId");
      if (!uploadId || typeof uploadId !== "string") {
        throw new ApiError("VALIDATION_ERROR", "Missing uploadId.", 400);
      }

      const upload = await getUpload(uploadId);
      const status = upload.status || "waiting";

      let assetId = upload.asset_id || null;
      let playbackId = null;
      if (assetId) {
        playbackId = await getPlaybackId(assetId);
      }

      return ok(res, { status, assetId, playbackId });
    }

    return notFound(res);
  } catch (err) {
    return sendError(res, err);
  }
}