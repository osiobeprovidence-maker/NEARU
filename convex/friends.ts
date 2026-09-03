import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthenticatedUser } from "./lib/auth";

const idStr = (x: any) => (x ? x.toString() : "");

function isStorageId(id?: string | null): boolean {
  return Boolean(
    id &&
      !id.startsWith("http") &&
      !id.startsWith("data:") &&
      !id.startsWith("blob:")
  );
}

async function resolveStorageUrl(
  ctx: any,
  cache: Record<string, string | undefined>,
  id: string
): Promise<string | undefined> {
  if (!id || !isStorageId(id)) return id || undefined;
  if (!(id in cache)) {
    try {
      cache[id] = (await ctx.storage.getUrl(id as any)) ?? undefined;
    } catch {
      cache[id] = undefined;
    }
  }
  return cache[id];
}

// ---------------------------------------------------------------------------
// 1. FIND FRIENDS (Social Graph Mutual Recommendations)
// ---------------------------------------------------------------------------

/**
 * Recommendations based on the existing social graph.
 *
 * Algorithm:
 * 1. Find all people directly connected to the current user (following & followers).
 * 2. Traverse 2nd-degree connections: for each direct connection, find who they connect with.
 * 3. Count mutual connections: |currentUserConnections ∩ candidateConnections|.
 * 4. Filter out: current user, users already followed/friends, blocked users.
 * 5. Sort descending by mutualCount.
 * 6. Supplement with active community members if mutuals count is below requested limit.
 */
export const getFriendRecommendations = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const targetLimit = args.limit ?? 20;

    // Blocked users set
    const blockedIds = new Set<string>();
    if (user.blockedUsers) {
      for (const b of user.blockedUsers) {
        if (b.id) blockedIds.add(b.id);
      }
    }

    // Direct connections of the current user
    const myFollowingDocs = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    const myFollowingIds = new Set(
      myFollowingDocs.map((f) => f.followingId.toString())
    );

    const myFollowerDocs = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();
    const myFollowerIds = new Set(
      myFollowerDocs.map((f) => f.followerId.toString())
    );

    // Direct connection IDs (union of following and followers)
    const myConnectionIds = new Set<string>([
      ...myFollowingIds,
      ...myFollowerIds,
    ]);

    // Active pending requests
    const pendingOutgoing = await ctx.db
      .query("chatRequests")
      .withIndex("by_fromUser", (q) => q.eq("fromUserId", args.userId))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .collect();
    const pendingOutgoingMap = new Map(
      pendingOutgoing.map((r) => [r.toUserId.toString(), r._id])
    );

    const pendingIncoming = await ctx.db
      .query("chatRequests")
      .withIndex("by_toUser", (q) =>
        q.eq("toUserId", args.userId).eq("status", "PENDING")
      )
      .collect();
    const pendingIncomingMap = new Map(
      pendingIncoming.map((r) => [r.fromUserId.toString(), r._id])
    );

    // Map: candidateUserId -> Set of mutual connection user IDs
    const candidateMutuals = new Map<string, Set<string>>();

    for (const connId of myConnectionIds) {
      // Get connections of connId
      const connFollowing = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", connId as any))
        .collect();
      const connFollowers = await ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", connId as any))
        .collect();

      const theirConnections = new Set<string>([
        ...connFollowing.map((f) => f.followingId.toString()),
        ...connFollowers.map((f) => f.followerId.toString()),
      ]);

      for (const candidateId of theirConnections) {
        // Never count current user
        if (candidateId === args.userId.toString()) continue;
        // Never recommend someone already followed
        if (myFollowingIds.has(candidateId)) continue;
        // Never recommend blocked users
        if (blockedIds.has(candidateId)) continue;

        if (!candidateMutuals.has(candidateId)) {
          candidateMutuals.set(candidateId, new Set<string>());
        }
        candidateMutuals.get(candidateId)!.add(connId);
      }
    }

    // Sort candidates descending by mutual connections
    const rankedCandidates = Array.from(candidateMutuals.entries())
      .map(([id, mutuals]) => ({ id, mutualCount: mutuals.size }))
      .sort((a, b) => b.mutualCount - a.mutualCount);

    const candidateIds = new Set(rankedCandidates.map((c) => c.id));

    // If fewer than requested limit, supplement with active members
    if (rankedCandidates.length < targetLimit) {
      const activeUsers = await ctx.db
        .query("users")
        .order("desc")
        .take(60);

      for (const other of activeUsers) {
        const oId = other._id.toString();
        if (oId === args.userId.toString()) continue;
        if (myFollowingIds.has(oId)) continue;
        if (blockedIds.has(oId)) continue;
        if (candidateIds.has(oId)) continue;
        if (other.moderationStatus === "BANNED") continue;

        // Calculate if any mutual connections exist
        let mutualCount = 0;
        for (const connId of myConnectionIds) {
          const pair = await ctx.db
            .query("follows")
            .withIndex("by_pair", (q) =>
              q.eq("followerId", connId as any).eq("followingId", other._id)
            )
            .unique();
          if (pair) mutualCount++;
        }

        rankedCandidates.push({ id: oId, mutualCount });
        candidateIds.add(oId);
        if (rankedCandidates.length >= targetLimit) break;
      }
    }

    // Resolve details for top candidates
    const avatarCache: Record<string, string | undefined> = {};
    const results = [];

    for (const item of rankedCandidates.slice(0, targetLimit)) {
      const userDoc: any = await ctx.db.get(item.id as any);
      if (!userDoc || userDoc.moderationStatus === "BANNED") continue;

      let avatar = userDoc.avatar || "";
      if (avatar && isStorageId(avatar)) {
        avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
      }

      const isFriend =
        myFollowingIds.has(item.id) && myFollowerIds.has(item.id);
      const isPendingOutgoing = pendingOutgoingMap.has(item.id);
      const isPendingIncoming = pendingIncomingMap.has(item.id);
      const incomingRequestId = pendingIncomingMap.get(item.id);

      results.push({
        _id: userDoc._id,
        name: userDoc.name,
        username: userDoc.username,
        avatar,
        bio: userDoc.bio,
        isNINVerified: userDoc.isNINVerified,
        badges: userDoc.badges,
        mutualCount: item.mutualCount,
        isFriend,
        isPendingOutgoing,
        isPendingIncoming,
        incomingRequestId,
      });
    }

    return results;
  },
});

// ---------------------------------------------------------------------------
// 2. ALL CONTACTS (Phone / Device Address Book Matching)
// ---------------------------------------------------------------------------

function normalizePhoneVariations(raw?: string | null): string[] {
  if (!raw) return [];
  // Retain only numbers and leading plus
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return [];

  const variations = new Set<string>();
  variations.add(digits);

  // Strip leading plus if present
  const withoutPlus = digits.startsWith("+") ? digits.slice(1) : digits;
  variations.add(withoutPlus);

  // Common country prefix handling (e.g. Nigeria +234 / 0...)
  if (digits.startsWith("+234") && digits.length >= 13) {
    const local = "0" + digits.slice(4);
    variations.add(local);
    variations.add(digits.slice(4));
  } else if (digits.startsWith("234") && digits.length >= 12) {
    const local = "0" + digits.slice(3);
    variations.add(local);
    variations.add(digits.slice(3));
  } else if (digits.startsWith("0") && digits.length === 11) {
    const intlWithPlus = "+234" + digits.slice(1);
    const intlNoPlus = "234" + digits.slice(1);
    variations.add(intlWithPlus);
    variations.add(intlNoPlus);
  }

  return Array.from(variations);
}

function normalizeEmail(raw?: string | null): string | null {
  if (!raw) return null;
  const em = raw.trim().toLowerCase();
  return em.includes("@") ? em : null;
}

/**
 * Match contacts from device address book against registered Laulau users.
 *
 * Requirements:
 * - Read only with user permission on the client.
 * - Normalize phone numbers and email addresses.
 * - Securely matches against registered users.
 * - NEVER leaks unmatched contacts.
 * - NEVER exposes private phone numbers or emails in the response.
 */
export const matchDeviceContacts = query({
  args: {
    viewerId: v.id("users"),
    contacts: v.array(
      v.object({
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (!args.contacts || args.contacts.length === 0) return [];

    const viewer = await ctx.db.get(args.viewerId);
    if (!viewer) return [];

    const blockedIds = new Set<string>();
    if (viewer.blockedUsers) {
      for (const b of viewer.blockedUsers) {
        if (b.id) blockedIds.add(b.id);
      }
    }

    // Direct following/follower status for viewer
    const myFollowingDocs = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.viewerId))
      .collect();
    const myFollowingIds = new Set(
      myFollowingDocs.map((f) => f.followingId.toString())
    );

    const myFollowerDocs = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.viewerId))
      .collect();
    const myFollowerIds = new Set(
      myFollowerDocs.map((f) => f.followerId.toString())
    );

    // Pending requests
    const pendingOutgoing = await ctx.db
      .query("chatRequests")
      .withIndex("by_fromUser", (q) => q.eq("fromUserId", args.viewerId))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .collect();
    const pendingOutgoingMap = new Map(
      pendingOutgoing.map((r) => [r.toUserId.toString(), r._id])
    );

    const pendingIncoming = await ctx.db
      .query("chatRequests")
      .withIndex("by_toUser", (q) =>
        q.eq("toUserId", args.viewerId).eq("status", "PENDING")
      )
      .collect();
    const pendingIncomingMap = new Map(
      pendingIncoming.map((r) => [r.fromUserId.toString(), r._id])
    );

    // Build lookup maps: email -> contactName, phoneVariation -> contactName
    const emailToContact = new Map<string, string>();
    const phoneToContact = new Map<string, string>();

    for (const c of args.contacts) {
      const contactLabel = c.name?.trim() || "";
      const email = normalizeEmail(c.email);
      if (email) {
        emailToContact.set(email, contactLabel);
      }
      const phoneVars = normalizePhoneVariations(c.phone);
      for (const p of phoneVars) {
        phoneToContact.set(p, contactLabel);
      }
    }

    const matchedUserMap = new Map<
      string,
      { user: any; contactName: string }
    >();

    // 1. Search by email
    for (const [em, contactLabel] of emailToContact.entries()) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", em))
        .first();
      if (user && user._id.toString() !== args.viewerId.toString()) {
        const uId = user._id.toString();
        if (!blockedIds.has(uId) && !matchedUserMap.has(uId)) {
          matchedUserMap.set(uId, { user, contactName: contactLabel });
        }
      }
    }

    // 2. Search by phone
    for (const [ph, contactLabel] of phoneToContact.entries()) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_phone", (q) => q.eq("phone", ph))
        .first();
      if (user && user._id.toString() !== args.viewerId.toString()) {
        const uId = user._id.toString();
        if (!blockedIds.has(uId) && !matchedUserMap.has(uId)) {
          matchedUserMap.set(uId, { user, contactName: contactLabel });
        }
      }
    }

    // 3. Fallback scan if phone was stored in varied format in users
    if (phoneToContact.size > 0 && matchedUserMap.size < 20) {
      const allUsersWithPhone = await ctx.db.query("users").take(200);
      for (const u of allUsersWithPhone) {
        const uId = u._id.toString();
        if (uId === args.viewerId.toString() || blockedIds.has(uId)) continue;
        if (matchedUserMap.has(uId)) continue;

        if (u.phone) {
          const userPhoneVars = normalizePhoneVariations(u.phone);
          for (const up of userPhoneVars) {
            if (phoneToContact.has(up)) {
              matchedUserMap.set(uId, {
                user: u,
                contactName: phoneToContact.get(up) || "",
              });
              break;
            }
          }
        }
      }
    }

    // Resolve profiles and avatars (never expose phone/email!)
    const avatarCache: Record<string, string | undefined> = {};
    const results = [];

    for (const [uId, { user, contactName }] of matchedUserMap.entries()) {
      if (user.moderationStatus === "BANNED") continue;

      let avatar = user.avatar || "";
      if (avatar && isStorageId(avatar)) {
        avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
      }

      const isFriend = myFollowingIds.has(uId) && myFollowerIds.has(uId);
      const isPendingOutgoing = pendingOutgoingMap.has(uId);
      const isPendingIncoming = pendingIncomingMap.has(uId);
      const incomingRequestId = pendingIncomingMap.get(uId);

      results.push({
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar,
        bio: user.bio,
        isNINVerified: user.isNINVerified,
        badges: user.badges,
        contactName: contactName || user.name,
        isFriend,
        isPendingOutgoing,
        isPendingIncoming,
        incomingRequestId,
      });
    }

    return results;
  },
});

// ---------------------------------------------------------------------------
// 3. FRIEND REQUEST MUTATIONS
// ---------------------------------------------------------------------------

/**
 * Convenience mutation to send a friend request.
 * Verifies authenticated caller and reuses chatRequests direct request system.
 */
export const sendFriendRequest = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (idStr(caller._id) !== idStr(args.fromUserId)) {
      throw new Error("Forbidden: you can only send friend requests as yourself.");
    }
    if (idStr(caller._id) === idStr(args.toUserId)) {
      throw new Error("Cannot send friend request to yourself.");
    }

    return await ctx.runMutation(api.chatRequests.sendDirect, {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      message: "Friend request",
    });
  },
});
