import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

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
  args: {},
  handler: async (ctx) => {
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

    return rallies.map((rally) => ({
      ...rally,
      creator: creators[rally.creatorId] || null,
    }));
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

export const listByCreator = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rallies")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    type: v.union(v.literal("ASK"), v.literal("HELP"), v.literal("JOIN")),
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
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    mediaStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedHashtags = (args.hashtags || []).map((h) =>
      h.toLowerCase().replace(/^#/, "").trim()
    ).filter((h) => h.length > 0);
    
    const uniqueHashtags = [...new Set(normalizedHashtags)];

    return await ctx.db.insert("rallies", {
      ...args,
      hashtags: uniqueHashtags.length > 0 ? uniqueHashtags : undefined,
      peopleInterested: 0,
      status: "ACTIVE",
      createdAt: Date.now(),
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
