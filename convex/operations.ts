import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ---------------------------------------------------------
// 1. MATCH DETAILS & CHECK-IN ENGINE
// ---------------------------------------------------------

export const getMatchDetails = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    const event = await ctx.db.get(match.eventId);
    const round = await ctx.db.get(match.roundId);
    const stage = await ctx.db.get(match.stageId);

    const teamA = match.teamAId ? await ctx.db.get(match.teamAId) : null;
    const teamB = match.teamBId ? await ctx.db.get(match.teamBId) : null;

    // Team members
    const teamAMembers = teamA
      ? await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", teamA._id))
          .collect()
      : [];
    const teamBMembers = teamB
      ? await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", teamB._id))
          .collect()
      : [];

    // Fetch user details for members
    const teamAPlayers = await Promise.all(
      teamAMembers.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return { ...m, name: u?.name || "Player", avatar: u?.avatar };
      })
    );
    const teamBPlayers = await Promise.all(
      teamBMembers.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return { ...m, name: u?.name || "Player", avatar: u?.avatar };
      })
    );

    // Check-ins for this match
    const checkIns = await ctx.db
      .query("matchCheckins")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();

    // Calculate team check-in counts
    const teamACheckInCount = teamA
      ? checkIns.filter((c) => c.teamId === teamA._id).length
      : 0;
    const teamBCheckInCount = teamB
      ? checkIns.filter((c) => c.teamId === teamB._id).length
      : 0;

    // Determine Check-in State (Not started | Open | Checked in | Incomplete | Closed)
    const checkInWindowMinutes = event?.checkInWindowMinutes || 30;
    let teamACheckInState: "Not started" | "Open" | "Checked in" | "Incomplete" | "Closed" = "Not started";
    let teamBCheckInState: "Not started" | "Open" | "Checked in" | "Incomplete" | "Closed" = "Not started";

    const now = Date.now();
    const scheduledMs = match.scheduledTime ? new Date(match.scheduledTime).getTime() : 0;
    const windowStartMs = scheduledMs > 0 ? scheduledMs - checkInWindowMinutes * 60 * 1000 : 0;

    if (scheduledMs === 0 || now < windowStartMs) {
      teamACheckInState = "Not started";
      teamBCheckInState = "Not started";
    } else if (now >= windowStartMs && match.status !== "Completed" && match.status !== "Cancelled") {
      teamACheckInState = teamAPlayers.length > 0 && teamACheckInCount >= teamAPlayers.length ? "Checked in" : "Open";
      teamBCheckInState = teamBPlayers.length > 0 && teamBCheckInCount >= teamBPlayers.length ? "Checked in" : "Open";
    } else {
      teamACheckInState = teamAPlayers.length > 0 && teamACheckInCount >= teamAPlayers.length ? "Checked in" : "Incomplete";
      teamBCheckInState = teamBPlayers.length > 0 && teamBCheckInCount >= teamBPlayers.length ? "Checked in" : "Incomplete";
    }

    // Evidence
    const evidence = await ctx.db
      .query("matchEvidence")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();

    // Disputes
    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();

    // Referee
    const referee = match.assignedRefereeId ? await ctx.db.get(match.assignedRefereeId) : null;

    return {
      ...match,
      event,
      round,
      stage,
      teamA,
      teamB,
      teamAPlayers,
      teamBPlayers,
      checkIns,
      teamACheckInCount,
      teamBCheckInCount,
      teamACheckInState,
      teamBCheckInState,
      evidence,
      disputes,
      referee,
    };
  },
});

export const checkInPlayer = mutation({
  args: {
    matchId: v.id("matches"),
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    const existing = await ctx.db
      .query("matchCheckins")
      .withIndex("by_match_team_user", (q) =>
        q.eq("matchId", args.matchId).eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new Error("You have already checked in for this match.");
    }

    await ctx.db.insert("matchCheckins", {
      matchId: args.matchId,
      teamId: args.teamId,
      userId: args.userId,
      checkedInAt: Date.now(),
    });

    const user = await ctx.db.get(args.userId);
    const team = await ctx.db.get(args.teamId);

    // Notify team members
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const member of teamMembers) {
      if (member.userId !== args.userId) {
        await ctx.db.insert("notifications", {
          userId: member.userId,
          type: "MATCH_CHECKIN",
          title: "Player Checked In",
          body: `${user?.name || "A teammate"} checked in for ${team?.name || "your team"}.`,
          read: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

// ---------------------------------------------------------
// 2. MATCH MANAGEMENT & OPERATIONS (ORGANIZERS / ADMINE)
// ---------------------------------------------------------

export const updateMatchSchedule = mutation({
  args: {
    matchId: v.id("matches"),
    scheduledTime: v.string(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    const prevTime = match.scheduledTime || "Unscheduled";
    await ctx.db.patch(args.matchId, {
      scheduledTime: args.scheduledTime,
      status: match.status === "Pending" ? "Scheduled" : match.status,
    });

    await ctx.db.insert("eventAuditLogs", {
      eventId: match.eventId,
      action: "MATCH_RESCHEDULED",
      userId: args.adminId,
      details: `Match ${args.matchId} rescheduled from ${prevTime} to ${args.scheduledTime}`,
      createdAt: Date.now(),
    });
  },
});

export const updateMatchStatus = mutation({
  args: {
    matchId: v.id("matches"),
    status: v.union(
      v.literal("Pending"),
      v.literal("Scheduled"),
      v.literal("Live"),
      v.literal("Completed"),
      v.literal("Cancelled")
    ),
    pauseReason: v.optional(v.string()),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    await ctx.db.patch(args.matchId, {
      status: args.status,
      pauseReason: args.pauseReason,
    });

    await ctx.db.insert("eventAuditLogs", {
      eventId: match.eventId,
      action: "MATCH_STATUS_CHANGED",
      userId: args.adminId,
      details: `Match ${args.matchId} status updated to ${args.status}${args.pauseReason ? ` (${args.pauseReason})` : ""}`,
      createdAt: Date.now(),
    });
  },
});

export const assignMatchReferee = mutation({
  args: {
    matchId: v.id("matches"),
    refereeId: v.id("users"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    await ctx.db.patch(args.matchId, {
      assignedRefereeId: args.refereeId,
    });

    const referee = await ctx.db.get(args.refereeId);

    await ctx.db.insert("eventAuditLogs", {
      eventId: match.eventId,
      action: "REFEREE_ASSIGNED",
      userId: args.adminId,
      details: `Assigned referee ${referee?.name || args.refereeId} to match ${args.matchId}`,
      createdAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------
// 3. EVIDENCE & RESULT SUBMISSION FLOW
// ---------------------------------------------------------

export const uploadMatchEvidence = mutation({
  args: {
    matchId: v.id("matches"),
    teamId: v.id("teams"),
    uploadedBy: v.id("users"),
    storageId: v.string(),
    url: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("matchEvidence", {
      matchId: args.matchId,
      teamId: args.teamId,
      uploadedBy: args.uploadedBy,
      storageId: args.storageId,
      url: args.url,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});

export const submitMatchResult = mutation({
  args: {
    matchId: v.id("matches"),
    teamAScore: v.number(),
    teamBScore: v.number(),
    submittedByTeamId: v.id("teams"),
    notes: v.optional(v.string()),
    evidenceUrl: v.optional(v.string()),
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
      notes: args.notes,
    });

    // If evidence URL provided
    if (args.evidenceUrl) {
      await ctx.db.insert("matchEvidence", {
        matchId: args.matchId,
        teamId: args.submittedByTeamId,
        uploadedBy: "system" as any,
        storageId: "",
        url: args.evidenceUrl,
        type: "Result Image",
        createdAt: Date.now(),
      });
    }

    // Notify opposing team members
    const opposingTeamId = args.submittedByTeamId === match.teamAId ? match.teamBId : match.teamAId;
    if (opposingTeamId) {
      const opposingMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", opposingTeamId))
        .collect();

      for (const m of opposingMembers) {
        await ctx.db.insert("notifications", {
          userId: m.userId,
          type: "RESULT_SUBMITTED",
          title: "Match Result Submitted",
          body: `Opponent submitted match result (${args.teamAScore} - ${args.teamBScore}). Please confirm or dispute.`,
          read: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const confirmMatchResult = mutation({
  args: {
    matchId: v.id("matches"),
    confirmedByTeamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    await ctx.db.patch(args.matchId, {
      resultStatus: "Confirmed",
      status: "Completed",
    });

    // Advance winner in Knockout stage
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

    // Update Group Stage standings if match belongs to a Group stage
    const stage = await ctx.db.get(match.stageId);
    if (stage?.type === "Group" && match.teamAId && match.teamBId && match.teamAScore !== undefined && match.teamBScore !== undefined) {
      await updateGroupStandings(ctx, match.stageId, match.teamAId, match.teamBId, match.teamAScore, match.teamBScore);
    }

    // Notify winning team & losing team
    if (match.teamAId) {
      const membersA = await ctx.db.query("teamMembers").withIndex("by_team", (q) => q.eq("teamId", match.teamAId!)).collect();
      const isWinnerA = match.winnerId === match.teamAId;
      for (const m of membersA) {
        await ctx.db.insert("notifications", {
          userId: m.userId,
          type: "RESULT_CONFIRMED",
          title: "Match Result Confirmed",
          body: isWinnerA ? "Congratulations! Your team won and advanced!" : "Match result confirmed.",
          read: false,
          createdAt: Date.now(),
        });
      }
    }
    if (match.teamBId) {
      const membersB = await ctx.db.query("teamMembers").withIndex("by_team", (q) => q.eq("teamId", match.teamBId!)).collect();
      const isWinnerB = match.winnerId === match.teamBId;
      for (const m of membersB) {
        await ctx.db.insert("notifications", {
          userId: m.userId,
          type: "RESULT_CONFIRMED",
          title: "Match Result Confirmed",
          body: isWinnerB ? "Congratulations! Your team won and advanced!" : "Match result confirmed.",
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    // Check if this was the Final match of the tournament!
    await checkTournamentCompletion(ctx, match.competitionId, match.eventId, match._id);
  },
});

// Helper: Update Group Standings
async function updateGroupStandings(
  ctx: any,
  stageId: Id<"stages">,
  teamAId: Id<"teams">,
  teamBId: Id<"teams">,
  scoreA: number,
  scoreB: number
) {
  const standings = await ctx.db.query("standings").withIndex("by_stage", (q: any) => q.eq("stageId", stageId)).collect();

  let stdA = standings.find((s: any) => s.teamId === teamAId);
  let stdB = standings.find((s: any) => s.teamId === teamBId);

  const diffA = scoreA - scoreB;
  const diffB = scoreB - scoreA;

  let winA = scoreA > scoreB ? 1 : 0;
  let winB = scoreB > scoreA ? 1 : 0;
  let draw = scoreA === scoreB ? 1 : 0;
  let lossA = scoreA < scoreB ? 1 : 0;
  let lossB = scoreB < scoreA ? 1 : 0;

  let ptsA = winA * 3 + draw * 1;
  let ptsB = winB * 3 + draw * 1;

  if (stdA) {
    await ctx.db.patch(stdA._id, {
      played: stdA.played + 1,
      wins: stdA.wins + winA,
      draws: stdA.draws + draw,
      losses: stdA.losses + lossA,
      points: stdA.points + ptsA,
      scoreDifference: stdA.scoreDifference + diffA,
    });
  }
  if (stdB) {
    await ctx.db.patch(stdB._id, {
      played: stdB.played + 1,
      wins: stdB.wins + winB,
      draws: stdB.draws + draw,
      losses: stdB.losses + lossB,
      points: stdB.points + ptsB,
      scoreDifference: stdB.scoreDifference + diffB,
    });
  }
}

// Helper: Check Tournament Completion
async function checkTournamentCompletion(
  ctx: any,
  competitionId: Id<"competitions">,
  eventId: Id<"events">,
  lastCompletedMatchId: Id<"matches">
) {
  const allMatches = await ctx.db.query("matches").withIndex("by_competition", (q: any) => q.eq("competitionId", competitionId)).collect();

  const unfinished = allMatches.filter((m: any) => m.status !== "Completed" && m.status !== "Cancelled");
  if (unfinished.length === 0) {
    // Competition completed! Find the champion team from the last match
    const lastMatch = await ctx.db.get(lastCompletedMatchId);
    let championTeamId = lastMatch?.winnerId;
    let runnerUpTeamId: Id<"teams"> | undefined = undefined;

    if (lastMatch?.winnerId && lastMatch.teamAId && lastMatch.teamBId) {
      runnerUpTeamId = lastMatch.winnerId === lastMatch.teamAId ? lastMatch.teamBId : lastMatch.teamAId;
    }

    await ctx.db.patch(competitionId, {
      status: "Completed",
      updatedAt: Date.now(),
    });

    await ctx.db.patch(eventId, {
      status: "Completed",
      championTeamId,
      runnerUpTeamId,
      updatedAt: Date.now(),
    });

    // Log completion
    await ctx.db.insert("eventAuditLogs", {
      eventId,
      action: "TOURNAMENT_COMPLETED",
      userId: "system" as any,
      details: `Tournament finished. Champion: ${championTeamId || "N/A"}`,
      createdAt: Date.now(),
    });
  }
}

// ---------------------------------------------------------
// 4. DISPUTES ENGINE
// ---------------------------------------------------------

export const reportDispute = mutation({
  args: {
    matchId: v.id("matches"),
    reportingTeamId: v.id("teams"),
    reason: v.string(),
    description: v.string(),
    evidenceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    const disputeId = await ctx.db.insert("disputes", {
      matchId: args.matchId,
      reportingTeamId: args.reportingTeamId,
      reason: args.reason,
      description: args.description,
      evidenceUrl: args.evidenceUrl,
      status: "Open",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("eventAuditLogs", {
      eventId: match.eventId,
      action: "DISPUTE_FILED",
      userId: "system" as any,
      details: `Dispute filed for match ${args.matchId} by team ${args.reportingTeamId}: ${args.reason}`,
      createdAt: Date.now(),
    });

    return disputeId;
  },
});

export const getEventDisputes = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const matchIds = new Set(matches.map((m) => m._id));
    const allDisputes = await ctx.db.query("disputes").collect();
    const eventDisputes = allDisputes.filter((d) => matchIds.has(d.matchId));

    return await Promise.all(
      eventDisputes.map(async (d) => {
        const match = await ctx.db.get(d.matchId);
        const reportingTeam = await ctx.db.get(d.reportingTeamId);
        const teamA = match?.teamAId ? await ctx.db.get(match.teamAId) : null;
        const teamB = match?.teamBId ? await ctx.db.get(match.teamBId) : null;
        return {
          ...d,
          match,
          reportingTeam,
          teamA,
          teamB,
        };
      })
    );
  },
});

export const resolveDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    resolution: v.string(), // "Confirm Team A" | "Confirm Team B" | "Replay Match" | "Cancel Match" | "Reject Dispute"
    adminId: v.id("users"),
    eventId: v.id("events"),
    teamAScore: v.optional(v.number()),
    teamBScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");

    const match = await ctx.db.get(dispute.matchId);
    if (!match) throw new Error("Associated match not found");

    if (args.resolution === "Reject Dispute") {
      await ctx.db.patch(args.disputeId, {
        status: "Rejected",
        resolution: args.resolution,
        resolvedBy: args.adminId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.disputeId, {
        status: "Resolved",
        resolution: args.resolution,
        resolvedBy: args.adminId,
        updatedAt: Date.now(),
      });

      if (args.resolution === "Confirm Team A" && match.teamAId) {
        await ctx.db.patch(match._id, {
          teamAScore: args.teamAScore ?? 1,
          teamBScore: args.teamBScore ?? 0,
          winnerId: match.teamAId,
          status: "Completed",
          resultStatus: "Confirmed",
        });
        if (match.nextMatchId) {
          if (match.matchIndex % 2 === 0) {
            await ctx.db.patch(match.nextMatchId, { teamAId: match.teamAId });
          } else {
            await ctx.db.patch(match.nextMatchId, { teamBId: match.teamAId });
          }
        }
      } else if (args.resolution === "Confirm Team B" && match.teamBId) {
        await ctx.db.patch(match._id, {
          teamAScore: args.teamAScore ?? 0,
          teamBScore: args.teamBScore ?? 1,
          winnerId: match.teamBId,
          status: "Completed",
          resultStatus: "Confirmed",
        });
        if (match.nextMatchId) {
          if (match.matchIndex % 2 === 0) {
            await ctx.db.patch(match.nextMatchId, { teamAId: match.teamBId });
          } else {
            await ctx.db.patch(match.nextMatchId, { teamBId: match.teamBId });
          }
        }
      } else if (args.resolution === "Replay Match") {
        await ctx.db.patch(match._id, {
          teamAScore: undefined,
          teamBScore: undefined,
          winnerId: undefined,
          status: "Scheduled",
          resultStatus: undefined,
        });
      } else if (args.resolution === "Cancel Match") {
        await ctx.db.patch(match._id, {
          status: "Cancelled",
        });
      }
    }

    await ctx.db.insert("eventAuditLogs", {
      eventId: args.eventId,
      action: "DISPUTE_RESOLVED",
      userId: args.adminId,
      details: `Resolved dispute ${args.disputeId} with action: ${args.resolution}`,
      createdAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------
// 5. DISQUALIFICATION ENGINE
// ---------------------------------------------------------

export const disqualifyTeamOrPlayer = mutation({
  args: {
    eventId: v.id("events"),
    teamId: v.id("teams"),
    playerId: v.optional(v.id("users")),
    reason: v.string(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("disqualifications", {
      eventId: args.eventId,
      teamId: args.teamId,
      playerId: args.playerId,
      reason: args.reason,
      adminId: args.adminId,
      createdAt: Date.now(),
    });

    // Auto-forfeit pending matches for this team
    const pendingMatches = await ctx.db
      .query("matches")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const match of pendingMatches) {
      if (match.status !== "Completed" && match.status !== "Cancelled") {
        if (match.teamAId === args.teamId) {
          // Team B wins by forfeit
          await ctx.db.patch(match._id, {
            winnerId: match.teamBId,
            status: "Completed",
            resultStatus: "Confirmed",
            notes: `Team A disqualified: ${args.reason}`,
          });
          if (match.nextMatchId && match.teamBId) {
            if (match.matchIndex % 2 === 0) {
              await ctx.db.patch(match.nextMatchId, { teamAId: match.teamBId });
            } else {
              await ctx.db.patch(match.nextMatchId, { teamBId: match.teamBId });
            }
          }
        } else if (match.teamBId === args.teamId) {
          // Team A wins by forfeit
          await ctx.db.patch(match._id, {
            winnerId: match.teamAId,
            status: "Completed",
            resultStatus: "Confirmed",
            notes: `Team B disqualified: ${args.reason}`,
          });
          if (match.nextMatchId && match.teamAId) {
            if (match.matchIndex % 2 === 0) {
              await ctx.db.patch(match.nextMatchId, { teamAId: match.teamAId });
            } else {
              await ctx.db.patch(match.nextMatchId, { teamBId: match.teamAId });
            }
          }
        }
      }
    }

    const team = await ctx.db.get(args.teamId);
    await ctx.db.insert("eventAuditLogs", {
      eventId: args.eventId,
      action: "TEAM_DISQUALIFIED",
      userId: args.adminId,
      details: `Disqualified ${team?.name || args.teamId}: ${args.reason}`,
      createdAt: Date.now(),
    });

    // Notify team members
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const m of members) {
      await ctx.db.insert("notifications", {
        userId: m.userId,
        type: "DISQUALIFIED",
        title: "Team Disqualified",
        body: `Your team ${team?.name} was disqualified from the tournament: ${args.reason}`,
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});

// ---------------------------------------------------------
// 6. ANNOUNCEMENTS & AUDIT LOGS
// ---------------------------------------------------------

export const createAnnouncement = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    content: v.string(),
    priority: v.optional(v.union(v.literal("Normal"), v.literal("Important"), v.literal("Emergency"))),
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("eventAnnouncements", {
      eventId: args.eventId,
      title: args.title,
      content: args.content,
      priority: args.priority || "Normal",
      authorId: args.authorId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("eventAuditLogs", {
      eventId: args.eventId,
      action: "ANNOUNCEMENT_PUBLISHED",
      userId: args.authorId,
      details: `Published announcement: "${args.title}"`,
      createdAt: Date.now(),
    });

    // Fanout notification to registered event teams
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId).eq("status", "Approved"))
      .collect();

    const teamIds = registrations.map((r) => r.teamId).filter(Boolean) as Id<"teams">[];
    for (const tId of teamIds) {
      const members = await ctx.db.query("teamMembers").withIndex("by_team", (q) => q.eq("teamId", tId)).collect();
      for (const m of members) {
        await ctx.db.insert("notifications", {
          userId: m.userId,
          type: "ANNOUNCEMENT",
          title: `Announcement: ${args.title}`,
          body: args.content.slice(0, 100),
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    return id;
  },
});

export const getEventAnnouncements = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const announcements = await ctx.db
      .query("eventAnnouncements")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();

    return await Promise.all(
      announcements.map(async (a) => {
        const author = await ctx.db.get(a.authorId);
        return { ...a, authorName: author?.name || "Organizer", authorAvatar: author?.avatar };
      })
    );
  },
});

export const getEventAuditLogs = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("eventAuditLogs")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();

    return await Promise.all(
      logs.map(async (l) => {
        const user = await ctx.db.get(l.userId);
        return { ...l, userName: user?.name || "Admin" };
      })
    );
  },
});

// ---------------------------------------------------------
// 7. LIVE EVENT OVERVIEW & TOURNAMENT HISTORY
// ---------------------------------------------------------

export const getLiveEventOverview = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const matches = await ctx.db
      .query("matches")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const liveMatchesRaw = matches.filter((m) => m.status === "Live");
    const upcomingMatchesRaw = matches.filter((m) => m.status === "Scheduled" || m.status === "Pending");
    const completedMatchesRaw = matches.filter((m) => m.status === "Completed").slice(-6);

    const hydrateMatch = async (m: typeof matches[0]) => {
      const teamA = m.teamAId ? await ctx.db.get(m.teamAId) : null;
      const teamB = m.teamBId ? await ctx.db.get(m.teamBId) : null;
      const round = await ctx.db.get(m.roundId);
      return { ...m, teamA, teamB, roundName: round?.name || "Round" };
    };

    const liveMatches = await Promise.all(liveMatchesRaw.map(hydrateMatch));
    const upcomingMatches = await Promise.all(upcomingMatchesRaw.slice(0, 4).map(hydrateMatch));
    const completedMatches = await Promise.all(completedMatchesRaw.map(hydrateMatch));

    const champion = event.championTeamId ? await ctx.db.get(event.championTeamId) : null;
    const runnerUp = event.runnerUpTeamId ? await ctx.db.get(event.runnerUpTeamId) : null;

    const announcements = await ctx.db
      .query("eventAnnouncements")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .take(3);

    return {
      event,
      liveMatches,
      upcomingMatches,
      completedMatches,
      totalMatches: matches.length,
      completedMatchesCount: matches.filter((m) => m.status === "Completed").length,
      champion,
      runnerUp,
      announcements,
    };
  },
});

export const getTournamentHistoryForPage = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    const completedEvents = events.filter((e) => e.status === "Completed");

    return await Promise.all(
      completedEvents.map(async (e) => {
        const champion = e.championTeamId ? await ctx.db.get(e.championTeamId) : null;
        const runnerUp = e.runnerUpTeamId ? await ctx.db.get(e.runnerUpTeamId) : null;

        const matches = await ctx.db
          .query("matches")
          .withIndex("by_event", (q) => q.eq("eventId", e._id))
          .collect();

        const registrations = await ctx.db
          .query("eventRegistrations")
          .withIndex("by_event", (q) => q.eq("eventId", e._id).eq("status", "Approved"))
          .collect();

        return {
          ...e,
          champion,
          runnerUp,
          totalTeams: registrations.length,
          totalMatches: matches.length,
        };
      })
    );
  },
});

export const getTournamentHistoryForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const historyItems = [];
    for (const mem of memberships) {
      const team = await ctx.db.get(mem.teamId);
      if (!team) continue;

      const event = await ctx.db.get(team.eventId);
      if (!event || event.status !== "Completed") continue;

      let placement = "Participant";
      if (event.championTeamId === team._id) placement = "Champion 🏆";
      else if (event.runnerUpTeamId === team._id) placement = "Runner-up 🥈";

      historyItems.push({
        event,
        team,
        role: mem.role,
        placement,
      });
    }

    return historyItems;
  },
});
