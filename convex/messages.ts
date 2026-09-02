import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthenticatedUser } from "./lib/auth";
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
 * Opens (or returns existing) direct conversation between two users.
 * Caller must be one of the two participants.
 */
export const getOrOpenDirect = mutation({
  args: { userIdA: v.id("users"), userIdB: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    // The caller must be one of the two parties.
    if (
      id(caller._id) !== id(args.userIdA) &&
      id(caller._id) !== id(args.userIdB)
    ) {
      throw new Error("Forbidden: you can only open a conversation you are part of.");
    }
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
      lastMessage: { senderId: "system", text: "Say hello!", timestamp: Date.now() },
      unreadCount: 0,
      unreadByUser: { [id(args.userIdA)]: 0, [id(args.userIdB)]: 0 },
      lastRead: {},
    });
  },
});

/**
 * Opens (or returns existing) rally-scoped chat conversation.
 * Caller must be the rally creator or an RSVP'd participant.
 */
export const getOrOpenRallyChat = mutation({
  args: { rallyId: v.id("rallies"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    // Caller can only join as themselves.
    if (id(caller._id) !== id(args.userId)) {
      throw new Error("Forbidden: you can only join a rally chat as yourself.");
    }
    const rally: any = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("RALLY not found");

    const isCreator = id(rally.creatorId) === id(caller._id);
    let isParticipant = false;
    if (!isCreator) {
      const rsvp = await ctx.db
        .query("rsvps")
        .withIndex("by_user_rally", (q) =>
          q.eq("userId", caller._id).eq("rallyId", args.rallyId)
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
      if (!existing.participantIds.some((p) => id(p) === id(caller._id))) {
        await ctx.db.patch(existing._id, {
          participantIds: [...existing.participantIds, caller._id],
          unreadByUser: { ...(existing.unreadByUser ?? {}), [id(caller._id)]: 0 },
        });
      }
      return existing._id;
    }

    return await ctx.db.insert("conversations", {
      type: "rally",
      directKey: undefined,
      rallyId: args.rallyId,
      rallyTitle: rally.title || "RALLY chat",
      participantIds: [caller._id],
      lastMessage: { senderId: "system", text: "RALLY chat started", timestamp: Date.now() },
      unreadCount: 0,
      unreadByUser: { [id(caller._id)]: 0 },
      lastRead: {},
    });
  },
});

/**
 * Send a message into a conversation.
 * Caller must be the sender and a participant in the conversation.
 */
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"), // accepted for compat, verified against auth
    text: v.string(),
    audioStorageId: v.optional(v.string()),
    audioDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await sendToConversationImpl(ctx, args);
  },
});

export const sendToConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"), // accepted for compat, verified against auth
    text: v.string(),
    audioStorageId: v.optional(v.string()),
    audioDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await sendToConversationImpl(ctx, args);
  },
});

/** Generate a Convex storage upload URL for sending voice notes. Requires auth. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

async function sendToConversationImpl(ctx: any, args: any) {
  const caller = await getAuthenticatedUser(ctx);
  // Caller must be the sender — reject if they're trying to impersonate another user.
  if (id(caller._id) !== id(args.senderId)) {
    throw new Error("Forbidden: you can only send messages as yourself.");
  }

  const text = args.text?.trim() ?? "";
  const audioStorageId = args.audioStorageId;
  const hasAudio = !!audioStorageId;
  if (!text && !hasAudio) throw new Error("Message cannot be empty");

  const conv = await ctx.db.get(args.conversationId);
  if (!conv) throw new Error("Conversation not found");
  if (!conv.participantIds.some((p) => id(p) === id(caller._id))) {
    throw new Error("You are not a participant in this conversation");
  }
  for (const otherId of conv.participantIds) {
    if (id(otherId) === id(caller._id)) continue;
    if (await isBlockedBetween(ctx, caller._id, otherId)) {
      throw new Error("You cannot message this user");
    }
  }

  const msgId = await insertMessage(ctx, args.conversationId, caller._id, text, {
    audioStorageId,
    audioDuration: args.audioDuration,
  });

  const sender: any = caller;
  for (const otherId of conv.participantIds) {
    if (id(otherId) === id(caller._id)) continue;
    await ctx.runMutation(api.notifications.create, {
      userId: otherId,
      type: "new_message",
      title: conv.type === "rally" ? "New message in RALLY chat" : "New message",
      body: `${sender?.name || "Someone"}: ${hasAudio ? "🎤 Voice note" : text.length > 60 ? text.slice(0, 60) + "…" : text}`,
      rallyId: conv.rallyId,
    });
  }

  return msgId;
}

/**
 * Mark a conversation as read for the authenticated user.
 */
export const markRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"), // accepted for compat, verified against auth
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (id(caller._id) !== id(args.userId)) {
      throw new Error("Forbidden: you can only mark your own conversations as read.");
    }
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return;
    if (!conv.participantIds.some((p) => id(p) === id(caller._id))) return;

    const collected = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const now = Date.now();
    const unreadByUser = { ...(conv.unreadByUser ?? emptyUnread(conv.participantIds)) };
    unreadByUser[id(caller._id)] = 0;

    await ctx.db.patch(args.conversationId, {
      unreadByUser,
      unreadCount: 0,
      lastRead: { ...(conv.lastRead ?? {}), [id(caller._id)]: now },
    });

    for (const m of collected) {
      if (id(m.senderId) === id(caller._id)) continue;
      if ((m.readByIds ?? []).some((r) => id(r) === id(caller._id))) continue;
      await ctx.db.patch(m._id, {
        readByIds: [...(m.readByIds ?? []), caller._id],
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Queries — no auth required (caller supplies their own userId for filtering)
// ---------------------------------------------------------------------------

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
        ? { _id: otherUser._id, name: otherUser.name, username: otherUser.username, avatar: otherUser.avatar, isNINVerified: otherUser.isNINVerified, badges: otherUser.badges }
        : null,
    };
  },
});

export const listConversationsWithParticipants = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("conversations").collect();
    const userConversations = all.filter((c) =>
      c.participantIds.some((p) => id(p) === id(args.userId))
    );
    userConversations.sort((a, b) => (b.lastMessage?.timestamp ?? 0) - (a.lastMessage?.timestamp ?? 0));

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
        participants[pid] = { _id: user._id, name: user.name, username: user.username, avatar: user.avatar, isNINVerified: user.isNINVerified, badges: user.badges };
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
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    const cache: Record<string, string | undefined> = {};
    const audioIds = [...new Set(msgs.map((m: any) => m.audioStorageId).filter(Boolean) as string[])];
    for (const sid of audioIds) {
      try { cache[sid] = (await ctx.storage.getUrl(sid)) ?? undefined; }
      catch { cache[sid] = undefined; }
    }

    return msgs.map((m: any) => ({
      ...m,
      audioUrl: m.audioStorageId ? (cache[m.audioStorageId] ?? undefined) : undefined,
    }));
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

export const listParticipants = query({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    const rally: any = await ctx.db.get(args.rallyId);
    if (!rally) return [];
    const rsvps = await ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId)).collect();
    const memberIds = new Set<string>([id(rally.creatorId)]);
    for (const r of rsvps) memberIds.add(id(r.userId));
    const out: any[] = [];
    for (const mid of memberIds) {
      const u: any = await ctx.db.get(mid as any);
      if (!u) continue;
      let avatar = u.avatar || "";
      if (avatar && !avatar.startsWith("http")) {
        try { avatar = (await ctx.storage.getUrl(avatar)) ?? ""; }
        catch { avatar = ""; }
      }
      out.push({ _id: u._id, name: u.name, username: u.username, avatar, isNINVerified: u.isNINVerified, badges: u.badges, isCreator: id(u._id) === id(rally.creatorId) });
    }
    return out;
  },
});
