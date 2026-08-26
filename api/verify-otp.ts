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

  const { phone, code } = await readBody(req);
  if (!phone || !code || typeof phone !== "string" || typeof code !== "string") {
    return res.status(400).json({ error: "Phone number and verification code are required" });
  }

  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Invalid verification code format" });
  }

  try {
    const response = await fetch(`${TERMII_BASE_URL}/api/v1/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        otp_code: code,
        phone_number: phone,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      console.error("Termii verify error:", data);
      if (data.message?.includes("expired")) {
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      }
      return res.status(400).json({ error: "Invalid verification code. Please try again." });
    }

    return res.status(200).json({ ok: true, phone });
  } catch (err) {
    console.error("OTP verify network error:", err);
    return res.status(502).json({ error: "Network error. Please try again." });
  }
}
