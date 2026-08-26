const TERMII_BASE_URL = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";
const TERMII_API_KEY = process.env.TERMII_API_KEY;

function readBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: string) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!TERMII_API_KEY) {
    console.error("TERMII_API_KEY is not set");
    return res.status(500).json({ error: "SMS service is not configured" });
  }

  const { pinId, pin } = await readBody(req);
  if (!pinId || !pin || typeof pinId !== "string" || typeof pin !== "string") {
    return res.status(400).json({ error: "Verification ID and code are required" });
  }

  if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({ error: "Invalid verification code format" });
  }

  try {
    const response = await fetch(`${TERMII_BASE_URL}/api/sms/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        pin_id: pinId,
        pin,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.verified !== "True") {
      console.error("Termii verify error:", JSON.stringify(data));
      return res.status(400).json({ error: "Invalid verification code. Please try again." });
    }

    return res.status(200).json({ ok: true, phone: data.msisdn });
  } catch (err) {
    console.error("OTP verify network error:", err);
    return res.status(502).json({ error: "Network error. Please try again." });
  }
}
