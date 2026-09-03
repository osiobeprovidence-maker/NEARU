import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./lib/auth";

// ---------------------------------------------------------------------------
// Queries — read-only, no auth required
// ---------------------------------------------------------------------------

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
    return await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
  },
});

export const listFollowingIds = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    return follows.map((f) => f.followingId);
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

function isStorageId(id?: string | null): boolean {
  return Boolean(id && !id.startsWith("http") && !id.startsWith("data:") && !id.startsWith("blob:"));
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

export const listFollowersWithProfiles = query({
  args: { userId: v.id("users"), viewerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .order("desc")
      .collect();

    const avatarCache: Record<string, string | undefined> = {};
    const results = await Promise.all(
      follows.map(async (f) => {
        const follower = await ctx.db.get(f.followerId);
        if (!follower) return null;
        let avatar = follower.avatar || "";
        if (avatar && isStorageId(avatar)) {
          avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
        }
        let isFollowing = false;
        if (args.viewerId) {
          const pair = await ctx.db
            .query("follows")
            .withIndex("by_pair", (q) =>
              q.eq("followerId", args.viewerId!).eq("followingId", follower._id)
            )
            .unique();
          isFollowing = pair !== null;
        }
        return {
          _id: follower._id,
          name: follower.name,
          username: follower.username,
          avatar,
          bio: follower.bio,
          isNINVerified: follower.isNINVerified,
          badges: follower.badges,
          isFollowing,
          followedAt: f.createdAt,
        };
      })
    );
    return results.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

export const listFollowingWithProfiles = query({
  args: { userId: v.id("users"), viewerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .order("desc")
      .collect();

    const avatarCache: Record<string, string | undefined> = {};
    const results = await Promise.all(
      follows.map(async (f) => {
        const following = await ctx.db.get(f.followingId);
        if (!following) return null;
        let avatar = following.avatar || "";
        if (avatar && isStorageId(avatar)) {
          avatar = (await resolveStorageUrl(ctx, avatarCache, avatar)) || "";
        }
        let isFollowing = false;
        if (args.viewerId) {
          const pair = await ctx.db
            .query("follows")
            .withIndex("by_pair", (q) =>
              q.eq("followerId", args.viewerId!).eq("followingId", following._id)
            )
            .unique();
          isFollowing = pair !== null;
        }
        return {
          _id: following._id,
          name: following.name,
          username: following.username,
          avatar,
          bio: following.bio,
          isNINVerified: following.isNINVerified,
          badges: following.badges,
          isFollowing,
          followedAt: f.createdAt,
        };
      })
    );
    return results.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

// ---------------------------------------------------------------------------
// Mutations — secured: caller must be the follower
// ---------------------------------------------------------------------------

/**
 * Follow a user.
 * The authenticated caller is always the follower — followerId arg is verified.
 */
export const follow = mutation({
  args: {
    followerId: v.id("users"), // verified against auth
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (caller._id.toString() !== args.followerId.toString()) {
      throw new Error("Forbidden: you can only follow accounts as yourself.");
    }
    if (args.followerId === args.followingId) return;
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", caller._id).eq("followingId", args.followingId)
      )
      .unique();
    if (existing) return;
    await ctx.db.insert("follows", {
      followerId: caller._id,
      followingId: args.followingId,
      createdAt: Date.now(),
    });
  },
});

/**
 * Unfollow a user.
 * The authenticated caller is always the follower — followerId arg is verified.
 */
export const unfollow = mutation({
  args: {
    followerId: v.id("users"), // verified against auth
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (caller._id.toString() !== args.followerId.toString()) {
      throw new Error("Forbidden: you can only unfollow accounts as yourself.");
    }
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", caller._id).eq("followingId", args.followingId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
