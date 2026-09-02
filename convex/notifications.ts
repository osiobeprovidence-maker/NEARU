import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
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

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Internal notification creation — called via ctx.runMutation from other
 * functions (messages, chatRequests, rallies). Not called directly by the
 * browser with user intent, so no auth check is needed here; the callers
 * that produce the notification are already auth-gated.
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    rallyId: v.optional(v.id("rallies")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
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
 * Register a push subscription for the authenticated user.
 * The client-supplied userId is ignored — auth identity is used.
 */
export const savePushSubscription = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("pushSubscriptions", {
      userId: caller._id,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: Date.now(),
    });
  },
});

/**
 * Remove a push subscription by endpoint. No auth check needed — the endpoint
 * itself is the opaque credential; knowing it is sufficient to remove it.
 */
export const removePushSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
