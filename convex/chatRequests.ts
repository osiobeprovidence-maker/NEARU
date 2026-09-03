import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthenticatedUser } from "./lib/auth";
import {
  isMutualFollow,
  isBlockedBetween,
} from "./messagingHelpers";

const MAX_ACTIVE_OUTGOING = 3;
const id = (x: any) => x.toString();

// ---------------------------------------------------------------------------
// Queries — no auth required (read-only, caller-filtered)
// ---------------------------------------------------------------------------

export const getDirectStatus = query({
  args: { viewerId: v.id("users"), targetId: v.id("users") },
  handler: async (ctx, args) => {
    if (id(args.viewerId) === id(args.targetId)) return { status: "self" };
    if (await isBlockedBetween(ctx, args.viewerId, args.targetId)) return { status: "blocked" };
    const mutual = await isMutualFollow(ctx, args.viewerId, args.targetId);
    if (mutual) {
      const conv = await findDirectConversation(ctx, args.viewerId, args.targetId);
      return { status: "mutual", conversationId: conv ? conv._id : null };
    }
    const fromMe = await ctx.db
      .query("chatRequests")
      .withIndex("by_pair", (q) => q.eq("fromUserId", args.viewerId).eq("toUserId", args.targetId))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();
    if (fromMe) return { status: "pending_from_me", requestId: fromMe._id };
    const toMe = await ctx.db
      .query("chatRequests")
      .withIndex("by_pair", (q) => q.eq("fromUserId", args.targetId).eq("toUserId", args.viewerId))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();
    if (toMe) return { status: "pending_to_me", requestId: toMe._id };
    const existingConv = await findDirectConversation(ctx, args.viewerId, args.targetId);
    if (existingConv) return { status: "mutual", conversationId: existingConv._id };
    return { status: "request" };
  },
});

async function findDirectConversation(ctx: any, aId: any, bId: any) {
  const key = [id(aId), id(bId)].sort().join(":");
  return await ctx.db
    .query("conversations")
    .withIndex("by_direct_key", (q) => q.eq("directKey", key))
    .unique();
}

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("chatRequests")
      .withIndex("by_toUser", (q) => q.eq("toUserId", args.userId).eq("status", "PENDING"))
      .order("desc")
      .collect();
    const avatarCache: Record<string, string | undefined> = {};
    const results: any[] = [];
    for (const r of rows) {
      const sender: any = await ctx.db.get(r.fromUserId);
      let avatar = sender?.avatar || "";
      if (avatar && !avatar.startsWith("http")) {
        if (!(avatar in avatarCache)) {
          try { avatarCache[avatar] = (await ctx.storage.getUrl(avatar)) ?? undefined; }
          catch { avatarCache[avatar] = undefined; }
        }
        avatar = avatarCache[avatar] || "";
      }
      const isMutual = await isMutualFollow(ctx, r.fromUserId, args.userId);
      results.push({
        ...r,
        sender: sender ? { _id: sender._id, name: sender.name, username: sender.username, avatar, isNINVerified: sender.isNINVerified, badges: sender.badges } : null,
        isMutual,
      });
    }
    return results;
  },
});

export const listSentByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("chatRequests")
      .withIndex("by_fromUser", (q) => q.eq("fromUserId", args.userId))
      .order("desc")
      .collect();
    const avatarCache: Record<string, string | undefined> = {};
    const results: any[] = [];
    for (const r of rows) {
      const target: any = await ctx.db.get(r.toUserId);
      let avatar = target?.avatar || "";
      if (avatar && !avatar.startsWith("http")) {
        if (!(avatar in avatarCache)) {
          try { avatarCache[avatar] = (await ctx.storage.getUrl(avatar)) ?? undefined; }
          catch { avatarCache[avatar] = undefined; }
        }
        avatar = avatarCache[avatar] || "";
      }
      results.push({
        ...r,
        target: target ? { _id: target._id, name: target.name, username: target.username, avatar, isNINVerified: target.isNINVerified, badges: target.badges } : null,
      });
    }
    return results;
  },
});

export const get = query({
  args: { requestId: v.id("chatRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;
    const sender: any = request.fromUserId ? await ctx.db.get(request.fromUserId) : null;
    let avatar = sender?.avatar || "";
    if (avatar && !avatar.startsWith("http")) {
      try { avatar = (await ctx.storage.getUrl(avatar)) ?? ""; } catch { avatar = ""; }
    }
    return {
      ...request,
      sender: sender ? { _id: sender._id, name: sender.name, username: sender.username, avatar, isNINVerified: sender.isNINVerified, badges: sender.badges } : null,
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations — all secured with getAuthenticatedUser
// ---------------------------------------------------------------------------

/**
 * Send a direct message or chat request.
 * Caller must be the sender (fromUserId).
 */
export const sendDirect = mutation({
  args: {
    fromUserId: v.id("users"), // verified against auth
    toUserId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (id(caller._id) !== id(args.fromUserId)) {
      throw new Error("Forbidden: you can only send messages as yourself.");
    }
    if (id(caller._id) === id(args.toUserId)) throw new Error("Cannot message yourself");
    if (await isBlockedBetween(ctx, caller._id, args.toUserId)) throw new Error("You cannot message this user");

    const text = args.message.trim();
    if (!text) throw new Error("Message cannot be empty");

    if (await isMutualFollow(ctx, caller._id, args.toUserId)) {
      const conv = await ctx.runMutation(api.messages.getOrOpenDirect, {
        userIdA: caller._id,
        userIdB: args.toUserId,
      });
      await ctx.runMutation(api.messages.sendToConversation, {
        conversationId: conv,
        senderId: caller._id,
        text,
      });
      return { type: "direct", conversationId: conv };
    }

    const existingPending = await ctx.db
      .query("chatRequests")
      .withIndex("by_pair", (q) => q.eq("fromUserId", caller._id).eq("toUserId", args.toUserId))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();
    if (existingPending) return { type: "request", requestId: existingPending._id };

    const active = await ctx.db
      .query("chatRequests")
      .withIndex("by_fromUser", (q) => q.eq("fromUserId", caller._id))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .collect();
    if (active.length >= MAX_ACTIVE_OUTGOING) {
      throw new Error(`You can have up to ${MAX_ACTIVE_OUTGOING} active message requests.`);
    }

    const now = Date.now();
    const requestId = await ctx.db.insert("chatRequests", {
      fromUserId: caller._id,
      toUserId: args.toUserId,
      rallyId: undefined,
      type: "direct",
      message: text,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.runMutation(api.notifications.create, {
      userId: args.toUserId,
      type: "message_request",
      title: "New message request",
      body: `${caller.name || "Someone"} wants to message you.`,
    });

    return { type: "request", requestId };
  },
});

/**
 * Accept a message request.
 * Only the recipient may accept — verified server-side via auth.
 */
export const accept = mutation({
  args: { requestId: v.id("chatRequests"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    // Server verifies caller is the recipient — not just args.userId.
    if (id(request.toUserId) !== id(caller._id)) {
      throw new Error("Only the recipient can accept this request");
    }
    if (request.status !== "PENDING") throw new Error("This request is no longer pending");
    if (await isBlockedBetween(ctx, request.fromUserId, request.toUserId)) {
      throw new Error("Cannot accept: messaging is blocked");
    }

    await ctx.db.patch(request._id, { status: "ACCEPTED", updatedAt: Date.now() });

    // Establish reciprocal follow relationship in follows table if not already present
    const fwdFollow = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", request.fromUserId).eq("followingId", request.toUserId)
      )
      .unique();
    if (!fwdFollow) {
      await ctx.db.insert("follows", {
        followerId: request.fromUserId,
        followingId: request.toUserId,
        createdAt: Date.now(),
      });
    }

    const revFollow = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", request.toUserId).eq("followingId", request.fromUserId)
      )
      .unique();
    if (!revFollow) {
      await ctx.db.insert("follows", {
        followerId: request.toUserId,
        followingId: request.fromUserId,
        createdAt: Date.now(),
      });
    }

    const conv = await ctx.runMutation(api.messages.getOrOpenDirect, {
      userIdA: request.fromUserId,
      userIdB: request.toUserId,
    });

    await ctx.db.patch(conv, {
      lastMessage: { senderId: "system", text: "Friend request accepted. Say hello!", timestamp: Date.now() },
      unreadCount: 1,
      unreadByUser: { [id(request.fromUserId)]: 1, [id(request.toUserId)]: 0 },
    });

    await ctx.runMutation(api.notifications.create, {
      userId: request.fromUserId,
      type: "message_request_accepted",
      title: "Friend request accepted",
      body: `${caller.name || "Someone"} accepted your friend request.`,
    });

    return { conversationId: conv };
  },
});

/**
 * Decline an incoming request.
 * Only the recipient may decline — verified server-side via auth.
 */
export const decline = mutation({
  args: { requestId: v.id("chatRequests"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (id(request.toUserId) !== id(caller._id)) {
      throw new Error("Only the recipient can decline this request");
    }
    await ctx.db.patch(request._id, { status: "DECLINED", updatedAt: Date.now() });
  },
});

/**
 * Cancel a pending request the caller sent.
 * Only the sender may cancel — verified server-side via auth.
 */
export const cancel = mutation({
  args: { requestId: v.id("chatRequests"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (id(request.fromUserId) !== id(caller._id)) {
      throw new Error("Only the sender can cancel this request");
    }
    await ctx.db.patch(request._id, { status: "CANCELLED", updatedAt: Date.now() });
  },
});

/**
 * Legacy rally-scoped request.
 * Caller must be the sender.
 */
export const send = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    rallyId: v.id("rallies"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (id(caller._id) !== id(args.fromUserId)) {
      throw new Error("Forbidden: you can only send messages as yourself.");
    }
    if (id(caller._id) === id(args.toUserId)) throw new Error("Cannot message yourself");
    if (await isBlockedBetween(ctx, caller._id, args.toUserId)) throw new Error("You cannot message this user");

    const existing = await ctx.db
      .query("chatRequests")
      .withIndex("by_pair_rally", (q) =>
        q.eq("fromUserId", caller._id).eq("toUserId", args.toUserId).eq("rallyId", args.rallyId)
      )
      .first();
    if (existing && existing.status === "PENDING") return { type: "request", requestId: existing._id };

    const now = Date.now();
    const requestId = await ctx.db.insert("chatRequests", {
      fromUserId: caller._id,
      toUserId: args.toUserId,
      rallyId: args.rallyId,
      type: "rally",
      message: args.message,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });
    return { type: "request", requestId };
  },
});
