import { Authenticator } from "otpauth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { secret, token } = req.body;
    if (!secret || !token) {
      return res.status(400).json({ error: "Secret and token are required" });
    }

    const totp = new Authenticator({
      issuer: "RALLY",
      label: "RALLY",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secret,
    });

    const delta = totp.validate({ token, window: 1 });

    if (delta !== null) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(400).json({ valid: false, error: "Invalid code" });
    }
  } catch (error) {
    console.error("TOTP verify error:", error);
    return res.status(500).json({ error: "Failed to verify TOTP" });
  }
}
