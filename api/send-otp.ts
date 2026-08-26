const TERMII_BASE_URL = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";
const TERMII_API_KEY = process.env.TERMII_API_KEY;

function normalizeNigerianPhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-()+ ]/g, "");

  if (/^234\d{10}$/.test(cleaned)) return cleaned;
  if (/^0\d{10}$/.test(cleaned)) return "234" + cleaned.slice(1);
  if (/^[789]\d{9}$/.test(cleaned)) return "234" + cleaned;

  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  if (!TERMII_API_KEY) {
    console.error("TERMII_API_KEY is not set");
    return new Response(JSON.stringify({ error: "SMS service is not configured" }), { status: 500 });
  }

  const { phone } = await req.json();
  if (!phone || typeof phone !== "string") {
    return new Response(JSON.stringify({ error: "Phone number is required" }), { status: 400 });
  }

  const normalized = normalizeNigerianPhone(phone);
  if (!normalized) {
    return new Response(JSON.stringify({ error: "Invalid phone number" }), { status: 400 });
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
        return new Response(JSON.stringify({ error: "Too many attempts. Please wait before trying again." }), { status: 429 });
      }
      return new Response(JSON.stringify({ error: "Unable to send verification code. Please try again." }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true, phone: normalized }), { status: 200 });
  } catch (err) {
    console.error("OTP send network error:", err);
    return new Response(JSON.stringify({ error: "Network error. Please try again." }), { status: 502 });
  }
}
