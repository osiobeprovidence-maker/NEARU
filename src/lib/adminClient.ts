import { getAuth, type User } from "firebase/auth";

async function getIdToken() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  return await user.getIdToken();
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed") as Error & { code?: string };
    err.code = data.code;
    throw err;
  }
  return data as T;
}

export interface AdminStats {
  totalUsers: number;
  totalRallies: number;
  activeRallies: number;
  totalPosts: number;
  verifiedProfiles: number;
  organizations: number;
  businesses: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  totalAds: number;
  activeAds: number;
  totalVerifications: number;
  pendingVerifications: number;
  verifiedProfilesToday: number;
  newUsersToday: number;
  newRalliesToday: number;
}

export interface AdminUserCard {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  accountType: "personal" | "organization" | "business";
  organizationName: string | null;
  isNINVerified: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  role: string;
  badges: string[];
  bio: string;
  isPro: boolean;
  moderationStatus: string;
  createdAt: number | null;
}

export interface AdminUserDetail extends AdminUserCard {
  ralliesCreated: number;
  ralliesJoined: number;
  reportsReceived: number;
  ratingsCount: number;
  rating: number;
  followersCount: number;
  followingCount: number;
  totalActivity: number;
  totalSpentNaira: number;
}

export interface AdminRally {
  _id: string;
  type: string;
  title: string;
  description: string;
  city: string | null;
  locationLabel: string | null;
  category: string | null;
  hashtags: string[];
  interest: string | null;
  pricing: string | null;
  isPaid: boolean;
  price: number | null;
  status: string;
  moderationStatus: string | null;
  createdAt: number;
  eventDate: string | null;
  creator: AdminUserCard | null;
  likesCount: number;
  commentsCount: number;
  rsvpsCount: number;
  reportsCount: number;
  participantCount: number;
}

export interface AdminReportTarget {
  _id?: string;
  title?: string;
  type?: string;
  status?: string;
  creator?: AdminUserCard | null;
  name?: string;
  username?: string;
  avatar?: string;
  accountType?: string;
  moderationStatus?: string;
}

export interface AdminReportNote {
  adminId: string;
  text: string;
  createdAt: number;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reporter: AdminUserCard | null;
  targetType: "user" | "rally" | "organization";
  target: AdminReportTarget | null;
  reason: string;
  description: string | null;
  status: string;
  assigneeId: string | null;
  notes: AdminReportNote[];
  createdAt: number;
  updatedAt: number;
}

export interface AdminBroadcast {
  id: string;
  adminId: string;
  title: string;
  body: string;
  type: string | null;
  audience: string;
  recipientCount: number;
  createdAt: number;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: number;
}

export interface SystemSettings {
  platformName: string;
  defaultRadiusKm: number;
  supportedCities: string[];
  autoApproveRallies: boolean;
  requireEmailVerification: boolean;
  autoVerifyPhone: boolean;
  maintenanceMode: boolean;
  updatedAt?: number;
  updatedBy?: string;
}

export interface AdminAnalytics {
  rallyTypes: { name: string; count: number }[];
  ralliesByCity: { city: string; count: number }[];
  accountsByCity: { city: string; count: number }[];
  usersOverTime: { label: string; count: number }[];
  ralliesOverTime: { label: string; count: number }[];
  verifiedOverTime: { label: string; count: number }[];
  retentionSupported: boolean;
}

export interface AudienceCounts {
  all: number;
  verified: number;
  plus: number;
}

// ---------------------------------------------------------------------------
// Dashboard + analytics
// ---------------------------------------------------------------------------

export function getAdminStats(): Promise<{ stats: AdminStats }> {
  return api("/api/admin/stats");
}

export function getAdminAnalytics(): Promise<{ analytics: AdminAnalytics }> {
  return api("/api/admin/analytics");
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface ListUsersParams {
  q?: string;
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  accountType?: "personal" | "organization" | "business";
  limit?: number;
}

export function getAdminUsers(params: ListUsersParams = {}): Promise<{ users: AdminUserCard[] }> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.accountType) qs.set("accountType", params.accountType);
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return api(`/api/admin/users${suffix}`);
}

export function getUserDetail(userId: string): Promise<{ user: AdminUserDetail }> {
  return api(`/api/admin/users/${encodeURIComponent(userId)}/detail`);
}

export function setUserStatus(
  userId: string,
  action: "activate" | "suspend" | "ban",
  reason?: string
): Promise<{ ok: boolean }> {
  return api(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: "POST",
    body: JSON.stringify({ action, reason }),
  });
}

export function setUserRole(
  userId: string,
  role: "admin" | "moderator" | "user"
): Promise<{ ok: boolean }> {
  return api(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

// ---------------------------------------------------------------------------
// Rallies
// ---------------------------------------------------------------------------

export interface ListRalliesParams {
  q?: string;
  status?: string;
  type?: string;
  limit?: number;
}

export function getAdminRallies(params: ListRalliesParams = {}): Promise<{ rallies: AdminRally[] }> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.type) qs.set("type", params.type);
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return api(`/api/admin/rallies${suffix}`);
}

export function setRallyModeration(
  rallyId: string,
  action: "APPROVE" | "HIDE" | "REMOVE" | "FLAG",
  reason?: string
): Promise<{ ok: boolean }> {
  return api(`/api/admin/rallies/${encodeURIComponent(rallyId)}/moderation`, {
    method: "POST",
    body: JSON.stringify({ action, reason }),
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function getAdminReports(status?: string): Promise<{ reports: AdminReport[] }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return api(`/api/admin/reports${qs}`);
}

export function actOnReport(
  reportId: string,
  action: "resolve" | "dismiss" | "escalate" | "assign" | "note",
  opts: { assigneeId?: string; note?: string } = {}
): Promise<{ ok: boolean }> {
  return api(`/api/admin/reports/${encodeURIComponent(reportId)}/act`, {
    method: "POST",
    body: JSON.stringify({ action, ...opts }),
  });
}

// ---------------------------------------------------------------------------
// Settings + audit
// ---------------------------------------------------------------------------

export function getAuditLogs(): Promise<{ logs: AuditLogEntry[] }> {
  return api("/api/admin/audit");
}

export function getSettings(): Promise<{ settings: SystemSettings }> {
  return api("/api/admin/settings");
}

export function updateSettings(
  fields: Partial<SystemSettings>
): Promise<{ ok: boolean }> {
  return api("/api/admin/settings", {
    method: "POST",
    body: JSON.stringify(fields),
  });
}

// ---------------------------------------------------------------------------
// Broadcasts
// ---------------------------------------------------------------------------

export function getAudienceCounts(): Promise<{ counts: AudienceCounts }> {
  return api("/api/admin/notifications/audience-counts");
}

export interface BroadcastPayload {
  title: string;
  body: string;
  type?: string;
  audience: "ALL" | "VERIFIED" | "PLUS" | "SPECIFIC";
  targetUserIds?: string[];
}

export function sendBroadcast(
  payload: BroadcastPayload
): Promise<{ ok: boolean; recipientCount: number }> {
  return api("/api/admin/notifications/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listBroadcasts(): Promise<{ broadcasts: AdminBroadcast[] }> {
  return api("/api/admin/notifications");
}