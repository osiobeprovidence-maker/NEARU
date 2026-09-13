import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ---------------------------------------------------------
// CHECK-IN
// ---------------------------------------------------------

export const getMatchDetails = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;
    
    const teamA = match.teamAId ? await ctx.db.get(match.teamAId) : null;
    const teamB = match.teamBId ? await ctx.db.get(match.teamBId) : null;
    
    return { ...match, teamA, teamB };
  }
});

export const checkInPlayer = mutation({
  args: {
    matchId: v.id("matches"),
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Basic verification: Check if already checked in
    const existing = await ctx.db
      .query("matchCheckins")
      .withIndex("by_match_team_user", (q) => 
        q.eq("matchId", args.matchId).eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new Error("Already checked in");
    }

    await ctx.db.insert("matchCheckins", {
      matchId: args.matchId,
      teamId: args.teamId,
      userId: args.userId,
      checkedInAt: Date.now(),
    });
  }
});

export const getMatchCheckins = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("matchCheckins")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();
  }
});

// ---------------------------------------------------------
// RESULT SUBMISSION & CONFIRMATION
// ---------------------------------------------------------

export const submitMatchResult = mutation({
  args: {
    matchId: v.id("matches"),
    teamAScore: v.number(),
    teamBScore: v.number(),
    submittedByTeamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    if (match.status === "Completed") {
      throw new Error("Match is already completed");
    }

    let winnerId: Id<"teams"> | undefined = undefined;
    if (args.teamAScore > args.teamBScore) winnerId = match.teamAId;
    else if (args.teamBScore > args.teamAScore) winnerId = match.teamBId;

    await ctx.db.patch(args.matchId, {
      teamAScore: args.teamAScore,
      teamBScore: args.teamBScore,
      winnerId,
      resultStatus: "Pending Confirmation",
      submittedByTeamId: args.submittedByTeamId,
    });
  }
});

export const confirmMatchResult = mutation({
  args: {
    matchId: v.id("matches"),
    confirmedByTeamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");
    
    // In a real system, we'd verify confirmedByTeamId is the OPPOSING team or an admin.
    
    await ctx.db.patch(args.matchId, {
      resultStatus: "Confirmed",
      status: "Completed",
    });

    // Advance winner
    if (match.nextMatchId && match.winnerId) {
      const nextMatch = await ctx.db.get(match.nextMatchId);
      if (nextMatch) {
        if (match.matchIndex % 2 === 0) {
          await ctx.db.patch(match.nextMatchId, { teamAId: match.winnerId });
        } else {
          await ctx.db.patch(match.nextMatchId, { teamBId: match.winnerId });
        }
      }
    }
  }
});

// ---------------------------------------------------------
// DISPUTES
// ---------------------------------------------------------

export const reportDispute = mutation({
  args: {
    matchId: v.id("matches"),
    reportingTeamId: v.id("teams"),
    reason: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    await ctx.db.insert("disputes", {
      matchId: args.matchId,
      reportingTeamId: args.reportingTeamId,
      reason: args.reason,
      description: args.description,
      status: "Open",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Optionally set match status to Disputed if we add that to the schema later
  }
});

export const getMatchDisputes = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("disputes")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();
  }
});

export const resolveDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    resolution: v.string(),
    adminId: v.id("users"),
    eventId: v.id("events"),
    
    // Optional overrides for match score
    overrideMatchId: v.optional(v.id("matches")),
    teamAScore: v.optional(v.number()),
    teamBScore: v.optional(v.number()),
    winnerId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");

    await ctx.db.patch(args.disputeId, {
      status: "Resolved",
      resolution: args.resolution,
      resolvedBy: args.adminId,
      updatedAt: Date.now(),
    });

    if (args.overrideMatchId && args.winnerId) {
      // Admin is forcefully resolving the match result
      await ctx.db.patch(args.overrideMatchId, {
        teamAScore: args.teamAScore,
        teamBScore: args.teamBScore,
        winnerId: args.winnerId,
        status: "Completed",
        resultStatus: "Confirmed"
      });

      // Advance winner manually due to dispute resolution
      const match = await ctx.db.get(args.overrideMatchId);
      if (match?.nextMatchId) {
        const nextMatch = await ctx.db.get(match.nextMatchId);
        if (nextMatch) {
          if (match.matchIndex % 2 === 0) {
            await ctx.db.patch(match.nextMatchId, { teamAId: args.winnerId });
          } else {
            await ctx.db.patch(match.nextMatchId, { teamBId: args.winnerId });
          }
        }
      }
    }

    // Audit Log
    await ctx.db.insert("eventAuditLogs", {
      eventId: args.eventId,
      action: "DISPUTE_RESOLVED",
      userId: args.adminId,
      details: `Resolved dispute ${args.disputeId} with resolution: ${args.resolution}`,
      createdAt: Date.now(),
    });
  }
});

// ---------------------------------------------------------
// DISQUALIFICATIONS
// ---------------------------------------------------------

export const disqualifyTeam = mutation({
  args: {
    eventId: v.id("events"),
    teamId: v.id("teams"),
    reason: v.string(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("disqualifications", {
      eventId: args.eventId,
      teamId: args.teamId,
      reason: args.reason,
      adminId: args.adminId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("eventAuditLogs", {
      eventId: args.eventId,
      action: "TEAM_DISQUALIFIED",
      userId: args.adminId,
      details: `Disqualified team ${args.teamId} for reason: ${args.reason}`,
      createdAt: Date.now(),
    });
  }
});

// ---------------------------------------------------------
// ANNOUNCEMENTS
// ---------------------------------------------------------

export const createAnnouncement = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("eventAnnouncements", {
      eventId: args.eventId,
      title: args.title,
      content: args.content,
      authorId: args.authorId,
      createdAt: Date.now(),
    });
  }
});

export const getEventAnnouncements = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const announcements = await ctx.db
      .query("eventAnnouncements")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();
    return announcements;
  }
});
