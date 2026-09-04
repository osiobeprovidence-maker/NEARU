import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function isStorageId(id?: string | null): boolean {
  return Boolean(
    id &&
      !id.startsWith("http") &&
      !id.startsWith("data:") &&
      !id.startsWith("blob:")
  );
}

async function resolveUrl(ctx: any, val?: string | null): Promise<string> {
  if (!val) return "";
  if (!isStorageId(val)) return val;
  try {
    const url = await ctx.storage.getUrl(val as any);
    return url || val;
  } catch {
    return val;
  }
}

// ---------------------------------------------------------------------------
// 1. STORAGE UPLOAD & URL RESOLUTION
// ---------------------------------------------------------------------------

/**
 * Returns a signed upload URL to upload a file directly to Convex Storage.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Resolves a storage ID to a public CDN URL.
 */
export const getMediaUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await resolveUrl(ctx, args.storageId);
  },
});

// ---------------------------------------------------------------------------
// 2. BRANDING, APP ICON, SPLASH SCREEN & TYPOGRAPHY
// ---------------------------------------------------------------------------

export const getBranding = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("systemSettings").first();
    if (!settings) {
      return {
        platformName: "lalao",
        appIconUrl: "",
        splashScreenUrl: "",
        brandLogoUrl: "",
        brandIconUrl: "",
        faviconUrl: "",
        primaryColor: "#4f46e5",
        splashBgColor: "#4f46e5",
        typography: {
          fontFamily: "Inter",
          headingWeight: "700",
          bodyWeight: "400",
        },
      };
    }

    const [
      appIconUrl,
      splashScreenUrl,
      brandLogoUrl,
      brandIconUrl,
      faviconUrl,
    ] = await Promise.all([
      resolveUrl(ctx, settings.appIconUrl),
      resolveUrl(ctx, settings.splashScreenUrl),
      resolveUrl(ctx, settings.brandLogoUrl),
      resolveUrl(ctx, settings.brandIconUrl),
      resolveUrl(ctx, settings.faviconUrl),
    ]);

    let customFontUrl = "";
    if (settings.typography?.customFontUrl) {
      customFontUrl = await resolveUrl(ctx, settings.typography.customFontUrl);
    }

    return {
      platformName: settings.platformName || "lalao",
      appIconUrl,
      splashScreenUrl,
      brandLogoUrl,
      brandIconUrl,
      faviconUrl,
      primaryColor: settings.primaryColor || "#4f46e5",
      splashBgColor: settings.splashBgColor || settings.primaryColor || "#4f46e5",
      typography: settings.typography
        ? {
            ...settings.typography,
            customFontUrl,
          }
        : {
            fontFamily: "Inter",
            headingWeight: "700",
            bodyWeight: "400",
          },
    };
  },
});

export const updateBranding = mutation({
  args: {
    appIconUrl: v.optional(v.string()),
    splashScreenUrl: v.optional(v.string()),
    splashBgColor: v.optional(v.string()),
    brandLogoUrl: v.optional(v.string()),
    brandIconUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    typography: v.optional(
      v.object({
        fontFamily: v.string(),
        headingWeight: v.string(),
        bodyWeight: v.string(),
        customFontUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("systemSettings").first();
    const now = Date.now();

    const updates: Record<string, any> = { updatedAt: now };
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined) {
        updates[k] = v;
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("systemSettings", {
        platformName: "lalao",
        defaultRadiusKm: 25,
        supportedCities: ["Lagos", "Abuja", "Port Harcourt", "Warri"],
        autoApproveRallies: true,
        requireEmailVerification: false,
        autoVerifyPhone: false,
        maintenanceMode: false,
        ...updates,
        updatedAt: now,
        updatedBy: undefined as any,
      });
    }

    return { ok: true };
  },
});

// ---------------------------------------------------------------------------
// 3. EMOJI & STICKER PACKS
// ---------------------------------------------------------------------------

export const listEmojiPacks = query({
  args: {},
  handler: async (ctx) => {
    const packs = await ctx.db
      .query("emojiPacks")
      .order("desc")
      .collect();

    const results = [];
    for (const p of packs) {
      const iconUrl = await resolveUrl(ctx, p.iconUrl);
      const items = await ctx.db
        .query("emojiItems")
        .withIndex("by_pack", (q) => q.eq("packId", p._id))
        .collect();

      results.push({
        ...p,
        iconUrl,
        itemCount: items.length,
      });
    }

    return results;
  },
});

export const listActiveEmojiPacks = query({
  args: {},
  handler: async (ctx) => {
    const packs = await ctx.db
      .query("emojiPacks")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const results = [];
    for (const p of packs) {
      const iconUrl = await resolveUrl(ctx, p.iconUrl);
      const items = await ctx.db
        .query("emojiItems")
        .withIndex("by_pack", (q) => q.eq("packId", p._id))
        .collect();

      const resolvedItems = await Promise.all(
        items.map(async (it) => ({
          ...it,
          mediaUrl: await resolveUrl(ctx, it.mediaUrl),
        }))
      );

      results.push({
        ...p,
        iconUrl,
        items: resolvedItems,
      });
    }

    return results;
  },
});

export const createEmojiPack = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.string(),
    category: v.optional(v.string()),
    isActive: v.boolean(),
    displayOrder: v.optional(v.number()),
    items: v.array(
      v.object({
        name: v.string(),
        mediaUrl: v.string(),
        mediaType: v.union(v.literal("image"), v.literal("animated")),
        displayOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const packId = await ctx.db.insert("emojiPacks", {
      name: args.name.trim(),
      description: args.description?.trim(),
      iconUrl: args.iconUrl,
      category: args.category || "General",
      isActive: args.isActive,
      displayOrder: args.displayOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });

    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      await ctx.db.insert("emojiItems", {
        packId,
        name: item.name,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
        displayOrder: item.displayOrder ?? i,
        createdAt: now,
      });
    }

    return { packId };
  },
});

export const updateEmojiPack = mutation({
  args: {
    id: v.id("emojiPacks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
    items: v.optional(
      v.array(
        v.object({
          name: v.string(),
          mediaUrl: v.string(),
          mediaType: v.union(v.literal("image"), v.literal("animated")),
          displayOrder: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, items, ...fields } = args;
    const now = Date.now();

    const updates: Record<string, any> = { updatedAt: now };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) updates[k] = v;
    }
    await ctx.db.patch(id, updates);

    // If new items array is provided, replace the pack items
    if (items) {
      const existingItems = await ctx.db
        .query("emojiItems")
        .withIndex("by_pack", (q) => q.eq("packId", id))
        .collect();

      for (const it of existingItems) {
        await ctx.db.delete(it._id);
      }

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await ctx.db.insert("emojiItems", {
          packId: id,
          name: it.name,
          mediaUrl: it.mediaUrl,
          mediaType: it.mediaType,
          displayOrder: it.displayOrder ?? i,
          createdAt: now,
        });
      }
    }

    return { ok: true };
  },
});

export const toggleEmojiPackActive = mutation({
  args: { id: v.id("emojiPacks") },
  handler: async (ctx, args) => {
    const pack = await ctx.db.get(args.id);
    if (!pack) throw new Error("Emoji pack not found");
    await ctx.db.patch(args.id, {
      isActive: !pack.isActive,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const removeEmojiPack = mutation({
  args: { id: v.id("emojiPacks") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("emojiItems")
      .withIndex("by_pack", (q) => q.eq("packId", args.id))
      .collect();

    for (const it of items) {
      await ctx.db.delete(it._id);
    }

    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

// ---------------------------------------------------------------------------
// 4. CUSTOM FONTS
// ---------------------------------------------------------------------------

export const listCustomFonts = query({
  args: {},
  handler: async (ctx) => {
    const fonts = await ctx.db.query("customFonts").collect();
    return await Promise.all(
      fonts.map(async (f) => ({
        ...f,
        fileUrl: await resolveUrl(ctx, f.fileUrl),
      }))
    );
  },
});

export const uploadCustomFont = mutation({
  args: {
    fontFamily: v.string(),
    fileUrl: v.string(),
    format: v.union(
      v.literal("woff2"),
      v.literal("woff"),
      v.literal("ttf"),
      v.literal("otf")
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("customFonts", {
      fontFamily: args.fontFamily.trim(),
      fileUrl: args.fileUrl,
      format: args.format,
      isActive: args.isActive,
      createdAt: Date.now(),
    });
    return { id };
  },
});

export const toggleCustomFontActive = mutation({
  args: { id: v.id("customFonts") },
  handler: async (ctx, args) => {
    const font = await ctx.db.get(args.id);
    if (!font) throw new Error("Font not found");
    await ctx.db.patch(args.id, { isActive: !font.isActive });
    return { ok: true };
  },
});
