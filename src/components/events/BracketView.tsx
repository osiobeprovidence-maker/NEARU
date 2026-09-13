import React from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import { cn } from '../../lib/utils';
import { Trophy } from 'lucide-react';

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
      <div className="p-12 text-center text-zinc-500 font-medium">
        Bracket is empty or not generated.
      </div>
    );
  }

  // Group matches by round
  const matchesByRound = new Map<string, Match[]>();
  rounds.forEach((r) => {
    matchesByRound.set(r._id, matches.filter(m => m.round._id === r._id));
  });

  return (
    <div className="flex gap-8 overflow-x-auto p-8 bg-zinc-50 rounded-xl border border-zinc-100 min-h-[500px]">
      {rounds.map((round) => (
        <div key={round._id} className="flex flex-col flex-none w-64 gap-6 relative">
          <div className="text-center font-black text-sm text-zinc-900 uppercase tracking-wider mb-2">
            {round.name}
          </div>
          
          <div className="flex-1 flex flex-col justify-around gap-6 relative">
            {matchesByRound.get(round._id)?.map((match, i) => (
              <div 
                key={match._id} 
                className="relative"
              >
                <div 
                  onClick={() => !readOnly && onMatchClick && onMatchClick(match)}
                  className={cn(
                    "bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col",
                    readOnly ? "" : "cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all",
                    match.status === "Live" ? "border-rose-400" : "border-zinc-200"
                  )}
                >
                  <TeamRow team={match.teamA} score={match.teamAScore} isWinner={match.winnerId && match.winnerId === match.teamA?._id} />
                  <div className="h-px bg-zinc-100 w-full" />
                  <TeamRow team={match.teamB} score={match.teamBScore} isWinner={match.winnerId && match.winnerId === match.teamB?._id} />
                  
                  {match.status === "Live" && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                      Live
                    </div>
                  )}
                </div>
                
                {/* Visual connectors (crude but works for flex layout) */}
                {round.orderIndex < rounds.length - 1 && (
                  <div className="absolute top-1/2 -right-4 w-4 h-px bg-zinc-300" />
                )}
                {round.orderIndex > 0 && (
                  <div className="absolute top-1/2 -left-4 w-4 h-px bg-zinc-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamRow({ team, score, isWinner }: { team?: Team; score?: number; isWinner?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-2.5",
      isWinner ? "bg-indigo-50/50" : ""
    )}>
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="w-5 h-5 rounded overflow-hidden shrink-0 bg-zinc-100 flex items-center justify-center">
          {team?.logoUrl ? (
            <img src={team.logoUrl} className="w-full h-full object-cover" />
          ) : (
            <Trophy className="w-3 h-3 text-zinc-400" />
          )}
        </div>
        <span className={cn(
          "text-sm font-bold truncate",
          team ? "text-zinc-900" : "text-zinc-400 font-medium",
          isWinner ? "text-indigo-900" : ""
        )}>
          {team ? team.name : "TBD"}
        </span>
      </div>
      <div className={cn(
        "text-sm font-black w-8 text-center",
        score !== undefined ? "text-zinc-900" : "text-zinc-300"
      )}>
        {score !== undefined ? score : "-"}
      </div>
    </div>
  );
}
