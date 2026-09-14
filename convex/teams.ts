import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./lib/auth";

export const createTeam = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    logoStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
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
    const user = await getAuthenticatedUser(ctx);
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
    const user = await getAuthenticatedUser(ctx);
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

export const getMyTeams = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const teams = await Promise.all(
      memberships.map(async (m) => {
        const team = await ctx.db.get(m.teamId);
        if (!team) return null;
        
        const event = await ctx.db.get(team.eventId);
        return {
          ...team,
          role: m.role,
          event,
        };
      })
    );

    return teams.filter(Boolean);
  },
});

export const joinTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    
    const event = await ctx.db.get(team.eventId);
    if (!event) throw new Error("Event not found");

    if (event.status !== "Registration Open") {
      throw new Error("Registration is closed for this event.");
    }

    // Check if user is already in a team for this event
    const userTeams = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
      
    for (const member of userTeams) {
      const existingTeam = await ctx.db.get(member.teamId);
      if (existingTeam?.eventId === event._id) {
        throw new Error("You are already on a team for this event.");
      }
    }

    // Check capacity
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();
      
    if (event.maxPlayersPerTeam && members.length >= event.maxPlayersPerTeam) {
      throw new Error("This team is already full.");
    }

    await ctx.db.insert("teamMembers", {
      teamId: team._id,
      userId: user._id,
      role: "player",
      joinedAt: Date.now(),
    });
    
    return true;
  },
});

export const leaveTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", user._id))
      .first();
      
    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    if (membership.role === "captain") {
      throw new Error("Captains cannot leave the team directly. Please transfer captaincy or delete the team.");
    }

export const invitePlayer = mutation({
  args: {
    teamId: v.id("teams"),
    inviteeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    if (team.captainId !== user._id) {
      throw new Error("Only the team captain can invite players");
    }

    const event = await ctx.db.get(team.eventId);
    if (!event) throw new Error("Event not found");

    if (event.status !== "Registration Open") {
      throw new Error("Registration is not open for this event");
    }

    // Check if invitee is already in a team for this event
    const inviteeMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.inviteeId))
      .collect();

    for (const m of inviteeMemberships) {
      const existingTeam = await ctx.db.get(m.teamId);
      if (existingTeam?.eventId === event._id) {
        throw new Error("User is already on a team for this event.");
      }
    }

    // Check team capacity
    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();

    if (event.maxPlayersPerTeam && currentMembers.length >= event.maxPlayersPerTeam) {
      throw new Error("Team has reached maximum player capacity.");
    }

    // Check existing pending invitation
    const existingInvite = await ctx.db
      .query("teamInvitations")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .filter((q) => q.and(q.eq(q.field("inviteeId"), args.inviteeId), q.eq(q.field("status"), "Pending")))
      .first();

    if (existingInvite) {
      throw new Error("An invitation has already been sent to this player.");
    }

    const inviteId = await ctx.db.insert("teamInvitations", {
      teamId: team._id,
      inviterId: user._id,
      inviteeId: args.inviteeId,
      status: "Pending",
      createdAt: Date.now(),
    });

    return inviteId;
  },
});

export const acceptInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const invite = await ctx.db.get(args.invitationId);
    if (!invite) throw new Error("Invitation not found");

    if (invite.inviteeId !== user._id) {
      throw new Error("This invitation was not sent to you.");
    }

    if (invite.status !== "Pending") {
      throw new Error("Invitation is no longer pending.");
    }

    const team = await ctx.db.get(invite.teamId);
    if (!team) throw new Error("Team no longer exists");

    const event = await ctx.db.get(team.eventId);
    if (!event) throw new Error("Event no longer exists");

    if (event.status !== "Registration Open") {
      throw new Error("Registration is closed for this event.");
    }

    // Check if user is already on a team for this event
    const userMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const m of userMemberships) {
      const existingTeam = await ctx.db.get(m.teamId);
      if (existingTeam?.eventId === event._id) {
        throw new Error("You are already on a team for this event.");
      }
    }

    // Check capacity
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect();

    if (event.maxPlayersPerTeam && members.length >= event.maxPlayersPerTeam) {
      throw new Error("Team capacity reached.");
    }

    await ctx.db.insert("teamMembers", {
      teamId: team._id,
      userId: user._id,
      role: "player",
      joinedAt: Date.now(),
    });

    await ctx.db.patch(args.invitationId, {
      status: "Accepted",
    });

    return true;
  },
});

export const declineInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const invite = await ctx.db.get(args.invitationId);
    if (!invite) throw new Error("Invitation not found");

    if (invite.inviteeId !== user._id) {
      throw new Error("This invitation was not sent to you.");
    }

    await ctx.db.patch(args.invitationId, {
      status: "Declined",
    });

    return true;
  },
});

export const getMyInvitations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("teamInvitations")
      .withIndex("by_invitee", (q) => q.eq("inviteeId", args.userId).eq("status", "Pending"))
      .collect();

    const invitesWithDetails = await Promise.all(
      invites.map(async (invite) => {
        const team = await ctx.db.get(invite.teamId);
        if (!team) return null;

        const event = await ctx.db.get(team.eventId);
        const inviter = await ctx.db.get(invite.inviterId);

        return {
          ...invite,
          team,
          event,
          inviterName: inviter?.name || inviter?.username || "Captain",
        };
      })
    );

    return invitesWithDetails.filter(Boolean);
  },
});

export const getTeamInvitations = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("teamInvitations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const invitesWithUser = await Promise.all(
      invites.map(async (invite) => {
        const invitee = await ctx.db.get(invite.inviteeId);
        return {
          ...invite,
          invitee,
        };
      })
    );

    return invitesWithUser;
  },
});

export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    memberUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    if (team.captainId !== user._id) {
      throw new Error("Only the captain can remove members");
    }

    if (args.memberUserId === team.captainId) {
      throw new Error("Captain cannot be removed from the team");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.memberUserId))
      .first();

    if (!membership) {
      throw new Error("Member not found on this team");
    }

    await ctx.db.delete(membership._id);
    return true;
  },
});

export const withdrawRegistration = mutation({
  args: {
    registrationId: v.id("eventRegistrations"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const reg = await ctx.db.get(args.registrationId);
    if (!reg) throw new Error("Registration not found");

    if (reg.teamId) {
      const team = await ctx.db.get(reg.teamId);
      if (!team) throw new Error("Team not found");

      // Check if user is captain or page manager
      const isCaptain = team.captainId === user._id;
      const pageMember = await ctx.db
        .query("pageMembers")
        .withIndex("by_page_user", (q) => q.eq("pageId", team.pageId).eq("userId", user._id))
        .first();

      const isManager = pageMember && (pageMember.role === "admin" || pageMember.role === "owner");

      if (!isCaptain && !isManager) {
        throw new Error("Unauthorized to withdraw registration");
      }
    }

    await ctx.db.patch(args.registrationId, {
      status: "Withdrawn",
      reviewedAt: Date.now(),
      reviewedBy: user._id,
    });

    return true;
  },
});


