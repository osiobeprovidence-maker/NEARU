const TERMII_BASE_URL = process.env.TERMII_BASE_URL || "https://v4.api.termii.com";
const TERMII_API_KEY = process.env.TERMII_API_KEY;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!TERMII_API_KEY) {
    console.error("TERMII_API_KEY is not set");
    return res.status(500).json({ error: "SMS service is not configured" });
  }

  let pinId, pin;
  try {
    const body = await readBody(req);
    pinId = body.pinId;
    pin = body.pin;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

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
    console.log("Termii verify response:", response.status, JSON.stringify(data));

    if (!response.ok || data.verified !== "True") {
      return res.status(400).json({ error: data.message || "Invalid verification code. Please try again." });
    }

    return res.status(200).json({ ok: true, phone: data.msisdn });
  } catch (err) {
    console.error("OTP verify error:", err);
    return res.status(502).json({ error: "Network error. Please try again." });
  }
};
