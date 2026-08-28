// Frontend client for the NIN verification payment API.
// The frontend only: requests payment, opens Paystack, polls status.
// It never calls Ninja and never sees credentials.

import { getAuth } from "firebase/auth";

async function getIdToken() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  return await user.getIdToken();
}

async function api(path: string, options: RequestInit & { headers?: Record<string, string> } = {}) {
  const token = await getIdToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed") as Error & { code?: string };
    err.code = data.code;
    throw err;
  }
  return data;
}

/**
 * Initialize a ₦150 NIN verification payment.
 * Returns Paystack checkout details (authorization_url, access_code, transactionId).
 */
export function createNinPayment(details) {
  return api("/api/verifications/nin/payment", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

/**
 * Poll the backend for the normalized verification status.
 */
export async function getVerificationStatus(transactionId) {
  return api(`/api/verifications/${encodeURIComponent(transactionId)}/status`);
}
