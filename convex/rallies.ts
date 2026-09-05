import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthenticatedUser } from "./lib/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isStorageId(id?: string | null): boolean {
  return Boolean(
    id &&
      typeof id === "string" &&
      !id.startsWith("http") &&
      !id.startsWith("/") &&
      !id.startsWith("data:") &&
      !id.startsWith("blob:")
  );
}

function extractStorageId(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  if (isStorageId(trimmed)) return trimmed;
  const match = trimmed.match(/\/api\/storage\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return null;
}

async function resolveStorageUrl(
  ctx: any,
  cache: Record<string, string | undefined>,
  id: string
): Promise<string | undefined> {
  const sid = extractStorageId(id);
  if (!sid) return id || undefined;
  if (!(sid in cache)) {
    try {
      cache[sid] = (await ctx.storage.getUrl(sid as any)) ?? undefined;
    } catch {
      cache[sid] = undefined;
    }
  }
  return cache[sid];
}

async function resolveMediaUrl(
  ctx: any,
  cache: Record<string, string | undefined>,
  rally: any
): Promise<string | undefined> {
  // 1. Mux playback ID if transcoded
  if (rally.muxPlaybackId) {
    return `https://stream.mux.com/${rally.muxPlaybackId}/high.mp4`;
  }
  // 2. Direct Convex storage ID
  if (rally.mediaStorageId) {
    const url = await resolveStorageUrl(ctx, cache, rally.mediaStorageId);
    if (url) return url;
  }
  // 3. Fallback to mediaUrl
  if (rally.mediaUrl) {
    const url = await resolveStorageUrl(ctx, cache, rally.mediaUrl);
    if (url) return url;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Storage upload — requires auth
// ---------------------------------------------------------------------------

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// ---------------------------------------------------------------------------
// Queries — read-only, no auth required
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
        creators[id] = { _id: user._id, name: user.name, username: user.username, avatar: user.avatar, isNINVerified: user.isNINVerified, badges: user.badges, accountType: user.accountType || "personal", organizationName: user.organizationName, isPro: user.isPro ?? false };
      }
    }

    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};
    const followingSet = new Set((args.followingIds ?? []).map((id) => id.toString()));
    const viewerInterests = new Set((args.userInterests ?? []).map((i) => i.toLowerCase().trim()));

    let viewerBlockedDbIds = new Map<string, string>();
    if (args.userId) {
      const viewer = await ctx.db.get(args.userId);
      if (viewer) {
        viewerBlockedDbIds = new Map((viewer.blockedUsers ?? []).map((b) => [b.id, b.id]));
      }
    }

    const results = await Promise.all(
      rallies.map(async (rally) => {
        const isPostType = rally.type === "POST";
        const isInterestPost = isPostType && Boolean(rally.interest);
        if (isInterestPost && args.userId) {
          const postInterest = (rally.interest ?? "").toLowerCase().trim();
          const isOwnPost = args.userId.toString() === rally.creatorId.toString();
          const viewerHasInterest = viewerInterests.has(postInterest);
          if (!isOwnPost && !viewerHasInterest) return null;
        }
        if (viewerBlockedDbIds.has(rally.creatorId.toString())) return null;

        const mediaUrl = await resolveMediaUrl(ctx, mediaCache, rally);
        const creator = rally.creatorId in creators ? creators[rally.creatorId] : null;
        let avatar = creator?.avatar || "";
        if (creator && isStorageId(avatar)) {
          avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
        }
        const resolvedCreator = creator ? { ...creator, avatar } : null;

        let pageAuthor = null;
        if (rally.authorType === "page" && rally.pageId) {
          const page = await ctx.db.get(rally.pageId);
          if (page) {
            let pageAvatar = page.avatar || "";
            if (pageAvatar && isStorageId(pageAvatar)) {
              pageAvatar = (await resolveStorageUrl(ctx, avatarCache, pageAvatar)) || "";
            }
            pageAuthor = {
              _id: page._id,
              name: page.name,
              slug: page.slug,
              avatar: pageAvatar,
              category: page.category,
              isVerified: page.isVerified,
            };
          }
        }

        const likes = await ctx.db.query("likes").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();
        const commentsCount = (await ctx.db.query("comments").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect()).length;
        const rsvps = await ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();

        const isLiked = args.userId ? likes.some((l) => l.userId === args.userId) : false;
        const isRsvpd = args.userId ? rsvps.some((r) => r.userId === args.userId) : false;

        let linkedEvent: string | undefined;
        if (rally.rallyLinkId) {
          const linked = await ctx.db.get(rally.rallyLinkId);
          linkedEvent = linked?.title;
        }

        return { ...rally, mediaUrl, creator: resolvedCreator, pageAuthor, linkedEvent, likesCount: likes.length, commentsCount, rsvpsCount: rsvps.length, isLiked, isRsvpd };
      })
    );
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const listInterests = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const rallies = await ctx.db.query("rallies").withIndex("by_status", (q) => q.eq("status", "ACTIVE")).collect();
    const counts = new Map<string, number>();
    let viewerBlocked = new Set<string>();
    if (args.userId) {
      const viewer = await ctx.db.get(args.userId);
      if (viewer) viewerBlocked = new Set((viewer.blockedUsers ?? []).map((b) => b.id));
    }
    for (const r of rallies) {
      if (viewerBlocked.has(r.creatorId.toString())) continue;
      if (!r.interest) continue;
      const label = r.interest.trim();
      if (!label) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  },
});

export const listByInterest = query({
  args: { interest: v.string(), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const rallies = await ctx.db.query("rallies").withIndex("by_interest", (q) => q.eq("interest", args.interest.toLowerCase())).filter((q) => q.eq(q.field("status"), "ACTIVE")).order("desc").collect();
    const creatorIds = [...new Set(rallies.map((r) => r.creatorId))];
    const creators: Record<string, any> = {};
    for (const id of creatorIds) {
      const user = await ctx.db.get(id);
      if (user) creators[id] = { _id: user._id, name: user.name, username: user.username, avatar: user.avatar, isNINVerified: user.isNINVerified, badges: user.badges, accountType: user.accountType || "personal", organizationName: user.organizationName, isPro: user.isPro ?? false };
    }
    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};
    let blockedSet = new Set<string>();
    if (args.userId) {
      const viewer = await ctx.db.get(args.userId);
      if (viewer) blockedSet = new Set((viewer.blockedUsers ?? []).map((b) => b.id));
    }
    const results = await Promise.all(rallies.map(async (rally) => {
      if (blockedSet.has(rally.creatorId.toString())) return null;
      const mediaUrl = await resolveMediaUrl(ctx, mediaCache, rally);
      const creator = rally.creatorId in creators ? creators[rally.creatorId] : null;
      let avatar = creator?.avatar || "";
      if (creator && isStorageId(avatar)) avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
      const likes = await ctx.db.query("likes").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();
      const commentsCount = (await ctx.db.query("comments").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect()).length;
      const rsvps = await ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();
      return { ...rally, mediaUrl, creator: creator ? { ...creator, avatar } : null, likesCount: likes.length, commentsCount, rsvpsCount: rsvps.length, isLiked: args.userId ? likes.some((l) => l.userId === args.userId) : false, isRsvpd: args.userId ? rsvps.some((r) => r.userId === args.userId) : false };
    }));
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const listByCreator = query({
  args: { creatorId: v.id("users"), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const rallies = await ctx.db.query("rallies").withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId)).order("desc").collect();
    // Strictly isolate personal posts: never return page posts in personal profile
    const personalRallies = rallies.filter((r) => (!r.authorType || r.authorType === "user") && !r.pageId);

    const creator = await ctx.db.get(args.creatorId);
    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};
    let resolvedCreatorAvatar = creator?.avatar || "";
    if (creator && isStorageId(resolvedCreatorAvatar)) resolvedCreatorAvatar = (await resolveStorageUrl(ctx, avatarCache, resolvedCreatorAvatar)) || "";
    const resolvedCreator = creator ? {
      _id: creator._id,
      name: creator.name,
      username: creator.username,
      avatar: resolvedCreatorAvatar,
      isNINVerified: creator.isNINVerified,
      badges: creator.badges,
      accountType: creator.accountType || "personal",
      organizationName: creator.organizationName,
      isPro: creator.isPro ?? false,
    } : null;
    return await Promise.all(personalRallies.map(async (rally) => {
      const mediaUrl = await resolveMediaUrl(ctx, mediaCache, rally);
      const likes = await ctx.db.query("likes").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();
      const commentsCount = (await ctx.db.query("comments").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect()).length;
      const rsvps = await ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();
      const viewerId = args.userId ?? args.creatorId;
      return { ...rally, mediaUrl, creator: resolvedCreator, likesCount: likes.length, commentsCount, rsvpsCount: rsvps.length, isLiked: likes.some((l) => l.userId === viewerId), isRsvpd: rsvps.some((r) => r.userId === viewerId) };
    }));
  },
});

export const listByPage = query({
  args: { pageId: v.id("pages"), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return [];

    const rallies = await ctx.db
      .query("rallies")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .order("desc")
      .collect();

    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};

    let resolvedAvatar = page.avatar || "";
    if (resolvedAvatar && isStorageId(resolvedAvatar)) {
      resolvedAvatar = (await resolveStorageUrl(ctx, avatarCache, resolvedAvatar)) || "";
    }

    const pageAuthor = {
      _id: page._id,
      name: page.name,
      slug: page.slug,
      avatar: resolvedAvatar,
      category: page.category,
      isVerified: page.isVerified,
    };

    const dummyCreator = {
      _id: page._id,
      name: page.name,
      username: page.slug,
      avatar: resolvedAvatar,
      isNINVerified: false,
      badges: [],
      accountType: "organization",
      organizationName: page.name,
      isPro: false,
    };

    return await Promise.all(
      rallies.map(async (rally) => {
        const mediaUrl = await resolveMediaUrl(ctx, mediaCache, rally);
        const likes = await ctx.db.query("likes").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();
        const commentsCount = (await ctx.db.query("comments").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect()).length;
        const rsvps = await ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();
        const viewerId = args.userId;

        return {
          ...rally,
          mediaUrl,
          creator: dummyCreator,
          pageAuthor,
          likesCount: likes.length,
          commentsCount,
          rsvpsCount: rsvps.length,
          isLiked: viewerId ? likes.some((l) => l.userId === viewerId) : false,
          isRsvpd: viewerId ? rsvps.some((r) => r.userId === viewerId) : false,
        };
      })
    );
  },
});

export const getEventPosts = query({
  args: { rallyId: v.id("rallies"), viewerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const posts = await ctx.db.query("rallies").withIndex("by_rally_link", (q) => q.eq("rallyLinkId", args.rallyId)).filter((q) => q.eq(q.field("type"), "POST")).order("desc").collect();
    const creatorIds = [...new Set(posts.map((p) => p.creatorId))];
    const creators: Record<string, any> = {};
    for (const id of creatorIds) {
      const user = await ctx.db.get(id);
      if (user) creators[id] = { _id: user._id, name: user.name, username: user.username, avatar: user.avatar, isNINVerified: user.isNINVerified, badges: user.badges, accountType: user.accountType || "personal", organizationName: user.organizationName, isPro: user.isPro ?? false };
    }
    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};
    const blocked = new Set<string>();
    if (args.viewerId) { const viewer = await ctx.db.get(args.viewerId); (viewer?.blockedUsers || []).forEach((b) => blocked.add(b.id)); }
    const results = await Promise.all(posts.map(async (post) => {
      if (blocked.has(post.creatorId.toString())) return null;
      const mediaUrl = await resolveMediaUrl(ctx, mediaCache, post);
      const creator = post.creatorId in creators ? creators[post.creatorId] : null;
      let avatar = creator?.avatar || "";
      if (creator && isStorageId(avatar)) avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
      const likes = await ctx.db.query("likes").withIndex("by_rally", (q) => q.eq("rallyId", post._id)).collect();
      const commentsCount = (await ctx.db.query("comments").withIndex("by_rally", (q) => q.eq("rallyId", post._id)).collect()).length;
      const rsvps = await ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", post._id)).collect();
      return { ...post, mediaUrl, creator: creator ? { ...creator, avatar } : null, likesCount: likes.length, commentsCount, rsvpsCount: rsvps.length, isLiked: args.viewerId ? likes.some((l) => l.userId === args.viewerId) : false, isRsvpd: args.viewerId ? rsvps.some((r) => r.userId === args.viewerId) : false };
    }));
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const listByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("rallies").withIndex("by_city", (q) => q.eq("city", args.city)).order("desc").collect();
  },
});

export const get = query({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) return null;
    const mediaCache: Record<string, string | undefined> = {};
    const mediaUrl = await resolveMediaUrl(ctx, mediaCache, rally);
    return { ...rally, mediaUrl };
  },
});

export const getProfileStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allCreated = await ctx.db.query("rallies").withIndex("by_creator", (q) => q.eq("creatorId", args.userId)).collect();
    // Exclude page posts: personal profile post counts only count personal posts
    const personalCreated = allCreated.filter((r) => (!r.authorType || r.authorType === "user") && !r.pageId);
    const posted = personalCreated.length;
    const completedCreated = personalCreated.filter((r) => r.status === "COMPLETED").length;
    const userRsvps = await ctx.db.query("rsvps").withIndex("by_user_rally", (q) => q.eq("userId", args.userId)).collect();
    let completedRsvps = 0;
    for (const r of userRsvps) {
      const rally = (await ctx.db.get(r.rallyId)) as any;
      if (rally && rally.status === "COMPLETED" && rally.creatorId !== args.userId) {
        completedRsvps++;
      }
    }
    const completed = completedCreated + completedRsvps;
    const ratingsReceived = await ctx.db.query("ratings").withIndex("by_rated_user", (q) => q.eq("ratedUserId", args.userId)).collect();
    return { posted, completed, rated: ratingsReceived.length };
  },
});

export const listRatingsForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_rated_user", (q) => q.eq("ratedUserId", args.userId))
      .order("desc")
      .collect();

    const avatarCache: Record<string, string | undefined> = {};
    const populated = await Promise.all(
      ratings.map(async (r) => {
        const rater = (await ctx.db.get(r.raterId)) as any;
        let avatar = rater?.avatar || "";
        if (avatar && isStorageId(avatar)) {
          avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
        }
        return {
          _id: r._id,
          raterId: r.raterId,
          ratedUserId: r.ratedUserId,
          rallyId: r.rallyId,
          score: r.score,
          review: r.review,
          createdAt: r.createdAt,
          rater: rater
            ? {
                _id: rater._id,
                name: rater.name,
                username: rater.username,
                avatar,
                isNINVerified: rater.isNINVerified,
                badges: rater.badges,
              }
            : null,
        };
      })
    );

    const total = populated.length;
    const avgScore = total > 0 ? populated.reduce((sum, r) => sum + r.score, 0) / total : 0;
    return {
      ratings: populated,
      averageScore: Number(avgScore.toFixed(1)),
      totalCount: total,
    };
  },
});

export const listCompletedByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const created = await ctx.db
      .query("rallies")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .filter((q) => q.eq(q.field("status"), "COMPLETED"))
      .collect();

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_user_rally", (q) => q.eq("userId", args.userId))
      .collect();

    const rsvpdCompleted: any[] = [];
    for (const r of rsvps) {
      const rally = (await ctx.db.get(r.rallyId)) as any;
      if (rally && rally.status === "COMPLETED" && rally.creatorId !== args.userId) {
        rsvpdCompleted.push(rally);
      }
    }

    const all = [...created, ...rsvpdCompleted].sort((a, b) => b.createdAt - a.createdAt);

    const mediaCache: Record<string, string | undefined> = {};
    const avatarCache: Record<string, string | undefined> = {};

    return await Promise.all(
      all.map(async (rally) => {
        const creator = (await ctx.db.get(rally.creatorId)) as any;
        let avatar = creator?.avatar || "";
        if (creator && isStorageId(avatar)) {
          avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
        }
        const mediaUrl = await resolveMediaUrl(ctx, mediaCache, rally);
        const likes = await ctx.db.query("likes").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();
        const commentsCount = (await ctx.db.query("comments").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect()).length;
        const rsvpList = await ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", rally._id)).collect();

        return {
          ...rally,
          mediaUrl,
          creator: creator
            ? {
                _id: creator._id,
                name: creator.name,
                username: creator.username,
                avatar,
                isNINVerified: creator.isNINVerified,
                badges: creator.badges,
              }
            : null,
          likesCount: likes.length,
          commentsCount,
          rsvpsCount: rsvpList.length,
          isLiked: likes.some((l) => l.userId === args.userId),
          isRsvpd: rsvpList.some((r) => r.userId === args.userId),
        };
      })
    );
  },
});

export const getComments = query({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("comments").withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId)).order("asc").collect();
    const avatarCache: Record<string, string | undefined> = {};
    return await Promise.all(comments.map(async (c) => {
      const user = await ctx.db.get(c.userId);
      let avatar = user?.avatar || "";
      if (avatar && isStorageId(avatar)) {
        avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
      }
      return { ...c, user: user ? { _id: user._id, name: user.name, username: user.username, avatar } : null };
    }));
  },
});

// ---------------------------------------------------------------------------
// Mutations — secured with getAuthenticatedUser
// ---------------------------------------------------------------------------

/**
 * Create a new rally or post.
 * The creatorId arg is verified against the authenticated caller.
 */
export const create = mutation({
  args: {
    type: v.union(v.literal("ASK"), v.literal("HELP"), v.literal("JOIN"), v.literal("EVENT"), v.literal("POST")),
    title: v.string(),
    description: v.string(),
    distance: v.number(),
    time: v.string(),
    peopleNeeded: v.number(),
    isPaid: v.boolean(),
    price: v.optional(v.number()),
    pricing: v.optional(v.union(v.literal("free"), v.literal("paid"), v.literal("none"))),
    creatorId: v.id("users"), // verified against auth
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
    mediaStorageId: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    muxUploadId: v.optional(v.string()),
    interest: v.optional(v.string()),
    rallyLinkId: v.optional(v.id("rallies")),
    interests: v.optional(v.array(v.string())),
    scoring: v.optional(v.union(v.literal("sum_scores"), v.literal("matches_won"), v.literal("total_points"))),
    authorType: v.optional(v.union(v.literal("user"), v.literal("page"))),
    pageId: v.optional(v.id("pages")),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    // Caller may only create content as themselves.
    if (caller._id.toString() !== args.creatorId.toString()) {
      throw new Error("Forbidden: you can only create content as yourself.");
    }

    // Authorization for Page posting
    const isPostingAsPage = args.authorType === "page";
    let validatedPageId: any = undefined;

    if (isPostingAsPage) {
      if (!args.pageId) {
        throw new Error("A valid Page ID is required when posting as a Page.");
      }
      const page = await ctx.db.get(args.pageId);
      if (!page) {
        throw new Error("Page not found.");
      }
      const membership = await ctx.db
        .query("pageMembers")
        .withIndex("by_page_user", (q) =>
          q.eq("pageId", args.pageId!).eq("userId", caller._id)
        )
        .first();

      const canPostAsPage =
        page.creatorId.toString() === caller._id.toString() ||
        (membership && ["owner", "admin", "editor"].includes(membership.role));

      if (!canPostAsPage) {
        throw new Error("Forbidden: You do not have permission to post on behalf of this Page.");
      }
      validatedPageId = args.pageId;
    }

    const normalizedHashtags = (args.hashtags || []).map((h) => h.toLowerCase().replace(/^#/, "").trim()).filter((h) => h.length > 0);
    const uniqueHashtags = [...new Set(normalizedHashtags)];

    if (args.type === "EVENT") {
      const isProAccount = caller.accountType === "organization" || caller.accountType === "business";
      if (!caller.isPro || !isProAccount) {
        throw new Error("Creating an Event requires a lalao Pro Organization or Business account.");
      }
    }

    const isRallyType = args.type !== "POST";
    let eventTag = args.eventTag;
    if (isRallyType && !eventTag) {
      const base = args.title.replace(/[^a-zA-Z0-9 ]/g, "").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
      if (base) eventTag = `#${base}`;
    }

    const effectivePricing: "free" | "paid" | "none" = args.pricing ? args.pricing : args.isPaid ? "paid" : "none";
    const effectiveIsPaid = effectivePricing === "paid";
    const effectivePrice = effectiveIsPaid && args.price && args.price > 0 ? Math.round(args.price) : undefined;
    if (effectiveIsPaid && effectivePrice === undefined) {
      throw new Error("Paid RALLYs must include a price greater than zero.");
    }

    const rallyId = await ctx.db.insert("rallies", {
      ...args,
      authorType: isPostingAsPage ? "page" : "user",
      pageId: validatedPageId,
      created_by_user_id: caller._id,
      pricing: effectivePricing,
      isPaid: effectiveIsPaid,
      price: effectivePrice,
      interest: args.type === "POST" && args.interest ? args.interest.toLowerCase().trim() : undefined,
      eventTag: isRallyType && eventTag ? eventTag.toLowerCase() : undefined,
      rallyLinkId: args.type === "POST" ? args.rallyLinkId : undefined,
      interests: !isRallyType && args.interests ? undefined : (args.interests || []).map((i) => i.toLowerCase().trim()).filter(Boolean),
      hashtags: uniqueHashtags.length > 0 ? uniqueHashtags : undefined,
      peopleInterested: 0,
      status: "ACTIVE",
      createdAt: Date.now(),
    });

    if (isRallyType) {
      try {
        await ctx.db.insert("rallyParticipants", { rallyId, userId: caller._id, role: "organizer", joinedAt: Date.now() });
      } catch {}
    }

    if (args.city) {
      try {
        await ctx.runMutation(api.notifications.notifyNearbyUsers, { rallyId, rallyTitle: args.title, rallyType: args.type, creatorId: caller._id, city: args.city });
      } catch {}
    }

    return rallyId;
  },
});

/**
 * Attach Mux playback IDs after transcoding.
 * Caller must own the rally — verified server-side.
 */
export const saveMuxResult = mutation({
  args: {
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"), // accepted for compat, verified against auth
    assetId: v.string(),
    playbackId: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("Rally not found");
    if (rally.creatorId.toString() !== caller._id.toString()) {
      throw new Error("Not authorised: you can only update your own posts");
    }
    await ctx.db.patch(args.rallyId, {
      muxAssetId: args.assetId,
      muxPlaybackId: args.playbackId,
      mediaUrl: `https://stream.mux.com/${args.playbackId}/high.mp4`,
      mediaType: "video",
    });
  },
});

/**
 * Update rally status.
 * Only the creator may change status — verified server-side.
 */
export const updateStatus = mutation({
  args: {
    rallyId: v.id("rallies"),
    status: v.union(v.literal("ACTIVE"), v.literal("COMPLETED"), v.literal("CANCELLED")),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("Rally not found");
    if (rally.creatorId.toString() !== caller._id.toString()) {
      throw new Error("Not authorised: you can only update your own rallies.");
    }
    await ctx.db.patch(args.rallyId, { status: args.status });
  },
});

export const incrementInterested = mutation({
  args: { rallyId: v.id("rallies") },
  handler: async (ctx, args) => {
    // No ownership check — any authenticated user can increment interest.
    await getAuthenticatedUser(ctx);
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) return;
    await ctx.db.patch(args.rallyId, { peopleInterested: rally.peopleInterested + 1 });
  },
});

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

/**
 * Toggle like. Caller must be the liker.
 */
export const toggleLike = mutation({
  args: { rallyId: v.id("rallies"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (caller._id.toString() !== args.userId.toString()) {
      throw new Error("Forbidden: you can only like content as yourself.");
    }
    const existing = await ctx.db.query("likes").withIndex("by_user_rally", (q) => q.eq("userId", caller._id).eq("rallyId", args.rallyId)).first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    }
    await ctx.db.insert("likes", { userId: caller._id, rallyId: args.rallyId, createdAt: Date.now() });
    return { liked: true };
  },
});

// ---------------------------------------------------------------------------
// RSVP
// ---------------------------------------------------------------------------

/**
 * Toggle RSVP. Caller must be the user RSVPing.
 */
export const toggleRsvp = mutation({
  args: { rallyId: v.id("rallies"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (caller._id.toString() !== args.userId.toString()) {
      throw new Error("Forbidden: you can only RSVP as yourself.");
    }
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("Rally not found");

    const existing = await ctx.db.query("rsvps").withIndex("by_user_rally", (q) => q.eq("userId", caller._id).eq("rallyId", args.rallyId)).first();

    if (existing) {
      await ctx.db.delete(existing._id);
      try {
        await ctx.runMutation(api.notifications.create, {
          userId: rally.creatorId,
          type: "rally_participant_left",
          title: "Participant left",
          body: `${caller.name || "Someone"} left "${rally.title}".`,
          rallyId: args.rallyId,
          url: `/rally/${args.rallyId}`,
        });
      } catch {}
      return { rsvpd: false };
    }

    if (rally.capacity && rally.capacity > 0) {
      const currentRsvps = await ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId)).collect();
      if (currentRsvps.length >= rally.capacity) throw new Error("This event is at full capacity");
    }
    await ctx.db.insert("rsvps", { userId: caller._id, rallyId: args.rallyId, createdAt: Date.now() });
    try {
      await ctx.runMutation(api.notifications.create, {
        userId: rally.creatorId,
        type: "rally_participant_joined",
        title: "New participant",
        body: `${caller.name || "Someone"} joined "${rally.title}".`,
        rallyId: args.rallyId,
        url: `/rally/${args.rallyId}`,
      });
    } catch {}
    return { rsvpd: true };
  },
});

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/**
 * Add a comment. Caller must be the commenter.
 */
export const addComment = mutation({
  args: { rallyId: v.id("rallies"), userId: v.id("users"), text: v.string() },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (caller._id.toString() !== args.userId.toString()) {
      throw new Error("Forbidden: you can only comment as yourself.");
    }
    if (!args.text.trim()) throw new Error("Comment cannot be empty");
    return await ctx.db.insert("comments", { userId: caller._id, rallyId: args.rallyId, text: args.text.trim(), createdAt: Date.now() });
  },
});

/**
 * Delete a comment. Only the commenter may delete it.
 */
export const deleteComment = mutation({
  args: { commentId: v.id("comments"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) return;
    if (comment.userId.toString() !== caller._id.toString()) {
      throw new Error("Forbidden: you can only delete your own comments.");
    }
    await ctx.db.delete(args.commentId);
  },
});

// ---------------------------------------------------------------------------
// Delete Rally
// ---------------------------------------------------------------------------

/**
 * Delete a rally and all its associated data.
 * Only the creator may delete — verified server-side.
 */
export const deleteRally = mutation({
  args: {
    rallyId: v.id("rallies"),
    requestingUserId: v.id("users"), // accepted for compat, verified against auth
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const rally = await ctx.db.get(args.rallyId);
    if (!rally) throw new Error("Rally not found");

    let isAuthorized = rally.creatorId.toString() === caller._id.toString();
    if (!isAuthorized && rally.pageId) {
      const membership = await ctx.db
        .query("pageMembers")
        .withIndex("by_page_user", (q) =>
          q.eq("pageId", rally.pageId!).eq("userId", caller._id)
        )
        .first();
      if (membership && ["owner", "admin", "editor"].includes(membership.role)) {
        isAuthorized = true;
      }
    }
    if (!isAuthorized) {
      throw new Error("Not authorised: you can only delete your own posts or posts for pages you manage.");
    }

    const likes = await ctx.db.query("likes").withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId)).collect();
    for (const like of likes) await ctx.db.delete(like._id);

    const comments = await ctx.db.query("comments").withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId)).collect();
    for (const comment of comments) await ctx.db.delete(comment._id);

    const rsvps = await ctx.db.query("rsvps").withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId)).collect();
    for (const rsvp of rsvps) await ctx.db.delete(rsvp._id);

    const notifications = await ctx.db.query("notifications").withIndex("by_rally", (q) => q.eq("rallyId", args.rallyId)).collect();
    for (const notif of notifications) await ctx.db.delete(notif._id);

    if (rally.mediaStorageId && isStorageId(rally.mediaStorageId)) {
      try { await ctx.storage.delete(rally.mediaStorageId as any); } catch {}
    }

    await ctx.db.delete(args.rallyId);
  },
});

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

/**
 * Submit a rating. Caller must be the rater.
 */
export const submitRating = mutation({
  args: {
    raterId: v.id("users"), // verified against auth
    ratedUserId: v.id("users"),
    rallyId: v.optional(v.id("rallies")),
    score: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (caller._id.toString() !== args.raterId.toString()) {
      throw new Error("Forbidden: you can only submit ratings as yourself.");
    }
    if (caller._id.toString() === args.ratedUserId.toString()) throw new Error("You cannot rate yourself");
    if (args.score < 1 || args.score > 5) throw new Error("Score must be between 1 and 5");

    const existing = await ctx.db.query("ratings").withIndex("by_rater_rated", (q) => q.eq("raterId", caller._id).eq("ratedUserId", args.ratedUserId)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { score: args.score, review: args.review, createdAt: Date.now() });
      return existing._id;
    }
    return await ctx.db.insert("ratings", { raterId: caller._id, ratedUserId: args.ratedUserId, rallyId: args.rallyId, score: args.score, review: args.review, createdAt: Date.now() });
  },
});
