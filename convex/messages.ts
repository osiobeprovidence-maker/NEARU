import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByConversation = query({
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

export const listConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db.query("conversations").collect();
    return conversations.filter((c) =>
      c.participantIds.includes(args.userId)
    );
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      text: args.text,
      timestamp: Date.now(),
    });
    await ctx.db.patch(args.conversationId, {
      lastMessage: {
        senderId: args.senderId,
        text: args.text,
        timestamp: Date.now(),
      },
      unreadCount: 0,
    });
    return msgId;
  },
});
