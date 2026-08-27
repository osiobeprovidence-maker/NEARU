import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("ads")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ads").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    brandName: v.optional(v.string()),
    brandLogoUrl: v.optional(v.string()),
    isActive: v.boolean(),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("ads", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("ads"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    brandName: v.optional(v.string()),
    brandLogoUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("ads") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("ads") },
  handler: async (ctx, args) => {
    const ad = await ctx.db.get(args.id);
    if (!ad) throw new Error("Ad not found");
    await ctx.db.patch(args.id, {
      isActive: !ad.isActive,
      updatedAt: Date.now(),
    });
  },
});
