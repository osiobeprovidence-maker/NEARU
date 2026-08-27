import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getConversation = query({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;
    if (!conv.participantIds.includes(args.userId)) return null;

    const otherUserId = conv.participantIds.find((pid) => pid !== args.userId);
    const otherUser: any = otherUserId ? await ctx.db.get(otherUserId as any) : null;

    return {
      ...conv,
      otherParticipant: otherUser
        ? {
            _id: otherUser._id,
            name: otherUser.name,
            username: otherUser.username,
            avatar: otherUser.avatar,
            isNINVerified: otherUser.isNINVerified,
            badges: otherUser.badges,
          }
        : null,
    };
  },
});

export const listConversationsWithParticipants = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db.query("conversations").collect();
    const userConversations = conversations.filter((c) =>
      c.participantIds.includes(args.userId)
    );

    const allParticipantIds = new Set<string>();
    for (const conv of userConversations) {
      for (const pid of conv.participantIds) {
        if (pid !== args.userId) allParticipantIds.add(pid);
      }
    }

    const participants: Record<string, any> = {};
    for (const pid of allParticipantIds) {
      const user: any = await ctx.db.get(pid as any);
      if (user) {
        participants[pid] = {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          isNINVerified: user.isNINVerified,
          badges: user.badges,
        };
      }
    }

    return userConversations.map((conv) => ({
      ...conv,
      otherParticipant: participants[
        conv.participantIds.find((pid) => pid !== args.userId) || ''
      ] || null,
    }));
  },
});

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
