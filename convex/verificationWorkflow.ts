import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./lib/auth";
import { getAuthenticatedAdmin } from "./lib/auth";

export const DEFAULT_PRICING = [
  {
    type: "lalao_buz" as const,
    name: "Lalao Buz",
    badgeColor: "blue",
    badgeLabel: "Lalao Buz — Blue",
    description: "For businesses, brands, stores and commercial entities.",
    priceNaira: 25000,
    isEnabled: true,
  },
  {
    type: "organization" as const,
    name: "Organization",
    badgeColor: "green",
    badgeLabel: "Organization — Green",
    description: "For organizations, groups, associations and institutions.",
    priceNaira: 15000,
    isEnabled: true,
  },
  {
    type: "personal" as const,
    name: "Personal",
    badgeColor: "black",
    badgeLabel: "Personal — Black",
    description: "For individuals, creators and public figures.",
    priceNaira: 5000,
    isEnabled: true,
  },
];

// ===========================================================================
// PRICING QUERIES & MUTATIONS (Admin Controlled, No Hardcoding)
// ===========================================================================

export const getPricing = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("verificationPricing").collect();
    if (!records || records.length === 0) {
      return DEFAULT_PRICING.map((p) => ({
        ...p,
        _id: `default-${p.type}`,
        updatedAt: Date.now(),
      }));
    }

    // Merge default info with database values so any missing fields are filled
    return DEFAULT_PRICING.map((def) => {
      const match = records.find((r) => r.type === def.type);
      if (match) {
        return {
          _id: match._id,
          type: match.type,
          name: match.name || def.name,
          badgeColor: match.badgeColor || def.badgeColor,
          badgeLabel: match.badgeLabel || def.badgeLabel,
          description: match.description || def.description,
          priceNaira: match.priceNaira ?? def.priceNaira,
          isEnabled: match.isEnabled ?? def.isEnabled,
          updatedAt: match.updatedAt || Date.now(),
        };
      }
      return {
        ...def,
        _id: `default-${def.type}`,
        updatedAt: Date.now(),
      };
    });
  },
});

export const updatePricing = mutation({
  args: {
    type: v.union(
      v.literal("lalao_buz"),
      v.literal("organization"),
      v.literal("personal")
    ),
    priceNaira: v.number(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await getAuthenticatedAdmin(ctx);
    const existing = await ctx.db
      .query("verificationPricing")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    const def = DEFAULT_PRICING.find((d) => d.type === args.type)!;
    const now = Date.now();

    let recordId = existing?._id;
    if (existing) {
      await ctx.db.patch(existing._id, {
        priceNaira: args.priceNaira,
        isEnabled: args.isEnabled,
        updatedAt: now,
        updatedBy: admin._id,
      });
    } else {
      recordId = await ctx.db.insert("verificationPricing", {
        type: args.type,
        name: def.name,
        badgeColor: def.badgeColor,
        badgeLabel: def.badgeLabel,
        description: def.description,
        priceNaira: args.priceNaira,
        isEnabled: args.isEnabled,
        updatedAt: now,
        updatedBy: admin._id,
      });
    }

    // Audit log
    await ctx.db.insert("verificationAuditLogs", {
      adminId: admin._id,
      adminName: admin.name || "Admin",
      action: "UPDATE_PRICING",
      previousStatus: existing ? `₦${existing.priceNaira} (${existing.isEnabled ? "enabled" : "disabled"})` : undefined,
      newStatus: `₦${args.priceNaira} (${args.isEnabled ? "enabled" : "disabled"})`,
      details: `Updated ${def.name} verification price to ₦${args.priceNaira.toLocaleString()}`,
      createdAt: now,
    });

    return { success: true, recordId };
  },
});

// ===========================================================================
// USER APPLICATION WORKFLOW
// ===========================================================================

export const getMyApplications = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getAuthenticatedUser(ctx);
      return await ctx.db
        .query("verificationApplications")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();
    } catch {
      return [];
    }
  },
});

export const submitApplication = mutation({
  args: {
    verificationType: v.union(
      v.literal("lalao_buz"),
      v.literal("organization"),
      v.literal("personal")
    ),
    applicantName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    entityName: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    socialHandle: v.optional(v.string()),
    documentUrls: v.optional(v.array(v.string())),
    documentStorageIds: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Prevent duplicate active applications of the same verification type
    const activeExisting = await ctx.db
      .query("verificationApplications")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("verificationType", args.verificationType)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "Payment Pending"),
          q.eq(q.field("status"), "Payment Submitted"),
          q.eq(q.field("status"), "Payment Confirmed"),
          q.eq(q.field("status"), "Under Review"),
          q.eq(q.field("status"), "Approved")
        )
      )
      .first();

    if (activeExisting) {
      if (activeExisting.status === "Approved") {
        throw new Error("You already have an approved badge for this verification type.");
      }
      throw new Error(`You already have an active application (${activeExisting.status}) for this verification category.`);
    }

    // Get current price directly from database
    const pricingRecord = await ctx.db
      .query("verificationPricing")
      .withIndex("by_type", (q) => q.eq("type", args.verificationType))
      .first();

    const def = DEFAULT_PRICING.find((d) => d.type === args.verificationType)!;
    const priceAmountNaira = pricingRecord?.priceNaira ?? def.priceNaira;
    const isEnabled = pricingRecord?.isEnabled ?? def.isEnabled;

    if (!isEnabled) {
      throw new Error("This verification type is currently not open for new applications.");
    }

    const now = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const paymentReference = `LAL-${args.verificationType.slice(0, 3).toUpperCase()}-${now.toString(36).toUpperCase()}-${randomSuffix}`;

    const applicationId = await ctx.db.insert("verificationApplications", {
      userId: user._id,
      verificationType: args.verificationType,
      applicantName: args.applicantName.trim(),
      username: user.username,
      contactEmail: args.contactEmail?.trim() || user.email,
      contactPhone: args.contactPhone?.trim() || user.phone,
      entityName: args.entityName?.trim(),
      registrationNumber: args.registrationNumber?.trim(),
      websiteUrl: args.websiteUrl?.trim(),
      socialHandle: args.socialHandle?.trim(),
      documentUrls: args.documentUrls || [],
      documentStorageIds: args.documentStorageIds || [],
      additionalInfo: args.additionalInfo?.trim(),
      priceAmountNaira,
      paymentReference,
      status: "Payment Pending",
      createdAt: now,
      updatedAt: now,
    });

    return { applicationId, paymentReference, priceAmountNaira };
  },
});

export const submitPayment = mutation({
  args: {
    applicationId: v.id("verificationApplications"),
    paymentMethod: v.optional(v.string()),
    paymentProofUrl: v.optional(v.string()),
    paymentProofStorageId: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found.");
    if (app.userId !== user._id) throw new Error("Unauthorized.");

    if (app.status !== "Payment Pending" && app.status !== "Payment Failed") {
      throw new Error(`Cannot submit payment for an application in ${app.status} status.`);
    }

    const now = Date.now();
    await ctx.db.patch(args.applicationId, {
      status: "Payment Submitted",
      paymentSubmittedAt: now,
      paymentMethod: args.paymentMethod || "bank_transfer",
      paymentProofUrl: args.paymentProofUrl || app.paymentProofUrl,
      paymentProofStorageId: args.paymentProofStorageId || app.paymentProofStorageId,
      paymentReference: args.paymentReference || app.paymentReference,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const cancelApplication = mutation({
  args: {
    applicationId: v.id("verificationApplications"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found.");
    if (app.userId !== user._id) throw new Error("Unauthorized.");

    if (app.status !== "Payment Pending") {
      throw new Error("Only applications with pending payment can be cancelled.");
    }

    const now = Date.now();
    await ctx.db.patch(args.applicationId, {
      status: "Cancelled",
      cancelledAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const generateDocumentUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Both user and admin can request upload URLs
    return await ctx.storage.generateUploadUrl();
  },
});

// ===========================================================================
// ADMIN VERIFICATION MANAGEMENT (Protected by getAuthenticatedAdmin)
// ===========================================================================

export const adminListApplications = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedAdmin(ctx);

    let applications = await ctx.db
      .query("verificationApplications")
      .order("desc")
      .collect();

    if (args.status && args.status !== "ALL") {
      applications = applications.filter((a) => a.status === args.status);
    }
    if (args.type && args.type !== "ALL") {
      applications = applications.filter((a) => a.verificationType === args.type);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      applications = applications.filter(
        (a) =>
          a.applicantName.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          a.paymentReference.toLowerCase().includes(q) ||
          (a.entityName && a.entityName.toLowerCase().includes(q))
      );
    }

    // Hydrate user profile avatar and basic info
    const enriched = await Promise.all(
      applications.map(async (app) => {
        const user = await ctx.db.get(app.userId);
        let avatar = user?.avatar || "";
        if (avatar && !avatar.startsWith("http")) {
          try {
            const url = await ctx.storage.getUrl(avatar);
            if (url) avatar = url;
          } catch {}
        }

        // Also resolve payment proof URL if storage ID is set
        let resolvedProofUrl = app.paymentProofUrl;
        if (app.paymentProofStorageId) {
          try {
            const proofUrl = await ctx.storage.getUrl(app.paymentProofStorageId);
            if (proofUrl) resolvedProofUrl = proofUrl;
          } catch {}
        }

        // Resolve document URLs if storage IDs are present
        const resolvedDocUrls: string[] = [];
        if (app.documentStorageIds && app.documentStorageIds.length > 0) {
          for (const docId of app.documentStorageIds) {
            try {
              const url = await ctx.storage.getUrl(docId);
              if (url) resolvedDocUrls.push(url);
            } catch {}
          }
        }

        return {
          ...app,
          userAvatar: avatar,
          paymentProofUrl: resolvedProofUrl,
          resolvedDocUrls: resolvedDocUrls.length > 0 ? resolvedDocUrls : (app.documentUrls || []),
        };
      })
    );

    return enriched;
  },
});

export const adminGetApplication = query({
  args: { applicationId: v.id("verificationApplications") },
  handler: async (ctx, args) => {
    await getAuthenticatedAdmin(ctx);
    const app = await ctx.db.get(args.applicationId);
    if (!app) return null;

    const user = await ctx.db.get(app.userId);
    let avatar = user?.avatar || "";
    if (avatar && !avatar.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(avatar);
        if (url) avatar = url;
      } catch {}
    }

    let resolvedProofUrl = app.paymentProofUrl;
    if (app.paymentProofStorageId) {
      try {
        const proofUrl = await ctx.storage.getUrl(app.paymentProofStorageId);
        if (proofUrl) resolvedProofUrl = proofUrl;
      } catch {}
    }

    const resolvedDocUrls: string[] = [];
    if (app.documentStorageIds && app.documentStorageIds.length > 0) {
      for (const docId of app.documentStorageIds) {
        try {
          const url = await ctx.storage.getUrl(docId);
          if (url) resolvedDocUrls.push(url);
        } catch {}
      }
    }

    return {
      ...app,
      userAvatar: avatar,
      userCreatedAt: user?.createdAt,
      paymentProofUrl: resolvedProofUrl,
      resolvedDocUrls: resolvedDocUrls.length > 0 ? resolvedDocUrls : (app.documentUrls || []),
    };
  },
});

/**
 * STEP 1 of Admin Workflow:
 * ADMIN CONFIRMS PAYMENT
 * 
 * IMPORTANT: PAYMENT MUST NOT AUTOMATICALLY VERIFY THE USER.
 * This mutation only moves the status to "Payment Confirmed".
 */
export const adminConfirmPayment = mutation({
  args: {
    applicationId: v.id("verificationApplications"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await getAuthenticatedAdmin(ctx);
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found.");

    if (app.status !== "Payment Submitted") {
      throw new Error(`Cannot confirm payment when application is in ${app.status} status.`);
    }

    const now = Date.now();
    await ctx.db.patch(args.applicationId, {
      status: "Payment Confirmed",
      paymentConfirmedAt: now,
      reviewedByAdminId: admin._id,
      reviewerAdminName: admin.name || "Admin",
      adminNotes: args.adminNotes || app.adminNotes,
      updatedAt: now,
    });

    // Write audit log
    await ctx.db.insert("verificationAuditLogs", {
      adminId: admin._id,
      adminName: admin.name || "Admin",
      applicationId: app._id,
      applicantId: app.userId,
      applicantName: app.applicantName,
      action: "CONFIRM_PAYMENT",
      previousStatus: "Payment Submitted",
      newStatus: "Payment Confirmed",
      details: `Payment ref ${app.paymentReference} confirmed for ₦${app.priceAmountNaira.toLocaleString()}`,
      createdAt: now,
    });

    return { success: true };
  },
});

export const adminRejectPayment = mutation({
  args: {
    applicationId: v.id("verificationApplications"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await getAuthenticatedAdmin(ctx);
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found.");

    if (app.status !== "Payment Submitted" && app.status !== "Payment Pending") {
      throw new Error(`Cannot reject payment when application is in ${app.status} status.`);
    }

    const now = Date.now();
    await ctx.db.patch(args.applicationId, {
      status: "Payment Failed",
      rejectionReason: args.reason,
      reviewedByAdminId: admin._id,
      reviewerAdminName: admin.name || "Admin",
      updatedAt: now,
    });

    // Write audit log
    await ctx.db.insert("verificationAuditLogs", {
      adminId: admin._id,
      adminName: admin.name || "Admin",
      applicationId: app._id,
      applicantId: app.userId,
      applicantName: app.applicantName,
      action: "REJECT_PAYMENT",
      previousStatus: app.status,
      newStatus: "Payment Failed",
      details: `Payment rejected: ${args.reason}`,
      createdAt: now,
    });

    // Notify user
    try {
      await ctx.db.insert("notifications", {
        userId: app.userId,
        type: "verification_payment_failed",
        title: "Payment Unsuccessful",
        body: `Payment verification for your ${app.verificationType} application failed: ${args.reason}`,
        read: false,
        createdAt: now,
      });
    } catch {}

    return { success: true };
  },
});

export const adminStartReview = mutation({
  args: {
    applicationId: v.id("verificationApplications"),
  },
  handler: async (ctx, args) => {
    const admin = await getAuthenticatedAdmin(ctx);
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found.");

    if (app.status !== "Payment Confirmed") {
      throw new Error(`Cannot start review when status is ${app.status}. Payment must be confirmed first.`);
    }

    const now = Date.now();
    await ctx.db.patch(args.applicationId, {
      status: "Under Review",
      reviewedAt: now,
      reviewedByAdminId: admin._id,
      reviewerAdminName: admin.name || "Admin",
      updatedAt: now,
    });

    // Write audit log
    await ctx.db.insert("verificationAuditLogs", {
      adminId: admin._id,
      adminName: admin.name || "Admin",
      applicationId: app._id,
      applicantId: app.userId,
      applicantName: app.applicantName,
      action: "START_REVIEW",
      previousStatus: "Payment Confirmed",
      newStatus: "Under Review",
      details: "Application review started by admin",
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * STEP 2 of Admin Workflow:
 * ADMIN APPROVES VERIFICATION
 * 
 * Only now is the verification badge activated!
 */
export const adminApproveVerification = mutation({
  args: {
    applicationId: v.id("verificationApplications"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await getAuthenticatedAdmin(ctx);
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found.");

    if (app.status !== "Under Review" && app.status !== "Payment Confirmed") {
      throw new Error(`Cannot approve verification while in ${app.status} status.`);
    }

    const now = Date.now();
    await ctx.db.patch(args.applicationId, {
      status: "Approved",
      approvedAt: now,
      reviewedByAdminId: admin._id,
      reviewerAdminName: admin.name || "Admin",
      adminNotes: args.adminNotes || app.adminNotes,
      updatedAt: now,
    });

    // Activate verification badge on the user document
    await ctx.db.patch(app.userId, {
      isVerified: true,
      isNINVerified: true, // backward compatible flag
      verificationType: app.verificationType,
      verifiedAt: now,
    });

    const targetUser = await ctx.db.get(app.userId);
    if (targetUser) {
      const badgeLabel =
        app.verificationType === "lalao_buz"
          ? "Lalao Buz Verified"
          : app.verificationType === "organization"
          ? "Organization Verified"
          : "Personal Verified";
      const existingBadges = targetUser.badges || [];
      if (!existingBadges.includes(badgeLabel)) {
        await ctx.db.patch(app.userId, {
          badges: [...existingBadges, badgeLabel],
        });
      }
    }

    // Write audit log
    await ctx.db.insert("verificationAuditLogs", {
      adminId: admin._id,
      adminName: admin.name || "Admin",
      applicationId: app._id,
      applicantId: app.userId,
      applicantName: app.applicantName,
      action: "APPROVE_VERIFICATION",
      previousStatus: app.status,
      newStatus: "Approved",
      details: `Verification approved. Activated ${app.verificationType} badge.`,
      createdAt: now,
    });

    // Send congratulatory notification to user
    try {
      const typeLabel =
        app.verificationType === "lalao_buz"
          ? "Lalao Buz"
          : app.verificationType === "organization"
          ? "Organization"
          : "Personal";
      await ctx.db.insert("notifications", {
        userId: app.userId,
        type: "verification_approved",
        title: "Verification Approved!",
        body: `Congratulations! Your ${typeLabel} verification badge is now officially active across Lalao.`,
        read: false,
        createdAt: now,
      });
    } catch {}

    return { success: true };
  },
});

export const adminRejectVerification = mutation({
  args: {
    applicationId: v.id("verificationApplications"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await getAuthenticatedAdmin(ctx);
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found.");

    if (app.status !== "Under Review" && app.status !== "Payment Confirmed") {
      throw new Error(`Cannot reject verification while in ${app.status} status.`);
    }

    const now = Date.now();
    await ctx.db.patch(args.applicationId, {
      status: "Rejected",
      rejectedAt: now,
      rejectionReason: args.reason,
      reviewedByAdminId: admin._id,
      reviewerAdminName: admin.name || "Admin",
      updatedAt: now,
    });

    // Write audit log
    await ctx.db.insert("verificationAuditLogs", {
      adminId: admin._id,
      adminName: admin.name || "Admin",
      applicationId: app._id,
      applicantId: app.userId,
      applicantName: app.applicantName,
      action: "REJECT_VERIFICATION",
      previousStatus: app.status,
      newStatus: "Rejected",
      details: `Verification rejected: ${args.reason}`,
      createdAt: now,
    });

    // Send notification to user
    try {
      await ctx.db.insert("notifications", {
        userId: app.userId,
        type: "verification_rejected",
        title: "Verification Application Update",
        body: `Your verification application could not be approved. Reason: ${args.reason}`,
        read: false,
        createdAt: now,
      });
    } catch {}

    return { success: true };
  },
});

export const adminListAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedAdmin(ctx);
    return await ctx.db
      .query("verificationAuditLogs")
      .order("desc")
      .take(args.limit || 100);
  },
});
