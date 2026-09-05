import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthenticatedUser } from "./lib/auth";

// ---------------------------------------------------------------------------
// Queries — no auth required (userId supplied by caller for filtering)
// ---------------------------------------------------------------------------

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

export const unreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return all.filter((n) => !n.read).length;
  },
});

export const getVapidPublicKey = query({
  args: {},
  handler: async () => {
    return (
      process.env.VAPID_PUBLIC_KEY ||
      "BAWBNIsZ2WbXzOVVIaAKbq1Gg-gMM9dHZxgeAcHUxi2GRr6LQIv603aKpPqplfu7KIy6N0kO1YkoBfi1iSJZc6Q"
    );
  },
});

/**
 * Internal query to fetch recipient's notification settings, active push subscriptions,
 * and current app branding icon for the push notification payload.
 */
export const getUserPushContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const systemSettings = await ctx.db.query("systemSettings").first();
    let brandIconUrl = "";
    if (systemSettings?.appIconUrl) {
      const url = await ctx.storage.getUrl(systemSettings.appIconUrl as any);
      if (url) brandIconUrl = url;
    } else if (systemSettings?.brandIconUrl) {
      const url = await ctx.storage.getUrl(systemSettings.brandIconUrl as any);
      if (url) brandIconUrl = url;
    }

    return {
      notificationSettings: user?.notificationSettings || null,
      subscriptions,
      brandIconUrl,
    };
  },
});

/**
 * Internal mutation to remove an expired/invalid push subscription (404/410).
 */
export const removeSubscriptionById = internalMutation({
  args: { id: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.id);
    if (sub) {
      await ctx.db.delete(args.id);
    }
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Internal notification creation — called via ctx.runMutation from other
 * functions (messages, chatRequests, rallies). Automatically saves to DB
 * and triggers real system push notification delivery to recipient's devices.
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    rallyId: v.optional(v.id("rallies")),
    senderId: v.optional(v.id("users")),
    conversationId: v.optional(v.id("conversations")),
    icon: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notifId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      url: args.url,
      rallyId: args.rallyId,
      senderId: args.senderId,
      conversationId: args.conversationId,
      icon: args.icon,
      data: args.data,
      read: false,
      createdAt: Date.now(),
    });

    // Schedule real system OS Web Push notification in the background
    await ctx.scheduler.runAfter(0, (internal as any).push.sendPushNotification, {
      userId: args.userId,
      title: args.title,
      body: args.body,
      type: args.type,
      url: args.url,
      icon: args.icon,
    });

    return notifId;
  },
});

/**
 * Mark a single notification as read.
 * Verifies the notification belongs to the authenticated caller.
 */
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const notif = await ctx.db.get(args.notificationId);
    if (!notif) return;
    if (notif.userId.toString() !== caller._id.toString()) {
      throw new Error("Forbidden: you can only mark your own notifications as read.");
    }
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

/**
 * Mark all notifications as read for the authenticated caller.
 * The client-supplied userId is ignored — auth identity is used.
 */
export const markAllAsRead = mutation({
  args: { userId: v.id("users") }, // accepted for compat, ignored
  handler: async (ctx, _args) => {
    const caller = await getAuthenticatedUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", caller._id))
      .collect();
    for (const n of unread) {
      if (!n.read) await ctx.db.patch(n._id, { read: true });
    }
  },
});

/**
 * Delete all notifications for the authenticated caller.
 * The client-supplied userId is ignored — auth identity is used.
 */
export const clearAll = mutation({
  args: { userId: v.id("users") }, // accepted for compat, ignored
  handler: async (ctx, _args) => {
    const caller = await getAuthenticatedUser(ctx);
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", caller._id))
      .collect();
    for (const n of all) {
      await ctx.db.delete(n._id);
    }
  },
});

/**
 * Notify nearby users about a new rally.
 * Called internally from rallies:create — no direct browser auth needed.
 */
export const notifyNearbyUsers = mutation({
  args: {
    rallyId: v.id("rallies"),
    rallyTitle: v.string(),
    rallyType: v.string(),
    creatorId: v.id("users"),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.city) return;
    const allUsers = await ctx.db.query("users").collect();
    const cityLower = args.city.toLowerCase().trim();
    for (const user of allUsers) {
      if (user._id === args.creatorId) continue;
      const userLoc = (user.location || "").toLowerCase().trim();
      if (!userLoc) continue;
      if (userLoc.includes(cityLower) || cityLower.includes(userLoc)) {
        const typeLabel =
          args.rallyType === "ASK" ? "asked for" :
          args.rallyType === "HELP" ? "offered help with" :
          "invited people to join";
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: "rally_nearby",
          title: "New RALLY nearby",
          body: `Someone just ${typeLabel} "${args.rallyTitle}" in ${args.city}.`,
          rallyId: args.rallyId,
          read: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

/**
 * Helper to resolve user ID safely for push mutations.
 */
async function resolveCallerId(ctx: any, rawUserId?: string | null): Promise<any | null> {
  // 1. Try authenticated JWT claims first
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject) {
      const userByUid = await ctx.db
        .query("users")
        .withIndex("by_firebase_uid", (q: any) => q.eq("firebaseUid", identity.subject))
        .first();
      if (userByUid) return userByUid._id;
    }
  } catch {}

  // 2. Try client-supplied ID (verified against users table)
  if (rawUserId && typeof rawUserId === "string" && rawUserId.trim().length > 0) {
    const trimmed = rawUserId.trim();
    try {
      const normalized = ctx.db.normalizeId("users", trimmed);
      if (normalized) {
        const userDoc = await ctx.db.get(normalized);
        if (userDoc) return userDoc._id;
      }
    } catch {}

    try {
      const userByUid = await ctx.db
        .query("users")
        .withIndex("by_firebase_uid", (q: any) => q.eq("firebaseUid", trimmed))
        .first();
      if (userByUid) return userByUid._id;
    } catch {}
  }

  return null;
}

/**
 * Register a push subscription for the authenticated user.
 * Validates keys, updates existing subscriptions to prevent duplicate accumulation,
 * and handles missing/invalid optional fields without crashing.
 */
export const savePushSubscription = mutation({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    platform: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const endpoint = args.endpoint?.trim();
    const p256dh = args.p256dh?.trim();
    const auth = args.auth?.trim();

    if (!endpoint || !p256dh || !auth) {
      throw new Error("Invalid push subscription: endpoint, p256dh, and auth are required.");
    }

    const callerId = await resolveCallerId(ctx, args.userId);
    if (!callerId) {
      throw new Error("Unauthenticated: valid user required to save push subscription.");
    }

    // Query all subscriptions for this endpoint to handle any prior duplicates
    const existingSubs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .collect();

    const now = Date.now();
    const platform = args.platform?.trim() || undefined;
    const userAgent = args.userAgent?.trim() || undefined;

    if (existingSubs && existingSubs.length > 0) {
      const primary = existingSubs[0];
      await ctx.db.patch(primary._id, {
        userId: callerId,
        p256dh,
        auth,
        platform,
        userAgent,
        updatedAt: now,
      });

      // Clean up any extraneous duplicates
      if (existingSubs.length > 1) {
        for (let i = 1; i < existingSubs.length; i++) {
          await ctx.db.delete(existingSubs[i]._id);
        }
      }

      return primary._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: callerId,
      endpoint,
      p256dh,
      auth,
      platform,
      userAgent,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Remove a push subscription by endpoint.
 */
export const removePushSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const endpoint = args.endpoint?.trim();
    if (!endpoint) return;
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .collect();
    for (const sub of existing) {
      await ctx.db.delete(sub._id);
    }
  },
});

/**
 * Clear all push subscriptions for the calling user upon logout
 * to prevent private notifications from appearing on shared/logged-out devices.
 */
export const clearUserPushSubscriptions = mutation({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
    endpoint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.endpoint?.trim()) {
      const existing = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint!.trim()))
        .collect();
      for (const sub of existing) {
        await ctx.db.delete(sub._id);
      }
      return;
    }

    const callerId = await resolveCallerId(ctx, args.userId);
    if (!callerId) return;

    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", callerId))
      .collect();

    for (const sub of subs) {
      await ctx.db.delete(sub._id);
    }
  },
});

/**
 * Send a test push notification to the calling user
 */
export const sendTestPush = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;
    try {
      const caller = await getAuthenticatedUser(ctx);
      if (caller) targetUserId = caller._id;
    } catch {}

    if (!targetUserId) {
      throw new Error("User ID required to send test notification.");
    }

    // Schedule test push action
    await ctx.scheduler.runAfter(0, (internal as any).push.sendPushNotification, {
      userId: targetUserId,
      title: "Lalao Notification Test",
      body: "Real OS system push notification delivered successfully! 🎉",
      url: "/settings/notifications",
      type: "system",
      tag: "test-push",
    });

    return { success: true };
  },
});

