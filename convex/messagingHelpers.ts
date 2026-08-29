import {
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";

/**
 * Phase 3 shared messaging helpers.
 * These are plain functions (not Convex query/mutation registrations) so they
 * can be imported by messaging modules. They centralize the authorization
 * rules that MUST be enforced server-side:
 *   - mutual-follow (for instant DM)
 *   - two-way blocking (blocking overrides everything)
 *   - per-user unread / read state updates
 */

const id = (x: any) => x.toString();

/** True when A follows B. */
export async function isFollowing(
  ctx: QueryCtx,
  followerId: any,
  followingId: any
): Promise<boolean> {
  if (id(followerId) === id(followingId)) return true;
  const row = await ctx.db
    .query("follows")
    .withIndex("by_pair", (q) =>
      q.eq("followerId", followerId).eq("followingId", followingId)
    )
    .unique();
  return row !== null;
}

/** True when A follows B AND B follows A. */
export async function isMutualFollow(
  ctx: QueryCtx,
  aId: any,
  bId: any
): Promise<boolean> {
  if (id(aId) === id(bId)) return true;
  const ab = await isFollowing(ctx, aId, bId);
  if (!ab) return false;
  return await isFollowing(ctx, bId, aId);
}

/**
 * True when communication between `aId` and `bId` is disallowed by a block in
 * EITHER direction. Blocking overrides all messaging permissions.
 */
export async function isBlockedBetween(
  ctx: QueryCtx,
  aId: any,
  bId: any
): Promise<boolean> {
  if (id(aId) === id(bId)) return false;
  const a: any = await ctx.db.get(aId);
  const b: any = await ctx.db.get(bId);
  const aBlocked = a?.blockedUsers ?? [];
  const bBlocked = b?.blockedUsers ?? [];
  const aHasB = aBlocked.some((x) => id(x.id) === id(bId));
  const bHasA = bBlocked.some((x) => id(x.id) === id(aId));
  return aHasB || bHasA;
}

function emptyUnread(participants: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of participants) map[id(p)] = 0;
  return map;
}

/**
 * Inverts a per-user unread map for an N-participant conversation into the
 * per-user counts each participant should hold (everyone else's unread).
 */
function otherUnreadMap(
  current: Record<string, number>,
  participants: any[],
  excludeId: any
): Record<string, number> {
  const next: Record<string, number> = {};
  const base: Record<string, number> = {};
  for (const p of participants) base[id(p)] = 0;
  for (const k of Object.keys(base)) {
    if (id(k) === id(excludeId)) {
      next[k] = base[k]; // sender's own is always 0
    } else {
      next[k] = (current?.[k] ?? 0) + 1;
    }
  }
  return next;
}

/**
 * Shared send logic used by both direct DMs and RALLY chats.
 * Updates lastMessage + per-user unread counts and stamps the message.
 * Throws when the sender is blocked or not a participant.
 * A message must carry either `text` or an `audioStorageId` (voice note).
 */
export async function insertMessage(
  ctx: MutationCtx,
  conversationId: any,
  senderId: any,
  text: string,
  options?: { queryCtx?: QueryCtx; audioStorageId?: string; audioDuration?: number }
) {
  const conv: any = await ctx.db.get(conversationId);
  if (!conv) throw new Error("Conversation not found");
  if (!conv.participantIds.some((p) => id(p) === id(senderId))) {
    throw new Error("You are not a participant in this conversation");
  }
  // Blocking enforcement — two-way
  for (const otherId of conv.participantIds) {
    if (id(otherId) === id(senderId)) continue;
    if (await isBlockedBetween(ctx as any, senderId, otherId)) {
      throw new Error("You cannot message this user");
    }
  }

  const trimmed = text.trim();
  const hasAudio = !!options?.audioStorageId;
  if (!trimmed && !hasAudio) throw new Error("Message cannot be empty");

  const now = Date.now();
  const preview = hasAudio ? "🎤 Voice note" : trimmed;
  const msgId = await ctx.db.insert("messages", {
    conversationId,
    senderId,
    text: trimmed,
    timestamp: now,
    readByIds: [senderId],
    audioStorageId: options?.audioStorageId,
    audioDuration: options?.audioDuration,
  });

  await ctx.db.patch(conversationId, {
    lastMessage: { senderId: id(senderId), text: preview, timestamp: now },
    unreadCount: 1,
    unreadByUser: otherUnreadMap(
      conv.unreadByUser ?? emptyUnread(conv.participantIds),
      conv.participantIds,
      senderId
    ),
  });

  return msgId;
}
