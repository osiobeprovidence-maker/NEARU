export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, username, name, passwordHash, totpSecret, totpEnabled, isEmailVerified } = req.body;

    if (!email || !username || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://rare-rooster-878.eu-west-1.convex.cloud";
    const DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;

    if (!DEPLOY_KEY) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const functionPath = "users:create";
    const args = {
      name,
      username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true&size=200`,
      email,
      isNINVerified: false,
      isPhoneVerified: false,
      isEmailVerified: isEmailVerified || false,
      passwordHash: passwordHash || undefined,
    };

    const response = await fetch(`${CONVEX_URL}/api/v1/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Convex ${DEPLOY_KEY}`,
      },
      body: JSON.stringify({
        path: functionPath,
        args: { args },
      }),
    });

    const result = await response.json();

    if (!response.ok || result.status === "error") {
      return res.status(500).json({ error: result.result || "Failed to save user" });
    }

    if (totpSecret || totpEnabled) {
      await fetch(`${CONVEX_URL}/api/v1/mutation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Convex ${DEPLOY_KEY}`,
        },
        body: JSON.stringify({
          path: "users:updateAuth",
          args: {
            args: {
              userId: result.result,
              totpSecret: totpSecret || undefined,
              totpEnabled: totpEnabled || false,
            },
          },
        }),
      });
    }

    return res.status(200).json({ userId: result.result });
  } catch (error) {
    console.error("Save user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
