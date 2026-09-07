import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Resolves a storage ID to an absolute public CDN URL if applicable.
 */
async function resolveStorageUrl(ctx: any, storageIdOrUrl?: string): Promise<string> {
  if (!storageIdOrUrl) return "";
  if (storageIdOrUrl.startsWith("http://") || storageIdOrUrl.startsWith("https://")) {
    return storageIdOrUrl;
  }
  try {
    const url = await ctx.storage.getUrl(storageIdOrUrl);
    return url || storageIdOrUrl;
  } catch {
    return storageIdOrUrl;
  }
}

// ---------------------------------------------------------------------------
// 1. PUBLIC QUERIES FOR WEBSITE LANDING PAGE
// ---------------------------------------------------------------------------

/**
 * Returns the latest published Android APK release for the Lalao download hub.
 */
export const getLatestRelease = query({
  args: {},
  handler: async (ctx) => {
    // 1. First look for explicit isLatest published release
    const latestCandidates = await ctx.db
      .query("appReleases")
      .withIndex("by_latest", (q) => q.eq("isLatest", true))
      .collect();
    let release = latestCandidates.find((r) => r.status === "published") || null;

    // 2. Fallback: If not marked isLatest, pick the newest published release by timestamp
    if (!release) {
      const allPublished = await ctx.db
        .query("appReleases")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .collect();
      if (allPublished.length > 0) {
        allPublished.sort((a, b) => b.timestamp - a.timestamp);
        release = allPublished[0];
      }
    }

    if (!release) return null;

    // Resolve storage URL if needed
    let resolvedApkUrl = release.apkUrl;
    if (release.apkStorageId) {
      const storageUrl = await resolveStorageUrl(ctx, release.apkStorageId);
      if (storageUrl) {
        resolvedApkUrl = storageUrl;
      }
    }

    return {
      ...release,
      apkUrl: resolvedApkUrl,
    };
  },
});

/**
 * Returns the version history of all published Android APK releases, newest first.
 */
export const getVersionHistory = query({
  args: {},
  handler: async (ctx) => {
    const releases = await ctx.db
      .query("appReleases")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Sort newest first
    releases.sort((a, b) => b.timestamp - a.timestamp);

    // Resolve URLs in parallel
    return await Promise.all(
      releases.map(async (rel) => {
        let resolvedUrl = rel.apkUrl;
        if (rel.apkStorageId) {
          const storageUrl = await resolveStorageUrl(ctx, rel.apkStorageId);
          if (storageUrl) {
            resolvedUrl = storageUrl;
          }
        }
        return {
          ...rel,
          apkUrl: resolvedUrl,
        };
      })
    );
  },
});

// ---------------------------------------------------------------------------
// 2. RELEASE PIPELINE MUTATIONS
// ---------------------------------------------------------------------------

/**
 * Returns a signed upload URL to upload an APK file directly to Convex Storage.
 */
export const generateApkUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Publishes an approved Android release or updates an existing draft.
 * Automatically marks previous releases as isLatest = false.
 */
export const publishRelease = mutation({
  args: {
    version: v.string(),
    buildNumber: v.number(),
    releaseDate: v.string(),
    timestamp: v.optional(v.number()),
    apkStorageId: v.optional(v.string()),
    apkUrl: v.optional(v.string()),
    apkSize: v.optional(v.string()),
    releaseNotes: v.array(v.string()),
    status: v.optional(
      v.union(v.literal("published"), v.literal("draft"), v.literal("archived"))
    ),
    minAndroidVersion: v.optional(v.string()),
    sha256: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const status = args.status ?? "published";
    const timestamp = args.timestamp ?? Date.now();

    let resolvedApkUrl = args.apkUrl || "";
    if (args.apkStorageId && !resolvedApkUrl) {
      const storageUrl = await resolveStorageUrl(ctx, args.apkStorageId);
      resolvedApkUrl = storageUrl || "";
    }

    // If publishing, ensure only this release is marked isLatest
    if (status === "published") {
      const currentLatest = await ctx.db
        .query("appReleases")
        .withIndex("by_latest", (q) => q.eq("isLatest", true))
        .collect();

      for (const rel of currentLatest) {
        await ctx.db.patch(rel._id, { isLatest: false });
      }
    }

    // Check if a release record with this exact version already exists
    const existing = await ctx.db
      .query("appReleases")
      .filter((q) => q.eq(q.field("version"), args.version))
      .first();

    const recordData = {
      version: args.version,
      buildNumber: args.buildNumber,
      releaseDate: args.releaseDate,
      timestamp,
      apkStorageId: args.apkStorageId,
      apkUrl: resolvedApkUrl,
      apkSize: args.apkSize || "4.8 MB",
      releaseNotes: args.releaseNotes,
      isLatest: status === "published",
      status,
      minAndroidVersion: args.minAndroidVersion ?? "Android 8.0+",
      sha256: args.sha256,
    };

    if (existing) {
      await ctx.db.patch(existing._id, recordData);
      return { success: true, releaseId: existing._id, action: "updated" };
    } else {
      const releaseId = await ctx.db.insert("appReleases", recordData);
      return { success: true, releaseId, action: "created" };
    }
  },
});
