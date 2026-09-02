// POST /api/login-user
// Resolves a username to an email address so the frontend can call
// signInWithEmailAndPassword with the email that Firebase actually knows.
// Uses the shared convexClient helper which calls the correct Convex HTTP API
// path (/api/query with args: [argsObject]).

import { callConvexQuery } from "./_lib/convexClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { username } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await callConvexQuery("users:getByUsername", { username });

    if (!user || !user.email) {
      return res.status(404).json({ error: "Username not found" });
    }

    return res.status(200).json({ email: user.email, name: user.name });
  } catch (error) {
    console.error("[login-user] error:", error?.message || error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
