import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
  }
});

export const getMatches = query({
  args: {
    competitionId: v.id("competitions"),
  },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
      .collect();

    const matchesWithTeams = await Promise.all(
      matches.map(async (match) => {
        const teamA = match.teamAId ? await ctx.db.get(match.teamAId) : null;
        const teamB = match.teamBId ? await ctx.db.get(match.teamBId) : null;
        const round = await ctx.db.get(match.roundId);
        return { ...match, teamA, teamB, round };
      })
    );

    return matchesWithTeams.sort((a, b) => a.matchIndex - b.matchIndex);
  }
});

export const getRounds = query({
  args: {
    competitionId: v.id("competitions"),
  },
  handler: async (ctx, args) => {
    const stages = await ctx.db
      .query("stages")
      .withIndex("by_competition", (q) => q.eq("competitionId", args.competitionId))
      .collect();
      
    if (stages.length === 0) return [];
    
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_stage", (q) => q.eq("stageId", stages[0]._id))
      .collect();
      
    return rounds.sort((a, b) => a.orderIndex - b.orderIndex);
  }
});

export const generateSingleElimination = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get approved teams for the event
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
      
    const approvedTeams = registrations
      .filter((r) => r.status === "Approved" && r.teamId)
      .map((r) => r.teamId!);

    if (approvedTeams.length < 2) {
      return null;
    }

    // 2. Create competition
    const competitionId = await ctx.db.insert("competitions", {
      eventId: args.eventId,
      name: args.name,
      format: "Single Elimination",
      status: "Active",
      seedingMethod: "Random",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 3. Create Knockout Stage
    const stageId = await ctx.db.insert("stages", {
      competitionId,
      name: "Knockout Stage",
      type: "Knockout",
      orderIndex: 1,
    });

    // Determine bracket size (next power of 2)
    const numTeams = approvedTeams.length;
    let bracketSize = 2;
    while (bracketSize < numTeams) {
      bracketSize *= 2;
    }

    const numByes = bracketSize - numTeams;
    
    // Shuffle teams for random seeding (basic implementation)
    const shuffledTeams = [...approvedTeams].sort(() => 0.5 - Math.random());
    
    // Calculate number of rounds
    const numRounds = Math.log2(bracketSize);
    const rounds: { id: Id<"rounds">; name: string; matchCount: number }[] = [];

    // 4. Create Rounds
    for (let r = 0; r < numRounds; r++) {
      const matchCount = bracketSize / Math.pow(2, r + 1);
      let roundName = `Round of ${matchCount * 2}`;
      if (matchCount === 1) roundName = "Final";
      if (matchCount === 2) roundName = "Semifinals";
      if (matchCount === 4) roundName = "Quarterfinals";

      const roundId = await ctx.db.insert("rounds", {
        stageId,
        name: roundName,
        orderIndex: r,
      });

      rounds.push({ id: roundId, name: roundName, matchCount });
    }

    // 5. Generate Matches
    // Map to keep track of generated matches: roundIndex -> matchIndex -> matchId
    const matchIds: Id<"matches">[][] = Array.from({ length: numRounds }, () => []);

    // Create matches starting from the Final (round index numRounds - 1) down to the first round
    for (let r = numRounds - 1; r >= 0; r--) {
      const currentRound = rounds[r];
      
      for (let m = 0; m < currentRound.matchCount; m++) {
        let nextMatchId: Id<"matches"> | undefined;
        
        // If it's not the final, determine the next match
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

    // 6. Populate First Round (and Byes)
    let teamIndex = 0;
    const firstRoundMatches = matchIds[0];
    
    for (let m = 0; m < firstRoundMatches.length; m++) {
      const matchId = firstRoundMatches[m];
      
      let teamAId: Id<"teams"> | undefined = undefined;
      let teamBId: Id<"teams"> | undefined = undefined;
      let matchStatus: "Pending" | "Completed" = "Pending";
      let winnerId: Id<"teams"> | undefined = undefined;
      
      // Assign Team A
      if (teamIndex < numTeams) {
        teamAId = shuffledTeams[teamIndex++];
      }
      
      // Assign Team B (Check if they get a bye)
      // For simplicity, distribute byes to the end of the matches
      if (m >= firstRoundMatches.length - numByes) {
        // This match is a bye for Team A
        teamBId = undefined;
        winnerId = teamAId; // Team A automatically wins
        matchStatus = "Completed";
      } else if (teamIndex < numTeams) {
        teamBId = shuffledTeams[teamIndex++];
      }

      await ctx.db.patch(matchId, {
        teamAId,
        teamBId,
        status: matchStatus,
        winnerId,
      });

      // If it was a bye, we need to manually advance the winner to the next round immediately
      if (matchStatus === "Completed" && winnerId) {
        const match = await ctx.db.get(matchId);
        if (match?.nextMatchId) {
          const nextMatch = await ctx.db.get(match.nextMatchId);
          if (nextMatch) {
            // Is Team A or Team B slot open?
            if (m % 2 === 0) {
              await ctx.db.patch(match.nextMatchId, { teamAId: winnerId });
            } else {
              await ctx.db.patch(match.nextMatchId, { teamBId: winnerId });
            }
          }
        }
      }
    }
    
    return competitionId;
  }
});

export const updateMatchScore = mutation({
  args: {
    matchId: v.id("matches"),
    teamAScore: v.number(),
    teamBScore: v.number(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");
    
    if (!match.teamAId || !match.teamBId) {
      throw new Error("Cannot score a match without both teams");
    }

    let winnerId: Id<"teams"> | undefined = undefined;
    if (args.teamAScore > args.teamBScore) winnerId = match.teamAId;
    else if (args.teamBScore > args.teamAScore) winnerId = match.teamBId;
    // We assume no draws in knockout. If draw, they must re-enter score.
    if (!winnerId) throw new Error("Match must have a winner in Knockout stage.");

    await ctx.db.patch(args.matchId, {
      teamAScore: args.teamAScore,
      teamBScore: args.teamBScore,
      winnerId,
      status: "Completed",
    });

    // Advance winner
    if (match.nextMatchId) {
      const nextMatch = await ctx.db.get(match.nextMatchId);
      if (nextMatch) {
        if (match.matchIndex % 2 === 0) {
          await ctx.db.patch(match.nextMatchId, { teamAId: winnerId });
        } else {
          await ctx.db.patch(match.nextMatchId, { teamBId: winnerId });
        }
      }
    }
  }
});
