const TERMII_BASE_URL = process.env.TERMII_BASE_URL || "https://v4.api.termii.com";
const TERMII_API_KEY = process.env.TERMII_API_KEY;

function normalizeNigerianPhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-()+ ]/g, "");

  if (/^234\d{10}$/.test(cleaned)) return cleaned;
  if (/^0\d{10}$/.test(cleaned)) return "234" + cleaned.slice(1);
  if (/^[789]\d{9}$/.test(cleaned)) return "234" + cleaned;

  return null;
}

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

  const { phone } = await readBody(req);
  if (!phone || typeof phone !== "string") {
    return res.status(400).json({ error: "Phone number is required" });
  }

  const normalized = normalizeNigerianPhone(phone);
  if (!normalized) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  try {
    const response = await fetch(`${TERMII_BASE_URL}/api/sms/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        pin_type: "NUMERIC",
        to: normalized,
        from: "N-Alert",
        channel: "dnd",
        pin_attempts: 5,
        pin_time_to_live: 5,
        pin_length: 6,
        pin_placeholder: "< 123456 >",
        message_text: "Your RALLY verification code is < 123456 >. It expires in 5 minutes.",
      }),
    });

    const data = await response.json();

    if (!response.ok || (data.smsStatus && data.smsStatus !== "Message Sent") || data.status === "error") {
      console.error("Termii send error:", JSON.stringify(data));
      if (response.status === 429) {
        return res.status(429).json({ error: "Too many attempts. Please wait before trying again." });
      }
      return res.status(502).json({ error: "Unable to send verification code. Please try again." });
    }

    return res.status(200).json({ ok: true, phone: normalized, pinId: data.pinId || data.pin_id });
  } catch (err) {
    console.error("OTP send network error:", err);
    return res.status(502).json({ error: "Network error. Please try again." });
  }
}
