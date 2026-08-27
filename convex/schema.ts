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
    type: v.union(v.literal("ASK"), v.literal("HELP"), v.literal("JOIN")),
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
      v.literal("COMPLETED"),
      v.literal("CANCELLED")
    ),
    createdAt: v.number(),
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
  })
    .index("by_status", ["status"])
    .index("by_city", ["city"])
    .index("by_creator", ["creatorId"]),

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
    rallyId: v.id("rallies"),
    message: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("ACCEPTED"),
      v.literal("DECLINED")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_toUser", ["toUserId", "status"])
    .index("by_fromUser", ["fromUserId"])
    .index("by_pair", ["fromUserId", "toUserId", "rallyId"]),

  conversations: defineTable({
    rallyId: v.id("rallies"),
    rallyTitle: v.string(),
    participantIds: v.array(v.id("users")),
    lastMessage: v.object({
      senderId: v.string(),
      text: v.string(),
      timestamp: v.number(),
    }),
    unreadCount: v.number(),
  }).index("by_rally", ["rallyId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
    timestamp: v.number(),
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
});
