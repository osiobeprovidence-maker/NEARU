import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthenticatedUser } from "./adminHelpers";

export const createTeam = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    logoStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    if (event.status !== "Registration Open") {
      throw new Error("Registration is not open for this event");
    }

    // Check if user is already in a team for this event
    const userTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
      
    for (const member of userTeams) {
      const team = await ctx.db.get(member.teamId);
      if (team?.eventId === args.eventId) {
        throw new Error("You are already on a team for this event.");
      }
    }

    let logoUrl = undefined;
    if (args.logoStorageId) {
      logoUrl = await ctx.storage.getUrl(args.logoStorageId) ?? undefined;
    }

    const teamId = await ctx.db.insert("teams", {
      eventId: args.eventId,
      pageId: event.pageId,
      name: args.name,
      logoStorageId: args.logoStorageId,
      logoUrl,
      captainId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add creator as captain
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: user._id,
      role: "captain",
      joinedAt: Date.now(),
    });

    return teamId;
  },
});

export const getTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const membersWithUser = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return { ...m, user };
      })
    );

    return { ...team, members: membersWithUser };
  },
});

export const registerTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    if (team.captainId !== user._id) throw new Error("Only the captain can register the team");

    const event = await ctx.db.get(team.eventId);
    if (!event) throw new Error("Event not found");

    if (event.status !== "Registration Open") {
      throw new Error("Registration is closed");
    }

    // Validation for min players
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (event.minPlayersPerTeam && members.length < event.minPlayersPerTeam) {
      throw new Error(`Your team needs at least ${event.minPlayersPerTeam} players to register.`);
    }

    // Check if already registered
    const existingRegistration = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("eventId"), team.eventId))
      .first();

    if (existingRegistration) {
      throw new Error("Team is already registered or pending.");
    }

    const status = event.requireApproval ? "Pending" : "Approved";

    await ctx.db.insert("eventRegistrations", {
      eventId: team.eventId,
      teamId: team._id,
      status,
      registeredAt: Date.now(),
    });
  },
});

export const approveRegistration = mutation({
  args: {
    registrationId: v.id("eventRegistrations"),
    approve: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);
    const reg = await ctx.db.get(args.registrationId);
    if (!reg) throw new Error("Registration not found");
    
    const event = await ctx.db.get(reg.eventId);
    if (!event) throw new Error("Event not found");

    const member = await ctx.db
      .query("pageMembers")
      .withIndex("by_page_user", (q: any) => q.eq("pageId", event.pageId).eq("userId", user._id))
      .first();
    
    if (!member || (member.role !== "admin" && member.role !== "owner")) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.registrationId, {
      status: args.approve ? "Approved" : "Rejected",
      reviewedAt: Date.now(),
      reviewedBy: user._id,
    });
  },
});
