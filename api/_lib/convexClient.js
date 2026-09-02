// Shared helper to call Convex queries/mutations from Vercel serverless functions.
// Uses the server-side CONVEX_DEPLOY_KEY so these calls are server-authoritative.
//
// IMPORTANT – Convex HTTP API format (verified against convex@1.x source):
//   POST  <deployment>/api/mutation   { path, format: "json", args: [argsObject] }
//   POST  <deployment>/api/query      { path, format: "json", args: [argsObject] }
//
//   Authorization: Convex <deployKey>
//
//   Response shape: { status: "success", value: … } | { status: "error", errorMessage: … }
//
// The args value is an ARRAY containing a single element (the args object).
// Using /api/v1/ or wrapping args inside another object are both wrong and will
// cause every Convex call to fail silently or with an opaque error.

export function convexEnv() {
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!deployKey) {
    throw new Error("CONVEX_DEPLOY_KEY is not configured");
  }
  const convexUrl =
    process.env.CONVEX_URL ||
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    process.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("CONVEX_URL is not configured");
  }
  return { url: convexUrl.replace(/\/$/, ""), deployKey };
}

/**
 * Call a Convex mutation.
 * @param {string} path  e.g. "admin:setUserStatus"
 * @param {object} args  Plain JS object of named arguments for the mutation.
 */
export async function callConvexMutation(path, args) {
  const { url, deployKey } = convexEnv();
  const res = await fetch(`${url}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${deployKey}`,
    },
    // args must be an array containing the single args object.
    body: JSON.stringify({ path, format: "json", args: [args] }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === "error") {
    const msg = body.errorMessage || body.errorData || `Convex mutation ${path} failed (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return body.value;
}

/**
 * Call a Convex query.
 * @param {string} path  e.g. "users:getByEmail"
 * @param {object} args  Plain JS object of named arguments for the query.
 */
export async function callConvexQuery(path, args) {
  const { url, deployKey } = convexEnv();
  const res = await fetch(`${url}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${deployKey}`,
    },
    // args must be an array containing the single args object.
    body: JSON.stringify({ path, format: "json", args: [args] }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === "error") {
    const msg = body.errorMessage || body.errorData || `Convex query ${path} failed (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return body.value;
}
