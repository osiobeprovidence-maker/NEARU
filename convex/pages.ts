import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthenticatedUser, getOptionalAuthenticatedUser } from "./lib/auth";

function cleanSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_-]/g, "");
}

function isStorageId(id?: string | null): boolean {
  return Boolean(
    id &&
      !id.startsWith("http://") &&
      !id.startsWith("https://") &&
      !id.startsWith("data:") &&
      !id.startsWith("blob:")
  );
}

async function resolveStorageUrl(
  ctx: any,
  val?: string | null
): Promise<string | undefined> {
  if (!val) return undefined;
  if (!isStorageId(val)) return val;
  try {
    const url = await ctx.storage.getUrl(val as any);
    return url || val;
  } catch {
    return val;
  }
}

async function safeDeleteStorageFile(ctx: any, storageId?: string | null) {
  if (storageId && isStorageId(storageId)) {
    try {
      await ctx.storage.delete(storageId as any);
    } catch (err) {
      console.warn("[pages] Safe storage delete caught error:", err);
    }
  }
}

/**
 * Resolves the authenticated caller via JWT or fallback explicit userId if valid.
 */
async function resolveCallerUser(
  ctx: any,
  explicitUserId?: Id<"users">
): Promise<any> {
  try {
    const caller = await getAuthenticatedUser(ctx);
    if (caller) return caller;
  } catch (err) {
    // JWT auth not established or expired
  }

  if (explicitUserId) {
    const user = await ctx.db.get(explicitUserId);
    if (user) return user;
  }

  throw new Error("Unauthenticated: you must be signed in to perform this action.");
}

/**
 * Verify that the caller is authenticated and has permission to manage the target Page.
 * Authorized roles: Page creator, super admin, or pageMembers with role "owner", "admin", or "editor".
 */
async function checkPageManagerPermission(
  ctx: any,
  pageId: Id<"pages">,
  caller: any
) {
  const page = await ctx.db.get(pageId);
  if (!page) throw new Error("Page not found.");

  const callerId = caller._id;

  const isSuperAdmin =
    caller.email === "osiobeprovidence@gmail.com" ||
    caller.role === "admin" ||
    caller.role === "super_admin";

  const isCreator =
    Boolean(page.creatorId) &&
    page.creatorId.toString() === callerId.toString();

  const member = await ctx.db
    .query("pageMembers")
    .withIndex("by_page_user", (q: any) =>
      q.eq("pageId", pageId).eq("userId", callerId)
    )
    .first();

  const isAuthorizedRole =
    Boolean(member) &&
    ["owner", "admin", "editor"].includes(member.role);

  const isAuthorized = isSuperAdmin || isCreator || isAuthorizedRole;

  if (!isAuthorized) {
    throw new Error("Forbidden: You do not have permission to manage this Page.");
  }

  return { page, member, caller };
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
 * Resolves avatar and coverImage to public CDN URLs if stored as Convex storage IDs.
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
    viewerId: v.optional(v.id("users")),
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

    let targetViewerId = args.viewerId;
    if (!targetViewerId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.subject) {
        const viewer = await getOptionalAuthenticatedUser(ctx);
        if (viewer) targetViewerId = viewer._id;
      }
    }

    if (targetViewerId) {
      isFollowing = follows.some(
        (f) => f.userId.toString() === targetViewerId!.toString()
      );

      const membership = await ctx.db
        .query("pageMembers")
        .withIndex("by_page_user", (q) =>
          q.eq("pageId", page._id).eq("userId", targetViewerId!)
        )
        .first();

      if (membership) {
        viewerRole = membership.role;
      }
    }

    const resolvedAvatar = await resolveStorageUrl(ctx, page.avatar);
    const resolvedCoverImage = await resolveStorageUrl(ctx, page.coverImage);

    return {
      ...page,
      avatar: resolvedAvatar,
      coverImage: resolvedCoverImage,
      rawAvatarStorageId: isStorageId(page.avatar) ? page.avatar : undefined,
      rawCoverStorageId: isStorageId(page.coverImage) ? page.coverImage : undefined,
      followersCount: follows.length,
      postsCount: posts.length,
      isFollowing,
      viewerRole,
    };
  },
});

/**
 * Get Page by ID.
 * Resolves avatar and coverImage to public CDN URLs.
 */
export const getById = query({
  args: {
    pageId: v.id("pages"),
    viewerId: v.optional(v.id("users")),
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

    let targetViewerId = args.viewerId;
    if (!targetViewerId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.subject) {
        const viewer = await getOptionalAuthenticatedUser(ctx);
        if (viewer) targetViewerId = viewer._id;
      }
    }

    if (targetViewerId) {
      isFollowing = follows.some(
        (f) => f.userId.toString() === targetViewerId!.toString()
      );

      const membership = await ctx.db
        .query("pageMembers")
        .withIndex("by_page_user", (q) =>
          q.eq("pageId", page._id).eq("userId", targetViewerId!)
        )
        .first();

      if (membership) {
        viewerRole = membership.role;
      }
    }

    const resolvedAvatar = await resolveStorageUrl(ctx, page.avatar);
    const resolvedCoverImage = await resolveStorageUrl(ctx, page.coverImage);

    return {
      ...page,
      avatar: resolvedAvatar,
      coverImage: resolvedCoverImage,
      rawAvatarStorageId: isStorageId(page.avatar) ? page.avatar : undefined,
      rawCoverStorageId: isStorageId(page.coverImage) ? page.coverImage : undefined,
      followersCount: follows.length,
      postsCount: posts.length,
      isFollowing,
      viewerRole,
    };
  },
});

/**
 * List all Pages managed by a user (owner, admin, or editor).
 * Returns pages owned directly by the user first, followed by authorized manager pages,
 * sorted by creation date with live post and follower counts.
 */
export const listUserManagedPages = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;
    if (!targetUserId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.subject) {
        return [];
      }
      const caller = await getOptionalAuthenticatedUser(ctx);
      if (!caller) {
        return [];
      }
      targetUserId = caller._id;
    }

    // 1. Fetch memberships where user is owner/admin/editor
    const memberships = await ctx.db
      .query("pageMembers")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId!))
      .collect();

    // 2. Also fetch pages directly created by user to ensure no owned pages are missed
    const createdPages = await ctx.db
      .query("pages")
      .withIndex("by_creator", (q) => q.eq("creatorId", targetUserId!))
      .collect();

    // 3. Merge pages into a deduplicated map
    const pageMap = new Map<string, { page: any; role: string }>();

    // Add created pages as owner
    for (const page of createdPages) {
      if (!page) continue;
      pageMap.set(page._id.toString(), {
        page,
        role: "owner",
      });
    }

    // Add membership pages
    for (const m of memberships) {
      if (!m || !m.pageId) continue;
      const idStr = m.pageId.toString();
      const existing = pageMap.get(idStr);
      if (existing) {
        // If already in map and created by user, keep owner; otherwise assign role
        if (existing.page.creatorId?.toString() === targetUserId.toString()) {
          existing.role = "owner";
        } else if (m.role) {
          existing.role = m.role;
        }
      } else {
        const page = await ctx.db.get(m.pageId);
        if (page) {
          const isCreator = page.creatorId?.toString() === targetUserId.toString();
          pageMap.set(idStr, {
            page,
            role: isCreator ? "owner" : (m.role || "admin"),
          });
        }
      }
    }

    if (pageMap.size === 0) {
      return [];
    }

    // 4. Resolve details, live metrics (postsCount, followersCount), and images for each page
    const items = await Promise.all(
      Array.from(pageMap.values()).map(async ({ page, role }) => {
        const [follows, posts, resolvedAvatar, resolvedCover] = await Promise.all([
          ctx.db
            .query("pageFollows")
            .withIndex("by_page", (q) => q.eq("pageId", page._id))
            .collect(),
          ctx.db
            .query("rallies")
            .withIndex("by_page", (q) => q.eq("pageId", page._id))
            .collect(),
          resolveStorageUrl(ctx, page.avatar),
          resolveStorageUrl(ctx, page.coverImage),
        ]);

        return {
          _id: page._id,
          name: page.name || "Untitled Page",
          slug: page.slug || "",
          category: page.category || "General",
          avatar: resolvedAvatar,
          coverImage: resolvedCover,
          description: page.description || undefined,
          location: page.location || undefined,
          website: page.website || undefined,
          isVerified: page.isVerified ?? false,
          creatorId: page.creatorId,
          role: role || "owner",
          followersCount: follows.length,
          postsCount: posts.length,
          createdAt: page.createdAt || 0,
          updatedAt: page.updatedAt,
        };
      })
    );

    // 5. Order: Owned pages first (role === 'owner'), followed by admin, editor, moderator.
    // Within the same role priority, sort newest first (createdAt descending).
    const rolePriority: Record<string, number> = {
      owner: 0,
      admin: 1,
      editor: 2,
      moderator: 3,
    };

    items.sort((a, b) => {
      const pA = rolePriority[a.role] ?? 4;
      const pB = rolePriority[b.role] ?? 4;
      if (pA !== pB) {
        return pA - pB;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return items;
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
        const resolvedAvatar = await resolveStorageUrl(ctx, page.avatar);
        const resolvedCover = await resolveStorageUrl(ctx, page.coverImage);
        return {
          ...page,
          avatar: resolvedAvatar,
          coverImage: resolvedCover,
          followersCount: follows.length,
          postsCount: posts.length,
        };
      })
    );
  },
});

/**
 * Generate a signed upload URL for a Page image (avatar or cover).
 * Gated on the backend to Page owners, admins, or editors.
 */
export const generatePageImageUploadUrl = mutation({
  args: {
    pageId: v.id("pages"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const caller = await resolveCallerUser(ctx, args.userId);
    await checkPageManagerPermission(ctx, args.pageId, caller);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Update Page profile / avatar image.
 * Verifies permission, safely cleans previous storage file, and saves new storage ID.
 */
export const updateProfileImage = mutation({
  args: {
    pageId: v.id("pages"),
    storageId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const caller = await resolveCallerUser(ctx, args.userId);
    const { page } = await checkPageManagerPermission(ctx, args.pageId, caller);

    const oldAvatar = page.avatar;
    if (oldAvatar && oldAvatar !== args.storageId) {
      await safeDeleteStorageFile(ctx, oldAvatar);
    }

    const now = Date.now();
    await ctx.db.patch(args.pageId, {
      avatar: args.storageId,
      updatedAt: now,
    });

    const url = await resolveStorageUrl(ctx, args.storageId);
    return { success: true, avatar: url, storageId: args.storageId };
  },
});

/**
 * Remove Page profile / avatar image.
 * Verifies permission, deletes file from Convex storage, and clears avatar field.
 */
export const removeProfileImage = mutation({
  args: {
    pageId: v.id("pages"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const caller = await resolveCallerUser(ctx, args.userId);
    const { page } = await checkPageManagerPermission(ctx, args.pageId, caller);

    if (page.avatar) {
      await safeDeleteStorageFile(ctx, page.avatar);
    }

    await ctx.db.patch(args.pageId, {
      avatar: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update Page cover image.
 * Verifies permission, safely cleans previous storage file, and saves new storage ID.
 */
export const updateCoverImage = mutation({
  args: {
    pageId: v.id("pages"),
    storageId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const caller = await resolveCallerUser(ctx, args.userId);
    const { page } = await checkPageManagerPermission(ctx, args.pageId, caller);

    const oldCover = page.coverImage;
    if (oldCover && oldCover !== args.storageId) {
      await safeDeleteStorageFile(ctx, oldCover);
    }

    const now = Date.now();
    await ctx.db.patch(args.pageId, {
      coverImage: args.storageId,
      updatedAt: now,
    });

    const url = await resolveStorageUrl(ctx, args.storageId);
    return { success: true, coverImage: url, storageId: args.storageId };
  },
});

/**
 * Remove Page cover image.
 * Verifies permission, deletes file from Convex storage, and clears coverImage field.
 */
export const removeCoverImage = mutation({
  args: {
    pageId: v.id("pages"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const caller = await resolveCallerUser(ctx, args.userId);
    const { page } = await checkPageManagerPermission(ctx, args.pageId, caller);

    if (page.coverImage) {
      await safeDeleteStorageFile(ctx, page.coverImage);
    }

    await ctx.db.patch(args.pageId, {
      coverImage: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update Page details. Gated to owner, admin, or editor.
 */
export const update = mutation({
  args: {
    pageId: v.id("pages"),
    userId: v.optional(v.id("users")),
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
    const caller = await resolveCallerUser(ctx, args.userId);
    const { page } = await checkPageManagerPermission(ctx, args.pageId, caller);

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.category !== undefined) updates.category = args.category.trim();
    if (args.description !== undefined) updates.description = args.description.trim();

    if (args.avatar !== undefined) {
      if (page.avatar && page.avatar !== args.avatar) {
        await safeDeleteStorageFile(ctx, page.avatar);
      }
      updates.avatar = args.avatar || undefined;
    }

    if (args.coverImage !== undefined) {
      if (page.coverImage && page.coverImage !== args.coverImage) {
        await safeDeleteStorageFile(ctx, page.coverImage);
      }
      updates.coverImage = args.coverImage || undefined;
    }

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
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("pageFollows")
      .withIndex("by_page_user", (q) =>
        q.eq("pageId", args.pageId).eq("userId", caller._id)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { following: false };
    }

    await ctx.db.insert("pageFollows", {
      pageId: args.pageId,
      userId: caller._id,
      createdAt: Date.now(),
    });
    return { following: true };
  },
});
