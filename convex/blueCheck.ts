import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, getAuthenticatedUserOrNull, getAuthenticatedAdmin } from "./lib/auth";
import { isAdminUser } from "./adminHelpers";

/**
 * RALLY Profile Blue Check Verification
 * 
 * STRICT REQUIREMENT:
 * This verification system is solely for RALLY profile verification (social-media style blue badge).
 * It is completely decoupled and independent from NIN/KYC national identity verification.
 */

// ---------------------------------------------------------------------------
// Queries & Mutations for Profile Owners
// ---------------------------------------------------------------------------

export const getMyStatus = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;

    if (!targetUserId) {
      const authUser = await getAuthenticatedUserOrNull(ctx);
      if (authUser) {
        targetUserId = authUser._id;
      }
    }

    if (!targetUserId) {
      return {
        isBlueVerified: false,
        blueCheckStatus: "unverified" as const,
        blueVerifiedAt: undefined,
        latestRequest: null,
      };
    }

    const user = await ctx.db.get(targetUserId);
    if (!user) {
      return {
        isBlueVerified: false,
        blueCheckStatus: "unverified" as const,
        blueVerifiedAt: undefined,
        latestRequest: null,
      };
    }

    // Fetch latest request for this user
    const requests = await ctx.db
      .query("blueCheckRequests")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId!))
      .order("desc")
      .collect();

    const latestRequest = requests.length > 0 ? requests[0] : null;

    return {
      isBlueVerified: Boolean(user.isBlueVerified),
      blueCheckStatus: (user.blueCheckStatus || (user.isBlueVerified ? "verified" : "unverified")) as
        | "unverified"
        | "pending"
        | "verified"
        | "rejected",
      blueVerifiedAt: user.blueVerifiedAt,
      latestRequest,
    };
  },
});

export const submitRequest = mutation({
  args: {
    userId: v.optional(v.id("users")),
    fullName: v.string(),
    category: v.string(),
    links: v.array(v.string()),
    evidenceNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Resolve user: prefer authenticated user, fallback to provided userId if matching auth or dev
    let user = await getAuthenticatedUserOrNull(ctx);
    if (!user && args.userId) {
      user = await ctx.db.get(args.userId);
    }

    if (!user) {
      throw new Error("You must be signed in to apply for Blue Check verification.");
    }

    if (user.isBlueVerified) {
      throw new Error("Your profile is already verified with a Blue Check badge.");
    }

    // Check if there is an existing pending request
    const existingPending = await ctx.db
      .query("blueCheckRequests")
      .withIndex("by_user", (q) => q.eq("userId", user!._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingPending) {
      throw new Error("You already have a pending verification request under review.");
    }

    const trimmedFullName = args.fullName.trim();
    if (!trimmedFullName) {
      throw new Error("Full name or entity name is required.");
    }

    const validLinks = args.links.map((l) => l.trim()).filter((l) => l.length > 0);
    if (validLinks.length === 0) {
      throw new Error("Please provide at least one valid public link or social profile URL.");
    }

    const now = Date.now();

    // Create the Blue Check request
    const requestId = await ctx.db.insert("blueCheckRequests", {
      userId: user._id,
      fullName: trimmedFullName,
      username: user.username || "",
      category: args.category.trim() || "Creator",
      links: validLinks,
      evidenceNote: args.evidenceNote?.trim() || undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Update user profile status to pending
    await ctx.db.patch(user._id, {
      blueCheckStatus: "pending",
    });

    return {
      success: true,
      requestId,
    };
  },
});

// ---------------------------------------------------------------------------
// Admin Queries & Mutations (Strict Admin Control)
// ---------------------------------------------------------------------------

async function resolveAdmin(ctx: any, adminUserId?: string) {
  try {
    const admin = await getAuthenticatedAdmin(ctx);
    if (admin) return admin;
  } catch {}

  if (adminUserId) {
    const candidate = await ctx.db.get(adminUserId as any);
    if (candidate && isAdminUser(candidate)) {
      return candidate;
    }
  }

  throw new Error("Forbidden: Admin privileges required.");
}

export const adminListRequests = query({
  args: {
    status: v.optional(v.string()), // "ALL", "pending", "verified", "rejected"
    search: v.optional(v.string()),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await resolveAdmin(ctx, args.adminUserId);

    let requests = await ctx.db
      .query("blueCheckRequests")
      .order("desc")
      .collect();

    if (args.status && args.status !== "ALL") {
      requests = requests.filter((r) => r.status === args.status);
    }

    if (args.search) {
      const q = args.search.toLowerCase().trim();
      requests = requests.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.username.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    // Hydrate requests with current user avatar and profile details
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const user = await ctx.db.get(req.userId);
        let avatar = user?.avatar || "";
        if (avatar && !avatar.startsWith("http")) {
          try {
            const url = await ctx.storage.getUrl(avatar);
            if (url) avatar = url;
          } catch {}
        }

        return {
          ...req,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar,
                isBlueVerified: Boolean(user.isBlueVerified),
                blueCheckStatus: user.blueCheckStatus || "unverified",
                isNINVerified: Boolean(user.isNINVerified),
                createdAt: user.createdAt,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

export const adminApproveRequest = mutation({
  args: {
    requestId: v.id("blueCheckRequests"),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const admin = await resolveAdmin(ctx, args.adminUserId);
    const req = await ctx.db.get(args.requestId);
    if (!req) {
      throw new Error("Verification request not found.");
    }

    const now = Date.now();

    // 1. Update the request
    await ctx.db.patch(args.requestId, {
      status: "verified",
      reviewedBy: admin._id,
      reviewerName: admin.name || "Admin",
      updatedAt: now,
    });

    // 2. Activate Blue Check on the target user's account
    await ctx.db.patch(req.userId, {
      isBlueVerified: true,
      blueCheckStatus: "verified",
      blueVerifiedAt: now,
    });

    // 3. Dispatch congratulations notification
    try {
      await ctx.db.insert("notifications", {
        userId: req.userId,
        type: "SYSTEM" as any,
        title: "Blue Check Verified!",
        body: "Congratulations! Your RALLY profile has been verified. Your blue check badge is now live across RALLY.",
        read: false,
        createdAt: now,
      });
    } catch {}

    return { success: true };
  },
});

export const adminRejectRequest = mutation({
  args: {
    requestId: v.id("blueCheckRequests"),
    reason: v.string(),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const admin = await resolveAdmin(ctx, args.adminUserId);
    const req = await ctx.db.get(args.requestId);
    if (!req) {
      throw new Error("Verification request not found.");
    }

    const trimmedReason = args.reason.trim();
    if (!trimmedReason) {
      throw new Error("Please provide a reason for rejecting the verification request.");
    }

    const now = Date.now();

    // 1. Update the request
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      rejectionReason: trimmedReason,
      reviewedBy: admin._id,
      reviewerName: admin.name || "Admin",
      updatedAt: now,
    });

    // 2. Update the target user's blueCheckStatus
    await ctx.db.patch(req.userId, {
      isBlueVerified: false,
      blueCheckStatus: "rejected",
    });

    // 3. Dispatch notification with reason
    try {
      await ctx.db.insert("notifications", {
        userId: req.userId,
        type: "SYSTEM" as any,
        title: "Verification Request Update",
        body: `Your Blue Check verification request was not approved: ${trimmedReason}. You can reapply with updated information.`,
        read: false,
        createdAt: now,
      });
    } catch {}

    return { success: true };
  },
});
