import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const SUPER_ADMIN_EMAIL = "riderEasy@gmail.com";

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
    await ctx.db.patch(args.userId, {
      blockedUsers: [...blocked, args.blockedUser],
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
