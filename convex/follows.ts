import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const isFollowing = query({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();
    return result !== null;
  },
});

export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();
    return follows;
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    return follows;
  },
});

export const getFollowerCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();
    return follows.length;
  },
});

export const getFollowingCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    return follows.length;
  },
});

export const follow = mutation({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  handler: async (ctx, args) => {
    if (args.followerId === args.followingId) return;
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();
    if (existing) return;
    await ctx.db.insert("follows", {
      followerId: args.followerId,
      followingId: args.followingId,
      createdAt: Date.now(),
    });
  },
});

export const unfollow = mutation({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
