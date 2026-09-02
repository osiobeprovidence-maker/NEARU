import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./adminHelpers";
import { getAuthenticatedAdmin } from "./lib/auth";

// ---------------------------------------------------------------------------
// lalao Admin / CRM backend.
//
// SECURITY MODEL:
// Admin functions support two execution paths:
//  1. Direct browser client: authenticated via Firebase JWT (ctx.auth), verified
//     by getAuthenticatedAdmin(ctx) to enforce super_admin/admin role.
//  2. Legacy serverless backend: authorized via VERIFICATION_SERVER_SECRET and
//     requestingAdminId verified by requireAdmin.
// ---------------------------------------------------------------------------

function assertServerSecret(provided: string | undefined) {
  const expected = process.env.VERIFICATION_SERVER_SECRET || "";
  if (!expected) {
    throw new Error("Admin server secret is not configured");
  }
  if (!provided || provided !== expected) {
    throw new Error("Unauthorized: invalid server secret");
  }
}

async function gate(
  ctx: any,
  args?: { requestingAdminId?: any; serverSecret?: string }
) {
  if (args?.serverSecret) {
    assertServerSecret(args.serverSecret);
    if (!args.requestingAdminId) throw new Error("Missing requestingAdminId");
    return requireAdmin(ctx, args.requestingAdminId);
  }
  return await getAuthenticatedAdmin(ctx);
}

async function resolveUserCard(ctx: any, user: any) {
  if (!user) return null;
  let avatar = user.avatar || "";
  if (avatar && !avatar.startsWith("http")) {
    try {
      const url = await ctx.storage.getUrl(avatar);
      if (url) avatar = url;
    } catch {}
  }
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatar,
    email: user.email || null,
    phone: user.phone || null,
    location: user.location || null,
    accountType: user.accountType || "personal",
    organizationName: user.organizationName || null,
    isNINVerified: !!user.isNINVerified,
    isPhoneVerified: !!user.isPhoneVerified,
    isEmailVerified: !!user.isEmailVerified,
    role: user.role || "user",
    badges: user.badges || [],
    bio: user.bio || "",
    isPro: user.isPro ?? false,
    moderationStatus: user.moderationStatus || "ACTIVE",
    createdAt: user.createdAt || null,
  };
}

async function resolveRallyCard(ctx: any, rally: any) {
  if (!rally) return null;
  const [creator, likes, comments, rsvps, reports] = await Promise.all([
    ctx.db.get(rally.creatorId),
    ctx.db.query("likes").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect(),
    ctx.db.query("comments").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect(),
    ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect(),
    ctx.db
      .query("reports")
      .withIndex("by_target", (q) => q.eq("targetType", "rally").eq("targetId", rally._id as any))
      .collect(),
  ]);
  return {
    _id: rally._id,
    type: rally.type,
    title: rally.title,
    description: rally.description,
    city: rally.city || null,
    locationLabel: rally.locationLabel || null,
    category: rally.category || null,
    hashtags: rally.hashtags || [],
    interest: rally.interest || null,
    pricing: rally.pricing || null,
    isPaid: rally.isPaid,
    price: rally.price ?? null,
    status: rally.status,
    moderationStatus: rally.moderationStatus || null,
    createdAt: rally.createdAt,
    eventDate: rally.eventDate || null,
    creator: await resolveUserCard(ctx, creator),
    likesCount: likes.length,
    commentsCount: comments.length,
    rsvpsCount: rsvps.length,
    reportsCount: reports.length,
    participantCount: rally.peopleInterested || 0,
  };
}

async function resolveReportCard(ctx: any, report: any) {
  const reporter = await ctx.db.get(report.reporterId);
  let target: any = null;
  if (report.targetType === "user" || report.targetType === "organization") {
    target = await resolveUserCard(ctx, await ctx.db.get(report.targetId as any));
  } else if (report.targetType === "rally") {
    const rally = await ctx.db.get(report.targetId as any);
    if (rally) {
      target = {
        _id: rally._id,
        title: rally.title,
        type: rally.type,
        status: rally.status,
        creator: await resolveUserCard(ctx, await ctx.db.get(rally.creatorId)),
      };
    }
  }
  return {
    id: report._id,
    reporterId: report.reporterId,
    reporter: await resolveUserCard(ctx, reporter),
    targetType: report.targetType,
    target,
    reason: report.reason,
    description: report.description || null,
    status: report.status,
    assigneeId: report.assigneeId || null,
    notes: report.notes || [],
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Dashboard + analytics
// ---------------------------------------------------------------------------

export const getDashboardStats = query({
  args: { requestingAdminId: v.optional(v.id("users")), serverSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    const [users, rallies, verifications, reports, ads] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("rallies").collect(),
      ctx.db.query("verifications").collect(),
      ctx.db.query("reports").collect(),
      ctx.db.query("ads").collect(),
    ]);
    const dayStart = Date.now() - 24 * 60 * 60 * 1000;
    return {
      totalUsers: users.length,
      totalRallies: rallies.length,
      activeRallies: rallies.filter((r) => r.status === "ACTIVE").length,
      totalPosts: rallies.filter((r) => r.type === "POST").length,
      verifiedProfiles: users.filter((u) => u.isNINVerified).length,
      organizations: users.filter((u) => u.accountType === "organization").length,
      businesses: users.filter((u) => u.accountType === "business").length,
      totalReports: reports.length,
      pendingReports: reports.filter(
        (r) => r.status === "PENDING" || r.status === "UNDER_REVIEW"
      ).length,
      resolvedReports: reports.filter((r) => r.status === "RESOLVED").length,
      totalAds: ads.length,
      activeAds: ads.filter((a) => a.isActive).length,
      totalVerifications: verifications.length,
      pendingVerifications: verifications.filter(
        (x) => x.verificationStatus === "VERIFICATION_PENDING"
      ).length,
      verifiedProfilesToday: verifications.filter(
        (x) =>
          x.verificationStatus === "VERIFIED" &&
          !!x.verifiedAt &&
          x.verifiedAt >= dayStart
      ).length,
      newUsersToday: users.filter((u) => !!u.createdAt && u.createdAt >= dayStart).length,
      newRalliesToday: rallies.filter((r) => r.createdAt >= dayStart).length,
    };
  },
});

export const getAnalytics = query({
  args: { requestingAdminId: v.optional(v.id("users")), serverSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    const [users, rallies, verifications] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("rallies").collect(),
      ctx.db.query("verifications").collect(),
    ]);

    const typeCounts: Record<string, number> = {};
    for (const r of rallies) typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    const rallyTypes = Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const cityCounts: Record<string, number> = {};
    for (const r of rallies) {
      const city = r.city || "Unknown";
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
    const ralliesByCity = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const userCityCounts: Record<string, number> = {};
    for (const u of users) {
      const city = u.location ? u.location.split(",")[0].trim() : "Unknown";
      userCityCounts[city] = (userCityCounts[city] || 0) + 1;
    }
    const accountsByCity = Object.entries(userCityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const buckets = 14;
    const binMs = 24 * 60 * 60 * 1000;
    const labels: string[] = [];
    const usersOverTime: { label: string; count: number }[] = [];
    const ralliesOverTime: { label: string; count: number }[] = [];
    const verifiedOverTime: { label: string; count: number }[] = [];
    const nowStamp = Date.now();
    for (let i = buckets - 1; i >= 0; i--) {
      const dayStart = nowStamp - i * binMs;
      const next = dayStart + binMs;
      const label = new Date(dayStart).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      labels.push(label);
      usersOverTime.push({
        label,
        count: users.filter((u) => !!u.createdAt && u.createdAt >= dayStart && u.createdAt < next).length,
      });
      ralliesOverTime.push({
        label,
        count: rallies.filter((r) => r.createdAt >= dayStart && r.createdAt < next).length,
      });
      verifiedOverTime.push({
        label,
        count: verifications.filter(
          (x) => x.verificationStatus === "VERIFIED" && !!x.verifiedAt && x.verifiedAt >= dayStart && x.verifiedAt < next
        ).length,
      });
    }

    return {
      rallyTypes,
      ralliesByCity,
      accountsByCity,
      usersOverTime,
      ralliesOverTime,
      verifiedOverTime,
      retentionSupported: false, // no historical session data
    };
  },
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const listUsers = query({
  args: {
    requestingAdminId: v.optional(v.id("users")),
    serverSecret: v.optional(v.string()),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("ACTIVE"), v.literal("SUSPENDED"), v.literal("BANNED"))
    ),
    accountType: v.optional(
      v.union(v.literal("personal"), v.literal("organization"), v.literal("business"))
    ),
  },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    const all = await ctx.db.query("users").order("desc").take(args.limit || 200);
    const q = (args.query || "").trim().toLowerCase();
    const filtered = all
      .filter((u) => {
        if (args.status && (u.moderationStatus || "ACTIVE") !== args.status) return false;
        if (args.accountType && (u.accountType || "personal") !== args.accountType) return false;
        if (!q) return true;
        return (
          (u.name || "").toLowerCase().includes(q) ||
          (u.username || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
        );
      })
      .slice(0, args.limit || 200);
    const cards = [];
    for (const u of filtered) {
      cards.push(await resolveUserCard(ctx, u));
    }
    return cards;
  },
});

export const getUserDetail = query({
  args: { requestingAdminId: v.optional(v.id("users")), serverSecret: v.optional(v.string()), userId: v.id("users") },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const [created, totalActivity, ratings, reportsReceived, followers, following, joined, paidVerifications] = await Promise.all([
      ctx.db.query("rallies").withIndex("by_creator", (q) => q.eq("creatorId", args.userId)).collect(),
      ctx.db.query("rallies").withIndex("by_creator", (q) => q.eq("creatorId", args.userId)).collect(),
      ctx.db.query("ratings").withIndex("by_rated_user", (q) => q.eq("ratedUserId", args.userId)).collect(),
      ctx.db.query("reports").withIndex("by_target", (q) => q.eq("targetType", "user").eq("targetId", args.userId as any)).collect(),
      ctx.db.query("follows").withIndex("by_following", (q) => q.eq("followingId", args.userId)).collect(),
      ctx.db.query("follows").withIndex("by_follower", (q) => q.eq("followerId", args.userId)).collect(),
      ctx.db
        .query("rallyParticipants")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db.query("verifications").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
    ]);
    const totalSpentNaira =
      paidVerifications
        .filter((x) => x.paymentStatus === "PAYMENT_SUCCESS")
        .reduce((s, x) => s + (x.customerAmountKobo || 0), 0) / 100;
    return {
      ...(await resolveUserCard(ctx, user)),
      ralliesCreated: created.length,
      ralliesJoined: joined.length,
      reportsReceived: reportsReceived.length,
      ratingsCount: ratings.length,
      rating: user.rating ?? 0,
      followersCount: followers.length,
      followingCount: following.length,
      totalActivity: created.length + joined.length,
      totalSpentNaira,
      badges: user.badges || [],
    };
  },
});

export const setUserStatus = mutation({
  args: {
    requestingAdminId: v.optional(v.id("users")),
    serverSecret: v.optional(v.string()),
    userId: v.id("users"),
    status: v.union(v.literal("ACTIVE"), v.literal("SUSPENDED"), v.literal("BANNED")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await gate(ctx, args);
    await ctx.db.patch(args.userId, { moderationStatus: args.status });
    await ctx.db.insert("auditLogs", {
      adminId: admin._id,
      adminName: admin.name,
      action: args.status === "ACTIVE" ? "restore_user" : args.status === "SUSPENDED" ? "suspend_user" : "ban_user",
      targetType: "user",
      targetId: args.userId,
      details: args.reason,
      createdAt: Date.now(),
    });
    return { ok: true, userId: args.userId, status: args.status };
  },
});

export const setUserRole = mutation({
  args: {
    requestingAdminId: v.optional(v.id("users")),
    serverSecret: v.optional(v.string()),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("moderator"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const admin = await gate(ctx, args);
    await ctx.db.patch(args.userId, { role: args.role });
    await ctx.db.insert("auditLogs", {
      adminId: admin._id,
      adminName: admin.name,
      action: "set_user_role",
      targetType: "user",
      targetId: args.userId,
      details: args.role,
      createdAt: Date.now(),
    });
    return { ok: true, userId: args.userId, role: args.role };
  },
});

// ---------------------------------------------------------------------------
// Rallies / posts moderation
// ---------------------------------------------------------------------------

export const listRallies = query({
  args: {
    requestingAdminId: v.optional(v.id("users")),
    serverSecret: v.optional(v.string()),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    const all = await ctx.db.query("rallies").order("desc").take((args.limit || 200) * 3);
    const q = (args.query || "").trim().toLowerCase();
    const filtered = all
      .filter((r) => {
        if (args.status && r.status !== args.status) return false;
        if (args.type && r.type !== args.type) return false;
        if (!q) return true;
        return (
          (r.title || "").toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          (r.city || "").toLowerCase().includes(q)
        );
      })
      .slice(0, args.limit || 200);
    const cards = [];
    for (const r of filtered) {
      cards.push(await resolveRallyCard(ctx, r));
    }
    return cards;
  },
});

export const setRallyModeration = mutation({
  args: {
    requestingAdminId: v.optional(v.id("users")),
    serverSecret: v.optional(v.string()),
    rallyId: v.id("rallies"),
    action: v.union(
      v.literal("APPROVE"),
      v.literal("HIDE"),
      v.literal("REMOVE"),
      v.literal("FLAG")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await gate(ctx, args);
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("RALLY_NOT_FOUND");
    const patch: any = {};
    if (args.action === "APPROVE") {
      patch.moderationStatus = "APPROVED";
    } else if (args.action === "HIDE") {
      patch.moderationStatus = "HIDDEN";
      patch.status = "CANCELLED";
    } else if (args.action === "REMOVE") {
      patch.moderationStatus = "REMOVED";
      patch.status = "CANCELLED";
    } else if (args.action === "FLAG") {
      patch.moderationStatus = "FLAGGED";
    }
    await ctx.db.patch(args.rallyId, { ...patch, updatedAt: Date.now() });
    const actionLabels: Record<string, string> = {
      APPROVE: "approve_rally",
      HIDE: "hide_rally",
      REMOVE: "remove_rally",
      FLAG: "flag_rally",
    };
    await ctx.db.insert("auditLogs", {
      adminId: admin._id,
      adminName: admin.name,
      action: actionLabels[args.action],
      targetType: "rally",
      targetId: args.rallyId,
      details: args.reason || rally.title,
      createdAt: Date.now(),
    });
    return { ok: true, rallyId: args.rallyId, moderationStatus: patch.moderationStatus, status: patch.status || rally.status };
  },
});

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

// User-facing report submission (called from the app, NOT admin-gated).
export const submitReport = mutation({
  args: {
    reporterId: v.id("users"),
    targetType: v.union(
      v.literal("user"),
      v.literal("rally"),
      v.literal("organization")
    ),
    targetId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reason = (args.reason || "").trim();
    if (!reason) throw new Error("REPORT_REASON_REQUIRED");
    const now = Date.now();
    const id = await ctx.db.insert("reports", {
      reporterId: args.reporterId,
      targetType: args.targetType,
      targetId: args.targetId,
      reason,
      description: args.description?.trim() || undefined,
      status: "PENDING",
      notes: [],
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

export const listReports = query({
  args: {
    requestingAdminId: v.optional(v.id("users")),
    serverSecret: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("PENDING"),
        v.literal("UNDER_REVIEW"),
        v.literal("RESOLVED"),
        v.literal("DISMISSED"),
        v.literal("ESCALATED")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    let rows = await ctx.db.query("reports").order("desc").take(args.limit || 200);
    if (args.status) rows = rows.filter((r) => r.status === args.status);
    const cards = [];
    for (const r of rows) cards.push(await resolveReportCard(ctx, r));
    return cards;
  },
});

export const actOnReport = mutation({
  args: {
    requestingAdminId: v.optional(v.id("users")),
    serverSecret: v.optional(v.string()),
    reportId: v.id("reports"),
    action: v.union(
      v.literal("resolve"),
      v.literal("dismiss"),
      v.literal("escalate"),
      v.literal("assign"),
      v.literal("note")
    ),
    assigneeId: v.optional(v.id("users")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await gate(ctx, args);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("REPORT_NOT_FOUND");
    const now = Date.now();
    const patch: Record<string, any> = { updatedAt: now };
    const actionLabel: Record<string, string> = {
      resolve: "resolve_report",
      dismiss: "dismiss_report",
      escalate: "escalate_report",
      assign: "assign_report",
      note: "note_report",
    };
    let detail = args.note || "";
    if (args.action === "resolve") patch.status = "RESOLVED";
    if (args.action === "dismiss") patch.status = "DISMISSED";
    if (args.action === "escalate") patch.status = "ESCALATED";
    if (args.action === "assign") {
      patch.status = "UNDER_REVIEW";
      if (args.assigneeId) {
        patch.assigneeId = args.assigneeId;
        const assignee: any = await ctx.db.get(args.assigneeId);
        detail = (assignee?.name || args.assigneeId.toString()) + (args.note ? ` — ${args.note}` : "");
      }
    }
    if (args.note && args.note.trim()) {
      const notes = report.notes || [];
      patch.notes = [...notes, { adminId: admin._id, text: args.note.trim(), createdAt: now }];
    }
    await ctx.db.patch(args.reportId, patch);
    await ctx.db.insert("auditLogs", {
      adminId: admin._id,
      adminName: admin.name,
      action: actionLabel[args.action],
      targetType: "report",
      targetId: args.reportId,
      details: detail,
      createdAt: now,
    });
    return { ok: true, reportId: args.reportId, status: patch.status };
  },
});

// ---------------------------------------------------------------------------
// Settings + audit trail
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
  platformName: "lalao",
  defaultRadiusKm: 5,
  supportedCities: [
    "Lagos",
    "Abuja",
    "Port Harcourt",
    "Ibadan",
    "Enugu",
    "Benin City",
    "Kano",
  ],
  autoApproveRallies: true,
  requireEmailVerification: false,
  autoVerifyPhone: false,
  maintenanceMode: false,
  brandLogoUrl: undefined,
  brandIconUrl: undefined,
  faviconUrl: undefined,
  brandFont: "system",
  primaryColor: "#4f46e5",
};

// Resolve a stored asset from a raw Convex storage id to a public URL.
// Values that are already full URLs (http) are returned unchanged.
async function resolveBrandAsset(ctx: any, value: string | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  try {
    const url = await ctx.storage.getUrl(value);
    return url ?? value;
  } catch {
    return value;
  }
}

export const getSystemSettings = query({
  args: { requestingAdminId: v.optional(v.id("users")), serverSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    const doc = await ctx.db.query("systemSettings").first();
    const merged = { ...DEFAULT_SETTINGS, ...(doc || {}) };
    merged.brandLogoUrl = await resolveBrandAsset(ctx, merged.brandLogoUrl);
    merged.brandIconUrl = await resolveBrandAsset(ctx, merged.brandIconUrl);
    merged.faviconUrl = await resolveBrandAsset(ctx, merged.faviconUrl);
    return merged;
  },
});

// Public-safe branding read used by the user-facing app. No admin auth required;
// only exposes cosmetic fields, never internal configuration.
export const getPublicBranding = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db.query("systemSettings").first();
    return {
      platformName: doc?.platformName ?? DEFAULT_SETTINGS.platformName,
      brandLogoUrl: await resolveBrandAsset(ctx, doc?.brandLogoUrl),
      brandIconUrl: await resolveBrandAsset(ctx, doc?.brandIconUrl),
      faviconUrl: await resolveBrandAsset(ctx, doc?.faviconUrl),
      brandFont: doc?.brandFont ?? DEFAULT_SETTINGS.brandFont,
      primaryColor: doc?.primaryColor ?? DEFAULT_SETTINGS.primaryColor,
    };
  },
});

export const updateSystemSettings = mutation({
  args: {
    requestingAdminId: v.optional(v.id("users")),
    serverSecret: v.optional(v.string()),
    platformName: v.optional(v.string()),
    defaultRadiusKm: v.optional(v.number()),
    supportedCities: v.optional(v.array(v.string())),
    autoApproveRallies: v.optional(v.boolean()),
    requireEmailVerification: v.optional(v.boolean()),
    autoVerifyPhone: v.optional(v.boolean()),
    maintenanceMode: v.optional(v.boolean()),
    brandLogoUrl: v.optional(v.string()),
    brandIconUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    brandFont: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await gate(ctx, args);
    const { requestingAdminId, serverSecret, ...fields } = args;
    void requestingAdminId;
    void serverSecret;
    const provided: Record<string, any> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) provided[k] = val;
    }
    const existing = await ctx.db.query("systemSettings").first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...provided, updatedAt: now, updatedBy: admin._id });
    } else {
      await ctx.db.insert("systemSettings", {
        ...DEFAULT_SETTINGS,
        ...provided,
        updatedAt: now,
        updatedBy: admin._id,
      });
    }
    await ctx.db.insert("auditLogs", {
      adminId: admin._id,
      adminName: admin.name,
      action: "update_system_settings",
      targetType: "settings",
      details: Object.keys(provided).join(", "),
      createdAt: now,
    });
    return { ok: true };
  },
});

// Admin-only signed upload URL for branding assets (logo, icon, favicon).
// The URL is bound to this Convex deployment's storage bucket.
export const generateBrandUploadUrl = mutation({
  args: { requestingAdminId: v.optional(v.id("users")), serverSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    return await ctx.storage.generateUploadUrl();
  },
});

export const listAuditLogs = query({
  args: { requestingAdminId: v.optional(v.id("users")), serverSecret: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    const rows = await ctx.db.query("auditLogs").order("desc").take(args.limit || 100);
    const adminNames: Record<string, string> = {};
    const cards = [];
    for (const row of rows) {
      if (!adminNames[row.adminId.toString()]) {
        const a: any = await ctx.db.get(row.adminId);
        adminNames[row.adminId.toString()] = a?.name || "Unknown";
      }
      cards.push({
        id: row._id,
        adminId: row.adminId,
        adminName: row.adminName || adminNames[row.adminId.toString()],
        action: row.action,
        targetType: row.targetType || null,
        targetId: row.targetId || null,
        details: row.details || null,
        createdAt: row.createdAt,
      });
    }
    return cards;
  },
});

// ---------------------------------------------------------------------------
// Broadcasts
// ---------------------------------------------------------------------------

export const getAudienceCounts = query({
  args: { requestingAdminId: v.optional(v.id("users")), serverSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    const all = await ctx.db.query("users").collect();
    return {
      all: all.length,
      verified: all.filter((u) => u.isNINVerified).length,
      plus: all.filter((u) => u.isPro).length,
    };
  },
});

export const sendBroadcast = mutation({
  args: {
    requestingAdminId: v.optional(v.id("users")),
    serverSecret: v.optional(v.string()),
    title: v.string(),
    body: v.string(),
    type: v.optional(v.string()),
    audience: v.union(
      v.literal("ALL"),
      v.literal("VERIFIED"),
      v.literal("PLUS"),
      v.literal("SPECIFIC")
    ),
    targetUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const admin = await gate(ctx, args);
    const title = (args.title || "").trim();
    const body = (args.body || "").trim();
    if (!title || !body) throw new Error("BROADCAST_CONTENT_REQUIRED");

    let recipients: any[] = [];
    if (args.audience === "SPECIFIC") {
      const ids = args.targetUserIds || [];
      for (const id of ids.slice(0, 1000)) {
        const u = await ctx.db.get(id);
        if (u) recipients.push(u);
      }
    } else {
      const all = await ctx.db.query("users").collect();
      recipients = all.filter((u) => {
        if (args.audience === "VERIFIED") return u.isNINVerified;
        if (args.audience === "PLUS") return u.isPro;
        return true;
      });
      recipients = recipients.slice(0, 5000);
    }

    const now = Date.now();
    const batchId = await ctx.db.insert("broadcastBatches", {
      adminId: admin._id,
      title,
      body,
      type: args.type,
      audience: args.audience,
      targetUserIds: args.audience === "SPECIFIC" ? args.targetUserIds : undefined,
      recipientCount: recipients.length,
      createdAt: now,
    });

    for (const u of recipients) {
      try {
        await ctx.db.insert("notifications", {
          userId: u._id,
          type: args.type || "admin_broadcast",
          title,
          body,
          read: false,
          createdAt: now,
        });
      } catch {}
    }

    await ctx.db.insert("auditLogs", {
      adminId: admin._id,
      adminName: admin.name,
      action: "send_broadcast",
      targetType: "broadcast",
      targetId: batchId,
      details: `${args.audience}: ${recipients.length} recipients`,
      createdAt: now,
    });

    return { ok: true, batchId, recipientCount: recipients.length };
  },
});

export const listBroadcasts = query({
  args: { requestingAdminId: v.optional(v.id("users")), serverSecret: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await gate(ctx, args);
    const rows = await ctx.db.query("broadcastBatches").order("desc").take(args.limit || 100);
    return rows.map((r) => ({
      id: r._id,
      adminId: r.adminId,
      title: r.title,
      body: r.body,
      type: r.type || null,
      audience: r.audience,
      recipientCount: r.recipientCount,
      createdAt: r.createdAt,
    }));
  },
});