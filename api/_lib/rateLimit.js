// Simple sliding-window rate limiter for serverless functions.
// In-memory per instance — appropriate as a soft guard. A durable rate limit
// keyed in Convex would be the next hardening step for high-traffic defense.

const buckets = new Map();

function keyFor(req, userId) {
  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
  return userId ? `u:${userId}` : `ip:${ip}`;
}

/**
 * @param {object} req
 * @param {object} opts
 * @param {string|null} opts.userId
 * @param {number} opts.max
 * @param {number} opts.windowMs
 */
export function rateLimit(req, { userId = null, max = 5, windowMs = 60000 } = {}) {
  const key = keyFor(req, userId);
  const now = Date.now();
  const bucket = buckets.get(key) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= max) {
    const resetIn = Math.ceil((now - bucket.timestamps[0]) / 1000);
    buckets.set(key, bucket);
    const err = new Error("Too many requests. Please try again shortly.");
    err.statusCode = 429;
    err.code = "RATE_LIMITED";
    err.retryAfter = resetIn;
    return err;
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return null;
}
