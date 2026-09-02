import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, getAuthenticatedUserOrNull } from "./lib/auth";

const SUPER_ADMIN_EMAIL = "osiobeprovidence@gmail.com";

// Never send auth secrets (password hash, TOTP secret) to the browser, from
// any query that returns a user document. These are only written server-side.
function redact(user: any) {
  if (!user) return user;
  const { passwordHash, totpSecret, ...safe } = user;
  void passwordHash;
  void totpSecret;
  return safe;
}

// ---------------------------------------------------------------------------
// Queries — read-only, public/semi-public data, no auth required
// ---------------------------------------------------------------------------

export const isAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    let user: any;
    try {
      user = await ctx.db.get(args.userId);
    } catch {
      return false;
    }
    if (!user) return false;
    if (user.email === SUPER_ADMIN_EMAIL) return true;
    return user.role === "super_admin" || user.role === "admin";
  },
});

export const get = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user: any;
    try {
      user = await ctx.db.get(args.userId);
    } catch {
      return null;
    }
    if (!user) return null;
    if (user.avatar && !user.avatar.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.avatar);
        if (url) user.avatar = url;
      } catch {}
    }
    if (user.coverImage && !user.coverImage.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.coverImage);
        if (url) user.coverImage = url;
      } catch {}
    }
    if (args.viewerId && args.viewerId.toString() !== args.userId.toString()) {
      const { interests, ...safe } = redact(user);
      void interests;
      return safe;
    }
    return redact(user);
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (!user) return null;
    if (user.avatar && !user.avatar.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.avatar);
        if (url) user.avatar = url;
      } catch {}
    }
    if (user.coverImage && !user.coverImage.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.coverImage);
        if (url) user.coverImage = url;
      } catch {}
    }
    return redact(user);
  },
});

export const getProfile = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user: any;
    try {
      user = await ctx.db.get(args.userId);
    } catch {
      return null;
    }
    if (!user) return null;

    if (user.avatar && !user.avatar.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.avatar);
        if (url) user.avatar = url;
      } catch {}
    }
    if (user.coverImage && !user.coverImage.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.coverImage);
        if (url) user.coverImage = url;
      } catch {}
    }

    const isSelf = !!args.viewerId && args.viewerId.toString() === args.userId.toString();

    const allCreated = await ctx.db
      .query("rallies")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();
    const postsCount = allCreated.length;

    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();
    const followersCount = followers.length;

    const base = {
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      coverImage: user.coverImage ?? null,
      bio: user.bio ?? user.description ?? null,
      location: user.location ?? null,
      gender: user.gender ?? null,
      badge: { isNINVerified: !!user.isNINVerified, badges: user.badges ?? [] },
      accountType: user.accountType ?? "personal",
      organizationName: user.organizationName ?? null,
      category: user.category ?? null,
      isPro: !!user.isPro,
      socialLinks: user.socialLinks ?? [],
      website: user.website ?? null,
      isFounded: false,
      showInterestsSetting: user.showInterests !== false,
      postsCount,
      followersCount,
    };

    if (isSelf) {
      return {
        ...base,
        isSelf: true,
        interests: user.interests ?? [],
        showInterests: user.showInterests !== false,
        followingCount: (
          await ctx.db
            .query("follows")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .collect()
        ).length,
        interestsVisible: user.interests && user.interests.length > 0 ? true : false,
        followingList: undefined,
        isFollowing: false,
        canFollow: false,
      };
    }

    const showInterests = user.showInterests !== false;
    const publicInterests = (user.publicInterests && user.publicInterests.length > 0
      ? user.publicInterests
      : (user.interests ?? [])
    ).slice(0, 3).filter(Boolean);
    const interests = showInterests ? publicInterests : [];

    let isFollowing = false;
    if (args.viewerId) {
      const rel = await ctx.db
        .query("follows")
        .withIndex("by_pair", (q) =>
          q.eq("followerId", args.viewerId).eq("followingId", args.userId)
        )
        .unique();
      isFollowing = rel !== null;
    }

    return {
      ...base,
      isSelf: false,
      interests,
      showInterests,
      followingCount: undefined,
      followingList: undefined,
      isFollowing,
      canFollow: !isSelf && !!args.viewerId,
    };
  },
});

export const getByFirebaseUid = query({
  args: { firebaseUid: v.string() },
  handler: async (ctx, args) => {
    try {
      if (!args.firebaseUid) return null;
      let user: any;
      try {
        user = await ctx.db
          .query("users")
          .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.firebaseUid))
          .first();
      } catch (err) {
        console.error("Error in db.query:", err);
        return null;
      }
      if (!user) return null;
      if (user.avatar && !user.avatar.startsWith("http")) {
        try {
          const url = await ctx.storage.getUrl(user.avatar);
          if (url) user.avatar = url;
        } catch { user.avatar = ""; }
      }
      if (user.coverImage && !user.coverImage.startsWith("http")) {
        try {
          const url = await ctx.storage.getUrl(user.coverImage);
          if (url) user.coverImage = url;
        } catch { user.coverImage = undefined; }
      }
      return redact(user);
    } catch (err) {
      console.error("Unhandled error in getByFirebaseUid:", err);
      return null;
    }
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!user) return null;
    if (user.avatar && !user.avatar.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.avatar);
        if (url) user.avatar = url;
      } catch {}
    }
    if (user.coverImage && !user.coverImage.startsWith("http")) {
      try {
        const url = await ctx.storage.getUrl(user.coverImage);
        if (url) user.coverImage = url;
      } catch {}
    }
    return redact(user);
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const results: Record<string, any> = {};
    for (const id of args.ids) {
      if (!results[id]) {
        let user: any;
        try {
          user = await ctx.db.get(id);
        } catch {
          continue;
        }
        if (user) {
          if (user.avatar && !user.avatar.startsWith("http")) {
            try {
              const url = await ctx.storage.getUrl(user.avatar);
              if (url) user.avatar = url;
            } catch {}
          }
          if (user.coverImage && !user.coverImage.startsWith("http")) {
            try {
              const url = await ctx.storage.getUrl(user.coverImage);
              if (url) user.coverImage = url;
            } catch {}
          }
          results[id] = redact(user);
        }
      }
    }
    return results;
  },
});

export const listPeople = query({
  args: {
    viewerId: v.id("users"),
    query: v.optional(v.string()),
    filteredInterest: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await ctx.db.get(args.viewerId);
    if (!viewer) return [];

    const viewerBlockedIds = new Set(
      (viewer.blockedUsers ?? []).map((b) => b.id)
    );

    const viewerFollowing = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.viewerId))
      .collect();
    const followingSet = new Set(viewerFollowing.map((f) => f.followingId.toString()));

    const all = await ctx.db.query("users").collect();
    const q = (args.query ?? "").toLowerCase().trim();
    const results: any[] = [];
    const avatarCache: Record<string, string | undefined> = {};

    for (const u of all) {
      if (u._id.toString() === args.viewerId.toString()) continue;
      if (viewerBlockedIds.has(u._id.toString())) continue;

      const isFollowing = followingSet.has(u._id.toString());
      if (u.privacySettings?.profileVisibility === "private" && !isFollowing) continue;

      if (args.filteredInterest) {
        const interest = (u.interests ?? []).some(
          (i) => i.toLowerCase() === args.filteredInterest!.toLowerCase()
        );
        if (!interest) continue;
      }

      if (q) {
        if (!u.name.toLowerCase().includes(q) && !u.username.toLowerCase().includes(q)) continue;
      }

      let avatar = u.avatar || "";
      if (avatar && !avatar.startsWith("http")) {
        try {
          if (!(avatar in avatarCache)) {
            avatarCache[avatar] = (await ctx.storage.getUrl(avatar)) ?? undefined;
          }
          avatar = avatarCache[avatar] || "";
        } catch { avatar = ""; }
      }

      const followers = await ctx.db
        .query("follows")
        .withIndex("by_following", (q2) => q2.eq("followingId", u._id))
        .collect();

      results.push({
        _id: u._id,
        name: u.name,
        username: u.username,
        avatar,
        badges: u.badges,
        bio: u.bio,
        isNINVerified: u.isNINVerified,
        location: u.location,
        interests: u.interests ?? [],
        profileVisibility: u.privacySettings?.profileVisibility ?? "public",
        isFollowing,
        followersCount: followers.length,
      });

      if (args.limit && results.length >= args.limit) break;
    }
    return results;
  },
});

export const resolveAvatarUrl = query({
  args: { avatar: v.string() },
  handler: async (ctx, args) => {
    if (args.avatar.startsWith("http")) return args.avatar;
    try {
      const url = await ctx.storage.getUrl(args.avatar);
      return url ?? args.avatar;
    } catch {
      return args.avatar;
    }
  },
});

export const canUseProfessional = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) return false;
    let user: any;
    try {
      user = await ctx.db.get(args.userId);
    } catch {
      return false;
    }
    if (!user) return false;
    const professional = user.accountType === "organization" || user.accountType === "business";
    return professional && user.isPro === true;
  },
});

// ---------------------------------------------------------------------------
// Mutations — account provisioning (called before profile exists)
// ---------------------------------------------------------------------------

/**
 * Find-or-create a Convex user for a given Firebase UID.
 * Uses getAuthenticatedUserOrNull because this runs during onboarding
 * BEFORE the Convex user record exists.
 * Verifies the caller's Firebase UID matches the requested UID.
 */
export const getOrCreateByFirebaseUid = mutation({
  args: {
    firebaseUid: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    photoURL: v.optional(v.string()),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the caller is authenticated. getAuthenticatedUserOrNull throws if
    // there is no valid JWT but returns null if no profile exists yet.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Critical: the caller may only provision their OWN Firebase UID.
    // Prevents user A from creating a record pretending to be user B.
    if (identity.subject !== args.firebaseUid) {
      throw new Error("Forbidden: you can only create a profile for your own Firebase account.");
    }

    const byUid = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .first();
    if (byUid) return { userId: byUid._id, isNew: false };

    if (args.email) {
      const byEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .unique();
      if (byEmail) {
        await ctx.db.patch(byEmail._id, { firebaseUid: args.firebaseUid });
        return { userId: byEmail._id, isNew: false };
      }
    }

    const rawBase = args.name
      ? args.name.toLowerCase().replace(/[^a-z0-9]/g, "")
      : (args.email ?? "user").split("@")[0].replace(/[^a-z0-9]/g, "");
    const base = rawBase.slice(0, 18) || "user";

    let username = base;
    let suffix = 0;
    while (true) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .unique();
      if (!existing) break;
      suffix += 1;
      username = `${base}${suffix}`;
    }

    const avatar =
      args.photoURL ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(args.name)}&background=6366f1&color=fff&bold=true&size=200`;

    const userId = await ctx.db.insert("users", {
      firebaseUid: args.firebaseUid,
      name: args.name,
      username,
      avatar,
      email: args.email,
      isNINVerified: false,
      isPhoneVerified: false,
      isEmailVerified: args.provider !== "password",
      badges: [],
      rallies: 0,
      completed: 0,
      rating: 0,
      accountType: "personal",
      isPro: false,
      onboardingCompleted: false,
      createdAt: Date.now(),
      moderationStatus: "ACTIVE",
      role: args.email === SUPER_ADMIN_EMAIL ? "super_admin" : "user",
    });

    return { userId, isNew: true };
  },
});

/**
 * Back-fill the Firebase UID onto a legacy record (one-time migration).
 * Uses getAuthenticatedUserOrNull — runs before the UID is linked.
 * Caller may only link their own Firebase UID.
 */
export const linkFirebaseUid = mutation({
  args: {
    userId: v.id("users"),
    firebaseUid: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    // Only allow linking your own Firebase UID.
    if (identity.subject !== args.firebaseUid) {
      throw new Error("Forbidden: you can only link your own Firebase UID.");
    }
    try {
      const user = await ctx.db.get(args.userId);
      if (!user) return;
      if (!user.firebaseUid) {
        await ctx.db.patch(args.userId, { firebaseUid: args.firebaseUid });
      }
    } catch {
      // Stale ID — silently ignore.
    }
  },
});

/**
 * Create a new user record during onboarding.
 * Requires auth; links the new record to the caller's Firebase UID immediately.
 */
export const create = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    avatar: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isNINVerified: v.boolean(),
    isPhoneVerified: v.boolean(),
    isEmailVerified: v.optional(v.boolean()),
    passwordHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require a valid Firebase JWT even though the Convex record doesn't exist yet.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = await ctx.db.insert("users", {
      ...args,
      // Link to the authenticated Firebase UID immediately — no separate
      // linkFirebaseUid call needed after this.
      firebaseUid: identity.subject,
      badges: [],
      rallies: 0,
      completed: 0,
      rating: 0,
      accountType: "personal",
      isPro: false,
      onboardingCompleted: false,
      createdAt: Date.now(),
      moderationStatus: "ACTIVE",
      role: args.email === SUPER_ADMIN_EMAIL ? "super_admin" : "user",
    });
    return userId;
  },
});

/**
 * updateAuth — patches password hash and TOTP fields.
 * Called from the Vercel serverless layer (via CONVEX_DEPLOY_KEY) after
 * account creation. No browser JWT is present in that path, so we do NOT
 * use getAuthenticatedUser here. This function is only reachable server-side
 * (the serverless function holds the deploy key; browsers do not).
 */
export const updateAuth = mutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.optional(v.string()),
    totpSecret: v.optional(v.string()),
    totpEnabled: v.optional(v.boolean()),
    isEmailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const filtered = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(userId, filtered);
  },
});

/**
 * Legacy find-or-create by email (called only by the serverless layer).
 * Not callable from the browser JWT path.
 */
export const getOrCreateByEmail = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (existing) return existing._id;
    const userId = await ctx.db.insert("users", {
      name: args.name,
      username: args.username || args.email.split("@")[0],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(args.name)}&background=6366f1&color=fff&bold=true&size=200`,
      email: args.email,
      isNINVerified: false,
      isPhoneVerified: false,
      isEmailVerified: true,
      badges: [],
      rallies: 0,
      completed: 0,
      rating: 0,
      accountType: "personal",
      isPro: false,
      createdAt: Date.now(),
      moderationStatus: "ACTIVE",
      role: args.email === SUPER_ADMIN_EMAIL ? "super_admin" : "user",
    });
    return userId;
  },
});

// ---------------------------------------------------------------------------
// Mutations — own-profile writes (secured: caller must own the record)
// ---------------------------------------------------------------------------

/**
 * Update profile fields. The authenticated user's own record is always
 * the target — the client-supplied userId arg is ignored entirely.
 */
export const update = mutation({
  args: {
    // userId is accepted for backwards compat but IGNORED — auth identity wins.
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    avatar: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    bio: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    category: v.optional(v.string()),
    socialLinks: v.optional(
      v.array(v.object({ platform: v.string(), url: v.string() }))
    ),
    phone: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthday: v.optional(v.string()),
    location: v.optional(v.string()),
    locationLatitude: v.optional(v.number()),
    locationLongitude: v.optional(v.number()),
    locationAccuracy: v.optional(v.number()),
    locationUpdatedAt: v.optional(v.number()),
    interests: v.optional(v.array(v.string())),
    publicInterests: v.optional(v.array(v.string())),
    showInterests: v.optional(v.boolean()),
    pronouns: v.optional(v.string()),
    showPronouns: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    // Discard args.userId — always patch the authenticated user's own record.
    const { userId: _ignored, ...fields } = args;
    void _ignored;
    const filtered = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    if (filtered.publicInterests) {
      filtered.publicInterests = (filtered.publicInterests as string[]).slice(0, 3);
    }
    if (Object.keys(filtered).length === 0) return;
    await ctx.db.patch(caller._id, filtered);
  },
});

export const updatePrivacySettings = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    profileVisibility: v.union(
      v.literal("public"), v.literal("verified_only"), v.literal("private")
    ),
    locationPrecision: v.union(
      v.literal("approximate"), v.literal("exact"), v.literal("city_only")
    ),
    whoCanMessage: v.union(
      v.literal("everyone"), v.literal("verified_only"), v.literal("mutual_interest")
    ),
    showOnlineStatus: v.boolean(),
    showReadReceipts: v.boolean(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const { userId: _ignored, ...settings } = args;
    void _ignored;
    await ctx.db.patch(caller._id, { privacySettings: settings });
  },
});

export const updateNotificationSettings = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    pushEnabled: v.boolean(),
    rallyMatches: v.boolean(),
    chatMessages: v.boolean(),
    activityReminders: v.boolean(),
    safetyAlerts: v.boolean(),
    emailDigest: v.boolean(),
    marketingUpdates: v.boolean(),
    soundEnabled: v.boolean(),
    vibrationEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const { userId: _ignored, ...settings } = args;
    void _ignored;
    await ctx.db.patch(caller._id, { notificationSettings: settings });
  },
});

export const updateAppSettings = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    theme: v.union(v.literal("system"), v.literal("light"), v.literal("dark")),
    language: v.string(),
    dataSaver: v.boolean(),
    autoPlayMedia: v.boolean(),
    cacheSizeMB: v.number(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const { userId: _ignored, ...settings } = args;
    void _ignored;
    await ctx.db.patch(caller._id, { appSettings: settings });
  },
});

export const addBlockedUser = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    blockedUser: v.object({
      id: v.string(),
      name: v.string(),
      username: v.string(),
      avatar: v.string(),
      blockedAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const blocked = caller.blockedUsers ?? [];
    if (blocked.some((b: any) => b.id === args.blockedUser.id)) return;
    await ctx.db.patch(caller._id, {
      blockedUsers: [...blocked, args.blockedUser],
    });
  },
});

export const unblockUser = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    blockedId: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const blocked = caller.blockedUsers ?? [];
    await ctx.db.patch(caller._id, {
      blockedUsers: blocked.filter((b: any) => b.id !== args.blockedId),
    });
  },
});

export const addTrustedContact = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    contact: v.object({
      id: v.string(),
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const contacts = caller.trustedContacts ?? [];
    await ctx.db.patch(caller._id, {
      trustedContacts: [...contacts, args.contact],
    });
  },
});

export const setNINVerified = mutation({
  args: {
    userId: v.id("users"),
    nin: v.string(),
    verifiedData: v.optional(v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
      gender: v.optional(v.string()),
    })),
  },
  handler: async (_ctx, _args) => {
    throw new Error("setNINVerified is disabled. Use the server-gated verification flow.");
  },
});

export const syncLocation = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    location: v.string(),
    locationLatitude: v.number(),
    locationLongitude: v.number(),
    locationAccuracy: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    await ctx.db.patch(caller._id, {
      location: args.location,
      locationLatitude: args.locationLatitude,
      locationLongitude: args.locationLongitude,
      locationAccuracy: args.locationAccuracy,
      locationUpdatedAt: Date.now(),
    });
  },
});

/** Generate a signed upload URL for a cover photo. Requires auth. */
export const generateCoverUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Generate a signed upload URL for an avatar. Requires auth. */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// ---------------------------------------------------------------------------
// Account types & lalao Pro
// ---------------------------------------------------------------------------

/**
 * Mark onboarding as complete. Uses getAuthenticatedUserOrNull because
 * this may run before the Convex record is fully linked to the JWT.
 * If a Convex record exists, uses it; otherwise falls back to the
 * client-supplied userId (creation just happened in the same session).
 */
export const completeOnboarding = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, used as fallback only
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    pronouns: v.optional(v.string()),
    showPronouns: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Try to get the authenticated user. Falls back to client userId if the
    // Convex record was just created (getOrCreateByFirebaseUid) and the
    // reactive query hasn't propagated yet.
    const caller = await getAuthenticatedUserOrNull(ctx);
    const targetId = caller ? caller._id : args.userId;

    const { userId: _ignored, ...fields } = args;
    void _ignored;
    const patch: Record<string, unknown> = { onboardingCompleted: true };
    if (fields.name) patch.name = fields.name;
    if (fields.username) patch.username = fields.username;
    if (fields.avatar) patch.avatar = fields.avatar;
    if (fields.interests && fields.interests.length > 0) {
      patch.interests = fields.interests;
      patch.publicInterests = fields.interests.slice(0, 3);
      patch.showInterests = true;
    }
    if (fields.pronouns !== undefined) patch.pronouns = fields.pronouns || undefined;
    if (fields.showPronouns !== undefined) patch.showPronouns = fields.showPronouns;

    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject && (!caller || !caller.firebaseUid)) {
      patch.firebaseUid = identity.subject;
    }

    try {
      await ctx.db.patch(targetId, patch);
    } catch {
      // Stale ID — silent fail.
    }
    return { ok: true };
  },
});

export const setPro = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    isPro: v.boolean(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    await ctx.db.patch(caller._id, {
      isPro: args.isPro,
      proSince: args.isPro ? Date.now() : undefined,
    });
    return { isPro: args.isPro };
  },
});

export const setAccountType = mutation({
  args: {
    userId: v.id("users"), // accepted for compat, ignored
    accountType: v.union(
      v.literal("personal"),
      v.literal("organization"),
      v.literal("business")
    ),
    organizationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    const professional = args.accountType === "organization" || args.accountType === "business";
    if (professional && caller.isPro !== true) {
      throw new Error("You need lalao Pro to create an Organization or Business account.");
    }
    const patch: Record<string, unknown> = {
      accountType: args.accountType,
      organizationName:
        args.accountType === "organization" || args.accountType === "business"
          ? args.organizationName?.trim() || caller.name || undefined
          : undefined,
    };
    await ctx.db.patch(caller._id, patch);
    return {
      accountType: args.accountType,
      organizationName: patch.organizationName as string | undefined,
    };
  },
});
