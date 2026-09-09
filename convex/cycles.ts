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

    const followingIds = new Set(following.map((f) => f.followingId.toString()));

    // Get all active user cycles that are not expired
    const activeCycles = await ctx.db
      .query("cycles")
      .withIndex("by_expiresAt")
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // Filter to friends' cycles
    const friendCycles = activeCycles.filter(
      (cycle) =>
        cycle.authorType === "user" &&
        followingIds.has(cycle.authorId.toString())
    );

    // Get page follows
    const pageFollows = await ctx.db
      .query("pageFollows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const followedPageIds = new Set(pageFollows.map((f) => f.pageId.toString()));

    // Filter to followed pages' cycles
    const pageCycles = activeCycles.filter(
      (cycle) =>
        cycle.authorType === "page" &&
        cycle.pageId &&
        followedPageIds.has(cycle.pageId.toString())
    );

    const validCycles = [...friendCycles, ...pageCycles];

    // Group cycles by author (or page)
    const grouped = new Map<string, typeof validCycles>();

    for (const cycle of validCycles) {
      const key = cycle.authorType === "page" ? `page:${cycle.pageId}` : `user:${cycle.authorId}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(cycle);
    }

    // Resolve details for each group
    const results = [];
    for (const [key, cycles] of grouped.entries()) {
      cycles.sort((a, b) => a.createdAt - b.createdAt); // oldest to newest viewing order

      let name = "";
      let avatarUrl = undefined;
      let hasUnseen = false;

      // Resolve author/page info and media URLs
      const enrichedCycles = [];
      for (const cycle of cycles) {
        if (!cycle.viewedBy?.includes(user._id)) {
          hasUnseen = true;
        }

        let mediaUrl = undefined;
        if (cycle.mediaStorageId) {
          mediaUrl = await ctx.storage.getUrl(cycle.mediaStorageId) ?? undefined;
        }

        enrichedCycles.push({
          ...cycle,
          mediaUrl,
        });
      }

      if (cycles[0].authorType === "page") {
        const page = await ctx.db.get(cycles[0].pageId!);
        if (page) {
          name = page.name;
          avatarUrl = page.avatar;
        }
      } else {
        const author = await ctx.db.get(cycles[0].authorId);
        if (author) {
          name = author.name;
          avatarUrl = author.avatar;
        }
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
        latestUpdate: cycles[cycles.length - 1].createdAt,
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

    if (myCycles.length === 0) return null;

    myCycles.sort((a, b) => a.createdAt - b.createdAt);
    
    let hasUnseen = false;

    const enrichedCycles = [];
    for (const cycle of myCycles) {
      if (!cycle.viewedBy?.includes(user._id)) {
        hasUnseen = true;
      }
      let mediaUrl = undefined;
      if (cycle.mediaStorageId) {
        mediaUrl = await ctx.storage.getUrl(cycle.mediaStorageId) ?? undefined;
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
      name: user.name,
      avatarUrl: user.avatar,
      hasUnseen, // For self, usually everything is seen if they just posted it, but we track it anyway
      cycles: enrichedCycles,
      latestUpdate: myCycles[myCycles.length - 1].createdAt,
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

export const deleteCycle = mutation({
  args: { cycleId: v.id("cycles") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Not found");

    if (cycle.authorId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.cycleId);
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
