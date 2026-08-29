// Server-side Mux Video helpers.
// Uses Mux's REST API directly (no SDK dependency) with the MUX_TOKEN_ID and
// MUX_TOKEN_SECRET server secrets. Never expose these to the browser.

const MUX_API_BASE = "https://api.mux.com";
const MUX_PLAYBACK_BASE = "https://stream.mux.com";

function muxAuthHeader() {
  const id = process.env.MUX_TOKEN_ID;
  const secret = process.env.MUX_TOKEN_SECRET;
  if (!id || !secret) {
    throw new Error("Mux credentials are not configured");
  }
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function muxFetch(path, options = {}) {
  const res = await fetch(`${MUX_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: muxAuthHeader(),
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error?.message || `Mux API request failed (${res.status})`);
  }
  return body.data;
}

/**
 * Create a direct upload URL for a video file.
 * Returns { uploadId, url } — url is the PUT endpoint the browser uploads bytes to,
 * uploadId is used later to resolve the resulting asset/playback id.
 * @param {string} corsOrigin browser origin so the signed URL carries CORS headers
 */
export async function createDirectUpload(corsOrigin) {
  const data = await muxFetch("/video/v1/uploads", {
    method: "POST",
    body: JSON.stringify({
      cors_origin: corsOrigin || "*",
      new_asset_settings: {
        playback_policies: ["public"],
        video_quality: "basic",
        mp4_support: "standard",
      },
    }),
  });
  return { uploadId: data.id, url: data.url };
}

/**
 * Retrieve a direct upload's current status.
 * When processed, the upload carries an asset_id that yields a playback id.
 */
export async function getUpload(uploadId) {
  return await muxFetch(`/video/v1/uploads/${encodeURIComponent(uploadId)}`);
}

/**
 * Resolve the public playback id for an asset, or null while it's still
 * processing (status !== ready).
 */
export async function getPlaybackId(assetId) {
  if (!assetId) return null;
  const asset = await muxFetch(`/video/v1/assets/${encodeURIComponent(assetId)}`);
  if (asset.status !== "ready") return null;
  const playback = (asset.playback_ids || []).find((p) => p?.id);
  return playback?.id || null;
}

export function hlsUrl(playbackId) {
  return `${MUX_PLAYBACK_BASE}/${playbackId}.m3u8`;
}

export function mp4Url(playbackId) {
  return `${MUX_PLAYBACK_BASE}/${playbackId}/high.mp4`;
}
