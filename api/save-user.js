// POST /api/save-user
// Legacy endpoint — creates a Convex user record from the serverless layer.
// NOTE: The preferred path is AuthContext.saveUserToConvex() which calls
// users:create directly from the browser via the Convex WebSocket client.
// This endpoint exists as a fallback and is kept aligned with the correct
// Convex HTTP API format (/api/mutation with args: [argsObject]).

import { callConvexMutation } from "./_lib/convexClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { email, username, name, passwordHash, totpSecret, totpEnabled, isEmailVerified } =
      req.body || {};

    if (!email || !username || !name) {
      return res.status(400).json({ error: "Missing required fields: email, username, name" });
    }

    const userId = await callConvexMutation("users:create", {
      name,
      username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true&size=200`,
      email,
      isNINVerified: false,
      isPhoneVerified: false,
      isEmailVerified: isEmailVerified || false,
      passwordHash: passwordHash || undefined,
    });

    if ((totpSecret || totpEnabled) && userId) {
      await callConvexMutation("users:updateAuth", {
        userId,
        totpSecret: totpSecret || undefined,
        totpEnabled: totpEnabled || false,
      });
    }

    return res.status(200).json({ userId });
  } catch (error) {
    console.error("[save-user] error:", error?.message || error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
