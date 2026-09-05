import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    username: v.string(),
    avatar: v.string(),
    // Stable Firebase UID — the primary identity key since Google/OAuth users
    // may not always have an email address. Written once at account creation
    // and never changed. Indexed for O(1) lookups on every auth state change.
    // Legacy users created before this field was added will have it populated
    // the first time they sign in (via the migration path in AuthContext).
    firebaseUid: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    nin: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthday: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    moderationStatus: v.optional(
      v.union(
        v.literal("ACTIVE"),
        v.literal("SUSPENDED"),
        v.literal("BANNED")
      )
    ),
    interests: v.optional(v.array(v.string())),
    // Up to 3 interest tags the user opts to show on their public profile.
    // Kept separate from the private `interests` list which stays private and
    // is only ever used for recommendations/personalization.
    publicInterests: v.optional(v.array(v.string())),
    isNINVerified: v.boolean(),
    isPhoneVerified: v.boolean(),
    isEmailVerified: v.optional(v.boolean()),
    passwordHash: v.optional(v.string()),
    totpSecret: v.optional(v.string()),
    totpEnabled: v.optional(v.boolean()),
    role: v.optional(v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("user")
    )),
    badges: v.optional(v.array(v.string())),
    // Account type: personal (default) vs professional (organization/business).
    // Professional account types require lalao Pro (isPro === true).
    accountType: v.optional(
      v.union(
        v.literal("personal"),
        v.literal("organization"),
        v.literal("business")
      )
    ),
    isPro: v.optional(v.boolean()),
    proSince: v.optional(v.number()),
    organizationName: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    // Organization / business page profile: an industry tag shown on the page,
    // a longer "About" description, the official website, and external social
    // profile links. Social platforms are free-form strings so unknown ones can
    // still be rendered with a generic link icon.
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    socialLinks: v.optional(
      v.array(
        v.object({
          platform: v.string(),
          url: v.string(),
        })
      )
    ),
    // Cover photo for the profile header (Convex storage id or URL).
    // Available to every account type, not just professional pages.
    coverImage: v.optional(v.string()),
    // Pronouns — user's self-selected pronoun set, stored as a free-form
    // string (e.g. "He/Him", "She/Her", "They/Them", or custom text).
    // Optional and never inferred from any other field. Defaults to not shown.
    pronouns: v.optional(v.string()),
    // Whether the pronoun is shown publicly on the profile. Defaults to false
    // so pronouns are private unless the user explicitly opts in.
    showPronouns: v.optional(v.boolean()),
    // True once the user has completed the initial onboarding wizard.
    // New accounts start with this unset (falsy). Existing accounts without
    // this field are treated as completed so they are not re-onboarded.
    onboardingCompleted: v.optional(v.boolean()),
    // Phase 2: whether this user is okay with their interest tags shown on
    // their public profile. Defaults to true. Interests always remain usable
    // for recommendations regardless of this flag.
    showInterests: v.optional(v.boolean()),
    locationLatitude: v.optional(v.number()),
    locationLongitude: v.optional(v.number()),
    locationAccuracy: v.optional(v.number()),
    locationUpdatedAt: v.optional(v.number()),
    rallies: v.optional(v.number()),
    completed: v.optional(v.number()),
    rating: v.optional(v.number()),
    privacySettings: v.optional(
      v.object({
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
      })
    ),
    notificationSettings: v.optional(
      v.object({
        pushEnabled: v.boolean(),
        rallyMatches: v.boolean(),
        chatMessages: v.boolean(),
        activityReminders: v.boolean(),
        safetyAlerts: v.boolean(),
        emailDigest: v.boolean(),
        marketingUpdates: v.boolean(),
        soundEnabled: v.boolean(),
        vibrationEnabled: v.boolean(),
      })
    ),
    appSettings: v.optional(
      v.object({
        theme: v.union(
          v.literal("system"),
          v.literal("light"),
          v.literal("dark")
        ),
        language: v.string(),
        dataSaver: v.boolean(),
        autoPlayMedia: v.boolean(),
        cacheSizeMB: v.number(),
      })
    ),
    trustedContacts: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          phone: v.string(),
          relationship: v.string(),
        })
      )
    ),
    blockedUsers: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          username: v.string(),
          avatar: v.string(),
          blockedAt: v.string(),
        })
      )
    ),
  })
    .index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_firebase_uid", ["firebaseUid"]),

  rallies: defineTable({
    type: v.union(v.literal("ASK"), v.literal("HELP"), v.literal("JOIN"), v.literal("EVENT"), v.literal("POST")),
    title: v.string(),
    description: v.string(),
    distance: v.number(),
    time: v.string(),
    peopleNeeded: v.number(),
    peopleInterested: v.number(),
    isPaid: v.boolean(),
    price: v.optional(v.number()),
    // Access model: 'free' = FREE, 'paid' = charged admission, 'none' = no
    // admission fee applied. Kept alongside legacy isPaid/price for backwards
    // compatibility with existing data and the rest of the product.
    pricing: v.optional(
      v.union(v.literal("free"), v.literal("paid"), v.literal("none"))
    ),
    creatorId: v.id("users"),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("LIVE"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED")
    ),
    // Admin moderation lifecycle, independent of the public `status`.
    // PENDING = awaiting review, APPROVED = cleared, HIDDEN/FLAGGED/REMOVED =
    // moderation actions taken by staff. HIDDEN and REMOVED also flip status so
    // the item drops out of public feeds.
    moderationStatus: v.optional(
      v.union(
        v.literal("PENDING"),
        v.literal("APPROVED"),
        v.literal("HIDDEN"),
        v.literal("FLAGGED"),
        v.literal("REMOVED")
      )
    ),
    createdAt: v.number(),
    // Event hub: a unique, human-identifiable event tag (e.g. "#RydersCup")
    // generated at creation. Links event Posts back to this RALLY.
    eventTag: v.optional(v.string()),
    // Event hub: one or more interests relevant to the event (e.g. "Tech &
    // Gaming"). Distinct from a POST's single `interest` — this is Rally-level.
    interests: v.optional(v.array(v.string())),
    // Event hub scoring model, kept extensible. "sum_scores" aggregates the
    // highest approved score per match for each participant.
    scoring: v.optional(
      v.union(
        v.literal("sum_scores"),
        v.literal("matches_won"),
        v.literal("total_points")
      )
    ),
    city: v.optional(v.string()),
    locationLabel: v.optional(v.string()),
    rallyLatitude: v.optional(v.number()),
    rallyLongitude: v.optional(v.number()),
    category: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    eventDate: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    mediaStorageId: v.optional(v.string()),
    mediaStorageIds: v.optional(v.array(v.string())),
    // Mux video: a video uploaded via Mux direct upload resolves to a playback
    // id/asset id once transcoding completes. playbackId drives the player.
    muxUploadId: v.optional(v.string()),
    muxAssetId: v.optional(v.string()),
    muxPlaybackId: v.optional(v.string()),
    capacity: v.optional(v.number()),
    endTime: v.optional(v.string()),
    // Phase 1: interest tag — only set on POST type when creator picks an interest.
    // A POST with an interest becomes an "Interest Post" eligible for
    // interest-based distribution (not location-restricted).
    // A POST without this field is a "Normal Post" (local + following).
    // RALLY types never use this field — they remain location-bound.
    interest: v.optional(v.string()),
    // Event hub: when this POST belongs to a RALLY event, the id of the event
    // RALLY. Used for event discovery + event Posts. Name avoids confusion with
    // the `creatorId`/`rallyId` used in messaging/notifications.
    rallyLinkId: v.optional(v.id("rallies")),
    // Identity and Page Posting Architecture:
    // authorType: "user" (default) or "page".
    // When authorType === "page", pageId points to the Page, and created_by_user_id records the admin who published it.
    authorType: v.optional(v.union(v.literal("user"), v.literal("page"))),
    pageId: v.optional(v.id("pages")),
    created_by_user_id: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_city", ["city"])
    .index("by_creator", ["creatorId"])
    .index("by_interest", ["interest"])
    .index("by_rally_link", ["rallyLinkId"])
    .index("by_page", ["pageId"]),

  // Independent Brand/Community Pages (separate from personal user profiles)
  pages: defineTable({
    name: v.string(),
    slug: v.string(), // lowercase handle, e.g. "footballhub"
    category: v.string(),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    creatorId: v.id("users"), // original creator / super-owner
    isVerified: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_creator", ["creatorId"]),

  // Page roles & permissions (owner, admin, editor, moderator)
  pageMembers: defineTable({
    pageId: v.id("pages"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("editor"),
      v.literal("moderator")
    ),
    createdAt: v.number(),
  })
    .index("by_page", ["pageId"])
    .index("by_user", ["userId"])
    .index("by_page_user", ["pageId", "userId"]),

  // Followers of a Page
  pageFollows: defineTable({
    pageId: v.id("pages"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_page", ["pageId"])
    .index("by_user", ["userId"])
    .index("by_page_user", ["pageId", "userId"]),

  // Event hub: a user who JOINED a RALLY (participating). Distinct from
  // following. Indexed to prevent duplicate participation.
  rallyParticipants: defineTable({
    rallyId: v.id("rallies"),
    userId: v.id("users"),
    role: v.union(v.literal("organizer"), v.literal("participant")),
    joinedAt: v.number(),
  })
    .index("by_rally", ["rallyId"])
    .index("by_user", ["userId"])
    .index("by_rally_user", ["rallyId", "userId"]),

  // Event hub: a user who FOLLOWS a RALLY (wants updates). Not a participant.
  rallyFollowers: defineTable({
    rallyId: v.id("rallies"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_rally", ["rallyId"])
    .index("by_user", ["userId"])
    .index("by_rally_user", ["rallyId", "userId"]),

  // Event hub: a result submitted by a participant. It never directly mutates
  // the official leaderboard — only APPROVED results do (enforced server-side).
  rallyResults: defineTable({
    rallyId: v.id("rallies"),
    userId: v.id("users"),
    match: v.string(),
    score: v.number(),
    opponent: v.optional(v.string()),
    // Evidence (Convex storage id) uploaded by the submitter, optional.
    evidenceStorageId: v.optional(v.string()),
    status: v.union(
      v.literal("PENDING"),
      v.literal("APPROVED"),
      v.literal("REJECTED")
    ),
    organizerNote: v.optional(v.string()),
    submittedAt: v.number(),
    decidedAt: v.optional(v.number()),
    decidedBy: v.optional(v.id("users")),
  })
    .index("by_rally", ["rallyId", "status"])
    .index("by_rally_user", ["rallyId", "userId", "status"]),

  // Event hub: official announcements published by the organizer. Distinguished
  // from ordinary community Posts.
  rallyAnnouncements: defineTable({
    rallyId: v.id("rallies"),
    authorId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_rally", ["rallyId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_pair", ["followerId", "followingId"]),

  chatRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    // Phase 3: rallyId is only set for rally-context requests; direct DMs
    // leave it unset and set type: "direct".
    rallyId: v.optional(v.id("rallies")),
    type: v.optional(
      v.union(
        v.literal("direct"),
        v.literal("rally")
      )
    ),
    message: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("ACCEPTED"),
      v.literal("DECLINED"),
      v.literal("CANCELLED")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_toUser", ["toUserId", "status"])
    .index("by_fromUser", ["fromUserId"])
    .index("by_pair", ["fromUserId", "toUserId"])
    .index("by_pair_rally", ["fromUserId", "toUserId", "rallyId"]),

  conversations: defineTable({
    // Phase 3: "direct" = 1:1 mutual-follow or accepted-request DM;
    // "rally" = RALLY participant chat scoped to a rally.
    type: v.optional(
      v.union(
        v.literal("direct"),
        v.literal("rally")
      )
    ),
    // Sorted "<lowerId>:<higherId>" pair key for direct conversations,
    // enabling a unique index to find-or-create without duplicates.
    directKey: v.optional(v.string()),
    rallyId: v.optional(v.id("rallies")),
    rallyTitle: v.optional(v.string()),
    participantIds: v.array(v.id("users")),
    lastMessage: v.object({
      senderId: v.string(),
      text: v.string(),
      timestamp: v.number(),
    }),
    unreadCount: v.number(),
    // Phase 3: per-user unread counts and last-read timestamps for
    // distinguishing Sent / Delivered / Read.
    unreadByUser: v.optional(v.record(v.string(), v.number())),
    lastRead: v.optional(v.record(v.string(), v.number())),
  })
    .index("by_rally", ["rallyId"])
    .index("by_direct_key", ["directKey"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
    timestamp: v.number(),
    // Phase 3: which participants have read this message (Read status).
    readByIds: v.optional(v.array(v.id("users"))),
    // Voice note: audio blob in Convex storage + its length in seconds.
    audioStorageId: v.optional(v.string()),
    audioDuration: v.optional(v.number()),
  }).index("by_conversation", ["conversationId"]),

  ads: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive", "displayOrder"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    rallyId: v.optional(v.id("rallies")),
    senderId: v.optional(v.id("users")),
    conversationId: v.optional(v.id("conversations")),
    icon: v.optional(v.string()),
    data: v.optional(v.any()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "read"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_rally", ["rallyId"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    platform: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]).index("by_endpoint", ["endpoint"]),

  verifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    provider: v.string(),
    amountKobo: v.number(),
    currency: v.string(),
    customerAmountKobo: v.number(),
    providerCostKobo: v.number(),
    grossMarginKobo: v.number(),
    paymentReference: v.string(),
    paymentStatus: v.union(
      v.literal("CREATED"),
      v.literal("PAYMENT_PENDING"),
      v.literal("PAYMENT_SUCCESS"),
      v.literal("PAYMENT_FAILED"),
      v.literal("REFUNDED")
    ),
    verificationStatus: v.union(
      v.literal("NOT_STARTED"),
      v.literal("VERIFICATION_PENDING"),
      v.literal("VERIFIED"),
      v.literal("VERIFICATION_FAILED"),
      v.literal("PROVIDER_ERROR")
    ),
    ninjaReference: v.optional(v.string()),
    ninHash: v.optional(v.string()),
    pendingNin: v.optional(v.string()),
    resultData: v.optional(v.any()),
    failureReason: v.optional(v.string()),
    paystackReference: v.optional(v.string()),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
    verifiedAt: v.optional(v.number()),
    updatedAt: v.number(),
    verifiedFirstName: v.optional(v.string()),
    verifiedLastName: v.optional(v.string()),
    verifiedDob: v.optional(v.string()),
  })
    .index("by_payment_reference", ["paymentReference"])
    .index("by_user", ["userId"])
    .index("by_status", ["verificationStatus"])
    .index("by_user_created", ["userId", "createdAt"]),

  likes: defineTable({
    userId: v.id("users"),
    rallyId: v.id("rallies"),
    createdAt: v.number(),
  })
    .index("by_rally", ["rallyId"])
    .index("by_user_rally", ["userId", "rallyId"]),

  comments: defineTable({
    userId: v.id("users"),
    rallyId: v.id("rallies"),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_rally", ["rallyId"]),

  rsvps: defineTable({
    userId: v.id("users"),
    rallyId: v.id("rallies"),
    createdAt: v.number(),
  })
    .index("by_rally", ["rallyId"])
    .index("by_user_rally", ["userId", "rallyId"]),

  ratings: defineTable({
    // User who submitted the rating
    raterId: v.id("users"),
    // User being rated
    ratedUserId: v.id("users"),
    // The rally the interaction happened through
    rallyId: v.optional(v.id("rallies")),
    score: v.number(),          // 1–5
    review: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_rater", ["raterId"])
    .index("by_rated_user", ["ratedUserId"])
    .index("by_rater_rated", ["raterId", "ratedUserId"]),

  // User reports / flags raised from the app or surfaced to the admin CRM.
  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.union(
      v.literal("user"),
      v.literal("rally"),
      v.literal("organization")
    ),
    targetId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("PENDING"),
      v.literal("UNDER_REVIEW"),
      v.literal("RESOLVED"),
      v.literal("DISMISSED"),
      v.literal("ESCALATED")
    ),
    assigneeId: v.optional(v.id("users")),
    notes: v.optional(
      v.array(
        v.object({
          adminId: v.id("users"),
          text: v.string(),
          createdAt: v.number(),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_reporter", ["reporterId"]),

  // Admin action trail. Every moderation/settings action writes a row here.
  auditLogs: defineTable({
    adminId: v.id("users"),
    adminName: v.optional(v.string()),
    action: v.string(),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  // Single-document admin system configuration. Read/updated by the System
  // Settings page; write gated to admins via the serverless layer.
  systemSettings: defineTable({
    platformName: v.string(),
    defaultRadiusKm: v.number(),
    supportedCities: v.array(v.string()),
    autoApproveRallies: v.boolean(),
    requireEmailVerification: v.boolean(),
    autoVerifyPhone: v.boolean(),
    maintenanceMode: v.boolean(),
    // Branding customization (optional; applied across the user-facing app)
    brandLogoUrl: v.optional(v.string()),
    brandIconUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    appIconUrl: v.optional(v.string()),
    splashScreenUrl: v.optional(v.string()),
    splashBgColor: v.optional(v.string()),
    brandFont: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    typography: v.optional(
      v.object({
        fontFamily: v.string(),
        headingWeight: v.string(),
        bodyWeight: v.string(),
        customFontUrl: v.optional(v.string()),
      })
    ),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }),

  // Messaging Emoji / Sticker Packs
  emojiPacks: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.string(),
    category: v.optional(v.string()),
    isActive: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_order", ["displayOrder"]),

  // Emoji / Sticker items in packs
  emojiItems: defineTable({
    packId: v.id("emojiPacks"),
    name: v.string(),
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("animated")),
    displayOrder: v.number(),
    createdAt: v.number(),
  }).index("by_pack", ["packId", "displayOrder"]),

  // Custom typography fonts
  customFonts: defineTable({
    fontFamily: v.string(),
    fileUrl: v.string(),
    format: v.union(v.literal("woff2"), v.literal("woff"), v.literal("ttf"), v.literal("otf")),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_active", ["isActive"]),

  // Admin broadcast log: one row per send, with the fan-out count.
  broadcastBatches: defineTable({
    adminId: v.id("users"),
    title: v.string(),
    body: v.string(),
    type: v.optional(v.string()),
    audience: v.union(
      v.literal("ALL"),
      v.literal("VERIFIED"),
      v.literal("PLUS"),
      v.literal("SPECIFIC")
    ),
    targetUserIds: v.optional(v.array(v.id("users"))),
    recipientCount: v.number(),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),
});
