const TERMII_BASE_URL = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";
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
    const response = await fetch(`${TERMII_BASE_URL}/api/v1/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        message_type: "numeric",
        to: normalized,
        from: "N-Alert",
        channel: "dnd",
        pin_length: 6,
        expire: 300,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      console.error("Termii send error:", data);
      if (response.status === 429) {
        return res.status(429).json({ error: "Too many attempts. Please wait before trying again." });
      }
      return res.status(502).json({ error: "Unable to send verification code. Please try again." });
    }

    return res.status(200).json({ ok: true, phone: normalized });
  } catch (err) {
    console.error("OTP send network error:", err);
    return res.status(502).json({ error: "Network error. Please try again." });
  }
}
