import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ---------------------------------------------------------------------------
// Event Hub — participants, followers, results, leaderboard, announcements.
// Auth follows the project pattern: userId passed as an arg + server-side
// ownership checks via .toString() (Convex Ids are not reference-equal across
// deserialization, so === would always be false).
// ---------------------------------------------------------------------------

const RALLY_STATUSES = v.union(
  v.literal("ACTIVE"),
  v.literal("LIVE"),
  v.literal("COMPLETED"),
  v.literal("CANCELLED")
);

async function getRallyOrThrow(ctx, rallyId) {
  const rally = await ctx.db.get(rallyId);
  if (!rally) throw new Error("RALLY not found");
  return rally;
}

async function isOrganizer(ctx, rallyId, userId) {
  const p = await ctx.db
    .query("rallyParticipants")
    .withIndex("by_rally_user", (q) => q.eq("rallyId", rallyId).eq("userId", userId))
    .unique();
  return Boolean(p && p.role === "organizer");
}

async function isParticipant(ctx, rallyId, userId) {
  const p = await ctx.db
    .query("rallyParticipants")
    .withIndex("by_rally_user", (q) => q.eq("rallyId", rallyId).eq("userId", userId))
    .unique();
  return Boolean(p);
}

async function resolveUserCard(ctx, cache, userId) {
  if (userId in cache) return cache[userId];
  const user = await ctx.db.get(userId);
  let card: any = null;
  if (user) {
    let avatar = user.avatar || "";
    if (avatar && !avatar.startsWith("http")) {
      try {
        avatar = (await ctx.storage.getUrl(avatar)) || "";
      } catch {
        avatar = "";
      }
    }
    card = {
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar,
      isNINVerified: user.isNINVerified,
      badges: user.badges,
      accountType: user.accountType || "personal",
      organizationName: user.organizationName,
      isPro: user.isPro ?? false,
    };
  }
  cache[userId] = card;
  return card;
}

async function blockedUserIds(ctx, userId) {
  if (!userId) return new Set<string>();
  const user = await ctx.db.get(userId);
  return new Set((user?.blockedUsers || []).map((b) => b.id));
}

async function notify(ctx, userId, type, title, body, rallyId) {
  if (!userId) return;
  try {
    await ctx.runMutation(api.notifications.create, {
      userId,
      type,
      title,
      body,
      rallyId,
    });
  } catch {
    // best-effort
  }
}

// ===========================================================================
// Relationship / discovery
// ===========================================================================

export const getRelationship = query({
  args: {
    rallyId: v.id("rallies"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const rally = await getRallyOrThrow(ctx, args.rallyId);
    let joined = false;
    let role: string | null = null;
    let following = false;
    if (args.userId) {
      const p = await ctx.db
        .query("rallyParticipants")
        .withIndex("by_rally_user", (q) =>
          q.eq("rallyId", args.rallyId).eq("userId", args.userId)
        )
        .unique();
      joined = Boolean(p);
      role = p?.role || null;
      const f = await ctx.db
        .query("rallyFollowers")
        .withIndex("by_rally_user", (q) =>
          q.eq("rallyId", args.rallyId).eq("userId", args.userId)
        )
        .unique();
      following = Boolean(f);
    }
    const participantCount = await ctx.db
      .query("rallyParticipants")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect()
      .then((rs) => rs.length);
    const followerCount = await ctx.db
      .query("rallyFollowers")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect()
      .then((rs) => rs.length);
    // Official approved-result matches counted for the leaderboard
    const approved = await ctx.db
      .query("rallyResults")
      .withIndex("by_rally", (q) =>
        q.eq("rallyId", args.rallyId).eq("status", "APPROVED")
      )
      .collect();

    return {
      joined,
      role,
      following,
      isOrganizer: role === "organizer",
      participantCount,
      followerCount,
      status: rally.status,
      approvedResultCount: approved.length,
    };
  },
});

export const getParticipants = query({
  args: {
    rallyId: v.id("rallies"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("rallyParticipants")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect();
    rows.sort((a, b) => a.joinedAt - b.joinedAt);
    const blocked = await blockedUserIds(ctx, args.viewerId);
    const cache: Record<string, any> = {};
    const participants = [];
    for (const row of rows) {
      if (blocked.has(row.userId.toString())) continue;
      const card = await resolveUserCard(ctx, cache, row.userId);
      if (card) participants.push({ ...card, role: row.role, joinedAt: row.joinedAt });
    }
    return participants;
  },
});

export const getFollowers = query({
  args: {
    rallyId: v.id("rallies"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("rallyFollowers")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .order("desc")
      .take(50);
    const blocked = await blockedUserIds(ctx, args.viewerId);
    const cache: Record<string, any> = {};
    const followers = [];
    for (const row of rows) {
      if (blocked.has(row.userId.toString())) continue;
      const card = await resolveUserCard(ctx, cache, row.userId);
      if (card) followers.push(card);
    }
    return followers;
  },
});

// ===========================================================================
// Join / Leave
// ===========================================================================

export const joinRally = mutation({
  args: {
    rallyId: v.id("rallies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const rally = await getRallyOrThrow(ctx, args.rallyId);
    if (rally.status === "CANCELLED" || rally.status === "COMPLETED") {
      throw new Error("This RALLY is no longer accepting participants");
    }
    const existing = await ctx.db
      .query("rallyParticipants")
      .withIndex("by_rally_user", (q) =>
        q.eq("rallyId", args.rallyId).eq("userId", args.userId)
      )
      .unique();
    if (existing) return { joined: true, role: existing.role };

    // Capacity enforcement server-side
    if (rally.capacity && rally.capacity > 0) {
      const count = await ctx.db
        .query("rallyParticipants")
        .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
        .collect();
      if (count.length >= rally.capacity) {
        throw new Error("This event is at full capacity");
      }
    }

    await ctx.db.insert("rallyParticipants", {
      rallyId: args.rallyId,
      userId: args.userId,
      role: "participant",
      joinedAt: Date.now(),
    });

    if (rally.creatorId.toString() !== args.userId.toString()) {
      try {
        const user = await ctx.db.get(args.userId);
        await notify(
          ctx,
          rally.creatorId,
          "event_participant_joined",
          "New participant",
          `${user?.name || "Someone"} joined "${rally.title}".`,
          args.rallyId
        );
      } catch {
        // best-effort
      }
    }

    return { joined: true, role: "participant" };
  },
});

export const leaveRally = mutation({
  args: {
    rallyId: v.id("rallies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rallyParticipants")
      .withIndex("by_rally_user", (q) =>
        q.eq("rallyId", args.rallyId).eq("userId", args.userId)
      )
      .unique();
    if (!existing) return { left: false };
    if (existing.role === "organizer") {
      throw new Error("The organizer cannot leave their own RALLY");
    }
    await ctx.db.delete(existing._id);
    return { left: true };
  },
});

export const removeParticipant = mutation({
  args: {
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const rally = await getRallyOrThrow(ctx, args.rallyId);
    if (rally.creatorId.toString() !== args.requestingUserId.toString()) {
      throw new Error("Only the organizer can remove participants");
    }
    if (args.targetUserId.toString() === args.requestingUserId.toString()) {
      throw new Error("Organizer cannot remove themselves");
    }
    const p = await ctx.db
      .query("rallyParticipants")
      .withIndex("by_rally_user", (q) =>
        q.eq("rallyId", args.rallyId).eq("userId", args.targetUserId)
      )
      .unique();
    if (p && p.role !== "organizer") {
      await ctx.db.delete(p._id);
    }
    return { removed: true };
  },
});

// ===========================================================================
// Follow / Unfollow
// ===========================================================================

export const followRally = mutation({
  args: {
    rallyId: v.id("rallies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const rally = await getRallyOrThrow(ctx, args.rallyId);
    const existing = await ctx.db
      .query("rallyFollowers")
      .withIndex("by_rally_user", (q) =>
        q.eq("rallyId", args.rallyId).eq("userId", args.userId)
      )
      .unique();
    if (existing) return { following: true };
    await ctx.db.insert("rallyFollowers", {
      rallyId: args.rallyId,
      userId: args.userId,
      createdAt: Date.now(),
    });
    return { following: true };
  },
});

export const unfollowRally = mutation({
  args: {
    rallyId: v.id("rallies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rallyFollowers")
      .withIndex("by_rally_user", (q) =>
        q.eq("rallyId", args.rallyId).eq("userId", args.userId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
    return { following: false };
  },
});

// ===========================================================================
// Results — participants submit; organizers approve; leaderboard follows.
// ===========================================================================

export const submitResult = mutation({
  args: {
    rallyId: v.id("rallies"),
    userId: v.id("users"),
    match: v.string(),
    score: v.number(),
    opponent: v.optional(v.string()),
    evidenceStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rally = await getRallyOrThrow(ctx, args.rallyId);
    const participant = await isParticipant(ctx, args.rallyId, args.userId);
    if (!participant) {
      throw new Error("You must join the RALLY before submitting results");
    }
    const match = args.match.trim();
    if (!match) throw new Error("Match label is required");
    if (!Number.isFinite(args.score)) throw new Error("Score is required");
    if (args.score < 0) throw new Error("Score cannot be negative");

    // Idempotency: a participant cannot submit the same match twice.
    // Protects against double-clicks / network retries / repeated tabs.
    const duplicate = await ctx.db
      .query("rallyResults")
      .withIndex("by_rally_user", (q) =>
        q
          .eq("rallyId", args.rallyId)
          .eq("userId", args.userId)
          .eq("status", "PENDING")
      )
      .collect()
      .then((rows) => rows.find((r) => r.match === match));
    if (duplicate) {
      return { resultId: duplicate._id, status: "PENDING", created: false };
    }

    const resultId = await ctx.db.insert("rallyResults", {
      rallyId: args.rallyId,
      userId: args.userId,
      match,
      score: args.score,
      opponent: args.opponent?.trim() || undefined,
      evidenceStorageId: args.evidenceStorageId || undefined,
      status: "PENDING",
      submittedAt: Date.now(),
    });

    // Notify the organizer a result is pending review.
    if (rally.creatorId.toString() !== args.userId.toString()) {
      try {
        const user = await ctx.db.get(args.userId);
        await notify(
          ctx,
          rally.creatorId,
          "result_submitted",
          "Result submitted",
          `${user?.name || "A participant"} submitted a result for "${rally.title}".`,
          args.rallyId
        );
      } catch {
        // best-effort
      }
    }

    return { resultId, status: "PENDING", created: true };
  },
});

export const approveResult = mutation({
  args: {
    resultId: v.id("rallyResults"),
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Result not found");
    const allowed = await isOrganizer(ctx, args.rallyId, args.requestingUserId);
    if (!allowed) throw new Error("Only the organizer can approve results");
    if (result.status !== "PENDING") {
      throw new Error("This result is no longer pending");
    }
    await ctx.db.patch(args.resultId, {
      status: "APPROVED",
      organizerNote: args.note?.trim() || undefined,
      decidedAt: Date.now(),
      decidedBy: args.requestingUserId,
    });
    try {
      await notify(
        ctx,
        result.userId,
        "result_approved",
        "Result approved",
        "Your submitted result was approved.",
        args.rallyId
      );
    } catch {}
    return { status: "APPROVED" };
  },
});

export const rejectResult = mutation({
  args: {
    resultId: v.id("rallyResults"),
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Result not found");
    const allowed = await isOrganizer(ctx, args.rallyId, args.requestingUserId);
    if (!allowed) throw new Error("Only the organizer can reject results");
    if (result.status !== "PENDING") {
      throw new Error("This result is no longer pending");
    }
    await ctx.db.patch(args.resultId, {
      status: "REJECTED",
      organizerNote: args.note?.trim() || undefined,
      decidedAt: Date.now(),
      decidedBy: args.requestingUserId,
    });
    try {
      await notify(
        ctx,
        result.userId,
        "result_rejected",
        "Result rejected",
        args.note ? `Your result was rejected: ${args.note}` : "Your result was rejected.",
        args.rallyId
      );
    } catch {}
    return { status: "REJECTED" };
  },
});

export const getResults = query({
  args: {
    rallyId: v.id("rallies"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("rallyResults")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .order("desc")
      .collect();
    const isOrg = args.viewerId
      ? await isOrganizer(ctx, args.rallyId, args.viewerId)
      : false;
    const cache: Record<string, any> = {};

    const visible = rows.filter((r) => {
      if (r.status === "APPROVED") return true;
      if (isOrg) return true;
      return args.viewerId && r.userId.toString() === args.viewerId.toString();
    });

    const out = [];
    for (const r of visible) {
      const user = await resolveUserCard(ctx, cache, r.userId);
      let evidenceUrl: string | undefined;
      if (r.evidenceStorageId && !r.evidenceStorageId.startsWith("http")) {
        try {
          evidenceUrl = (await ctx.storage.getUrl(r.evidenceStorageId)) || undefined;
        } catch {}
      }
      out.push({ ...r, user, evidenceUrl });
    }
    return out;
  },
});

export const getLeaderboard = query({
  args: {
    rallyId: v.id("rallies"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const rally = await getRallyOrThrow(ctx, args.rallyId);
    const official = await ctx.db
      .query("rallyResults")
      .withIndex("by_rally", (q) =>
        q.eq("rallyId", args.rallyId).eq("status", "APPROVED")
      )
      .collect();

    const cache: Record<string, any> = {};
    const byUser = new Map<string, { userId: string; score: number; matches: number }>();
    for (const r of official) {
      const key = r.userId.toString();
      const cur = byUser.get(key) || { userId: key, score: 0, matches: 0 };
      // Scoring model: sum_scores (default) — each approved result adds its score.
      cur.score += r.score;
      cur.matches += 1;
      byUser.set(key, cur);
    }

    const entries = [];
    for (const { userId, score, matches } of byUser.values()) {
      if (args.viewerId && (await blockedUserIds(ctx, args.viewerId)).has(userId)) continue;
      const user = await resolveUserCard(ctx, cache, userId);
      if (!user) continue;
      entries.push({ user, score, matches });
    }
    // Sort by score desc, then number of matches as a tiebreaker.
    entries.sort((a, b) => b.score - a.score || b.matches - a.matches);
    return { scoring: rally.scoring || "sum_scores", entries };
  },
});

// ===========================================================================
// Announcements (official organizer updates)
// ===========================================================================

export const createAnnouncement = mutation({
  args: {
    rallyId: v.id("rallies"),
    authorId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const rally = await getRallyOrThrow(ctx, args.rallyId);
    if (rally.creatorId.toString() !== args.authorId.toString()) {
      throw new Error("Only the organizer can publish official updates");
    }
    const text = args.text.trim();
    if (!text) throw new Error("Update text is required");

    await ctx.db.insert("rallyAnnouncements", {
      rallyId: args.rallyId,
      authorId: args.authorId,
      text,
      createdAt: Date.now(),
    });

    // Notify participants + followers (best-effort, once each).
    const participantRows = await ctx.db
      .query("rallyParticipants")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect();
    const followerRows = await ctx.db
      .query("rallyFollowers")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect();
    const rsvpRows = await ctx.db
      .query("rsvps")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect();
    const targets = new Map<string, any>();
    for (const p of participantRows) if (p.userId.toString() !== args.authorId.toString()) targets.set(p.userId.toString(), p.userId);
    for (const f of followerRows) if (f.userId.toString() !== args.authorId.toString()) targets.set(f.userId.toString(), f.userId);
    for (const r of rsvpRows) if (r.userId.toString() !== args.authorId.toString()) targets.set(r.userId.toString(), r.userId);
    for (const targetId of targets.values()) {
      try {
        await ctx.db.insert("notifications", {
          userId: targetId,
          type: "event_update",
          title: "Official update",
          body: `${rally.title}: ${text.slice(0, 90)}`,
          rallyId: args.rallyId,
          read: false,
          createdAt: Date.now(),
        });
      } catch {}
    }
    return { created: true };
  },
});

export const listAnnouncements = query({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("rallyAnnouncements")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .order("desc")
      .collect();
    const cache: Record<string, any> = {};
    const out = [];
    for (const a of rows) {
      const author = await resolveUserCard(ctx, cache, a.authorId);
      out.push({ ...a, author });
    }
    return out;
  },
});

export const deleteAnnouncement = mutation({
  args: {
    announcementId: v.id("rallyAnnouncements"),
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const a = await ctx.db.get(args.announcementId);
    if (!a) return { deleted: false };
    const allowed = await isOrganizer(ctx, args.rallyId, args.requestingUserId);
    if (!allowed) throw new Error("Only the organizer can delete updates");
    await ctx.db.delete(args.announcementId);
    return { deleted: true };
  },
});

// ===========================================================================
// Organizer event controls
// ===========================================================================

export const updateEventStatus = mutation({
  args: {
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"),
    status: RALLY_STATUSES,
  },
  handler: async (ctx, args) => {
    const rally = await getRallyOrThrow(ctx, args.rallyId);
    if (rally.creatorId.toString() !== args.requestingUserId.toString()) {
      throw new Error("Only the organizer can change RALLY status");
    }
    await ctx.db.patch(args.rallyId, { status: args.status });
    if (args.status === "LIVE") {
      try {
        await ctx.db.insert("notifications", {
          userId: args.requestingUserId,
          type: "event_status",
          title: "Event is live",
          body: `"${rally.title}" is now LIVE.`,
          rallyId: args.rallyId,
          read: false,
          createdAt: Date.now(),
        });
      } catch {}
    }
    return { status: args.status };
  },
});

export const updateEventProfile = mutation({
  args: {
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    time: v.optional(v.string()),
    endTime: v.optional(v.string()),
    city: v.optional(v.string()),
    locationLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rally = await getRallyOrThrow(ctx, args.rallyId);
    if (rally.creatorId.toString() !== args.requestingUserId.toString()) {
      throw new Error("Only the organizer can update event information");
    }
    const patch: Record<string, unknown> = {};
    for (const k of ["title", "description", "eventDate", "time", "endTime", "city", "locationLabel"]) {
      if (args[k as keyof typeof args] !== undefined) {
        patch[k] = args[k as keyof typeof args];
      }
    }
    if (Object.keys(patch).length) await ctx.db.patch(args.rallyId, patch);
    return { updated: true };
  },
});
