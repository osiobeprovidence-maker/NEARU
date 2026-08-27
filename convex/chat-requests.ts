import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatRequests")
      .withIndex("by_toUser", (q) =>
        q.eq("toUserId", args.userId).eq("status", "PENDING")
      )
      .order("desc")
      .collect();
  },
});

export const listSentByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatRequests")
      .withIndex("by_fromUser", (q) => q.eq("fromUserId", args.userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { requestId: v.id("chatRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

export const send = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    rallyId: v.id("rallies"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.fromUserId === args.toUserId) throw new Error("Cannot message yourself");
    const existing = await ctx.db
      .query("chatRequests")
      .withIndex("by_pair", (q) =>
        q
          .eq("fromUserId", args.fromUserId)
          .eq("toUserId", args.toUserId)
          .eq("rallyId", args.rallyId)
      )
      .unique();
    if (existing && existing.status === "PENDING") {
      throw new Error("Request already sent");
    }
    const now = Date.now();
    return await ctx.db.insert("chatRequests", {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      rallyId: args.rallyId,
      message: args.message,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const accept = mutation({
  args: { requestId: v.id("chatRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: "ACCEPTED",
      updatedAt: Date.now(),
    });
    const request = await ctx.db.get(args.requestId);
    if (!request) return;
    const rally = await ctx.db.get(request.rallyId);
    await ctx.db.insert("conversations", {
      rallyId: request.rallyId,
      rallyTitle: rally?.title || "Chat",
      participantIds: [request.fromUserId, request.toUserId],
      lastMessage: {
        senderId: "system",
        text: "Chat request accepted. Say hello!",
        timestamp: Date.now(),
      },
      unreadCount: 0,
    });
  },
});

export const decline = mutation({
  args: { requestId: v.id("chatRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: "DECLINED",
      updatedAt: Date.now(),
    });
  },
});
