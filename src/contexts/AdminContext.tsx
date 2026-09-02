import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  getAdminStats,
  getAdminAnalytics,
  getAdminUsers,
  getUserDetail,
  setUserStatus,
  setUserRole,
  getAdminRallies,
  setRallyModeration,
  getAdminReports,
  actOnReport,
  getAuditLogs,
  getSettings,
  updateSettings as updateSettingsApi,
  getAudienceCounts,
  sendBroadcast as sendBroadcastApi,
  listBroadcasts,
  type AdminStats,
  type AdminAnalytics,
  type SystemSettings as BackendSettings,
  type AdminUserCard,
  type AdminUserDetail,
  type AdminRally as BackendRally,
  type AdminReport as BackendReport,
  type AdminBroadcast,
} from '../lib/adminClient';
import { User, Rally } from '../types';

// ---------------------------------------------------------------------------
// Public interfaces (kept identical to the previous implementation so existing
// admin pages keep compiling). All values are now hydrated from the real
// lalao backend via the serverless admin API.
// ---------------------------------------------------------------------------

export interface AdminUser extends User {
  email: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support' | 'verification_agent' | 'analyst' | 'user';
  status: 'active' | 'suspended' | 'banned';
  joinedAt: string;
  lastActive: string;
  isPlus: boolean;
  totalSpentOrShared: number;
  ralliesCreatedCount: number;
  ralliesJoinedCount: number;
  reportsReceivedCount: number;
  reportsSubmittedCount: number;
  trustScore: number;
  moderationStatus?: string;
}

export interface AdminRally extends Rally {
  moderationStatus: 'APPROVED' | 'PENDING' | 'FLAGGED' | 'HIDDEN' | 'REMOVED';
  reportsCount: number;
  flagReason?: string;
  moderatorNotes?: string;
  reviewedBy?: string;
}

export interface AdminReport {
  id: string;
  type: 'Suspicious Activity' | 'Spam/Bots' | 'Harassment' | 'Inappropriate Content' | 'Scam/Fraud' | 'Safety Concern' | 'Other' | string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserAvatar: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar: string;
  rallyId?: string;
  rallyTitle?: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
  createdAt: string;
  assignedAdmin?: string;
  evidenceText?: string;
  adminNotes?: string[];
  target?: BackendReport['target'];
}

export interface AdminVerification {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  ninNumber: string;
  documentPhotoUrl: string;
  selfiePhotoUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  confidenceScore: number;
  assignedAdmin?: string;
  notes?: string;
  rejectionReason?: string;
}

export type AdminVerificationRequest = AdminVerification;

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  audience: 'ALL' | 'VERIFIED' | 'PLUS' | 'LOCATION' | 'SPECIFIC' | string;
  targetLocation?: string;
  targetUserId?: string;
  type: 'SYSTEM' | 'SECURITY' | 'MODERATION' | 'SAFETY' | 'COMMUNITY' | 'UPDATE' | 'MARKETING';
  sentAt: string;
  sentBy: string;
  sentCount: number;
  openRate: number;
  status: string;
  readCount: number;
  isReadByAdmin?: boolean;
}

export interface AdminAuditEntry {
  id: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetType: 'USER' | 'RALLY' | 'REPORT' | 'VERIFICATION' | 'SETTINGS' | 'NOTIFICATION';
  targetId: string;
  targetName: string;
  timestamp: string;
  ipAddress: string;
  result: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: string;
}

export interface AdminToast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

export interface SystemSettings {
  platformName: string;
  supportEmail: string;
  defaultRadiusKm: number;
  maxRalliesPerUser: number;
  profanityFilterEnabled: boolean;
  aiAutoFlagEnabled: boolean;
  requireNINForPaidRallies: boolean;
  autoHideReportsThreshold: number;
  supportedCities: string[];
  brandLogoUrl?: string;
  brandIconUrl?: string;
  faviconUrl?: string;
  brandFont?: string;
  primaryColor?: string;
}

interface AdminContextType {
  users: AdminUser[];
  rallies: AdminRally[];
  reports: AdminReport[];
  verifications: AdminVerification[];
  notifications: AdminNotification[];
  auditLogs: AdminAuditEntry[];
  toasts: AdminToast[];
  systemSettings: SystemSettings;
  loading: boolean;
  error: string;
  analytics: AdminAnalytics | null;
  audienceCounts: { all: number; verified: number; plus: number } | null;
  userDetails: Record<string, AdminUserDetail>;
  loadUserDetail: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  showToast: (toastOrTitle: string | Omit<AdminToast, 'id'>, type?: AdminToast['type']) => void;
  dismissToast: (id: string) => void;
  // User Actions
  verifyUser: (userId: string) => void;
  suspendUser: (userId: string, reason: string) => void;
  banUser: (userId: string, reason: string) => void;
  unbanUser: (userId: string) => void;
  updateUserRole: (userId: string, role: AdminUser['role']) => void;
  addUser: (user: Partial<AdminUser>) => void;
  // Rally Actions
  approveRally: (rallyId: string) => void;
  hideRally: (rallyId: string, reason?: string) => void;
  removeRally: (rallyId: string, reason?: string) => void;
  flagRally: (rallyId: string, reason: string) => void;
  // Report Actions
  resolveReport: (reportId: string, resolutionNote?: string) => void;
  escalateReport: (reportId: string) => void;
  dismissReport: (reportId: string) => void;
  assignReport: (reportId: string, adminRef: string) => void;
  addReportNote: (reportId: string, note: string) => void;
  // Verification Actions
  approveVerification: (verificationId: string) => void;
  rejectVerification: (verificationId: string, reason: string) => void;
  requestResubmission: (verificationId: string, note: string) => void;
  requestVerificationInfo: (verificationId: string, note: string) => void;
  // Notification Actions
  sendBroadcast: (notification: {
    title: string;
    message: string;
    audience: string;
    type: AdminNotification['type'];
    targetLocation?: string;
    targetUserId?: string;
    sentBy?: string;
  }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  // Stats
  metrics: {
    totalUsers: number;
    activeRallies: number;
    verifiedProfiles: number;
    pendingReports: number;
    pendingVerifications: number;
    todayApprovedVerifications: number;
    [key: string]: number | string | undefined;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Normalization helpers: backend cards -> page-facing shapes
// ---------------------------------------------------------------------------

const ROLE_MAP: Record<string, AdminUser['role']> = {
  super_admin: 'super_admin',
  admin: 'admin',
  moderator: 'moderator',
  user: 'user',
};

function infoDisplay(value: number | null | undefined, unknownText = '—'): string {
  return value == null || Number.isNaN(value) ? unknownText : String(value);
}

function userCardToAdminUser(u: AdminUserCard): AdminUser {
  const createdAt = u.createdAt ? new Date(u.createdAt).toISOString() : '';
  const { name, username, avatar } = u;
  return {
    id: u._id,
    name,
    username,
    avatar,
    email: u.email || '',
    phone: u.phone || '',
    role: ROLE_MAP[u.role] || 'user',
    status: (u.moderationStatus || 'ACTIVE').toLowerCase() as AdminUser['status'],
    joinedAt: createdAt,
    lastActive: '',
    isPlus: u.isPro,
    totalSpentOrShared: 0,
    ralliesCreatedCount: 0,
    ralliesJoinedCount: 0,
    reportsReceivedCount: 0,
    reportsSubmittedCount: 0,
    trustScore: Math.min(
      100,
      Math.round(
        (u.isNINVerified ? 25 : 0) +
          (u.isPhoneVerified ? 10 : 0) +
          (u.isEmailVerified ? 10 : 0) +
          (u.isPro ? 10 : 0)
      )
    ),
    moderationStatus: u.moderationStatus || 'ACTIVE',
    isNINVerified: u.isNINVerified,
    isPhoneVerified: u.isPhoneVerified,
    location: u.location || '',
    bio: u.bio || '',
    badges: u.badges || [],
    isPro: u.isPro,
    accountType: u.accountType,
    organizationName: u.organizationName || undefined,
    stats: {
      rallies: 0,
      completed: 0,
      rating: 0,
    },
  };
}

function backendRallyToAdminRally(r: BackendRally): AdminRally {
  const moderation: AdminRally['moderationStatus'] =
    (r.moderationStatus as AdminRally['moderationStatus']) ??
    (r.status === 'CANCELLED' ? 'HIDDEN' : 'APPROVED');
  const creatorUser: User = {
    id: r.creator?._id || '',
    name: r.creator?.name || 'Unknown',
    username: r.creator?.username || '',
    avatar: r.creator?.avatar || '',
    isNINVerified: r.creator?.isNINVerified ?? false,
    isPhoneVerified: r.creator?.isPhoneVerified ?? false,
  };
  return {
    id: r._id,
    type: r.type as Rally['type'],
    title: r.title,
    description: r.description,
    distance: 0,
    time: '',
    peopleNeeded: 0,
    peopleInterested: r.participantCount || 0,
    isPaid: r.isPaid || r.pricing === 'paid',
    price: r.price,
    pricing: r.pricing as Rally['pricing'],
    creator: creatorUser,
    status: r.status as Rally['status'],
    createdAt: new Date(r.createdAt).toISOString(),
    city: r.city || undefined,
    locationLabel: r.locationLabel || undefined,
    category: r.category as Rally['category'],
    hashtags: r.hashtags,
    eventDate: r.eventDate || undefined,
    interests: r.interest ? [r.interest] : undefined,
    moderationStatus: moderation,
    reportsCount: r.reportsCount,
  };
}

function backendReportToAdminReport(rr: BackendReport): AdminReport {
  const isRally = rr.targetType === 'rally';
  const targetName = isRally ? rr.target?.title : rr.target?.name;
  const targetId = isRally ? rr.target?._id : rr.target?._id;
  return {
    id: rr.id,
    type: rr.reason,
    reportedUserId: targetId || '',
    reportedUserName: targetName || 'Unknown',
    reportedUserAvatar: rr.target?.avatar || '',
    reporterId: rr.reporterId,
    reporterName: rr.reporter?.name || 'Unknown',
    reporterAvatar: rr.reporter?.avatar || '',
    rallyId: isRally ? rr.target?._id : undefined,
    rallyTitle: isRally ? rr.target?.title : undefined,
    description: rr.description || rr.reason,
    priority: 'MEDIUM',
    status: rr.status as AdminReport['status'],
    createdAt: new Date(rr.createdAt).toISOString(),
    assignedAdmin: rr.assigneeId || undefined,
    evidenceText: '',
    adminNotes: rr.notes?.map((n) => `${n.text}`) || [],
    target: rr.target,
  };
}

function backendBroadcastToNotification(b: AdminBroadcast): AdminNotification {
  return {
    id: b.id,
    title: b.title,
    message: b.body,
    audience: b.audience,
    type: (b.type as AdminNotification['type']) || 'SYSTEM',
    sentAt: new Date(b.createdAt).toLocaleString('en-GB'),
    sentBy: '',
    sentCount: b.recipientCount,
    openRate: 0,
    status: 'SENT',
    readCount: 0,
    isReadByAdmin: false,
  };
}

function backendAuditToEntry(e: {
  id: string;
  adminName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: number;
}): AdminAuditEntry {
  return {
    id: e.id,
    adminName: e.adminName,
    adminRole: 'admin',
    action: e.action,
    targetType: (e.targetType || '').toUpperCase() as AdminAuditEntry['targetType'],
    targetId: e.targetId || '',
    targetName: e.details || '',
    timestamp: new Date(e.createdAt).toLocaleString('en-GB'),
    ipAddress: '',
    result: 'SUCCESS',
    details: e.details || '',
  };
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const convex = useConvex();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rallies, setRallies] = useState<AdminRally[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [audienceCounts, setAudienceCounts] = useState<{ all: number; verified: number; plus: number } | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, AdminUserDetail>>({});
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    platformName: 'lalao',
    supportEmail: '',
    defaultRadiusKm: 5,
    maxRalliesPerUser: 0,
    profanityFilterEnabled: false,
    aiAutoFlagEnabled: false,
    requireNINForPaidRallies: false,
    autoHideReportsThreshold: 0,
    supportedCities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu', 'Benin City', 'Kano'],
    brandLogoUrl: undefined,
    brandIconUrl: undefined,
    faviconUrl: undefined,
    brandFont: 'system',
    primaryColor: '#4f46e5',
  });
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifications, setVerifications] = useState<AdminVerification[]>([]);

  const showToast = useCallback((toastOrTitle: string | Omit<AdminToast, 'id'>, type: AdminToast['type'] = 'success') => {
    const toast: AdminToast =
      typeof toastOrTitle === 'string'
        ? { id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: toastOrTitle, type }
        : { ...toastOrTitle, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
    return toast;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [
        statsRes,
        usersRes,
        ralliesRes,
        reportsRes,
        broadcastsRes,
        logsRes,
        settingsRes,
        countsRes,
        analyticsRes,
      ] = await Promise.allSettled([
        convex.query(api.admin.getDashboardStats, {}),
        convex.query(api.admin.listUsers, {}),
        convex.query(api.admin.listRallies, {}),
        convex.query(api.admin.listReports, {}),
        convex.query(api.admin.listBroadcasts, {}),
        convex.query(api.admin.listAuditLogs, {}),
        convex.query(api.admin.getSystemSettings, {}),
        convex.query(api.admin.getAudienceCounts, {}),
        convex.query(api.admin.getAnalytics, {}),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value as any);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        setUsers((usersRes.value as any[]).map(userCardToAdminUser));
      }
      if (ralliesRes.status === 'fulfilled' && Array.isArray(ralliesRes.value)) {
        setRallies((ralliesRes.value as any[]).map(backendRallyToAdminRally));
      }
      if (reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value)) {
        setReports((reportsRes.value as any[]).map(backendReportToAdminReport));
      }
      if (broadcastsRes.status === 'fulfilled' && Array.isArray(broadcastsRes.value)) {
        setNotifications((broadcastsRes.value as any[]).map(backendBroadcastToNotification));
      }
      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)) {
        setAuditLogs((logsRes.value as any[]).map(backendAuditToEntry));
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        const s = settingsRes.value as BackendSettings;
        setSystemSettings((prev) => ({
          ...prev,
          platformName: s.platformName,
          defaultRadiusKm: s.defaultRadiusKm,
          supportedCities: s.supportedCities,
          brandLogoUrl: s.brandLogoUrl,
          brandIconUrl: s.brandIconUrl,
          faviconUrl: s.faviconUrl,
          brandFont: s.brandFont,
          primaryColor: s.primaryColor,
        }));
      }
      if (countsRes.status === 'fulfilled' && countsRes.value) {
        setAudienceCounts(countsRes.value);
      }
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        setAnalytics(analyticsRes.value as any);
      }

      const rejected = [statsRes, usersRes, ralliesRes, reportsRes, broadcastsRes, logsRes, settingsRes, countsRes, analyticsRes]
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (rejected.length > 0) {
        console.warn('[AdminContext] Some admin queries failed:', rejected.map(r => r.reason));
      }
    } catch (err) {
      console.error('[AdminContext] refresh error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [convex]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadUserDetail = useCallback(async (userId: string) => {
    if (userDetails[userId]) return;
    try {
      const d = (await convex.query(api.admin.getUserDetail, { userId: userId as any })) as any;
      if (!d) return;
      setUserDetails((prev) => ({ ...prev, [userId]: d }));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                ralliesCreatedCount: d.ralliesCreated,
                ralliesJoinedCount: d.ralliesJoined,
                reportsReceivedCount: d.reportsReceived,
                totalSpentOrShared: d.totalSpentNaira,
                stats: { ...u.stats, rallies: d.ralliesCreated, rating: d.rating },
              }
            : u
        )
      );
    } catch {
      // keep whatever we have
    }
  }, [userDetails, convex]);

  const metrics: AdminContextType['metrics'] = {
    totalUsers: stats?.totalUsers ?? 0,
    activeRallies: stats?.activeRallies ?? 0,
    verifiedProfiles: stats?.verifiedProfiles ?? 0,
    pendingReports: stats?.pendingReports ?? 0,
    pendingVerifications: stats?.pendingVerifications ?? 0,
    todayApprovedVerifications: stats?.verifiedProfilesToday ?? 0,
    totalRallies: stats?.totalRallies ?? 0,
    totalPosts: stats?.totalPosts ?? 0,
    organizations: stats?.organizations ?? 0,
    businesses: stats?.businesses ?? 0,
    totalReports: stats?.totalReports ?? 0,
    resolvedReports: stats?.resolvedReports ?? 0,
    totalAds: stats?.totalAds ?? 0,
    activeAds: stats?.activeAds ?? 0,
    totalVerifications: stats?.totalVerifications ?? 0,
    newUsersToday: stats?.newUsersToday ?? 0,
    newRalliesToday: stats?.newRalliesToday ?? 0,
  };

  // -------------------------------------------------------------------------
  // Real actions
  // -------------------------------------------------------------------------

  const updateSettings = useCallback(
    async (newSettings: Partial<SystemSettings>) => {
      const allowedFields: (keyof BackendSettings)[] = [
        'platformName',
        'defaultRadiusKm',
        'supportedCities',
        'autoApproveRallies',
        'requireEmailVerification',
        'autoVerifyPhone',
        'maintenanceMode',
        'brandLogoUrl',
        'brandIconUrl',
        'faviconUrl',
        'brandFont',
        'primaryColor',
      ];
      const payload: Partial<BackendSettings> = {};
      for (const f of allowedFields) {
        if (newSettings[f as keyof SystemSettings] !== undefined) {
          payload[f] = newSettings[f as keyof SystemSettings] as never;
        }
      }
      try {
        await convex.mutation(api.admin.updateSystemSettings, payload as any);
        setSystemSettings((prev) => ({ ...prev, ...newSettings }));
        showToast('Settings saved.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Failed to save settings.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const verifyUser = useCallback(
    (userId: string) => {
      void userId;
      showToast('Verification cannot be granted manually — users must pass the real NIN check.', 'warning');
    },
    [showToast]
  );

  const suspendUser = useCallback(
    async (userId: string, reason: string) => {
      try {
        await convex.mutation(api.admin.setUserStatus, {
          userId: userId as any,
          status: 'SUSPENDED',
          reason,
        });
        showToast('User suspended.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Failed to suspend user.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const banUser = useCallback(
    async (userId: string, reason: string) => {
      try {
        await convex.mutation(api.admin.setUserStatus, {
          userId: userId as any,
          status: 'BANNED',
          reason,
        });
        showToast('User banned.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Failed to ban user.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const unbanUser = useCallback(
    async (userId: string) => {
      try {
        await convex.mutation(api.admin.setUserStatus, {
          userId: userId as any,
          status: 'ACTIVE',
        });
        showToast('User restored.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Failed to restore user.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const updateUserRole = useCallback(
    async (userId: string, role: AdminUser['role']) => {
      const realRole = role === 'verification_agent' || role === 'analyst' || role === 'support' ? 'moderator' : role;
      if (realRole === 'super_admin') {
        showToast('Super admin role cannot be changed via the CRM.', 'warning');
        return;
      }
      try {
        await convex.mutation(api.admin.setUserRole, {
          userId: userId as any,
          role: realRole as any,
        });
        showToast('Role updated.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Failed to update role.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const addUser = useCallback(
    (user: Partial<AdminUser>) => {
      void user;
      showToast('Manual user creation is not supported — users register through the app.', 'warning');
    },
    [showToast]
  );

  const approveRally = useCallback(
    async (rallyId: string) => {
      try {
        await convex.mutation(api.admin.setRallyModeration, {
          rallyId: rallyId as any,
          action: 'APPROVE',
        });
        showToast('RALLY approved.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Action failed.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const hideRally = useCallback(
    async (rallyId: string, reason?: string) => {
      try {
        await convex.mutation(api.admin.setRallyModeration, {
          rallyId: rallyId as any,
          action: 'HIDE',
          reason,
        });
        showToast('RALLY hidden from feeds.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Action failed.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const removeRally = useCallback(
    async (rallyId: string, reason?: string) => {
      try {
        await convex.mutation(api.admin.setRallyModeration, {
          rallyId: rallyId as any,
          action: 'REMOVE',
          reason,
        });
        showToast('RALLY removed.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Action failed.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const flagRally = useCallback(
    async (rallyId: string, reason: string) => {
      try {
        await convex.mutation(api.admin.setRallyModeration, {
          rallyId: rallyId as any,
          action: 'FLAG',
          reason,
        });
        showToast('RALLY flagged for review.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Action failed.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const resolveReport = useCallback(
    async (reportId: string, resolutionNote?: string) => {
      try {
        await convex.mutation(api.admin.actOnReport, {
          reportId: reportId as any,
          action: 'resolve',
          note: resolutionNote,
        });
        showToast('Report resolved.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Action failed.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const escalateReport = useCallback(
    async (reportId: string) => {
      try {
        await convex.mutation(api.admin.actOnReport, {
          reportId: reportId as any,
          action: 'escalate',
        });
        showToast('Report escalated.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Action failed.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const dismissReport = useCallback(
    async (reportId: string) => {
      try {
        await convex.mutation(api.admin.actOnReport, {
          reportId: reportId as any,
          action: 'dismiss',
        });
        showToast('Report dismissed.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Action failed.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const assignReport = useCallback(
    async (reportId: string, adminRef: string) => {
      try {
        await convex.mutation(api.admin.actOnReport, {
          reportId: reportId as any,
          action: 'assign',
          assigneeId: adminRef as any,
        });
        showToast('Report assigned.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Action failed.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const addReportNote = useCallback(
    async (reportId: string, note: string) => {
      try {
        await convex.mutation(api.admin.actOnReport, {
          reportId: reportId as any,
          action: 'note',
          note,
        });
        showToast('Note added.', 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Action failed.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  // NIN verification actions are intentionally inert: real verification runs
  // through the provider + serverless backend, never through admin approval.
  const approveVerification = useCallback(
    (verificationId: string) => {
      void verificationId;
      showToast('Verifications cannot be approved manually.', 'warning');
    },
    [showToast]
  );
  const rejectVerification = useCallback(
    (verificationId: string, rejectReason?: string) => {
      void verificationId;
      void rejectReason;
      showToast('Verifications cannot be changed manually.', 'warning');
    },
    [showToast]
  );
  const requestResubmission = useCallback(
    (verificationId: string, note?: string) => {
      void verificationId;
      void note;
      showToast('Verifications cannot be changed manually.', 'warning');
    },
    [showToast]
  );
  const requestVerificationInfo = requestResubmission;

  const sendBroadcast = useCallback(
    async (notification: {
      title: string;
      message: string;
      audience: string;
      type: AdminNotification['type'];
      targetLocation?: string;
      targetUserId?: string;
      sentBy?: string;
    }) => {
      const audience = notification.targetUserId
        ? 'SPECIFIC'
        : notification.audience === 'LOCATION'
        ? 'ALL'
        : notification.audience;
      try {
        const res = await convex.mutation(api.admin.sendBroadcast, {
          title: notification.title,
          body: notification.message,
          type: notification.type || 'SYSTEM',
          audience: (audience as 'ALL' | 'VERIFIED' | 'PLUS' | 'SPECIFIC') || 'ALL',
          targetUserIds: notification.targetUserId ? [notification.targetUserId as any] : undefined,
        });
        showToast(`Broadcast sent to ${res.recipientCount} user${res.recipientCount === 1 ? '' : 's'}.`, 'success');
        refresh();
      } catch (err) {
        showToast((err as Error).message || 'Failed to send broadcast.', 'danger');
      }
    },
    [convex, refresh, showToast]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isReadByAdmin: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isReadByAdmin: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value: AdminContextType = {
    users,
    rallies,
    reports,
    verifications,
    notifications,
    auditLogs,
    toasts,
    systemSettings,
    loading,
    error,
    analytics,
    audienceCounts,
    userDetails,
    loadUserDetail,
    refresh,
    updateSettings,
    showToast,
    dismissToast,
    verifyUser,
    suspendUser,
    banUser,
    unbanUser,
    updateUserRole,
    addUser,
    approveRally,
    hideRally,
    removeRally,
    flagRally,
    resolveReport,
    escalateReport,
    dismissReport,
    assignReport,
    addReportNote,
    approveVerification,
    rejectVerification,
    requestResubmission,
    requestVerificationInfo,
    sendBroadcast,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    metrics,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}