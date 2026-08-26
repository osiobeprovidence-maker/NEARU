import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listConversations = query({
  args: { participantId: v.id("users") },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db.query("conversations").collect();
    return allConversations.filter((c) =>
      c.participantIds.includes(args.participantId)
    );
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

export const listMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      text: args.text,
      timestamp,
    });
    await ctx.db.patch(args.conversationId, {
      lastMessage: {
        senderId: args.senderId,
        text: args.text,
        timestamp,
      },
      unreadCount: 0,
    });
  },
});

export const createConversation = mutation({
  args: {
    rallyId: v.id("rallies"),
    rallyTitle: v.string(),
    participantIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      rallyId: args.rallyId,
      rallyTitle: args.rallyTitle,
      participantIds: args.participantIds,
      lastMessage: {
        senderId: "",
        text: "",
        timestamp: Date.now(),
      },
      unreadCount: 0,
    });
  },
});

export const markAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { unreadCount: 0 });
  },
});
