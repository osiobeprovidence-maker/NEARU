import { Authenticator } from "otpauth";
import QRCode from "qrcode";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const totp = new Authenticator({
      issuer: "RALLY",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const secret = totp.secret;
    const uri = totp.toString();

    const qrCodeDataUrl = await QRCode.toDataURL(uri, {
      width: 256,
      margin: 2,
      color: { dark: "#18181b", light: "#ffffff" },
    });

    return res.status(200).json({
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error("TOTP setup error:", error);
    return res.status(500).json({ error: "Failed to generate TOTP" });
  }
}
