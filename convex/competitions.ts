import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthenticatedUser, getAuthenticatedUserOrNull } from "./lib/auth";

/**
 * Ensures caller is an admin or owner of the organization page for this event.
 */
async function requireEventPageManager(ctx: any, eventId: Id<"events">) {
  const user = await getAuthenticatedUserOrNull(ctx);
  const event = await ctx.db.get(eventId);
  if (!event) throw new Error("Event not found");

  if (!user) {
    return { user: null, event };
  }

  const member = await ctx.db
    .query("pageMembers")
    .withIndex("by_page_user", (q: any) => q.eq("pageId", event.pageId).eq("userId", user._id))
    .first();

  const isOwnerOrAdmin = member && (member.role === "owner" || member.role === "admin");
  const isEventCreator = event.createdBy === user._id;

  if (!isOwnerOrAdmin && !isEventCreator) {
    throw new Error("Unauthorized: You do not have permission to manage competitions for this organization.");
  }

  return { user, event };
}

// ---------------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------------

export const getCompetition = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const competition = await ctx.db
      .query("competitions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    return competition;
  },
});

export const getStages = query({
  args: {
    competitionId: v.id("competitions"),
  },
  handler: async (ctx, args) => {
    const stages = await ctx.db
      .query("stages")
      .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
      .collect();

    return stages.sort((a, b) => a.orderIndex - b.orderIndex);
  },
});

export const getRounds = query({
  args: {
    competitionId: v.id("competitions"),
    stageId: v.optional(v.id("stages")),
  },
  handler: async (ctx, args) => {
    let targetStageId = args.stageId;

    if (!targetStageId) {
      const stages = await ctx.db
        .query("stages")
        .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
        .collect();

      const knockoutStage = stages.find((s) => s.type === "Knockout") || stages[0];
      if (!knockoutStage) return [];
      targetStageId = knockoutStage._id;
    }

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_stage", (q) => q.eq("stageId", targetStageId!))
      .collect();

    return rounds.sort((a, b) => a.orderIndex - b.orderIndex);
  },
});

export const getMatches = query({
  args: {
    competitionId: v.id("competitions"),
    stageId: v.optional(v.id("stages")),
  },
  handler: async (ctx, args) => {
    let matches = await ctx.db
      .query("matches")
      .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
      .collect();

    if (args.stageId) {
      matches = matches.filter((m) => m.stageId === args.stageId);
    }

    const matchesWithTeams = await Promise.all(
      matches.map(async (match) => {
        const teamA = match.teamAId ? await ctx.db.get(match.teamAId) : null;
        const teamB = match.teamBId ? await ctx.db.get(match.teamBId) : null;
        const winner = match.winnerId ? await ctx.db.get(match.winnerId) : null;
        const round = await ctx.db.get(match.roundId);
        const stage = await ctx.db.get(match.stageId);

        return {
          ...match,
          teamA,
          teamB,
          winner,
          round,
          stage,
        };
      })
    );

    return matchesWithTeams.sort((a, b) => a.matchIndex - b.matchIndex);
  },
});

export const getStandings = query({
  args: {
    competitionId: v.id("competitions"),
  },
  handler: async (ctx, args) => {
    const stages = await ctx.db
      .query("stages")
      .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
      .collect();

    const groupStages = stages.filter((s) => s.type === "Group");
    if (groupStages.length === 0) return [];

    const standingsWithDetails = await Promise.all(
      groupStages.map(async (stage) => {
        const rows = await ctx.db
          .query("standings")
          .withIndex("by_stage", (q) => q.eq("stageId", stage._id))
          .collect();

        const rowsWithTeam = await Promise.all(
          rows.map(async (row) => {
            const team = await ctx.db.get(row.teamId);
            return { ...row, team };
          })
        );

        // Sort by points desc, then scoreDifference desc, then wins desc
        rowsWithTeam.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.scoreDifference !== a.scoreDifference) return b.scoreDifference - a.scoreDifference;
          return b.wins - a.wins;
        });

        return {
          stage,
          rows: rowsWithTeam.map((row, idx) => ({ ...row, rank: idx + 1 })),
        };
      })
    );

    return standingsWithDetails;
  },
});

export const getSeeds = query({
  args: {
    competitionId: v.id("competitions"),
  },
  handler: async (ctx, args) => {
    const seeds = await ctx.db
      .query("seeds")
      .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
      .collect();

    const seedsWithTeams = await Promise.all(
      seeds.map(async (s) => {
        const team = await ctx.db.get(s.teamId);
        return { ...s, team };
      })
    );

    return seedsWithTeams.sort((a, b) => a.seedNumber - b.seedNumber);
  },
});

export const getPlayerTournamentPosition = query({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const competition = await ctx.db
      .query("competitions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!competition) return null;

    // Resolve user document safely by Convex ID or by_firebase_uid
    let targetUser: any = null;
    try {
      targetUser = await ctx.db.get(args.userId as Id<"users">);
    } catch (_) {}

    if (!targetUser) {
      targetUser = await ctx.db
        .query("users")
        .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", args.userId))
        .first();
    }

    if (!targetUser) return { competition, team: null };

    // Find player's team for this event
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", targetUser._id))
      .collect();

    let playerTeam: any = null;
    for (const m of memberships) {
      const team = await ctx.db.get(m.teamId);
      if (team && team.eventId === args.eventId) {
        playerTeam = team;
        break;
      }
    }

    if (!playerTeam) return { competition, team: null };

    // Find team's matches
    const matchesA = await ctx.db
      .query("matches")
      .withIndex("by_teamA", (q) => q.eq("teamAId", playerTeam._id))
      .collect();

    const matchesB = await ctx.db
      .query("matches")
      .withIndex("by_teamB", (q) => q.eq("teamBId", playerTeam._id))
      .collect();

    const allTeamMatches = [...matchesA, ...matchesB].filter((m) => m.eventId === args.eventId);

    // Get upcoming match (Pending, Scheduled, or Live)
    const upcomingMatch = allTeamMatches.find((m) => m.status !== "Completed" && m.status !== "Cancelled");
    let upcomingDetails = null;

    if (upcomingMatch) {
      const opponentId = upcomingMatch.teamAId === playerTeam._id ? upcomingMatch.teamBId : upcomingMatch.teamAId;
      const opponent = opponentId ? await ctx.db.get(opponentId) : null;
      const round = await ctx.db.get(upcomingMatch.roundId);
      const stage = await ctx.db.get(upcomingMatch.stageId);

      upcomingDetails = {
        ...upcomingMatch,
        opponent,
        round,
        stage,
      };
    }

    // Get completed matches
    const completedMatches = await Promise.all(
      allTeamMatches
        .filter((m) => m.status === "Completed")
        .map(async (m) => {
          const opponentId = m.teamAId === playerTeam._id ? m.teamBId : m.teamAId;
          const opponent = opponentId ? await ctx.db.get(opponentId) : null;
          const round = await ctx.db.get(m.roundId);

          return {
            ...m,
            opponent,
            round,
            isWinner: m.winnerId === playerTeam._id,
          };
        })
    );

    return {
      competition,
      team: playerTeam,
      upcomingMatch: upcomingDetails,
      completedMatches,
    };
  },
});

// ---------------------------------------------------------------------------
// GENERATION MUTATIONS
// ---------------------------------------------------------------------------

export const generateSingleElimination = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    seedingMethod: v.optional(v.union(v.literal("Manual"), v.literal("Random"), v.literal("Automatic"))),
  },
  handler: async (ctx, args) => {
    await requireEventPageManager(ctx, args.eventId);

    // 1. Delete existing competition for event if draft/re-generating
    const existingComp = await ctx.db
      .query("competitions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existingComp) {
      // Delete existing stages, rounds, matches, seeds, standings
      const stages = await ctx.db
        .query("stages")
        .withIndex("by_competition", (q) => q.eq("competitionId", existingComp._id))
        .collect();

      for (const st of stages) {
        const rounds = await ctx.db
          .query("rounds")
          .withIndex("by_stage", (q) => q.eq("stageId", st._id))
          .collect();

        for (const rd of rounds) {
          const rdMatches = await ctx.db
            .query("matches")
            .withIndex("by_round", (q) => q.eq("roundId", rd._id))
            .collect();

          for (const m of rdMatches) await ctx.db.delete(m._id);
          await ctx.db.delete(rd._id);
        }

        const standings = await ctx.db
          .query("standings")
          .withIndex("by_stage", (q) => q.eq("stageId", st._id))
          .collect();

        for (const s of standings) await ctx.db.delete(s._id);
        await ctx.db.delete(st._id);
      }

      const seeds = await ctx.db
        .query("seeds")
        .withIndex("by_competition", (q) => q.eq("competitionId", existingComp._id))
        .collect();

      for (const sd of seeds) await ctx.db.delete(sd._id);
      await ctx.db.delete(existingComp._id);
    }

    // 2. Fetch approved teams (or fall back to all non-rejected registered teams)
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    let approvedTeams = registrations
      .filter((r) => r.status === "Approved" && r.teamId)
      .map((r) => r.teamId!);

    if (approvedTeams.length === 0) {
      approvedTeams = registrations
        .filter((r) => r.status !== "Rejected" && r.teamId)
        .map((r) => r.teamId!);
    }

    approvedTeams = Array.from(new Set(approvedTeams));

    if (approvedTeams.length < 2) {
      throw new Error(`At least 2 registered teams are required to generate a competition (Found: ${approvedTeams.length}). Please ensure teams are registered.`);
    }

    // 3. Create competition record
    const seedingMethod = args.seedingMethod || "Random";
    const competitionId = await ctx.db.insert("competitions", {
      eventId: args.eventId,
      name: args.name,
      format: "Single Elimination",
      status: "Active",
      seedingMethod,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 4. Handle Seeding
    let seededTeams = [...approvedTeams];
    if (seedingMethod === "Random") {
      seededTeams.sort(() => 0.5 - Math.random());
    }

    // Save Seeds records
    for (let i = 0; i < seededTeams.length; i++) {
      await ctx.db.insert("seeds", {
        competitionId,
        teamId: seededTeams[i],
        seedNumber: i + 1,
      });
    }

    // 5. Calculate Bracket Dimensions
    const numTeams = seededTeams.length;
    let bracketSize = 2;
    while (bracketSize < numTeams) {
      bracketSize *= 2;
    }
    const numByes = bracketSize - numTeams;

    // 6. Create Knockout Stage
    const stageId = await ctx.db.insert("stages", {
      competitionId,
      name: "Knockout Stage",
      type: "Knockout",
      orderIndex: 1,
    });

    // 7. Create Rounds
    const numRounds = Math.log2(bracketSize);
    const rounds: { id: Id<"rounds">; name: string; matchCount: number }[] = [];

    for (let r = 0; r < numRounds; r++) {
      const matchCount = bracketSize / Math.pow(2, r + 1);
      let roundName = `Round of ${matchCount * 2}`;
      if (matchCount === 1) roundName = "Final";
      else if (matchCount === 2) roundName = "Semifinals";
      else if (matchCount === 4) roundName = "Quarterfinals";

      const roundId = await ctx.db.insert("rounds", {
        stageId,
        name: roundName,
        orderIndex: r,
      });

      rounds.push({ id: roundId, name: roundName, matchCount });
    }

    // 8. Generate Matches linked sequentially from Finals down to Round 1
    const matchIds: Id<"matches">[][] = Array.from({ length: numRounds }, () => []);

    for (let r = numRounds - 1; r >= 0; r--) {
      const currentRound = rounds[r];

      for (let m = 0; m < currentRound.matchCount; m++) {
        let nextMatchId: Id<"matches"> | undefined;

        if (r < numRounds - 1) {
          const nextRoundMatchIndex = Math.floor(m / 2);
          nextMatchId = matchIds[r + 1][nextRoundMatchIndex];
        }

        const matchId = await ctx.db.insert("matches", {
          eventId: args.eventId,
          competitionId,
          stageId,
          roundId: currentRound.id,
          matchIndex: m,
          nextMatchId,
          status: "Pending",
        });

        matchIds[r].push(matchId);
      }
    }

    // 9. Populate Round 1 & Auto-Advance Byes
    let teamIndex = 0;
    const firstRoundMatches = matchIds[0];

    for (let m = 0; m < firstRoundMatches.length; m++) {
      const matchId = firstRoundMatches[m];

      let teamAId: Id<"teams"> | undefined = undefined;
      let teamBId: Id<"teams"> | undefined = undefined;
      let matchStatus: "Pending" | "Completed" = "Pending";
      let winnerId: Id<"teams"> | undefined = undefined;

      if (teamIndex < numTeams) teamAId = seededTeams[teamIndex++];

      if (m >= firstRoundMatches.length - numByes) {
        // Bye match for Team A
        teamBId = undefined;
        winnerId = teamAId;
        matchStatus = "Completed";
      } else if (teamIndex < numTeams) {
        teamBId = seededTeams[teamIndex++];
      }

      await ctx.db.patch(matchId, {
        teamAId,
        teamBId,
        status: matchStatus,
        winnerId,
      });

      // Auto-advance bye winner to next round
      if (matchStatus === "Completed" && winnerId) {
        const match = await ctx.db.get(matchId);
        if (match?.nextMatchId) {
          if (m % 2 === 0) {
            await ctx.db.patch(match.nextMatchId, { teamAId: winnerId });
          } else {
            await ctx.db.patch(match.nextMatchId, { teamBId: winnerId });
          }
        }
      }
    }

    return competitionId;
  },
});

export const generateGroupStageKnockout = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    numGroups: v.optional(v.number()), // default 2
    advancingPerGroup: v.optional(v.number()), // default 2
    seedingMethod: v.optional(v.union(v.literal("Manual"), v.literal("Random"), v.literal("Automatic"))),
  },
  handler: async (ctx, args) => {
    await requireEventPageManager(ctx, args.eventId);

    // Delete existing competition for event if re-generating
    const existingComp = await ctx.db
      .query("competitions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existingComp) {
      const stages = await ctx.db
        .query("stages")
        .withIndex("by_competition", (q) => q.eq("competitionId", existingComp._id))
        .collect();

      for (const st of stages) {
        const rounds = await ctx.db
          .query("rounds")
          .withIndex("by_stage", (q) => q.eq("stageId", st._id))
          .collect();

        for (const rd of rounds) {
          const rdMatches = await ctx.db
            .query("matches")
            .withIndex("by_round", (q) => q.eq("roundId", rd._id))
            .collect();
          for (const m of rdMatches) await ctx.db.delete(m._id);
          await ctx.db.delete(rd._id);
        }

        const standings = await ctx.db
          .query("standings")
          .withIndex("by_stage", (q) => q.eq("stageId", st._id))
          .collect();

        for (const s of standings) await ctx.db.delete(s._id);
        await ctx.db.delete(st._id);
      }

      const seeds = await ctx.db
        .query("seeds")
        .withIndex("by_competition", (q) => q.eq("competitionId", existingComp._id))
        .collect();

      for (const sd of seeds) await ctx.db.delete(sd._id);
      await ctx.db.delete(existingComp._id);
    }

    // Fetch approved teams (or fall back to all non-rejected registered teams)
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    let approvedTeams = registrations
      .filter((r) => r.status === "Approved" && r.teamId)
      .map((r) => r.teamId!);

    if (approvedTeams.length === 0) {
      approvedTeams = registrations
        .filter((r) => r.status !== "Rejected" && r.teamId)
        .map((r) => r.teamId!);
    }

    approvedTeams = Array.from(new Set(approvedTeams));

    if (approvedTeams.length < 4) {
      throw new Error(`At least 4 registered teams are required for a Group Stage tournament (Found: ${approvedTeams.length}). Please ensure teams are registered.`);
    }

    const competitionId = await ctx.db.insert("competitions", {
      eventId: args.eventId,
      name: args.name,
      format: "Group Stage -> Knockout",
      status: "Active",
      seedingMethod: args.seedingMethod || "Random",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const seedingMethod = args.seedingMethod || "Random";
    let seededTeams = [...approvedTeams];
    if (seedingMethod === "Random") {
      seededTeams.sort(() => 0.5 - Math.random());
    }

    for (let i = 0; i < seededTeams.length; i++) {
      await ctx.db.insert("seeds", {
        competitionId,
        teamId: seededTeams[i],
        seedNumber: i + 1,
      });
    }

    // 1. Group Stage Allocation (Clamped so each group has at least 2 teams)
    const maxPossibleGroups = Math.max(1, Math.floor(seededTeams.length / 2));
    const groupCount = Math.max(1, Math.min(args.numGroups || 2, maxPossibleGroups));
    const groups: Id<"teams">[][] = Array.from({ length: groupCount }, () => []);

    for (let i = 0; i < seededTeams.length; i++) {
      groups[i % groupCount].push(seededTeams[i]);
    }

    // Create Group Stages & Round Robin Matches
    for (let g = 0; g < groupCount; g++) {
      const groupLetter = String.fromCharCode(65 + g); // A, B, C...
      const stageId = await ctx.db.insert("stages", {
        competitionId,
        name: `Group ${groupLetter}`,
        type: "Group",
        orderIndex: g + 1,
      });

      const roundId = await ctx.db.insert("rounds", {
        stageId,
        name: `Group ${groupLetter} Fixtures`,
        orderIndex: 0,
      });

      const groupTeams = groups[g];

      // Insert initial Standings for group teams
      for (let t = 0; t < groupTeams.length; t++) {
        await ctx.db.insert("standings", {
          stageId,
          teamId: groupTeams[t],
          played: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          scoreDifference: 0,
          rank: t + 1,
        });
      }

      // Generate round robin matches for group
      let matchIdx = 0;
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          await ctx.db.insert("matches", {
            eventId: args.eventId,
            competitionId,
            stageId,
            roundId,
            teamAId: groupTeams[i],
            teamBId: groupTeams[j],
            status: "Pending",
            matchIndex: matchIdx++,
          });
        }
      }
    }

    // 2. Knockout Stage Generation for advancing teams
    const advancingPerGroup = args.advancingPerGroup || 2;
    const totalAdvancing = groupCount * advancingPerGroup;

    let knockoutBracketSize = 2;
    while (knockoutBracketSize < totalAdvancing) {
      knockoutBracketSize *= 2;
    }

    const knockoutStageId = await ctx.db.insert("stages", {
      competitionId,
      name: "Knockout Stage",
      type: "Knockout",
      orderIndex: 99,
    });

    const numKnockoutRounds = Math.log2(knockoutBracketSize);
    const knockoutRounds: { id: Id<"rounds">; name: string; matchCount: number }[] = [];

    for (let r = 0; r < numKnockoutRounds; r++) {
      const matchCount = knockoutBracketSize / Math.pow(2, r + 1);
      let roundName = `Round of ${matchCount * 2}`;
      if (matchCount === 1) roundName = "Final";
      else if (matchCount === 2) roundName = "Semifinals";
      else if (matchCount === 4) roundName = "Quarterfinals";

      const roundId = await ctx.db.insert("rounds", {
        stageId: knockoutStageId,
        name: roundName,
        orderIndex: r,
      });

      knockoutRounds.push({ id: roundId, name: roundName, matchCount });
    }

    const knockoutMatchIds: Id<"matches">[][] = Array.from({ length: numKnockoutRounds }, () => []);

    for (let r = numKnockoutRounds - 1; r >= 0; r--) {
      const currentRound = knockoutRounds[r];

      for (let m = 0; m < currentRound.matchCount; m++) {
        let nextMatchId: Id<"matches"> | undefined;

        if (r < numKnockoutRounds - 1) {
          const nextRoundMatchIndex = Math.floor(m / 2);
          nextMatchId = knockoutMatchIds[r + 1][nextRoundMatchIndex];
        }

        const matchId = await ctx.db.insert("matches", {
          eventId: args.eventId,
          competitionId,
          stageId: knockoutStageId,
          roundId: currentRound.id,
          matchIndex: m,
          nextMatchId,
          status: "Pending",
        });

        knockoutMatchIds[r].push(matchId);
      }
    }

    return competitionId;
  },
});

// ---------------------------------------------------------------------------
// MATCH MANAGEMENT & PROGRESSION MUTATIONS
// ---------------------------------------------------------------------------

export const updateMatchScore = mutation({
  args: {
    matchId: v.id("matches"),
    teamAScore: v.number(),
    teamBScore: v.number(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");
    await requireEventPageManager(ctx, match.eventId);

    if (!match.teamAId || !match.teamBId) {
      throw new Error("Cannot enter score for a match without both teams decided.");
    }

    const stage = await ctx.db.get(match.stageId);
    if (!stage) throw new Error("Stage not found");

    let winnerId: Id<"teams"> | undefined = undefined;
    if (args.teamAScore > args.teamBScore) {
      winnerId = match.teamAId;
    } else if (args.teamBScore > args.teamAScore) {
      winnerId = match.teamBId;
    }

    // In Knockout stages, draws are not allowed
    if (stage.type === "Knockout" && !winnerId) {
      throw new Error("Knockout matches must have a winner (no draws allowed).");
    }

    // Update match record
    await ctx.db.patch(args.matchId, {
      teamAScore: args.teamAScore,
      teamBScore: args.teamBScore,
      winnerId,
      status: "Completed",
    });

    // 1. Advance winner if Knockout match
    if (stage.type === "Knockout" && match.nextMatchId && winnerId) {
      const nextMatch = await ctx.db.get(match.nextMatchId);
      if (nextMatch) {
        if (match.matchIndex % 2 === 0) {
          await ctx.db.patch(match.nextMatchId, { teamAId: winnerId });
        } else {
          await ctx.db.patch(match.nextMatchId, { teamBId: winnerId });
        }
      }
    }

    // 2. Handle Group Stage Standings update
    if (stage.type === "Group") {
      const standingsA = await ctx.db
        .query("standings")
        .withIndex("by_stage", (q) => q.eq("stageId", stage._id))
        .filter((q) => q.eq(q.field("teamId"), match.teamAId))
        .first();

      const standingsB = await ctx.db
        .query("standings")
        .withIndex("by_stage", (q) => q.eq("stageId", stage._id))
        .filter((q) => q.eq(q.field("teamId"), match.teamBId))
        .first();

      if (standingsA && standingsB) {
        const isDraw = args.teamAScore === args.teamBScore;
        const isWinA = args.teamAScore > args.teamBScore;

        const diffA = args.teamAScore - args.teamBScore;
        const diffB = args.teamBScore - args.teamAScore;

        await ctx.db.patch(standingsA._id, {
          played: standingsA.played + 1,
          wins: standingsA.wins + (isWinA ? 1 : 0),
          losses: standingsA.losses + (!isWinA && !isDraw ? 1 : 0),
          draws: standingsA.draws + (isDraw ? 1 : 0),
          points: standingsA.points + (isWinA ? 3 : isDraw ? 1 : 0),
          scoreDifference: standingsA.scoreDifference + diffA,
        });

        await ctx.db.patch(standingsB._id, {
          played: standingsB.played + 1,
          wins: standingsB.wins + (!isWinA && !isDraw ? 1 : 0),
          losses: standingsB.losses + (isWinA ? 1 : 0),
          draws: standingsB.draws + (isDraw ? 1 : 0),
          points: standingsB.points + (!isWinA && !isDraw ? 3 : isDraw ? 1 : 0),
          scoreDifference: standingsB.scoreDifference + diffB,
        });

        // Recalculate group ranks
        const allGroupStandings = await ctx.db
          .query("standings")
          .withIndex("by_stage", (q) => q.eq("stageId", stage._id))
          .collect();

        allGroupStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.scoreDifference !== a.scoreDifference) return b.scoreDifference - a.scoreDifference;
          return b.wins - a.wins;
        });

        for (let i = 0; i < allGroupStandings.length; i++) {
          await ctx.db.patch(allGroupStandings[i]._id, { rank: i + 1 });
        }
      }
    }
  },
});

export const updateMatchSchedule = mutation({
  args: {
    matchId: v.id("matches"),
    scheduledTime: v.optional(v.string()),
    status: v.union(
      v.literal("Pending"),
      v.literal("Scheduled"),
      v.literal("Live"),
      v.literal("Completed"),
      v.literal("Cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");
    await requireEventPageManager(ctx, match.eventId);

    await ctx.db.patch(args.matchId, {
      scheduledTime: args.scheduledTime,
      status: args.status,
    });
  },
});

export const saveSeeds = mutation({
  args: {
    competitionId: v.id("competitions"),
    seeds: v.array(v.object({ teamId: v.id("teams"), seedNumber: v.number() })),
  },
  handler: async (ctx, args) => {
    const comp = await ctx.db.get(args.competitionId);
    if (!comp) throw new Error("Competition not found");
    await requireEventPageManager(ctx, comp.eventId);

    for (const s of args.seeds) {
      const existing = await ctx.db
        .query("seeds")
        .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
        .filter((q) => q.eq(q.field("teamId"), s.teamId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { seedNumber: s.seedNumber });
      } else {
        await ctx.db.insert("seeds", {
          competitionId: args.competitionId,
          teamId: s.teamId,
          seedNumber: s.seedNumber,
        });
      }
    }
  },
});
