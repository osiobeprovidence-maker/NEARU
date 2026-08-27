// Shared helper to call Convex queries/mutations from Vercel serverless functions.
// Uses the server-side CONVEX_DEPLOY_KEY so these calls are server-authoritative.

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://rare-rooster-878.eu-west-1.convex.cloud";

export function convexEnv() {
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!deployKey) {
    throw new Error("CONVEX_DEPLOY_KEY is not configured");
  }
  return { url: CONVEX_URL, deployKey };
}

/**
 * Call a Convex mutation.
 * @param {string} path e.g. "verifications:createPaymentTransaction"
 * @param {object} args inputs to the mutation
 */
export async function callConvexMutation(path, args) {
  const { url, deployKey } = convexEnv();
  const res = await fetch(`${url}/api/v1/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${deployKey}`,
    },
    body: JSON.stringify({ path, args: { args } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === "error") {
    throw new Error(body.result || `Convex mutation ${path} failed`);
  }
  return body.result;
}

/**
 * Call a Convex query.
 * @param {string} path e.g. "verifications:getByPaymentReference"
 * @param {object} args inputs to the query
 */
export async function callConvexQuery(path, args) {
  const { url, deployKey } = convexEnv();
  const res = await fetch(`${url}/api/v1/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${deployKey}`,
    },
    body: JSON.stringify({ path, args: { args } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === "error") {
    throw new Error(body.result || `Convex query ${path} failed`);
  }
  return body.result;
}
