// Frontend client for the Mux video upload flow.
// The browser never sees Mux credentials — it asks /api/mux/upload for a signed
// direct-upload URL, PUTs the raw file bytes straight to Mux, then polls
// /api/mux/status until transcoding resolves a public playback id.

import { getAuth } from "firebase/auth";

async function getIdToken() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  return await user.getIdToken();
}

async function api(path: string, options: RequestInit & { headers?: Record<string, string> } = {}) {
  const token = await getIdToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed") as Error & { code?: string };
    err.code = data.code;
    throw err;
  }
  return data;
}

/**
 * Ask the backend for a fresh Mux direct upload.
 * @returns {{ uploadId: string, url: string }}
 */
export function createMuxUpload() {
  return api("/api/mux/upload");
}

/**
 * Check a Mux direct upload's processing status.
 * @returns {{ status: string, assetId: string|null, playbackId: string|null }}
 */
export function getMuxStatus(uploadId: string) {
  return api(`/api/mux/status?uploadId=${encodeURIComponent(uploadId)}`);
}

/**
 * PUT a File's bytes directly to the Mux upload URL returned by createMuxUpload.
 * Uses XMLHttpRequest so we can surface real upload progress (fetch lacks it).
 * @param onProgress 0..1 fraction of bytes uploaded (may be partial on some engines).
 */
export async function putFileToMux(
  url: string,
  file: File,
  onProgress?: (fraction: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new Error(`Upload to Mux failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload to Mux failed: network error"));
    xhr.onabort = () => reject(new Error("Upload to Mux aborted"));
    xhr.send(file);
  });
}

/**
 * Poll a Mux upload until it's ready or a terminal state, resolving the
 * playback id. `onProgress` is invoked between polls with the current status.
 * Resolves with { assetId, playbackId } or throws on an error state.
 */
export async function waitForPlayback(
  uploadId: string,
  onProgress?: (status: string) => void,
  maxAttempts = 60
) {
  for (let i = 0; i < maxAttempts; i++) {
    const { status, assetId, playbackId } = await getMuxStatus(uploadId);
    onProgress?.(status);
    if (status === "ready" && playbackId) {
      return { assetId, playbackId };
    }
    if (["errored", "cancelled", "timed_out"].includes(status)) {
      throw new Error(`Mux upload ${status}`);
    }
    // Mux typically finishes processing within a few seconds to a minute.
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("Mux is still processing. Please open the post to check later.");
}
