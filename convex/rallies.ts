import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isStorageId(id?: string | null): boolean {
  return Boolean(id && !id.startsWith("http"));
}

async function resolveStorageUrl(
  ctx: any,
  cache: Record<string, string | undefined>,
  id: string
): Promise<string | undefined> {
  if (!(id in cache)) {
    try {
      cache[id] = (await ctx.storage.getUrl(id)) ?? undefined;
    } catch {
      cache[id] = undefined;
    }
  }
  return cache[id];
}

/**
 * Build the playable media URL for a rally.
 * Prefers a Mux playback id (video is transcoded/streamed by Mux); falls back
 * to Convex storage for images/legacy files; otherwise uses an external URL.
 */
async function resolveMediaUrl(
  ctx: any,
  cache: Record<string, string | undefined>,
  rally: any
): Promise<string | undefined> {
  if (rally.muxPlaybackId) {
    // MP4 rendition: plays natively in <video> across iOS/Android WebView and
    // all desktop browsers without needing an HLS player (hls.js).
    return `https://stream.mux.com/${rally.muxPlaybackId}/high.mp4`;
  }
  if (isStorageId(rally.mediaStorageId)) {
    return await resolveStorageUrl(ctx, cache, rally.mediaStorageId);
  }
  return rally.mediaUrl;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("rallies")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .order("desc")
      .collect();
  },
});

export const listWithCreators = query({
  args: {
    userId: v.optional(v.id("users")),
    // Phase 1 feed eligibility args:
    // - userInterests: the viewer's interests array for Interest Post matching
    // - followingIds: the IDs of users the viewer follows (for Normal Post visibility)
    userInterests: v.optional(v.array(v.string())),
    followingIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const rallies = await ctx.db
      .query("rallies")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .order("desc")
      .collect();

    const creatorIds = [...new Set(rallies.map((r) => r.creatorId))];
    const creators: Record<string, any> = {};
    for (const id of creatorIds) {
      const user = await ctx.db.get(id);
      if (user) {
        creators[id] = {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          isNINVerified: user.isNINVerified,
          badges: user.badges,
        };
      }
    }

    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};

    const followingSet = new Set((args.followingIds ?? []).map((id) => id.toString()));
    const viewerInterests = new Set(
      (args.userInterests ?? []).map((i) => i.toLowerCase().trim())
    );

    // Phase 2: resolve the IDs of users the viewer has blocked so their
    // content (posts and RALLYs) is excluded from the feed.
    let viewerBlockedDbIds = new Map<string, string>();
    if (args.userId) {
      const viewer = await ctx.db.get(args.userId);
      if (viewer) {
        viewerBlockedDbIds = new Map(
          (viewer.blockedUsers ?? []).map((b) => [b.id, b.id])
        );
      }
    }

    const results = await Promise.all(
      rallies.map(async (rally) => {
        // ---------------------------------------------------------------
        // Phase 1 feed eligibility filter
        //
        // Rule A — RALLY types (ASK/HELP/JOIN/EVENT): always eligible.
        //   Location filtering happens client-side (haversineDistance).
        //
        // Rule B — POST type WITHOUT interest: "Normal Post"
        //   Eligible when:
        //     (a) viewer is the creator, OR
        //     (b) creator is in viewer's following list, OR
        //     (c) location filtering will handle local visibility
        //   → always include; client applies location filter same as RALLYs.
        //
        // Rule C — POST type WITH interest: "Interest Post"
        //   Eligible ONLY when viewer's interests include the post's interest.
        //   Following does NOT bypass this check.
        //   Location does NOT restrict this post type.
        //   Exception: the creator always sees their own posts.
        //   Exception: when no userInterests provided (unauthenticated), skip.
        // ---------------------------------------------------------------
        const isPostType = rally.type === "POST";
        const isInterestPost = isPostType && Boolean(rally.interest);

        if (isInterestPost && args.userId) {
          const postInterest = (rally.interest ?? "").toLowerCase().trim();
          const isOwnPost = args.userId.toString() === rally.creatorId.toString();
          const viewerHasInterest = viewerInterests.has(postInterest);
          if (!isOwnPost && !viewerHasInterest) {
            // Viewer doesn't share this interest — exclude from feed.
            return null;
          }
        }

        // Phase 2: hide content created by anyone the viewer has blocked.
        if (viewerBlockedDbIds.has(rally.creatorId.toString())) {
          return null;
        }

        // Resolve media URL
        const mediaUrl = await resolveMediaUrl(ctx, mediaCache, rally);

        // Resolve creator avatar
        const creator = rally.creatorId in creators ? creators[rally.creatorId] : null;
        let avatar = creator?.avatar || "";
        if (creator && isStorageId(avatar)) {
          avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
        }
        const resolvedCreator = creator ? { ...creator, avatar } : null;

        // Engagement counts
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
          .collect();
        const commentsCount = (
          await ctx.db
            .query("comments")
            .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
            .collect()
        ).length;
        const rsvps = await ctx.db
          .query("rsvps")
          .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
          .collect();

        const isLiked = args.userId
          ? likes.some((l) => l.userId === args.userId)
          : false;
        const isRsvpd = args.userId
          ? rsvps.some((r) => r.userId === args.userId)
          : false;

        // Event-posts-in-feed: if this rally/post is linked to an EVENT, surface
        // its title so the feed card can render a clickable association.
        let linkedEvent: string | undefined;
        if (rally.rallyLinkId) {
          const linked = await ctx.db.get(rally.rallyLinkId);
          linkedEvent = linked?.title;
        }

        return {
          ...rally,
          mediaUrl,
          creator: resolvedCreator,
          linkedEvent,
          likesCount: likes.length,
          commentsCount,
          rsvpsCount: rsvps.length,
          isLiked,
          isRsvpd,
        };
      })
    );

    // Remove nulls (Interest Posts filtered out above)
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

/**
 * Phase 2: distinct interest tags currently in use, with post counts.
 * Powers the Explore "Interests" discovery surface.
 */
export const listInterests = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const rallies = await ctx.db
      .query("rallies")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .collect();

    const counts = new Map<string, number>();
    let viewerBlocked = new Set<string>();
    if (args.userId) {
      const viewer = await ctx.db.get(args.userId);
      if (viewer) {
        viewerBlocked = new Set((viewer.blockedUsers ?? []).map((b) => b.id));
      }
    }

    for (const r of rallies) {
      if (viewerBlocked.has(r.creatorId.toString())) continue;
      if (!r.interest) continue;
      const label = r.interest.trim();
      if (!label) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  },
});

/**
 * Phase 2: posts tagged with a specific interest, with full creator/engagement
 * resolution (same shape as listWithCreators). Used by the interest page.
 * Only ACTIVE status is returned and viewer-blocked creators are excluded.
 */
export const listByInterest = query({
  args: {
    interest: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const rallies = await ctx.db
      .query("rallies")
      .withIndex("by_interest", (q) => q.eq("interest", args.interest.toLowerCase()))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .order("desc")
      .collect();

    const creatorIds = [...new Set(rallies.map((r) => r.creatorId))];
    const creators: Record<string, any> = {};
    for (const id of creatorIds) {
      const user = await ctx.db.get(id);
      if (user) {
        creators[id] = {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          isNINVerified: user.isNINVerified,
          badges: user.badges,
        };
      }
    }

    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};

    let blockedSet = new Set<string>();
    if (args.userId) {
      const viewer = await ctx.db.get(args.userId);
      if (viewer) {
        blockedSet = new Set((viewer.blockedUsers ?? []).map((b) => b.id));
      }
    }

    const results = await Promise.all(
      rallies.map(async (rally) => {
        if (blockedSet.has(rally.creatorId.toString())) return null;

        const mediaUrl = await resolveMediaUrl(ctx, mediaCache, rally);

        const creator = rally.creatorId in creators ? creators[rally.creatorId] : null;
        let avatar = creator?.avatar || "";
        if (creator && isStorageId(avatar)) {
          avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
        }
        const resolvedCreator = creator ? { ...creator, avatar } : null;

        const likes = await ctx.db
          .query("likes")
          .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
          .collect();
        const commentsCount = (
          await ctx.db
            .query("comments")
            .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
            .collect()
        ).length;
        const rsvps = await ctx.db
          .query("rsvps")
          .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
          .collect();

        const isLiked = args.userId ? likes.some((l) => l.userId === args.userId) : false;
        const isRsvpd = args.userId ? rsvps.some((r) => r.userId === args.userId) : false;

        return {
          ...rally,
          mediaUrl,
          creator: resolvedCreator,
          likesCount: likes.length,
          commentsCount,
          rsvpsCount: rsvps.length,
          isLiked,
          isRsvpd,
        };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

/**
 * Returns all rallies created by a specific user, with resolved storage URLs
 * and engagement counts — same shape as listWithCreators.
 */
export const listByCreator = query({
  args: { creatorId: v.id("users"), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const rallies = await ctx.db
      .query("rallies")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .order("desc")
      .collect();

    const creator = await ctx.db.get(args.creatorId);
    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};

    // Resolve creator avatar once
    let resolvedCreatorAvatar = creator?.avatar || "";
    if (creator && isStorageId(resolvedCreatorAvatar)) {
      resolvedCreatorAvatar =
        (await resolveStorageUrl(ctx, avatarCache, resolvedCreatorAvatar)) || "";
    }
    const resolvedCreator = creator
      ? {
          _id: creator._id,
          name: creator.name,
          username: creator.username,
          avatar: resolvedCreatorAvatar,
          isNINVerified: creator.isNINVerified,
          badges: creator.badges,
        }
      : null;

    return await Promise.all(
      rallies.map(async (rally) => {
        // Resolve media URL
        const mediaUrl = await resolveMediaUrl(ctx, mediaCache, rally);

        // Engagement counts
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
          .collect();
        const commentsCount = (
          await ctx.db
            .query("comments")
            .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
            .collect()
        ).length;
        const rsvps = await ctx.db
          .query("rsvps")
          .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
          .collect();

        const viewerId = args.userId ?? args.creatorId;
        const isLiked = likes.some((l) => l.userId === viewerId);
        const isRsvpd = rsvps.some((r) => r.userId === viewerId);

        return {
          ...rally,
          mediaUrl,
          creator: resolvedCreator,
          likesCount: likes.length,
          commentsCount,
          rsvpsCount: rsvps.length,
          isLiked,
          isRsvpd,
        };
      })
    );
  },
});

/**
 * Event hub: Posts linked to a specific RALLY (rallyLinkId), resolved with
 * creator + engagement, newest first. Powers the RALLY detail "Event Posts" tab
 * and is discoverable by participants, followers and interest-matched users.
 */
export const getEventPosts = query({
  args: {
    rallyId: v.id("rallies"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("rallies")
      .withIndex("by_rally_link", (q) => q.eq("rallyLinkId", args.rallyId))
      .filter((q) => q.eq(q.field("type"), "POST"))
      .order("desc")
      .collect();

    const creatorIds = [...new Set(posts.map((p) => p.creatorId))];
    const creators: Record<string, any> = {};
    for (const id of creatorIds) {
      const user = await ctx.db.get(id);
      if (user) {
        creators[id] = {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          isNINVerified: user.isNINVerified,
          badges: user.badges,
        };
      }
    }

    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};

    const blocked = new Set<string>();
    if (args.viewerId) {
      const viewer = await ctx.db.get(args.viewerId);
      (viewer?.blockedUsers || []).forEach((b) => blocked.add(b.id));
    }

    const results = await Promise.all(
      posts.map(async (post) => {
        if (blocked.has(post.creatorId.toString())) return null;
        const mediaUrl = await resolveMediaUrl(ctx, mediaCache, post);
        const creator = post.creatorId in creators ? creators[post.creatorId] : null;
        let avatar = creator?.avatar || "";
        if (creator && isStorageId(avatar)) {
          avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
        }
        const resolvedCreator = creator ? { ...creator, avatar } : null;

        const likes = await ctx.db
          .query("likes")
          .withIndex("by_rally", (q) => q.eq("rallyId", post._id))
          .collect();
        const commentsCount = (
          await ctx.db
            .query("comments")
            .withIndex("by_rally", (q) => q.eq("rallyId", post._id))
            .collect()
        ).length;
        const rsvps = await ctx.db
          .query("rsvps")
          .withIndex("by_rally", (q) => q.eq("rallyId", post._id))
          .collect();

        const isLiked = args.viewerId
          ? likes.some((l) => l.userId === args.viewerId)
          : false;
        const isRsvpd = args.viewerId
          ? rsvps.some((r) => r.userId === args.viewerId)
          : false;

        return {
          ...post,
          mediaUrl,
          creator: resolvedCreator,
          likesCount: likes.length,
          commentsCount,
          rsvpsCount: rsvps.length,
          isLiked,
          isRsvpd,
        };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const listByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rallies")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.rallyId);
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    // All five post types are supported
    type: v.union(
      v.literal("ASK"),
      v.literal("HELP"),
      v.literal("JOIN"),
      v.literal("EVENT"),
      v.literal("POST")
    ),
    title: v.string(),
    description: v.string(),
    distance: v.number(),
    time: v.string(),
    peopleNeeded: v.number(),
    isPaid: v.boolean(),
    price: v.optional(v.number()),
    creatorId: v.id("users"),
    // Event hub: optional pre-configured event tag; auto-generated if absent.
    eventTag: v.optional(v.string()),
    city: v.optional(v.string()),
    locationLabel: v.optional(v.string()),
    rallyLatitude: v.optional(v.number()),
    rallyLongitude: v.optional(v.number()),
    category: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    eventDate: v.optional(v.string()),
    endTime: v.optional(v.string()),
    capacity: v.optional(v.number()),
    // Media: provide storageId (preferred) or a fallback external URL
    mediaStorageId: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    // Mux video: for video uploads the client creates a Mux direct upload
    // first and passes the uploadId here. The playbackId is attached later by
    // saveMuxResult once Mux finishes transcoding.
    muxUploadId: v.optional(v.string()),
    // Phase 1: interest tag for POST type (makes it an Interest Post)
    interest: v.optional(v.string()),
    // Event hub (POST type): link this Post to a RALLY event.
    rallyLinkId: v.optional(v.id("rallies")),
    // Event hub (RALLY types): event-level interests + scoring model.
    interests: v.optional(v.array(v.string())),
    scoring: v.optional(
      v.union(
        v.literal("sum_scores"),
        v.literal("matches_won"),
        v.literal("total_points")
      )
    ),
  },
  handler: async (ctx, args) => {
    const normalizedHashtags = (args.hashtags || [])
      .map((h) => h.toLowerCase().replace(/^#/, "").trim())
      .filter((h) => h.length > 0);
    const uniqueHashtags = [...new Set(normalizedHashtags)];

    // Event Hub / LALOA Pro: creating an EVENT requires Pro (server-side gate).
    if (args.type === "EVENT") {
      const creator = await ctx.db.get(args.creatorId);
      if (!creator?.isPro) {
        throw new Error(
          "Creating an Event requires LALOA Pro. Upgrade to create events."
        );
      }
    }

    // Event hub: generate a unique event tag for RALLY types (not Posts).
    const isRallyType = args.type !== "POST";
    let eventTag = args.eventTag;
    if (isRallyType && !eventTag) {
      const base = args.title
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join("");
      if (base) eventTag = `#${base}`;
    }

    const rallyId = await ctx.db.insert("rallies", {
      ...args,
      // Only store interest on POST type; clear it for RALLY types to keep data clean
      interest: args.type === "POST" && args.interest ? args.interest.toLowerCase().trim() : undefined,
      // Event tag only meaningful on RALLY types
      eventTag: isRallyType && eventTag ? eventTag.toLowerCase() : undefined,
      // rallyLinkId only meaningful on POST type
      rallyLinkId: args.type === "POST" ? args.rallyLinkId : undefined,
      // Rally-level interests normalize to lowercase
      interests:
        !isRallyType && args.interests
          ? undefined
          : (args.interests || []).map((i) => i.toLowerCase().trim()).filter(Boolean),
      hashtags: uniqueHashtags.length > 0 ? uniqueHashtags : undefined,
      peopleInterested: 0,
      status: "ACTIVE",
      createdAt: Date.now(),
    });

    // Event hub: the organizer is automatically the first participant.
    if (isRallyType) {
      try {
        await ctx.db.insert("rallyParticipants", {
          rallyId,
          userId: args.creatorId,
          role: "organizer",
          joinedAt: Date.now(),
        });
      } catch {
        // Non-fatal: organizer may already be a participant
      }
    }

    if (args.city) {
      try {
        await ctx.runMutation(api.notifications.notifyNearbyUsers, {
          rallyId,
          rallyTitle: args.title,
          rallyType: args.type,
          creatorId: args.creatorId,
          city: args.city,
        });
      } catch {
        // Non-fatal: notifications are best-effort
      }
    }

    return rallyId;
  },
});

/**
 * Attach the Mux asset/playback ids to a rally once Mux finishes transcoding a
 * video. The client calls this after polling /api/mux/status reaches "ready".
 * Only the creator may update their own rally's Mux result.
 */
export const saveMuxResult = mutation({
  args: {
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"),
    assetId: v.string(),
    playbackId: v.string(),
  },
  handler: async (ctx, args) => {
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("Rally not found");
    if (rally.creatorId.toString() !== args.requestingUserId.toString()) {
      throw new Error("Not authorised: you can only update your own posts");
    }
    await ctx.db.patch(args.rallyId, {
      muxAssetId: args.assetId,
      muxPlaybackId: args.playbackId,
      mediaType: "video",
    });
  },
});

export const updateStatus = mutation({
  args: {
    rallyId: v.id("rallies"),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rallyId, { status: args.status });
  },
});

export const incrementInterested = mutation({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) return;
    await ctx.db.patch(args.rallyId, {
      peopleInterested: rally.peopleInterested + 1,
    });
  },
});

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

export const toggleLike = mutation({
  args: { rallyId: v.id("rallies"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_rally", (q) =>
        q.eq("userId", args.userId).eq("rallyId", args.rallyId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      await ctx.db.insert("likes", {
        userId: args.userId,
        rallyId: args.rallyId,
        createdAt: Date.now(),
      });
      return { liked: true };
    }
  },
});

// ---------------------------------------------------------------------------
// RSVP — capacity is enforced server-side
// ---------------------------------------------------------------------------

export const toggleRsvp = mutation({
  args: { rallyId: v.id("rallies"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("Rally not found");

    const existing = await ctx.db
      .query("rsvps")
      .withIndex("by_user_rally", (q) =>
        q.eq("userId", args.userId).eq("rallyId", args.rallyId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      // Phase 3: notify the creator that a participant left.
      try {
        const user: any = await ctx.db.get(args.userId);
        await ctx.runMutation(api.notifications.create, {
          userId: rally.creatorId,
          type: "rally_participant_left",
          title: "Participant left",
          body: `${user?.name || "Someone"} left "${rally.title}".`,
          rallyId: args.rallyId,
        });
      } catch {
        // best-effort
      }
      return { rsvpd: false };
    } else {
      // Enforce capacity atomically on the server
      if (rally.capacity && rally.capacity > 0) {
        const currentRsvps = await ctx.db
          .query("rsvps")
          .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
          .collect();
        if (currentRsvps.length >= rally.capacity) {
          throw new Error("This event is at full capacity");
        }
      }
      await ctx.db.insert("rsvps", {
        userId: args.userId,
        rallyId: args.rallyId,
        createdAt: Date.now(),
      });
      // Phase 3: notify the creator that a participant joined.
      try {
        const user: any = await ctx.db.get(args.userId);
        await ctx.runMutation(api.notifications.create, {
          userId: rally.creatorId,
          type: "rally_participant_joined",
          title: "New participant",
          body: `${user?.name || "Someone"} joined "${rally.title}".`,
          rallyId: args.rallyId,
        });
      } catch {
        // best-effort
      }
      return { rsvpd: true };
    }
  },
});

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const addComment = mutation({
  args: {
    rallyId: v.id("rallies"),
    userId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.text.trim()) throw new Error("Comment cannot be empty");
    const commentId = await ctx.db.insert("comments", {
      userId: args.userId,
      rallyId: args.rallyId,
      text: args.text.trim(),
      createdAt: Date.now(),
    });
    return commentId;
  },
});

export const getComments = query({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .order("asc")
      .collect();

    const avatarCache: Record<string, string | undefined> = {};

    return await Promise.all(
      comments.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        let avatar = user?.avatar || "";
        if (avatar && isStorageId(avatar)) {
          avatar =
            (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
        }
        return {
          ...c,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                avatar,
              }
            : null,
        };
      })
    );
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) return;
    if (comment.userId !== args.userId) throw new Error("Not your comment");
    await ctx.db.delete(args.commentId);
  },
});

// ---------------------------------------------------------------------------
// Delete Rally — server-side ownership enforced
// ---------------------------------------------------------------------------

export const deleteRally = mutation({
  args: {
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("Rally not found");

    // Ownership check — server-side, not bypassable from the client.
    // Use .toString() comparison: Convex Id values are not reference-equal
    // across deserialization boundaries, so === would always return false and
    // every delete attempt would throw "Not authorised" — even for the owner.
    if (rally.creatorId.toString() !== args.requestingUserId.toString()) {
      throw new Error("Not authorised: you can only delete your own posts");
    }

    // 1. Delete all likes for this rally
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // 2. Delete all comments for this rally
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // 3. Delete all RSVPs for this rally
    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect();
    for (const rsvp of rsvps) {
      await ctx.db.delete(rsvp._id);
    }

    // 4. Delete notifications that reference this rally.
    // Use the by_rally index (defined in schema) — avoids a full table scan
    // that would hit Convex's per-mutation document-read limit on large datasets.
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId))
      .collect();
    for (const notif of notifications) {
      await ctx.db.delete(notif._id);
    }

    // 5. Clean up storage file if exclusively owned by this rally
    if (rally.mediaStorageId && isStorageId(rally.mediaStorageId)) {
      try {
        await ctx.storage.delete(rally.mediaStorageId as any);
      } catch {
        // Non-fatal: file may already be gone or shared
      }
    }

    // 6. Finally delete the rally record itself
    await ctx.db.delete(args.rallyId);
  },
});

// ---------------------------------------------------------------------------
// Profile statistics — derived live from source records
// ---------------------------------------------------------------------------

export const getProfileStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Posted: all rallies created by this user (any status)
    const allCreated = await ctx.db
      .query("rallies")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();

    const posted = allCreated.length;

    // Completed: creator's rallies with COMPLETED status
    const completed = allCreated.filter((r) => r.status === "COMPLETED").length;

    // Rated: number of ratings THIS user has submitted (ratings given, not received)
    const ratingsGiven = await ctx.db
      .query("ratings")
      .withIndex("by_rater", (q) => q.eq("raterId", args.userId))
      .collect();

    const rated = ratingsGiven.length;

    return { posted, completed, rated };
  },
});

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export const submitRating = mutation({
  args: {
    raterId: v.id("users"),
    ratedUserId: v.id("users"),
    rallyId: v.optional(v.id("rallies")),
    score: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.raterId === args.ratedUserId) {
      throw new Error("You cannot rate yourself");
    }
    if (args.score < 1 || args.score > 5) {
      throw new Error("Score must be between 1 and 5");
    }

    // One rating per rater per rated user (update if exists)
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_rater_rated", (q) =>
        q.eq("raterId", args.raterId).eq("ratedUserId", args.ratedUserId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        review: args.review,
        createdAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("ratings", {
      raterId: args.raterId,
      ratedUserId: args.ratedUserId,
      rallyId: args.rallyId,
      score: args.score,
      review: args.review,
      createdAt: Date.now(),
    });
  },
});
