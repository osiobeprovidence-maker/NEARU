import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const SUPER_ADMIN_EMAIL = "riderezzy@gmail.com";

export const isAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;
    if (user.email === SUPER_ADMIN_EMAIL) return true;
    return user.role === "super_admin" || user.role === "admin";
  },
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    if (user.avatar && !user.avatar.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.avatar);
        if (url) user.avatar = url;
      } catch {}
    }
    return user;
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    return user;
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!user) return null;
    if (user.avatar && !user.avatar.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.avatar);
        if (url) user.avatar = url;
      } catch {}
    }
    return user;
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const results: Record<string, any> = {};
    for (const id of args.ids) {
      if (!results[id]) {
        const user = await ctx.db.get(id);
        if (user) {
          if (user.avatar && !user.avatar.startsWith("http")) {
            try {
              const url = await ctx.storage.getUrl(user.avatar);
              if (url) user.avatar = url;
            } catch {}
          }
          results[id] = user;
        }
      }
    }
    return results;
  },
});

/**
 * Phase 2: discover/search people for the Explore "People" surface and
 * interest discovery. Returns lightweight user cards with follow status.
 *
 * Visibility rules (no search loophole):
 *  - The viewer is excluded.
 *  - Anyone the viewer has blocked is excluded.
 *  - Users whose profileVisibility === "private" are only returned when the
 *    viewer already follows them (they are never surfaced in open discovery).
 *  - filteredInterests: if provided (e.g. viewing an interest page), only
 *    users who selected that interest are returned.
 */
export const listPeople = query({
  args: {
    viewerId: v.id("users"),
    query: v.optional(v.string()),
    filteredInterest: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await ctx.db.get(args.viewerId);
    if (!viewer) return [];

    const viewerBlockedIds = new Set(
      (viewer.blockedUsers ?? []).map((b) => b.id)
    );
    const viewerBlockedDb = new Set<string>();

    const viewerFollowing = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.viewerId))
      .collect();
    const followingSet = new Set(
      viewerFollowing.map((f) => f.followingId.toString())
    );

    const all = await ctx.db.query("users").collect();
    const q = (args.query ?? "").toLowerCase().trim();

    const results: any[] = [];
    const avatarCache: Record<string, string | undefined> = {};

    for (const u of all) {
      if (u._id.toString() === args.viewerId.toString()) continue;
      if (viewerBlockedIds.has(u._id.toString())) continue;

      const isFollowing = followingSet.has(u._id.toString());

      // Private accounts are hidden from open discovery unless following
      if (u.privacySettings?.profileVisibility === "private" && !isFollowing) {
        continue;
      }

      // Interest filter
      if (args.filteredInterest) {
        const interest = (u.interests ?? []).some(
          (i) => i.toLowerCase() === args.filteredInterest.toLowerCase()
        );
        if (!interest) continue;
      }

      // Text filter on name / username
      if (q) {
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.username.toLowerCase().includes(q)
        ) {
          continue;
        }
      }

      let avatar = u.avatar || "";
      if (avatar && !avatar.startsWith("http")) {
        try {
          if (!(avatar in avatarCache)) {
            avatarCache[avatar] = (await ctx.storage.getUrl(avatar)) ?? undefined;
          }
          avatar = avatarCache[avatar] || "";
        } catch {
          avatar = "";
        }
      }

      const followers = await ctx.db
        .query("follows")
        .withIndex("by_following", (q2) => q2.eq("followingId", u._id))
        .collect();

      results.push({
        _id: u._id,
        name: u.name,
        username: u.username,
        avatar,
        badges: u.badges,
        bio: u.bio,
        isNINVerified: u.isNINVerified,
        location: u.location,
        interests: u.interests ?? [],
        profileVisibility: u.privacySettings?.profileVisibility ?? "public",
        isFollowing,
        followersCount: followers.length,
      });

      if (args.limit && results.length >= args.limit) break;
    }

    return results;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    avatar: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isNINVerified: v.boolean(),
    isPhoneVerified: v.boolean(),
    isEmailVerified: v.optional(v.boolean()),
    passwordHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      ...args,
      badges: [],
      rallies: 0,
      completed: 0,
      rating: 0,
      accountType: "personal",
      isPro: false,
      role: args.email === SUPER_ADMIN_EMAIL ? "super_admin" : "user",
    });
    return userId;
  },
});

export const updateAuth = mutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.optional(v.string()),
    totpSecret: v.optional(v.string()),
    totpEnabled: v.optional(v.boolean()),
    isEmailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const filtered = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(userId, filtered);
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthday: v.optional(v.string()),
    location: v.optional(v.string()),
    locationLatitude: v.optional(v.number()),
    locationLongitude: v.optional(v.number()),
    locationAccuracy: v.optional(v.number()),
    locationUpdatedAt: v.optional(v.number()),
    interests: v.optional(v.array(v.string())),
    showInterests: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const filtered = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(filtered).length === 0) return;
    await ctx.db.patch(userId, filtered);
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const resolveAvatarUrl = query({
  args: { avatar: v.string() },
  handler: async (ctx, args) => {
    if (args.avatar.startsWith("http")) return args.avatar;
    try {
      const url = await ctx.storage.getUrl(args.avatar);
      return url ?? args.avatar;
    } catch {
      return args.avatar;
    }
  },
});

export const updatePrivacySettings = mutation({
  args: {
    userId: v.id("users"),
    profileVisibility: v.union(
      v.literal("public"),
      v.literal("verified_only"),
      v.literal("private")
    ),
    locationPrecision: v.union(
      v.literal("approximate"),
      v.literal("exact"),
      v.literal("city_only")
    ),
    whoCanMessage: v.union(
      v.literal("everyone"),
      v.literal("verified_only"),
      v.literal("mutual_interest")
    ),
    showOnlineStatus: v.boolean(),
    showReadReceipts: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, ...settings } = args;
    await ctx.db.patch(userId, { privacySettings: settings });
  },
});

export const updateNotificationSettings = mutation({
  args: {
    userId: v.id("users"),
    pushEnabled: v.boolean(),
    rallyMatches: v.boolean(),
    chatMessages: v.boolean(),
    activityReminders: v.boolean(),
    safetyAlerts: v.boolean(),
    emailDigest: v.boolean(),
    marketingUpdates: v.boolean(),
    soundEnabled: v.boolean(),
    vibrationEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, ...settings } = args;
    await ctx.db.patch(userId, { notificationSettings: settings });
  },
});

export const updateAppSettings = mutation({
  args: {
    userId: v.id("users"),
    theme: v.union(
      v.literal("system"),
      v.literal("light"),
      v.literal("dark")
    ),
    language: v.string(),
    dataSaver: v.boolean(),
    autoPlayMedia: v.boolean(),
    cacheSizeMB: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, ...settings } = args;
    await ctx.db.patch(userId, { appSettings: settings });
  },
});

export const addBlockedUser = mutation({
  args: {
    userId: v.id("users"),
    blockedUser: v.object({
      id: v.string(),
      name: v.string(),
      username: v.string(),
      avatar: v.string(),
      blockedAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const blocked = user.blockedUsers ?? [];
    if (blocked.some((b) => b.id === args.blockedUser.id)) return;
    await ctx.db.patch(args.userId, {
      blockedUsers: [...blocked, args.blockedUser],
    });
  },
});

export const unblockUser = mutation({
  args: {
    userId: v.id("users"),
    blockedId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const blocked = user.blockedUsers ?? [];
    await ctx.db.patch(args.userId, {
      blockedUsers: blocked.filter((b) => b.id !== args.blockedId),
    });
  },
});

export const getOrCreateByEmail = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (existing) return existing._id;
    const userId = await ctx.db.insert("users", {
      name: args.name,
      username: args.username || args.email.split("@")[0],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(args.name)}&background=6366f1&color=fff&bold=true&size=200`,
      email: args.email,
      isNINVerified: false,
      isPhoneVerified: false,
      isEmailVerified: true,
      badges: [],
      rallies: 0,
      completed: 0,
      rating: 0,
      accountType: "personal",
      isPro: false,
      role: args.email === SUPER_ADMIN_EMAIL ? "super_admin" : "user",
    });
    return userId;
  },
});

export const addTrustedContact = mutation({
  args: {
    userId: v.id("users"),
    contact: v.object({
      id: v.string(),
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const contacts = user.trustedContacts ?? [];
    await ctx.db.patch(args.userId, {
      trustedContacts: [...contacts, args.contact],
    });
  },
});

export const setNINVerified = mutation({
  args: {
    userId: v.id("users"),
    nin: v.string(),
    verifiedData: v.optional(v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
      gender: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Deprecated: the paid verification flow is server-gated.
    throw new Error("setNINVerified is disabled. Use the server-gated verification flow.");
  },
});

export const syncLocation = mutation({
  args: {
    userId: v.id("users"),
    location: v.string(),
    locationLatitude: v.number(),
    locationLongitude: v.number(),
    locationAccuracy: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      location: args.location,
      locationLatitude: args.locationLatitude,
      locationLongitude: args.locationLongitude,
      locationAccuracy: args.locationAccuracy,
      locationUpdatedAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// Account types & LALOA Pro
// ---------------------------------------------------------------------------

/**
 * Grant or revoke LALOA Pro. Billing is deferred to a later Paystack phase;
 * until then this is the explicit upgrade path (called from the Plus page).
 */
export const setPro = mutation({
  args: {
    userId: v.id("users"),
    isPro: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isPro: args.isPro,
      proSince: args.isPro ? Date.now() : undefined,
    });
    return { isPro: args.isPro };
  },
});

/**
 * Set the account type (personal | organization | business).
 * Professional account types (organization/business) require LALOA Pro.
 * Default for all users is "personal".
 */
export const setAccountType = mutation({
  args: {
    userId: v.id("users"),
    accountType: v.union(
      v.literal("personal"),
      v.literal("organization"),
      v.literal("business")
    ),
    organizationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const professional = args.accountType === "organization" || args.accountType === "business";
    if (professional && user.isPro !== true) {
      throw new Error("You need LALOA Pro to create an Organization or Business account.");
    }

    const patch: Record<string, unknown> = {
      accountType: args.accountType,
      organizationName:
        args.accountType === "organization" || args.accountType === "business"
          ? args.organizationName?.trim() || user.name || undefined
          : undefined,
    };
    await ctx.db.patch(args.userId, patch);
    return {
      accountType: args.accountType,
      organizationName: patch.organizationName as string | undefined,
    };
  },
});

/**
 * Whether the user is allowed to act as a professional (organization/business)
 * account. Used by the frontend to gate org-only features.
 */
export const canUseProfessional = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) return false;
    const user = await ctx.db.get(args.userId);
    if (!user) return false;
    const professional = user.accountType === "organization" || user.accountType === "business";
    return professional && user.isPro === true;
  },
});

