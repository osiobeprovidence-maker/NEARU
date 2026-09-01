import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const SUPER_ADMIN_EMAIL = "riderezzy@gmail.com";

// Never send auth secrets (password hash, TOTP secret) to the browser, from
// any query that returns a user document. These are only written server-side.
function redact(user: any) {
  if (!user) return user;
  const { passwordHash, totpSecret, ...safe } = user;
  void passwordHash;
  void totpSecret;
  return safe;
}

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
    // Optional viewer. When provided and not the owner of the profile, the
    // private interest list is redacted so it is never sent to visitors.
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user: any;
    try {
      user = await ctx.db.get(args.userId);
    } catch {
      // Stale or malformed ID (e.g. from a previous deployment or corrupted
      // localStorage) — treat as not-found rather than crashing.
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
    // Private interests only travel to the owner of the account.
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

/**
 * View-aware profile serialization.
 *
 * Returns a single DTO that distinguishes OWNER vs PUBLIC viewers, so that
 * privacy-sensitive fields are enforced server-side (never just hidden in CSS):
 *
 *  - OWNER: full identity, private interest list (interests), the showInterests
 *    setting, and their own Following count.
 *  - PUBLIC: only bio/location/gender, interests ONLY if showInterests is not
 *    false, posts + followers counts, and the follow/message relationship.
 *    The Following count is NEVER returned to a public viewer, and no list of
 *    accounts the owner follows is ever exposed.
 */
export const getProfile = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Guard against stale / malformed Convex IDs cached in localStorage from a
    // previous session or deployment. ctx.db.get throws an internal error on an
    // ID that belongs to a different deployment; we surface that as null (no
    // profile) so the frontend can recover gracefully instead of crashing.
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

    // Posts count = content created by this user (canonical source).
    const allCreated = await ctx.db
      .query("rallies")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();
    const postsCount = allCreated.length;

    // Follower count = users who follow this profile owner.
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

    // ----- OWNER VIEW -----
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
        // Owner can always see their own interests regardless of privacy toggle.
        interestsVisible: user.interests && user.interests.length > 0 ? true : false,
        followingList: undefined,
        isFollowing: false,
        canFollow: false,
      };
    }

    // ----- PUBLIC VIEW -----
    // Interests are only exposed when the owner opted in via "showInterests".
    const showInterests = user.showInterests !== false;
    const publicInterests = (user.publicInterests && user.publicInterests.length > 0
      ? user.publicInterests
      : (user.interests ?? [])
    ).slice(0, 3).filter(Boolean);
    const interests = showInterests ? publicInterests : [];

    // Whether the viewer follows the owner (for the Follow/Following button).
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
      // Strictly NO following count / no following list for public viewers.
      followingCount: undefined,
      followingList: undefined,
      isFollowing,
      canFollow: !isSelf && !!args.viewerId,
    };
  },
});

/**
 * Look up a user by their stable Firebase UID.
 * This is the primary lookup path for all signed-in users.
 * Returns null (never throws) for unknown or missing UIDs.
 */
export const getByFirebaseUid = query({
  args: { firebaseUid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.firebaseUid))
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

/**
 * Find-or-create a Convex user for a given Firebase UID.
 * Lookup order (prevents duplicates):
 *   1. by firebaseUid index (fast path, new and returning accounts)
 *   2. by email index (migration path for legacy users created before this field)
 *   3. create a new record
 *
 * When an existing email-only record is found, the firebaseUid is written
 * back so future lookups always hit the fast path.
 *
 * photoURL is only used on FIRST create — it never overwrites a
 * user-customised LALAO avatar after initial account creation.
 */
export const getOrCreateByFirebaseUid = mutation({
  args: {
    firebaseUid: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    photoURL: v.optional(v.string()),
    provider: v.string(), // "google" | "password" | "emailLink"
  },
  handler: async (ctx, args) => {
    // 1. Fast path — uid already linked
    const byUid = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .unique();
    if (byUid) return { userId: byUid._id, isNew: false };

    // 2. Migration path — legacy record exists only by email
    if (args.email) {
      const byEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .unique();
      if (byEmail) {
        // Back-fill the firebaseUid so this branch is never needed again.
        await ctx.db.patch(byEmail._id, { firebaseUid: args.firebaseUid });
        return { userId: byEmail._id, isNew: false };
      }
    }

    // 3. New user — build a sensible username from name or email
    const rawBase = args.name
      ? args.name.toLowerCase().replace(/[^a-z0-9]/g, "")
      : (args.email ?? "user").split("@")[0].replace(/[^a-z0-9]/g, "");
    const base = rawBase.slice(0, 18) || "user";

    // Ensure username is unique by appending a short numeric suffix when needed.
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
      isEmailVerified: args.provider !== "password", // Google accounts are pre-verified
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

    return { userId, isNew: true };
  },
});

/**
 * Write the Firebase UID onto an existing user record that was created
 * before this field existed (one-time migration, called from AuthContext).
 */
export const linkFirebaseUid = mutation({
  args: {
    userId: v.id("users"),
    firebaseUid: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.userId);
      if (!user) return;
      if (!user.firebaseUid) {
        await ctx.db.patch(args.userId, { firebaseUid: args.firebaseUid });
      }
    } catch {
      // Stale ID — silently ignore, migration retries next session.
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
          // Stale or invalid ID — skip rather than crash.
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

/**
 * Phase 2: discover/search people for the Explore "People" surface and
 * interest discovery. Returns lightweight user cards with follow status.
 *
 * Visibility rules (no search loophole):
 *  - The viewer is excluded.
 *  - Anyone the viewer has blocked is excluded.
 *  - Users whose profileVisibility === "private" are only returned when the
 *    viewer already follows them (they are never surfaced in open discovery).
 *  - filteredInterests: if provided (e.g. viewing an interest page), only
 *    users who selected that interest are returned.
 */
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
    const viewerBlockedDb = new Set<string>();

    const viewerFollowing = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.viewerId))
      .collect();
    const followingSet = new Set(
      viewerFollowing.map((f) => f.followingId.toString())
    );

    const all = await ctx.db.query("users").collect();
    const q = (args.query ?? "").toLowerCase().trim();

    const results: any[] = [];
    const avatarCache: Record<string, string | undefined> = {};

    for (const u of all) {
      if (u._id.toString() === args.viewerId.toString()) continue;
      if (viewerBlockedIds.has(u._id.toString())) continue;

      const isFollowing = followingSet.has(u._id.toString());

      // Private accounts are hidden from open discovery unless following
      if (u.privacySettings?.profileVisibility === "private" && !isFollowing) {
        continue;
      }

      // Interest filter
      if (args.filteredInterest) {
        const interest = (u.interests ?? []).some(
          (i) => i.toLowerCase() === args.filteredInterest.toLowerCase()
        );
        if (!interest) continue;
      }

      // Text filter on name / username
      if (q) {
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.username.toLowerCase().includes(q)
        ) {
          continue;
        }
      }

      let avatar = u.avatar || "";
      if (avatar && !avatar.startsWith("http")) {
        try {
          if (!(avatar in avatarCache)) {
            avatarCache[avatar] = (await ctx.storage.getUrl(avatar)) ?? undefined;
          }
          avatar = avatarCache[avatar] || "";
        } catch {
          avatar = "";
        }
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
    const userId = await ctx.db.insert("users", {
      ...args,
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

export const update = mutation({
  args: {
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
      v.array(
        v.object({
          platform: v.string(),
          url: v.string(),
        })
      )
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
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const filtered = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    // Never let more than 3 interests go public through this mutation.
    if (filtered.publicInterests) {
      filtered.publicInterests = (filtered.publicInterests as string[]).slice(0, 3);
    }
    if (Object.keys(filtered).length === 0) return;
    try {
      await ctx.db.patch(userId, filtered);
    } catch {
      // Document may not exist (stale id); fail silently rather than crashing
      // the caller. The UI will re-sync on the next getByEmail query.
    }
  },
});

export const generateCoverUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
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

export const updatePrivacySettings = mutation({
  args: {
    userId: v.id("users"),
    profileVisibility: v.union(
      v.literal("public"),
      v.literal("verified_only"),
      v.literal("private")
    ),
    locationPrecision: v.union(
      v.literal("approximate"),
      v.literal("exact"),
      v.literal("city_only")
    ),
    whoCanMessage: v.union(
      v.literal("everyone"),
      v.literal("verified_only"),
      v.literal("mutual_interest")
    ),
    showOnlineStatus: v.boolean(),
    showReadReceipts: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, ...settings } = args;
    await ctx.db.patch(userId, { privacySettings: settings });
  },
});

export const updateNotificationSettings = mutation({
  args: {
    userId: v.id("users"),
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
    const { userId, ...settings } = args;
    await ctx.db.patch(userId, { notificationSettings: settings });
  },
});

export const updateAppSettings = mutation({
  args: {
    userId: v.id("users"),
    theme: v.union(
      v.literal("system"),
      v.literal("light"),
      v.literal("dark")
    ),
    language: v.string(),
    dataSaver: v.boolean(),
    autoPlayMedia: v.boolean(),
    cacheSizeMB: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, ...settings } = args;
    await ctx.db.patch(userId, { appSettings: settings });
  },
});

export const addBlockedUser = mutation({
  args: {
    userId: v.id("users"),
    blockedUser: v.object({
      id: v.string(),
      name: v.string(),
      username: v.string(),
      avatar: v.string(),
      blockedAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const blocked = user.blockedUsers ?? [];
    if (blocked.some((b) => b.id === args.blockedUser.id)) return;
    await ctx.db.patch(args.userId, {
      blockedUsers: [...blocked, args.blockedUser],
    });
  },
});

export const unblockUser = mutation({
  args: {
    userId: v.id("users"),
    blockedId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const blocked = user.blockedUsers ?? [];
    await ctx.db.patch(args.userId, {
      blockedUsers: blocked.filter((b) => b.id !== args.blockedId),
    });
  },
});

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

export const addTrustedContact = mutation({
  args: {
    userId: v.id("users"),
    contact: v.object({
      id: v.string(),
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const contacts = user.trustedContacts ?? [];
    await ctx.db.patch(args.userId, {
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
  handler: async (ctx, args) => {
    // Deprecated: the paid verification flow is server-gated.
    throw new Error("setNINVerified is disabled. Use the server-gated verification flow.");
  },
});

export const syncLocation = mutation({
  args: {
    userId: v.id("users"),
    location: v.string(),
    locationLatitude: v.number(),
    locationLongitude: v.number(),
    locationAccuracy: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      location: args.location,
      locationLatitude: args.locationLatitude,
      locationLongitude: args.locationLongitude,
      locationAccuracy: args.locationAccuracy,
      locationUpdatedAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// Account types & lalao Pro
// ---------------------------------------------------------------------------

/**
 * Grant or revoke lalao Pro. Billing is deferred to a later Paystack phase;
 * until then this is the explicit upgrade path (called from the Plus page).
 */
export const setPro = mutation({
  args: {
    userId: v.id("users"),
    isPro: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isPro: args.isPro,
      proSince: args.isPro ? Date.now() : undefined,
    });
    return { isPro: args.isPro };
  },
});

/**
 * Set the account type (personal | organization | business).
 * Professional account types (organization/business) require lalao Pro.
 * Default for all users is "personal".
 */
export const setAccountType = mutation({
  args: {
    userId: v.id("users"),
    accountType: v.union(
      v.literal("personal"),
      v.literal("organization"),
      v.literal("business")
    ),
    organizationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user: any;
    try {
      user = await ctx.db.get(args.userId);
    } catch {
      return null;
    }
    if (!user) throw new Error("User not found");

    const professional = args.accountType === "organization" || args.accountType === "business";
    if (professional && user.isPro !== true) {
      throw new Error("You need lalao Pro to create an Organization or Business account.");
    }

    const patch: Record<string, unknown> = {
      accountType: args.accountType,
      organizationName:
        args.accountType === "organization" || args.accountType === "business"
          ? args.organizationName?.trim() || user.name || undefined
          : undefined,
    };
    await ctx.db.patch(args.userId, patch);
    return {
      accountType: args.accountType,
      organizationName: patch.organizationName as string | undefined,
    };
  },
});

/**
 * Whether the user is allowed to act as a professional (organization/business)
 * account. Used by the frontend to gate org-only features.
 */
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


