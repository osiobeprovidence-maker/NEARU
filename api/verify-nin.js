export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nin, firstName, lastName, dateOfBirth } = req.body;

  if (!nin || !firstName || !lastName) {
    return res.status(400).json({ error: "NIN, firstName, and lastName are required." });
  }

  const cleanNIN = nin.replace(/\D/g, "");
  if (cleanNIN.length !== 11) {
    return res.status(400).json({ error: "NIN must be exactly 11 digits." });
  }

  const clientKey = process.env.NINJA_CLIENT_KEY;
  const clientSecret = process.env.NINJA_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    console.error("NINJA_CLIENT_KEY or NINJA_CLIENT_SECRET not set.");
    return res.status(500).json({ error: "Verification service not configured." });
  }

  try {
    const sessionRes = await fetch("https://api.ninja.boucloud.io/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_key: clientKey,
        client_secret: clientSecret,
      }),
    });

    if (!sessionRes.ok) {
      const errBody = await sessionRes.text();
      console.error("Ninja session error:", sessionRes.status, errBody);
      return res.status(502).json({ error: "Failed to authenticate with verification provider." });
    }

    const { token } = await sessionRes.json();

    const identifyRes = await fetch("https://api.ninja.boucloud.io/api/identity/identify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idType: "nin",
        mode: "verify",
        idNumber: cleanNIN,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(dateOfBirth ? { dateOfBirth } : {}),
      }),
    });

    const result = await identifyRes.json();

    if (!identifyRes.ok) {
      console.error("Ninja identify error:", identifyRes.status, result);
      return res.status(502).json({
        verified: false,
        error: result.error || "Verification request failed.",
        code: result.code || "IDENTIFY_FAILED",
      });
    }

    return res.status(200).json({
      verified: result.verified === true,
      status: result.status || "unknown",
      score: result.score ?? null,
      recommendation: result.recommendation || null,
      data: result.data || null,
    });
  } catch (err) {
    console.error("NIN verification error:", err);
    return res.status(500).json({ error: "Verification service temporarily unavailable." });
  }
}
