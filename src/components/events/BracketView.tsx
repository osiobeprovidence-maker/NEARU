import React from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import { cn } from '../../lib/utils';
import { Trophy, Clock, PlayCircle } from 'lucide-react';

interface Team {
  _id: Id<"teams">;
  name: string;
  logoUrl?: string;
}

interface Match {
  _id: Id<"matches">;
  teamA?: Team;
  teamB?: Team;
  teamAScore?: number;
  teamBScore?: number;
  winnerId?: Id<"teams">;
  status: string;
  scheduledTime?: string;
  matchIndex: number;
  round: {
    _id: Id<"rounds">;
    name: string;
    orderIndex: number;
  };
}

interface BracketViewProps {
  matches: Match[];
  rounds: { _id: Id<"rounds">; name: string; orderIndex: number }[];
  onMatchClick?: (match: Match) => void;
  readOnly?: boolean;
}

export default function BracketView({ matches, rounds, onMatchClick, readOnly }: BracketViewProps) {
  if (!matches || matches.length === 0 || !rounds || rounds.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 font-medium bg-zinc-50 rounded-2xl border border-zinc-100">
        Bracket has not been generated yet.
      </div>
    );
  }

  // Group matches by round
  const matchesByRound = new Map<string, Match[]>();
  rounds.forEach((r) => {
    const roundMatches = matches
      .filter((m) => m.round._id === r._id)
      .sort((a, b) => a.matchIndex - b.matchIndex);
    matchesByRound.set(r._id, roundMatches);
  });

  return (
    <div className="flex gap-8 overflow-x-auto p-6 md:p-8 bg-zinc-900 text-white rounded-2xl border border-zinc-800 min-h-[520px]">
      {rounds.map((round) => {
        const roundMatches = matchesByRound.get(round._id) || [];
        return (
          <div key={round._id} className="flex flex-col flex-none w-72 gap-6 relative">
            <div className="text-center font-black text-xs uppercase tracking-wider text-indigo-400 bg-zinc-800/80 py-2.5 px-4 rounded-xl border border-zinc-700/50">
              {round.name}
            </div>

            <div className="flex-1 flex flex-col justify-around gap-6 relative">
              {roundMatches.map((match) => (
                <div key={match._id} className="relative">
                  <div
                    onClick={() => !readOnly && onMatchClick && onMatchClick(match)}
                    className={cn(
                      "bg-zinc-800/90 border rounded-2xl overflow-hidden shadow-lg flex flex-col transition-all",
                      readOnly ? "" : "cursor-pointer hover:border-indigo-500 hover:shadow-indigo-500/10 active:scale-[0.99]",
                      match.status === "Live" ? "border-rose-500 ring-2 ring-rose-500/30" : "border-zinc-700/80"
                    )}
                  >
                    {/* Header info */}
                    <div className="px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-700/50 flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                      <span>Match #{match.matchIndex + 1}</span>
                      {match.scheduledTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {match.scheduledTime}
                        </span>
                      )}
                      {match.status === "Live" && (
                        <span className="flex items-center gap-1 text-rose-400 font-black uppercase tracking-wider animate-pulse">
                          <PlayCircle className="w-3 h-3" /> Live
                        </span>
                      )}
                    </div>

                    <TeamRow
                      team={match.teamA}
                      score={match.teamAScore}
                      isWinner={Boolean(match.winnerId && match.winnerId === match.teamA?._id)}
                    />
                    <div className="h-px bg-zinc-700/50 w-full" />
                    <TeamRow
                      team={match.teamB}
                      score={match.teamBScore}
                      isWinner={Boolean(match.winnerId && match.winnerId === match.teamB?._id)}
                    />
                  </div>

                  {/* Connectors */}
                  {round.orderIndex < rounds.length - 1 && (
                    <div className="absolute top-1/2 -right-4 w-4 h-px bg-zinc-700" />
                  )}
                  {round.orderIndex > 0 && (
                    <div className="absolute top-1/2 -left-4 w-4 h-px bg-zinc-700" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamRow({ team, score, isWinner }: { team?: Team; score?: number; isWinner?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2.5 transition-colors",
      isWinner ? "bg-indigo-950/60 border-l-4 border-indigo-500" : ""
    )}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 bg-zinc-700/60 border border-zinc-600 flex items-center justify-center font-bold text-xs text-zinc-300">
          {team?.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            team?.name.charAt(0) || <Trophy className="w-3 h-3 text-zinc-500" />
          )}
        </div>
        <span className={cn(
          "text-xs font-bold truncate",
          team ? "text-zinc-100" : "text-zinc-500 italic",
          isWinner ? "text-indigo-200" : ""
        )}>
          {team ? team.name : "TBD"}
        </span>
      </div>
      <div className={cn(
        "text-sm font-black w-7 text-center shrink-0",
        score !== undefined ? (isWinner ? "text-indigo-400" : "text-zinc-300") : "text-zinc-600"
      )}>
        {score !== undefined ? score : "-"}
      </div>
    </div>
  );
}
