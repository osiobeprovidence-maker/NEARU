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
  args: { userId: v.optional(v.id("users")) },
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

    return await Promise.all(
      rallies.map(async (rally) => {
        // Resolve media URL
        let mediaUrl = rally.mediaUrl;
        if (isStorageId(rally.mediaStorageId)) {
          mediaUrl = await resolveStorageUrl(ctx, mediaCache, rally.mediaStorageId!);
        }

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
        let mediaUrl = rally.mediaUrl;
        if (isStorageId(rally.mediaStorageId)) {
          mediaUrl = await resolveStorageUrl(ctx, mediaCache, rally.mediaStorageId!);
        }

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
  },
  handler: async (ctx, args) => {
    const normalizedHashtags = (args.hashtags || [])
      .map((h) => h.toLowerCase().replace(/^#/, "").trim())
      .filter((h) => h.length > 0);
    const uniqueHashtags = [...new Set(normalizedHashtags)];

    const rallyId = await ctx.db.insert("rallies", {
      ...args,
      hashtags: uniqueHashtags.length > 0 ? uniqueHashtags : undefined,
      peopleInterested: 0,
      status: "ACTIVE",
      createdAt: Date.now(),
    });

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
