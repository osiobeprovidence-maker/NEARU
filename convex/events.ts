import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./lib/auth";

/**
 * Ensures the user has permission to manage the given page.
 * Returns the page member object if successful, throws otherwise.
 */
async function requirePageManager(ctx: any, pageId: string) {
  const user = await getAuthenticatedUser(ctx);
  const member = await ctx.db
    .query("pageMembers")
    .withIndex("by_page_user", (q: any) => q.eq("pageId", pageId).eq("userId", user._id))
    .first();
  
  if (!member || (member.role !== "admin" && member.role !== "owner")) {
    throw new Error("Unauthorized: You do not have permission to manage this organization.");
  }
  
  return { user, member };
}

export const createEvent = mutation({
  args: {
    pageId: v.id("pages"),
    name: v.string(),
    game: v.string(),
    description: v.optional(v.string()),
    bannerStorageId: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    location: v.optional(v.string()),
    isOnline: v.boolean(),
    registrationType: v.union(v.literal("team"), v.literal("individual")),
    registrationOpeningDate: v.optional(v.string()),
    registrationClosingDate: v.optional(v.string()),
    maxTeams: v.optional(v.number()),
    minPlayersPerTeam: v.optional(v.number()),
    maxPlayersPerTeam: v.optional(v.number()),
    maxSubstitutes: v.optional(v.number()),
    requireApproval: v.boolean(),
    entryRequirements: v.optional(v.string()),
    prizePool: v.optional(v.string()),
    rules: v.optional(v.string()),
    contactInfo: v.optional(v.string()),
    publishImmediately: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePageManager(ctx, args.pageId);

    let bannerUrl = undefined;
    if (args.bannerStorageId) {
      bannerUrl = await ctx.storage.getUrl(args.bannerStorageId) ?? undefined;
    }

    const eventId = await ctx.db.insert("events", {
      pageId: args.pageId,
      name: args.name,
      game: args.game,
      description: args.description,
      bannerStorageId: args.bannerStorageId,
      bannerUrl,
      eventDate: args.eventDate,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
      isOnline: args.isOnline,
      registrationType: args.registrationType,
      registrationOpeningDate: args.registrationOpeningDate,
      registrationClosingDate: args.registrationClosingDate,
      maxTeams: args.maxTeams,
      minPlayersPerTeam: args.minPlayersPerTeam,
      maxPlayersPerTeam: args.maxPlayersPerTeam,
      maxSubstitutes: args.maxSubstitutes,
      requireApproval: args.requireApproval,
      entryRequirements: args.entryRequirements,
      prizePool: args.prizePool,
      rules: args.rules,
      contactInfo: args.contactInfo,
      status: args.publishImmediately ? "Published" : "Draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user._id,
    });

    return eventId;
  },
});

export const updateEventStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("Draft"),
      v.literal("Published"),
      v.literal("Registration Open"),
      v.literal("Registration Closed"),
      v.literal("Completed")
    ),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    await requirePageManager(ctx, event.pageId);

    await ctx.db.patch(args.eventId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const getOrganizationEvents = query({
  args: {
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .order("desc")
      .collect();

    // Fetch registration counts for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const registrations = await ctx.db
          .query("eventRegistrations")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        const approvedRegistrations = registrations.filter(r => r.status === "Approved").length;

        return {
          ...event,
          registrationCount: registrations.length,
          approvedTeamsCount: approvedRegistrations,
        };
      })
    );

    return eventsWithStats;
  },
});

export const getEvent = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const page = await ctx.db.get(event.pageId);
    return { ...event, page };
  },
});

export const getEventRegistrations = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const registrationsWithTeams = await Promise.all(
      registrations.map(async (reg) => {
        if (!reg.teamId) return reg; // Handle individual registrations later
        
        const team = await ctx.db.get(reg.teamId);
        return { ...reg, team };
      })
    );

    return registrationsWithTeams;
  }
});

export const getMyRegisteredEvents = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user", (q) => q.eq("registeredBy", args.userId))
      .collect();

    const events = await Promise.all(
      registrations.map(async (reg) => {
        const event = await ctx.db.get(reg.eventId);
        return event ? { ...event, registrationStatus: reg.status } : null;
      })
    );

    return events.filter(Boolean);
  }
});
