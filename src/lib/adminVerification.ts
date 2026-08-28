import { getAuth } from "firebase/auth";

async function getIdToken() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  return await user.getIdToken();
}

async function api<T>(path: string): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed") as Error & { code?: string };
    err.code = data.code;
    throw err;
  }
  return data as T;
}

export interface AdminVerificationTx {
  transactionId: string;
  userId: string;
  type: string;
  provider: string;
  amount: number; // kobo
  currency: string;
  paymentStatus: string;
  verificationStatus: string;
  paymentReference: string;
  paystackReference: string | null;
  ninjaReference: string | null;
  ninHashMasked: string | null;
  failureReason: string | null;
  createdAt: number;
  paidAt: number | null;
  verifiedAt: number | null;
}

export interface AdminVerificationReport {
  totalTransactions: number;
  totalSuccessfulPayments: number;
  totalSuccessfulVerifications: number;
  failedVerifications: number;
  providerErrors: number;
  totalRevenue: number; // naira
  totalProviderCost: number; // naira
  grossMargin: number; // naira
  unit: string;
  note: string;
}

export function getAdminVerifications(): Promise<{ verifications: AdminVerificationTx[] }> {
  return api("/api/admin/verifications");
}

export function getAdminVerificationReport(): Promise<{ report: AdminVerificationReport }> {
  return api("/api/admin/verifications/report");
}

export function formatNaira(koboOrNaira: number, isNaira = false): string {
  const value = isNaira ? koboOrNaira : koboOrNaira / 100;
  return value.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

export function formatDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case "PAYMENT_PENDING": return "Payment Initialised";
    case "PAYMENT_SUCCESS": return "Paid";
    case "PAYMENT_FAILED": return "Payment Failed";
    default: return status.replace(/_/g, " ");
  }
}

export function getVerificationStatusLabel(status: string): string {
  switch (status) {
    case "VERIFICATION_PENDING": return "Verification Pending";
    case "VERIFICATION_IN_PROGRESS": return "In Progress";
    case "VERIFIED": return "Verified";
    case "VERIFICATION_FAILED": return "Verification Failed";
    case "PROVIDER_ERROR": return "Provider Error";
    default: return status.replace(/_/g, " ");
  }
}
