import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  insertMessage,
  isBlockedBetween,
} from "./messagingHelpers";

const id = (x: any) => x.toString();

function emptyUnread(participants: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of participants) map[id(p)] = 0;
  return map;
}

function findOrCreateDirectKey(a: any, b: any) {
  return [id(a), id(b)].sort().join(":");
}

async function findDirect(ctx: any, a: any, b: any) {
  const key = findOrCreateDirectKey(a, b);
  return await ctx.db
    .query("conversations")
    .withIndex("by_direct_key", (q) => q.eq("directKey", key))
    .unique();
}

/**
 * Returns the direct conversation id for a 1:1 pair, creating it if missing.
 * Callers are responsible for authorizing (mutual follow or accepted request).
 */
export const getOrOpenDirect = mutation({
  args: { userIdA: v.id("users"), userIdB: v.id("users") },
  handler: async (ctx, args) => {
    if (id(args.userIdA) === id(args.userIdB)) {
      throw new Error("Cannot open a conversation with yourself");
    }
    if (await isBlockedBetween(ctx, args.userIdA, args.userIdB)) {
      throw new Error("Messaging is blocked");
    }
    const existing = await findDirect(ctx, args.userIdA, args.userIdB);
    if (existing) return existing._id;
    const key = findOrCreateDirectKey(args.userIdA, args.userIdB);
    return await ctx.db.insert("conversations", {
      type: "direct",
      directKey: key,
      rallyId: undefined,
      rallyTitle: undefined,
      participantIds: [args.userIdA, args.userIdB],
      lastMessage: {
        senderId: "system",
        text: "Say hello!",
        timestamp: Date.now(),
      },
      unreadCount: 0,
      unreadByUser: { [id(args.userIdA)]: 0, [id(args.userIdB)]: 0 },
      lastRead: {},
    });
  },
});

/**
 * Returns (or creates) the RALLY-scoped chat conversation for a rally.
 * Only the rally creator or an RSVP'd participant may open it (spec: RALLY chat
 * is participant/creator-only and does NOT consume a DM slot).
 */
export const getOrOpenRallyChat = mutation({
  args: { rallyId: v.id("rallies"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const rally: any = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("RALLY not found");

    const isCreator = id(rally.creatorId) === id(args.userId);
    let isParticipant = false;
    if (!isCreator) {
      const rsvp = await ctx.db
        .query("rsvps")
        .withIndex("by_user_rally", (q) =>
          q.eq("userId", args.userId).eq("rallyId", args.rallyId)
        )
        .unique();
      isParticipant = !!rsvp;
    }
    if (!isCreator && !isParticipant) {
      throw new Error("Only participants can join the RALLY chat");
    }

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .filter((q) => q.eq(q.field("type"), "rally"))
      .unique();
    if (existing) {
      // Ensure the participant is in participantIds (they may have joined late)
      if (!existing.participantIds.some((p) => id(p) === id(args.userId))) {
        await ctx.db.patch(existing._id, {
          participantIds: [...existing.participantIds, args.userId],
          unreadByUser: {
            ...(existing.unreadByUser ?? {}),
            [id(args.userId)]: 0,
          },
        });
      }
      return existing._id;
    }

    return await ctx.db.insert("conversations", {
      type: "rally",
      directKey: undefined,
      rallyId: args.rallyId,
      rallyTitle: rally.title || "RALLY chat",
      participantIds: [args.userId],
      lastMessage: {
        senderId: "system",
        text: "RALLY chat started",
        timestamp: Date.now(),
      },
      unreadCount: 0,
      unreadByUser: { [id(args.userId)]: 0 },
      lastRead: {},
    });
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await sendToConversationImpl(ctx, args);
  },
});

/**
 * Sends a message into a conversation (direct or rally), enforcing that the
 * sender is a participant and is not blocked, updating unread state, and
 * notifying other participants.
 */
export const sendToConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await sendToConversationImpl(ctx, args);
  },
});

async function sendToConversationImpl(ctx: any, args: any) {
  const text = args.text.trim();
  if (!text) throw new Error("Message cannot be empty");

  const conv = await ctx.db.get(args.conversationId);
  if (!conv) throw new Error("Conversation not found");
  if (!conv.participantIds.some((p) => id(p) === id(args.senderId))) {
    throw new Error("You are not a participant in this conversation");
  }
  for (const otherId of conv.participantIds) {
    if (id(otherId) === id(args.senderId)) continue;
    if (await isBlockedBetween(ctx, args.senderId, otherId)) {
      throw new Error("You cannot message this user");
    }
  }

  const msgId = await insertMessage(ctx, args.conversationId, args.senderId, text);

  // Notify the other participants in the conversation.
  const sender: any = await ctx.db.get(args.senderId);
  for (const otherId of conv.participantIds) {
    if (id(otherId) === id(args.senderId)) continue;
    await ctx.runMutation(api.notifications.create, {
      userId: otherId,
      type: "new_message",
      title: conv.type === "rally" ? "New message in RALLY chat" : "New message",
      body: `${sender?.name || "Someone"}: ${text.length > 60 ? text.slice(0, 60) + "…" : text}`,
      rallyId: conv.rallyId,
    });
  }

  return msgId;
}

/**
 * Marks a conversation as read for the given user: records lastRead timestamp,
 * resets that user's unread count, and marks all messages in the conversation
 * as read by that user (drives the Sent/Delivered/Read ticks).
 */
export const markRead = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return;
    if (!conv.participantIds.some((p) => id(p) === id(args.userId))) return;

    const collected = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const now = Date.now();
    const unreadByUser = { ...(conv.unreadByUser ?? emptyUnread(conv.participantIds)) };
    unreadByUser[id(args.userId)] = 0;

    await ctx.db.patch(args.conversationId, {
      unreadByUser,
      unreadCount: 0,
      lastRead: { ...(conv.lastRead ?? {}), [id(args.userId)]: now },
    });

    for (const m of collected) {
      if (id(m.senderId) === id(args.userId)) continue;
      if ((m.readByIds ?? []).some((r) => id(r) === id(args.userId))) continue;
      await ctx.db.patch(m._id, {
        readByIds: [...(m.readByIds ?? []), args.userId],
      });
    }
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;
    if (!conv.participantIds.some((p) => id(p) === id(args.userId))) return null;

    const otherUserId = conv.participantIds.find((pid) => id(pid) !== id(args.userId));
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

/**
 * Lists the viewer's conversations (direct + rally), sorted by recency, with
 * participant cards resolved and per-viewer unread counts.
 */
export const listConversationsWithParticipants = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("conversations").collect();
    const userConversations = all.filter((c) =>
      c.participantIds.some((p) => id(p) === id(args.userId))
    );

    userConversations.sort(
      (a, b) => (b.lastMessage?.timestamp ?? 0) - (a.lastMessage?.timestamp ?? 0)
    );

    const allParticipantIds = new Set<string>();
    for (const conv of userConversations) {
      for (const pid of conv.participantIds) {
        if (id(pid) !== id(args.userId)) allParticipantIds.add(id(pid));
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

    return userConversations.map((conv) => {
      const unreadByUser = conv.unreadByUser ?? {};
      const myUnread = unreadByUser[id(args.userId)] ?? 0;
      const isDirect = conv.type === "direct";
      const otherId = conv.participantIds.find((p) => id(p) !== id(args.userId));
      return {
        ...conv,
        isDirect,
        rallyTitle: conv.rallyTitle ?? null,
        otherParticipant: otherId ? participants[id(otherId)] || null : null,
        myUnread,
      };
    });
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
      c.participantIds.some((p) => id(p) === id(args.userId))
    );
  },
});

/**
 * Lists participants of a RALLY chat (creator + RSVP'd users), shown as user
 * cards. Returns user summaries rather than raw ids.
 */
export const listParticipants = query({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    const rally: any = await ctx.db.get(args.rallyId);
    if (!rally) return [];

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect();

    const memberIds = new Set<string>([id(rally.creatorId)]);
    for (const r of rsvps) memberIds.add(id(r.userId));

    const out: any[] = [];
    for (const mid of memberIds) {
      const u: any = await ctx.db.get(mid as any);
      if (!u) continue;
      let avatar = u.avatar || "";
      if (avatar && !avatar.startsWith("http")) {
        try {
          avatar = (await ctx.storage.getUrl(avatar)) ?? "";
        } catch {
          avatar = "";
        }
      }
      out.push({
        _id: u._id,
        name: u.name,
        username: u.username,
        avatar,
        isNINVerified: u.isNINVerified,
        badges: u.badges,
        isCreator: id(u._id) === id(rally.creatorId),
      });
    }
    return out;
  },
});
