import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  isMutualFollow,
  isBlockedBetween,
  isFollowing,
} from "./messagingHelpers";

const MAX_ACTIVE_OUTGOING = 3;
const id = (x: any) => x.toString();

/**
 * Returns the message relationship between the viewer and a target user, so
 * the Message button can decide the correct action:
 *  - mutual: open the direct conversation immediately
 *  - pending_from_me: a request I sent is waiting for accept
 *  - pending_to_me: the target sent me a request (I should accept/decline)
 *  - request: no relationship -> show "Message" to send a request
 *  - blocked: no messaging allowed at all
 */
export const getDirectStatus = query({
  args: {
    viewerId: v.id("users"),
    targetId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (id(args.viewerId) === id(args.targetId)) return { status: "self" };

    if (await isBlockedBetween(ctx, args.viewerId, args.targetId)) {
      return { status: "blocked" };
    }

    const mutual = await isMutualFollow(ctx, args.viewerId, args.targetId);
    if (mutual) {
      const conv = await findDirectConversation(ctx, args.viewerId, args.targetId);
      return {
        status: "mutual",
        conversationId: conv ? conv._id : null,
      };
    }

    // Existing pending request from me to them?
    const fromMe = await ctx.db
      .query("chatRequests")
      .withIndex("by_pair", (q) =>
        q
          .eq("fromUserId", args.viewerId)
          .eq("toUserId", args.targetId)
      )
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();
    if (fromMe) return { status: "pending_from_me", requestId: fromMe._id };

    // Existing pending request from them to me?
    const toMe = await ctx.db
      .query("chatRequests")
      .withIndex("by_pair", (q) =>
        q
          .eq("fromUserId", args.targetId)
          .eq("toUserId", args.viewerId)
      )
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();
    if (toMe) return { status: "pending_to_me", requestId: toMe._id };

    // Existing accepted (conversation exists)?
    const existingConv = await findDirectConversation(ctx, args.viewerId, args.targetId);
    if (existingConv) return { status: "mutual", conversationId: existingConv._id };

    return { status: "request" };
  },
});

async function findDirectConversation(ctx: any, aId: any, bId: any) {
  const key = [id(aId), id(bId)].sort().join(":");
  const conv = await ctx.db
    .query("conversations")
    .withIndex("by_direct_key", (q) => q.eq("directKey", key))
    .unique();
  return conv;
}

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("chatRequests")
      .withIndex("by_toUser", (q) =>
        q.eq("toUserId", args.userId).eq("status", "PENDING")
      )
      .order("desc")
      .collect();

    const avatarCache: Record<string, string | undefined> = {};
    const results: any[] = [];
    for (const r of rows) {
      const sender: any = await ctx.db.get(r.fromUserId);
      let avatar = sender?.avatar || "";
      if (avatar && !avatar.startsWith("http")) {
        if (!(avatar in avatarCache)) {
          try {
            avatarCache[avatar] = (await ctx.storage.getUrl(avatar)) ?? undefined;
          } catch {
            avatarCache[avatar] = undefined;
          }
        }
        avatar = avatarCache[avatar] || "";
      }
      const isMutual = await isMutualFollow(ctx, r.fromUserId, args.userId);
      results.push({
        ...r,
        sender: sender
          ? {
              _id: sender._id,
              name: sender.name,
              username: sender.username,
              avatar,
              isNINVerified: sender.isNINVerified,
              badges: sender.badges,
            }
          : null,
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
          try {
            avatarCache[avatar] = (await ctx.storage.getUrl(avatar)) ?? undefined;
          } catch {
            avatarCache[avatar] = undefined;
          }
        }
        avatar = avatarCache[avatar] || "";
      }
      results.push({
        ...r,
        target: target
          ? {
              _id: target._id,
              name: target.name,
              username: target.username,
              avatar,
              isNINVerified: target.isNINVerified,
              badges: target.badges,
            }
          : null,
      });
    }
    return results;
  },
});

export const get = query({
  args: { requestId: v.id("chatRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

/**
 * Direct message initiation:
 *  - If the two users mutually follow each other, NO request is created —
 *    the direct conversation is opened and the initial message sent
 *    immediately (spec #11).
 *  - Otherwise a message request is created (spec #12), limited to 3 active
 *    outgoing requests server-side (spec #13), with dedupe while pending
 *    (spec #37).
 */
export const sendDirect = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (id(args.fromUserId) === id(args.toUserId)) {
      throw new Error("Cannot message yourself");
    }
    if (await isBlockedBetween(ctx, args.fromUserId, args.toUserId)) {
      throw new Error("You cannot message this user");
    }

    const text = args.message.trim();
    if (!text) throw new Error("Message cannot be empty");

    // Mutual follow -> instant chat, no request.
    if (await isMutualFollow(ctx, args.fromUserId, args.toUserId)) {
      const conv = await ctx.runMutation(api.messages.getOrOpenDirect, {
        userIdA: args.fromUserId,
        userIdB: args.toUserId,
      });
      await ctx.runMutation(api.messages.sendToConversation, {
        conversationId: conv,
        senderId: args.fromUserId,
        text,
      });
      return {
        type: "direct",
        conversationId: conv,
      };
    }

    // Dedupe: no two identical pending requests between the same user pair.
    const existingPending = await ctx.db
      .query("chatRequests")
      .withIndex("by_pair", (q) =>
        q
          .eq("fromUserId", args.fromUserId)
          .eq("toUserId", args.toUserId)
      )
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();
    if (existingPending) {
      return { type: "request", requestId: existingPending._id };
    }

    // Enforce 3 active outgoing requests (server-side authority).
    const active = await ctx.db
      .query("chatRequests")
      .withIndex("by_fromUser", (q) => q.eq("fromUserId", args.fromUserId))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .collect();
    if (active.length >= MAX_ACTIVE_OUTGOING) {
      throw new Error(
        `You can have up to ${MAX_ACTIVE_OUTGOING} active message requests.`
      );
    }

    const now = Date.now();
    const requestId = await ctx.db.insert("chatRequests", {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      rallyId: undefined,
      type: "direct",
      message: text,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });

    // In-app notification for the recipient
    const fromUser: any = await ctx.db.get(args.fromUserId);
    await ctx.runMutation(api.notifications.create, {
      userId: args.toUserId,
      type: "message_request",
      title: "New message request",
      body: `${fromUser?.name || "Someone"} wants to message you.`,
    });

    return { type: "request", requestId };
  },
});

/**
 * Accept a message request -> turn it into a normal direct conversation
 * (spec #14). Only the recipient may accept.
 */
export const accept = mutation({
  args: { requestId: v.id("chatRequests"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (id(request.toUserId) !== id(args.userId)) {
      throw new Error("Only the recipient can accept this request");
    }
    if (request.status !== "PENDING") {
      throw new Error("This request is no longer pending");
    }
    if (await isBlockedBetween(ctx, request.fromUserId, request.toUserId)) {
      throw new Error("Cannot accept: messaging is blocked");
    }

    await ctx.db.patch(request._id, { status: "ACCEPTED", updatedAt: Date.now() });

    const conv = await ctx.runMutation(api.messages.getOrOpenDirect, {
      userIdA: request.fromUserId,
      userIdB: request.toUserId,
    });

    await ctx.db.patch(conv, {
      lastMessage: {
        senderId: "system",
        text: "Message request accepted. Say hello!",
        timestamp: Date.now(),
      },
      unreadCount: 1,
      unreadByUser: {
        [id(request.fromUserId)]: 1,
        [id(request.toUserId)]: 0,
      },
    });

    // Notify the requester that their request was accepted.
    await ctx.runMutation(api.notifications.create, {
      userId: request.fromUserId,
      type: "message_request_accepted",
      title: "Message request accepted",
      body: "You can now chat.",
    });

    return { conversationId: conv };
  },
});

/**
 * Decline an incoming request. Only the recipient may decline.
 */
export const decline = mutation({
  args: { requestId: v.id("chatRequests"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (id(request.toUserId) !== id(args.userId)) {
      throw new Error("Only the recipient can decline this request");
    }
    await ctx.db.patch(request._id, { status: "DECLINED", updatedAt: Date.now() });
  },
});

/**
 * Cancel a pending request you sent (frees an active-request slot).
 * Only the sender may cancel.
 */
export const cancel = mutation({
  args: { requestId: v.id("chatRequests"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (id(request.fromUserId) !== id(args.userId)) {
      throw new Error("Only the sender can cancel this request");
    }
    await ctx.db.patch(request._id, { status: "CANCELLED", updatedAt: Date.now() });
  },
});

/**
 * Legacy rally-scoped request flow (kept for compatibility). Creates or reuses
 * a direct conversation between two users who already share a rally context.
 */
export const send = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    rallyId: v.id("rallies"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (id(args.fromUserId) === id(args.toUserId)) {
      throw new Error("Cannot message yourself");
    }
    if (await isBlockedBetween(ctx, args.fromUserId, args.toUserId)) {
      throw new Error("You cannot message this user");
    }
    const existing = await ctx.db
      .query("chatRequests")
      .withIndex("by_pair_rally", (q) =>
        q
          .eq("fromUserId", args.fromUserId)
          .eq("toUserId", args.toUserId)
          .eq("rallyId", args.rallyId)
      )
      .first();
    if (existing && existing.status === "PENDING") {
      return { type: "request", requestId: existing._id };
    }
    const now = Date.now();
    const requestId = await ctx.db.insert("chatRequests", {
      fromUserId: args.fromUserId,
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
