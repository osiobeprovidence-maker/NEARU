import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    username: v.string(),
    avatar: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    nin: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthday: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
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
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
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
  }).index("by_username", ["username"]).index("by_email", ["email"]),

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
    creatorId: v.id("users"),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("LIVE"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED")
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
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    mediaStorageId: v.optional(v.string()),
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
  })
    .index("by_status", ["status"])
    .index("by_city", ["city"])
    .index("by_creator", ["creatorId"])
    .index("by_interest", ["interest"])
    .index("by_rally_link", ["rallyLinkId"]),

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
  }).index("by_conversation", ["conversationId"]),

  ads: defineTable({
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
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
    rallyId: v.optional(v.id("rallies")),
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
    createdAt: v.number(),
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
});
