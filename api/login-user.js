export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://rare-rooster-878.eu-west-1.convex.cloud";
    const DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;

    if (!DEPLOY_KEY) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const response = await fetch(`${CONVEX_URL}/api/v1/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Convex ${DEPLOY_KEY}`,
      },
      body: JSON.stringify({
        path: "users:getByUsername",
        args: { args: { username } },
      }),
    });

    const result = await response.json();

    if (!response.ok || result.status === "error") {
      return res.status(500).json({ error: result.result || "Failed to look up user" });
    }

    if (!result.result) {
      return res.status(404).json({ error: "Username not found" });
    }

    return res.status(200).json({ email: result.result.email, name: result.result.name });
  } catch (error) {
    console.error("Login lookup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
