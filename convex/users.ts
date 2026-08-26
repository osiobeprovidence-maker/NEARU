import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
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

export const create = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    avatar: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isNINVerified: v.boolean(),
    isPhoneVerified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      ...args,
      badges: [],
      rallies: 0,
      completed: 0,
      rating: 0,
    });
    return userId;
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const filtered = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(userId, filtered);
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
