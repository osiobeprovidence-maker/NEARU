const TERMII_BASE_URL = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";
const TERMII_API_KEY = process.env.TERMII_API_KEY;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  if (!TERMII_API_KEY) {
    console.error("TERMII_API_KEY is not set");
    return new Response(JSON.stringify({ error: "SMS service is not configured" }), { status: 500 });
  }

  const { phone, code } = await req.json();
  if (!phone || !code || typeof phone !== "string" || typeof code !== "string") {
    return new Response(JSON.stringify({ error: "Phone number and verification code are required" }), { status: 400 });
  }

  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return new Response(JSON.stringify({ error: "Invalid verification code format" }), { status: 400 });
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
        return new Response(JSON.stringify({ error: "Verification code has expired. Please request a new one." }), { status: 400 });
      }
      return new Response(JSON.stringify({ error: "Invalid verification code. Please try again." }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true, phone }), { status: 200 });
  } catch (err) {
    console.error("OTP verify network error:", err);
    return new Response(JSON.stringify({ error: "Network error. Please try again." }), { status: 502 });
  }
}
