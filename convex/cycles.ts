import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./lib/auth";

export const getActiveFriendCycles = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return [];

    const now = Date.now();

    // Get following
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect();

    const followingIds = new Set(
      following
        .map((f) => f.followingId)
        .filter((id) => id != null)
        .map((id) => id.toString())
    );

    // Get all active user cycles that are not expired
    const activeCycles = await ctx.db
      .query("cycles")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .collect();

    // Filter to friends' cycles
    const friendCycles = activeCycles.filter(
      (cycle) =>
        cycle.authorType === "user" &&
        cycle.authorId &&
        followingIds.has(cycle.authorId.toString())
    );

    // Get page follows
    const pageFollows = await ctx.db
      .query("pageFollows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const followedPageIds = new Set(
      pageFollows
        .map((f) => f.pageId)
        .filter((id) => id != null)
        .map((id) => id.toString())
    );

    // Filter to followed pages' cycles
    const pageCycles = activeCycles.filter(
      (cycle) =>
        cycle.authorType === "page" &&
        cycle.pageId &&
        followedPageIds.has(cycle.pageId.toString())
    );

    const validCycles = [...friendCycles, ...pageCycles];

    if (validCycles.length === 0) {
      return [];
    }

    // Group cycles by author (or page)
    const grouped = new Map<string, typeof validCycles>();

    for (const cycle of validCycles) {
      if (cycle.authorType === "page" && !cycle.pageId) continue;
      if (cycle.authorType === "user" && !cycle.authorId) continue;

      const key = cycle.authorType === "page" ? `page:${cycle.pageId}` : `user:${cycle.authorId}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(cycle);
    }

    // Resolve details for each group
    const results = [];
    for (const [key, cycles] of grouped.entries()) {
      cycles.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // oldest to newest viewing order

      let name = "";
      let avatarUrl = undefined;
      let hasUnseen = false;
      let resolvedAuthor = false;

      if (cycles[0].authorType === "page" && cycles[0].pageId) {
        const page = await ctx.db.get(cycles[0].pageId);
        if (page) {
          name = page.name || "Unknown Page";
          avatarUrl = page.avatar;
          resolvedAuthor = true;
        }
      } else if (cycles[0].authorType === "user" && cycles[0].authorId) {
        const author = await ctx.db.get(cycles[0].authorId);
        if (author) {
          name = author.name || "Unknown User";
          avatarUrl = author.avatar;
          resolvedAuthor = true;
        }
      }

      if (!resolvedAuthor) {
        // Author or page is deleted, skip this group
        continue;
      }

      // Resolve author/page info and media URLs
      const enrichedCycles = [];
      for (const cycle of cycles) {
        if (!cycle.viewedBy?.includes(user._id)) {
          hasUnseen = true;
        }

        let mediaUrl = undefined;
        if (cycle.mediaStorageId) {
          try {
             mediaUrl = (await ctx.storage.getUrl(cycle.mediaStorageId)) ?? undefined;
          } catch (e) {
             // Invalid storage ID, ignore
             console.warn(`Invalid storage id ${cycle.mediaStorageId} for cycle ${cycle._id}`);
          }
        }

        enrichedCycles.push({
          ...cycle,
          mediaUrl,
        });
      }

      results.push({
        key,
        authorType: cycles[0].authorType,
        authorId: cycles[0].authorId,
        pageId: cycles[0].pageId,
        name,
        avatarUrl,
        hasUnseen,
        cycles: enrichedCycles,
        latestUpdate: cycles[cycles.length - 1].createdAt || 0,
      });
    }

    return results.sort((a, b) => b.latestUpdate - a.latestUpdate);
  },
});

export const getMyActiveCycles = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return null;

    const now = Date.now();
    const myCycles = await ctx.db
      .query("cycles")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    if (!myCycles || myCycles.length === 0) return null;

    myCycles.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    
    let hasUnseen = false;

    const enrichedCycles = [];
    for (const cycle of myCycles) {
      if (!cycle.viewedBy?.includes(user._id)) {
        hasUnseen = true;
      }
      let mediaUrl = undefined;
      if (cycle.mediaStorageId) {
        try {
           mediaUrl = (await ctx.storage.getUrl(cycle.mediaStorageId)) ?? undefined;
        } catch (e) {
           console.warn(`Invalid storage id ${cycle.mediaStorageId} for cycle ${cycle._id}`);
        }
      }
      enrichedCycles.push({
        ...cycle,
        mediaUrl,
      });
    }

    return {
      key: `user:${user._id}`,
      authorType: "user",
      authorId: user._id,
      name: user.name || "You",
      avatarUrl: user.avatar,
      hasUnseen, // For self, usually everything is seen if they just posted it, but we track it anyway
      cycles: enrichedCycles,
      latestUpdate: myCycles[myCycles.length - 1].createdAt || 0,
    };
  },
});

export const createCycle = mutation({
  args: {
    authorType: v.union(v.literal("user"), v.literal("page")),
    pageId: v.optional(v.id("pages")),
    contentType: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
    text: v.optional(v.string()),
    mediaStorageId: v.optional(v.string()),
    videoDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) throw new Error("Unauthorized");

    if (args.authorType === "page" && !args.pageId) {
      throw new Error("Page ID required when authorType is page");
    }

    if (args.authorType === "page") {
      // Ensure user is an admin of the page
      const member = await ctx.db
        .query("pageMembers")
        .withIndex("by_page_user", (q) =>
          q.eq("pageId", args.pageId!).eq("userId", user._id)
        )
        .first();
      
      if (!member) throw new Error("Unauthorized for this page");
    }

    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    const cycleId = await ctx.db.insert("cycles", {
      authorId: user._id,
      authorType: args.authorType,
      pageId: args.pageId,
      contentType: args.contentType,
      text: args.text,
      mediaStorageId: args.mediaStorageId,
      videoDuration: args.videoDuration,
      createdAt: now,
      expiresAt: expiresAt,
      viewedBy: [user._id], // Mark as viewed by creator initially
    });

    return cycleId;
  },
});

export const markCycleViewed = mutation({
  args: { cycleId: v.id("cycles") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return;

    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) return;

    const viewedBy = cycle.viewedBy || [];
    if (!viewedBy.includes(user._id)) {
      await ctx.db.patch(args.cycleId, {
        viewedBy: [...viewedBy, user._id],
      });
    }
  },
});



export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});

export const likeCycle = mutation({
  args: { cycleId: v.id("cycles") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const existingLike = await ctx.db
      .query("cycleLikes")
      .withIndex("by_user_cycle", (q) => q.eq("userId", user._id).eq("cycleId", args.cycleId))
      .first();

    if (!existingLike) {
      await ctx.db.insert("cycleLikes", {
        cycleId: args.cycleId,
        userId: user._id,
        createdAt: Date.now(),
      });
    }
  },
});

export const unlikeCycle = mutation({
  args: { cycleId: v.id("cycles") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const existingLike = await ctx.db
      .query("cycleLikes")
      .withIndex("by_user_cycle", (q) => q.eq("userId", user._id).eq("cycleId", args.cycleId))
      .first();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
    }
  },
});

export const deleteCycle = mutation({
  args: { cycleId: v.id("cycles") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Cycle not found");
    if (cycle.authorId !== user._id) throw new Error("Unauthorized");

    // Optional: delete associated likes to save space, but they will eventually be pruned anyway
    const likes = await ctx.db
      .query("cycleLikes")
      .withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    await ctx.db.delete(args.cycleId);
  },
});

export const getCycleEngagement = query({
  args: { cycleId: v.id("cycles") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return null;

    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) return null;

    const isOwner = cycle.authorId === user._id;

    const likes = await ctx.db
      .query("cycleLikes")
      .withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
      .collect();
    
    const likedByMe = likes.some(l => l.userId === user._id);
    
    // For non-owners, only return public counts and personal like state
    if (!isOwner) {
      return {
        likeCount: likes.length,
        likedByMe,
        viewCount: cycle.viewedBy?.length || 0,
        likers: [],
        viewers: [],
      };
    }

    // For owners, return detailed viewer/liker profiles
    const likers = await Promise.all(
      likes.map(async (l) => {
        const u = await ctx.db.get(l.userId);
        if (!u) return null;
        let avatarUrl = u.avatar;
        // Optionally resolve storage URL if using internal storage
        return {
          _id: u._id,
          name: u.name,
          username: u.username,
          avatar: avatarUrl,
        };
      })
    );

    const viewers = await Promise.all(
      (cycle.viewedBy || []).map(async (viewerId) => {
        const u = await ctx.db.get(viewerId);
        if (!u) return null;
        return {
          _id: u._id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
        };
      })
    );

    return {
      likeCount: likes.length,
      likedByMe,
      viewCount: cycle.viewedBy?.length || 0,
      likers: likers.filter(Boolean),
      viewers: viewers.filter(Boolean),
    };
  },
});

