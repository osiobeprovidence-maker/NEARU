import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./lib/auth";

function cleanSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_-]/g, "");
}

/**
 * Helper to resolve a valid Convex user ID from either an Id, a string, or the auth context.
 * Guaranteed never to throw, handling unauthenticated callers, missing profile records, or string UIDs gracefully.
 */
async function resolveUserId(ctx: any, rawUserId?: string | null): Promise<any | null> {
  // 1. If an explicit userId was supplied by the caller, resolve it first
  if (rawUserId && typeof rawUserId === "string" && rawUserId.trim().length > 0) {
    const trimmed = rawUserId.trim();
    try {
      const normalized = ctx.db.normalizeId("users", trimmed);
      if (normalized) {
        const userDoc = await ctx.db.get(normalized);
        if (userDoc) return userDoc._id;
      }
    } catch {}

    try {
      const userByUid = await ctx.db
        .query("users")
        .withIndex("by_firebase_uid", (q: any) => q.eq("firebaseUid", trimmed))
        .first();
      if (userByUid) return userByUid._id;
    } catch {}

    try {
      const userByUsername = await ctx.db
        .query("users")
        .withIndex("by_username", (q: any) => q.eq("username", trimmed.replace(/^@/, "")))
        .first();
      if (userByUsername) return userByUsername._id;
    } catch {}

    return null;
  }

  // 2. If no userId argument was provided, fall back to the authenticated caller identity
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject) {
      const userByUid = await ctx.db
        .query("users")
        .withIndex("by_firebase_uid", (q: any) => q.eq("firebaseUid", identity.subject))
        .first();
      if (userByUid) return userByUid._id;
    }
  } catch {}

  return null;
}

/**
 * Create a new Page.
 * Automatically assigns the authenticated creator as "owner" in pageMembers.
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (!caller) {
      throw new Error("You must be signed in to create a Page.");
    }

    const trimmedName = args.name.trim();
    if (!trimmedName) throw new Error("Page name is required.");

    const normalizedSlug = cleanSlug(args.slug);
    if (!normalizedSlug || normalizedSlug.length < 2) {
      throw new Error("Page username/handle must be at least 2 characters.");
    }

    // Check slug uniqueness
    const existing = await ctx.db
      .query("pages")
      .withIndex("by_slug", (q) => q.eq("slug", normalizedSlug))
      .first();

    if (existing) {
      throw new Error(`The handle @${normalizedSlug} is already taken.`);
    }

    const now = Date.now();
    const pageId = await ctx.db.insert("pages", {
      name: trimmedName,
      slug: normalizedSlug,
      category: args.category.trim() || "General",
      description: args.description?.trim() || undefined,
      avatar: args.avatar?.trim() || undefined,
      coverImage: args.coverImage?.trim() || undefined,
      website: args.website?.trim() || undefined,
      email: args.email?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      location: args.location?.trim() || undefined,
      creatorId: caller._id,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    // Assign caller as owner
    await ctx.db.insert("pageMembers", {
      pageId,
      userId: caller._id,
      role: "owner",
      createdAt: now,
    });

    return { pageId, slug: normalizedSlug };
  },
});

/**
 * Get Page by unique slug / handle.
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
    viewerId: v.optional(v.union(v.id("users"), v.string())),
  },
  handler: async (ctx, args) => {
    const normalizedSlug = cleanSlug(args.slug);
    const page = await ctx.db
      .query("pages")
      .withIndex("by_slug", (q) => q.eq("slug", normalizedSlug))
      .first();

    if (!page) return null;

    const follows = await ctx.db
      .query("pageFollows")
      .withIndex("by_page", (q) => q.eq("pageId", page._id))
      .collect();

    const posts = await ctx.db
      .query("rallies")
      .withIndex("by_page", (q) => q.eq("pageId", page._id))
      .collect();

    let isFollowing = false;
    let viewerRole: "owner" | "admin" | "editor" | "moderator" | null = null;

    const resolvedViewer = await resolveUserId(ctx, args.viewerId);
    if (resolvedViewer) {
      isFollowing = follows.some(
        (f) => f.userId.toString() === resolvedViewer.toString()
      );

      const membership = await ctx.db
        .query("pageMembers")
        .withIndex("by_page_user", (q) =>
          q.eq("pageId", page._id).eq("userId", resolvedViewer)
        )
        .first();

      if (membership) {
        viewerRole = membership.role;
      }
    }

    return {
      ...page,
      followersCount: follows.length,
      postsCount: posts.length,
      isFollowing,
      viewerRole,
    };
  },
});

/**
 * Get Page by ID.
 */
export const getById = query({
  args: {
    pageId: v.id("pages"),
    viewerId: v.optional(v.union(v.id("users"), v.string())),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return null;

    const follows = await ctx.db
      .query("pageFollows")
      .withIndex("by_page", (q) => q.eq("pageId", page._id))
      .collect();

    const posts = await ctx.db
      .query("rallies")
      .withIndex("by_page", (q) => q.eq("pageId", page._id))
      .collect();

    let isFollowing = false;
    let viewerRole: "owner" | "admin" | "editor" | "moderator" | null = null;

    const resolvedViewer = await resolveUserId(ctx, args.viewerId);
    if (resolvedViewer) {
      isFollowing = follows.some(
        (f) => f.userId.toString() === resolvedViewer.toString()
      );

      const membership = await ctx.db
        .query("pageMembers")
        .withIndex("by_page_user", (q) =>
          q.eq("pageId", page._id).eq("userId", resolvedViewer)
        )
        .first();

      if (membership) {
        viewerRole = membership.role;
      }
    }

    return {
      ...page,
      followersCount: follows.length,
      postsCount: posts.length,
      isFollowing,
      viewerRole,
    };
  },
});

/**
 * List all Pages managed by a user (owner, admin, or editor).
 * Resilient to either Convex User Id or string UID.
 */
export const listUserManagedPages = query({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
  },
  handler: async (ctx, args) => {
    try {
      const targetUserId = await resolveUserId(ctx, args.userId);
      if (!targetUserId) {
        return [];
      }

      const memberships = await ctx.db
        .query("pageMembers")
        .withIndex("by_user", (q) => q.eq("userId", targetUserId))
        .collect();

      if (!memberships || memberships.length === 0) {
        return [];
      }

      const results = [];
      for (const m of memberships) {
        if (!m || !m.pageId) continue;
        try {
          const page = await ctx.db.get(m.pageId);
          if (page) {
            results.push({
              _id: page._id,
              name: page.name || "Untitled Page",
              slug: page.slug || "",
              category: page.category || "General",
              avatar: page.avatar || undefined,
              coverImage: page.coverImage || undefined,
              description: page.description || undefined,
              role: m.role || "owner",
            });
          }
        } catch {
          // ignore individual page load issue
        }
      }
      return results;
    } catch (err) {
      console.warn("[pages:listUserManagedPages] safe error fallback:", err);
      return [];
    }
  },
});

/**
 * List all Pages for discovery / exploration.
 */
export const listAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("pages")
      .order("desc")
      .take(args.limit || 30);

    return await Promise.all(
      pages.map(async (page) => {
        const follows = await ctx.db
          .query("pageFollows")
          .withIndex("by_page", (q) => q.eq("pageId", page._id))
          .collect();
        const posts = await ctx.db
          .query("rallies")
          .withIndex("by_page", (q) => q.eq("pageId", page._id))
          .collect();
        return {
          ...page,
          followersCount: follows.length,
          postsCount: posts.length,
        };
      })
    );
  },
});

/**
 * Update Page details. Gated to owner, admin, or editor.
 */
export const update = mutation({
  args: {
    pageId: v.id("pages"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    if (!caller) throw new Error("Unauthorized.");

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found.");

    // Check membership role
    const member = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q) =>
        q.eq("pageId", args.pageId).eq("userId", caller._id)
      )
      .first();

    const isAuthorized =
      page.creatorId.toString() === caller._id.toString() ||
      (member && ["owner", "admin", "editor"].includes(member.role));

    if (!isAuthorized) {
      throw new Error("Forbidden: You do not have permission to edit this Page.");
    }

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.category !== undefined) updates.category = args.category.trim();
    if (args.description !== undefined) updates.description = args.description.trim();
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.website !== undefined) updates.website = args.website.trim();
    if (args.email !== undefined) updates.email = args.email.trim();
    if (args.phone !== undefined) updates.phone = args.phone.trim();
    if (args.location !== undefined) updates.location = args.location.trim();

    await ctx.db.patch(args.pageId, updates);
    return { success: true };
  },
});

/**
 * Toggle follow/unfollow for a Page.
 */
export const toggleFollow = mutation({
  args: {
    pageId: v.id("pages"),
    userId: v.optional(v.union(v.id("users"), v.string())),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const actingUserId = caller?._id;
    if (!actingUserId) {
      throw new Error("Forbidden: You must be signed in to follow a Page.");
    }

    const existing = await ctx.db
      .query("pageFollows")
      .withIndex("by_page_user", (q) =>
        q.eq("pageId", args.pageId).eq("userId", actingUserId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { following: false };
    }

    await ctx.db.insert("pageFollows", {
      pageId: args.pageId,
      userId: actingUserId,
      createdAt: Date.now(),
    });
    return { following: true };
  },
});
