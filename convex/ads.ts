import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function extractStorageId(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  // If it's already a clean storageId (not a URL)
  if (
    !trimmed.startsWith("http") &&
    !trimmed.startsWith("/") &&
    !trimmed.startsWith("blob:") &&
    !trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  // If it's a URL containing /api/storage/<storageId>
  const match = trimmed.match(/\/api\/storage\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

function sanitizeMediaReference(val?: string): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  const storageId = extractStorageId(trimmed);
  if (storageId) return storageId;
  return trimmed;
}

async function resolveAdUrls(ctx: any, ad: any) {
  const resolved: Record<string, unknown> = { ...ad };
  for (const key of ["imageUrl", "brandLogoUrl"]) {
    const val = ad[key];
    if (!val || typeof val !== "string") continue;

    const storageId = extractStorageId(val);
    if (storageId) {
      try {
        const url = await ctx.storage.getUrl(storageId as any);
        if (url) {
          resolved[key] = url;
          continue;
        }
      } catch {}
    }

    resolved[key] = val;
  }

  // Auto-detect mediaType if missing or unconfigured
  if (!resolved.mediaType && typeof resolved.imageUrl === "string" && resolved.imageUrl.trim()) {
    const lower = (resolved.imageUrl as string).toLowerCase();
    if (
      lower.includes(".mp4") ||
      lower.includes(".webm") ||
      lower.includes(".mov") ||
      lower.includes("video")
    ) {
      resolved.mediaType = "video";
    } else {
      resolved.mediaType = "image";
    }
  }

  return resolved;
}

export const generateAdUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const ads = await ctx.db
      .query("ads")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return Promise.all(ads.map((ad: any) => resolveAdUrls(ctx, ad)));
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const ads = await ctx.db.query("ads").collect();
    return Promise.all(ads.map((ad: any) => resolveAdUrls(ctx, ad)));
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
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
      imageUrl: sanitizeMediaReference(args.imageUrl),
      brandLogoUrl: sanitizeMediaReference(args.brandLogoUrl),
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
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
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
        if (key === "imageUrl" || key === "brandLogoUrl") {
          updates[key] = sanitizeMediaReference(value as string);
        } else {
          updates[key] = value;
        }
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
