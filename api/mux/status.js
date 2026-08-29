// GET /api/mux/status?uploadId=<id>
// Checks a Mux direct upload's processing status and, once the asset is ready,
// resolves the public playback id. Returns:
//   { status, assetId, playbackId }
// where status is one of "waiting" | "uploading" | "processing" | "ready" |
// "errored" | "cancelled" | "timed_out". playbackId is only present when ready.

import { requireFirebaseUser, resolveConvexUser } from "../../_lib/auth.js";
import { getUpload, getPlaybackId } from "../../_lib/mux.js";
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

    const { uploadId } = req.query;
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
  } catch (err) {
    return sendError(res, err);
  }
}
