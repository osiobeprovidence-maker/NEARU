import React from 'react';
import { Trophy, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StandingsRow {
  _id: string;
  rank?: number;
  points: number;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  scoreDifference: number;
  team?: {
    _id: string;
    name: string;
    logoUrl?: string;
  } | null;
}

interface GroupStandings {
  stage: {
    _id: string;
    name: string;
  };
  rows: StandingsRow[];
}

export default function StandingsView({ standings }: { standings: GroupStandings[] }) {
  if (!standings || standings.length === 0) {
    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-12 text-center text-zinc-500 font-medium">
        No group standings available.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {standings.map(({ stage, rows }) => (
        <div key={stage._id} className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600" /> {stage.name} Standings
            </h3>
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              Top 2 Advance to Knockout
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-medium">
              <thead>
                <tr className="border-b border-zinc-200 text-xs font-black uppercase tracking-wider text-zinc-400">
                  <th className="pb-3 px-2 w-12 text-center">Rank</th>
                  <th className="pb-3 px-2">Team</th>
                  <th className="pb-3 px-2 text-center">Played</th>
                  <th className="pb-3 px-2 text-center">W</th>
                  <th className="pb-3 px-2 text-center">L</th>
                  <th className="pb-3 px-2 text-center">D</th>
                  <th className="pb-3 px-2 text-center">Diff</th>
                  <th className="pb-3 px-2 text-center font-black text-zinc-900">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row, index) => {
                  const isQualified = index < 2; // Top 2 advance
                  return (
                    <tr 
                      key={row._id} 
                      className={cn(
                        "hover:bg-zinc-50 transition-colors",
                        isQualified ? "bg-emerald-50/30" : ""
                      )}
                    >
                      <td className="py-4 px-2 text-center font-black text-zinc-900">
                        {row.rank || index + 1}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-zinc-500">
                            {row.team?.logoUrl ? (
                              <img src={row.team.logoUrl} alt={row.team.name} className="w-full h-full object-cover" />
                            ) : (
                              row.team?.name.charAt(0) || 'T'
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900">{row.team?.name || 'Unknown Team'}</span>
                            {isQualified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Qualified
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center font-semibold text-zinc-600">{row.played}</td>
                      <td className="py-4 px-2 text-center font-bold text-emerald-600">{row.wins}</td>
                      <td className="py-4 px-2 text-center font-bold text-rose-600">{row.losses}</td>
                      <td className="py-4 px-2 text-center font-semibold text-zinc-500">{row.draws}</td>
                      <td className="py-4 px-2 text-center font-semibold text-zinc-600">
                        {row.scoreDifference > 0 ? `+${row.scoreDifference}` : row.scoreDifference}
                      </td>
                      <td className="py-4 px-2 text-center font-black text-indigo-600 text-base">{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
