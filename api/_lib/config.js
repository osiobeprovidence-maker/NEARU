// Business configuration for NIN verification.
// Prices are in kobo (smallest NGN unit). The backend is the single source of
// truth for pricing — never trust a frontend-provided amount.

export const NIN_CONFIG = {
  type: "NIN_VERIFICATION",
  provider: "PAYSTACK",
  currency: "NGN",
  // Customer pays ₦150.00
  customerAmountKobo: Number(process.env.NIN_VERIFICATION_PRICE_KOBO || 15000),
  // RALLY's Ninja provider expense (internal only)
  providerCostKobo: Number(process.env.NIN_PROVIDER_COST_KOBO || 10000),
};

export function grossMarginKobo() {
  return NIN_CONFIG.customerAmountKobo - NIN_CONFIG.providerCostKobo;
}

// The server secret used to authorize Convex state-transition mutations.
// Value must match VERIFICATION_SERVER_SECRET set in both the Convex project
// and Vercel. Used only by serverless routes; never exposed to browsers.
export function serverSecret() {
  return process.env.VERIFICATION_SERVER_SECRET || "";
}

export function isServerSecretValid(candidate) {
  const expected = serverSecret();
  if (!expected || !candidate) return false;
  // Constant-time compare
  if (expected.length !== candidate.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ candidate.charCodeAt(i);
  }
  return diff === 0;
}
