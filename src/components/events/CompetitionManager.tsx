import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import BracketView from './BracketView';
import StandingsView from './StandingsView';
import { Loader2, Play, Trophy, Users, RefreshCw, Calendar, Clock, CheckCircle2, AlertTriangle, Settings, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CompetitionManager({ eventId, isRegistrationClosed }: { eventId: Id<"events">; isRegistrationClosed?: boolean }) {
  const competition = useQuery(api.competitions.getCompetition, { eventId });
  const event = useQuery(api.events.getEvent, { eventId });
  const registeredTeams = useQuery(api.events.getEventTeams, { eventId });

  const generateSingleElimination = useMutation(api.competitions.generateSingleElimination);
  const generateGroupStageKnockout = useMutation(api.competitions.generateGroupStageKnockout);

  // Form State
  const [compName, setCompName] = useState("Main Tournament");
  const [compFormat, setCompFormat] = useState<"Single Elimination" | "Group Stage -> Knockout">("Single Elimination");
  const [seedingMethod, setSeedingMethod] = useState<"Automatic" | "Random" | "Manual">("Random");
  const [numGroups, setNumGroups] = useState<number>(2);
  const [advancingPerGroup, setAdvancingPerGroup] = useState<number>(2);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      if (compFormat === "Single Elimination") {
        await generateSingleElimination({
          eventId,
          name: compName.trim() || "Single Elimination Tournament",
          seedingMethod,
        });
      } else {
        await generateGroupStageKnockout({
          eventId,
          name: compName.trim() || "Group Stage Tournament",
          numGroups,
          advancingPerGroup,
          seedingMethod,
        });
      }

      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Competition Generated!', subtitle: `${compFormat} tournament structure created.` }
        })
      );
    } catch (err: any) {
      const msg = err.message || "Failed to generate competition.";
      setError(msg.includes("ConvexError") || msg.includes("Uncaught Error") ? msg.split(":")[1]?.trim() || msg : msg);
    } finally {
      setIsGenerating(false);
    }
  };

  if (competition === undefined) {
    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // If no competition generated yet
  if (competition === null) {
    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
        <div>
          <span className="px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 mb-2 inline-block">
            Phase 2: Competition Engine
          </span>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Create & Configure Competition</h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Convert your registered teams into a live tournament structure with rounds, matches, and automatic bracket progression.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
              Competition Name *
            </label>
            <input
              value={compName}
              onChange={e => setCompName(e.target.value)}
              placeholder="e.g. Honor of Kings Championship 2026"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-2">
              Select Tournament Format *
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCompFormat("Single Elimination")}
                className={cn(
                  "p-5 rounded-2xl border text-left transition-all",
                  compFormat === "Single Elimination" ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20" : "bg-white border-zinc-200 hover:border-zinc-300"
                )}
              >
                <Trophy className={cn("w-6 h-6 mb-2", compFormat === "Single Elimination" ? "text-indigo-600" : "text-zinc-400")} />
                <div className="font-black text-zinc-900 text-sm">Single Elimination</div>
                <div className="text-xs text-zinc-500 font-medium mt-1">Direct knockout bracket. Winners advance, losers are eliminated.</div>
              </button>

              <button
                type="button"
                onClick={() => setCompFormat("Group Stage -> Knockout")}
                className={cn(
                  "p-5 rounded-2xl border text-left transition-all",
                  compFormat === "Group Stage -> Knockout" ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20" : "bg-white border-zinc-200 hover:border-zinc-300"
                )}
              >
                <Users className={cn("w-6 h-6 mb-2", compFormat === "Group Stage -> Knockout" ? "text-indigo-600" : "text-zinc-400")} />
                <div className="font-black text-zinc-900 text-sm">Group Stage → Knockout</div>
                <div className="text-xs text-zinc-500 font-medium mt-1">Round Robin groups followed by a Knockout bracket for top ranked teams.</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
              Seeding Method
            </label>
            <select
              value={seedingMethod}
              onChange={e => setSeedingMethod(e.target.value as any)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
            >
              <option value="Random">Random Seeding (Shuffle)</option>
              <option value="Automatic">Automatic (Registration Order)</option>
              <option value="Manual">Manual Seeding</option>
            </select>
          </div>

          {compFormat === "Group Stage -> Knockout" && (
            <>
              <div>
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                  Number of Groups
                </label>
                <input
                  type="number"
                  value={numGroups}
                  onChange={e => setNumGroups(Number(e.target.value))}
                  min={2}
                  max={8}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                  Advancing Teams Per Group
                </label>
                <input
                  type="number"
                  value={advancingPerGroup}
                  onChange={e => setAdvancingPerGroup(Number(e.target.value))}
                  min={1}
                  max={4}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-indigo-200"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Generate {compFormat} Bracket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{competition.name}</h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                {competition.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-semibold mt-1">Format: {competition.format} • Seeding: {competition.seedingMethod}</p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            title="Regenerate Competition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-generate Competition
          </button>
        </div>

        <CompetitionData competitionId={competition._id} format={competition.format} />
      </div>
    </div>
  );
}

function CompetitionData({ competitionId, format }: { competitionId: Id<"competitions">; format: string }) {
  const matches = useQuery(api.competitions.getMatches, { competitionId });
  const rounds = useQuery(api.competitions.getRounds, { competitionId });
  const standings = useQuery(api.competitions.getStandings, { competitionId });
  const seeds = useQuery(api.competitions.getSeeds, { competitionId });

  const updateMatchScore = useMutation(api.competitions.updateMatchScore);
  const updateMatchSchedule = useMutation(api.competitions.updateMatchSchedule);

  const [activeTab, setActiveTab] = useState<'Bracket' | 'Standings' | 'Matches' | 'Seeds'>('Bracket');
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  const [teamAScore, setTeamAScore] = useState<number | ''>('');
  const [teamBScore, setTeamBScore] = useState<number | ''>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [matchStatus, setMatchStatus] = useState<"Pending" | "Scheduled" | "Live" | "Completed" | "Cancelled">("Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMatchClick = (match: any) => {
    setSelectedMatch(match);
    setTeamAScore(match.teamAScore ?? '');
    setTeamBScore(match.teamBScore ?? '');
    setScheduledTime(match.scheduledTime || '');
    setMatchStatus(match.status || 'Pending');
  };

  const handleSaveMatch = async () => {
    if (!selectedMatch) return;
    setIsSubmitting(true);
    try {
      // 1. Update schedule & status
      await updateMatchSchedule({
        matchId: selectedMatch._id,
        scheduledTime: scheduledTime || undefined,
        status: matchStatus,
      });

      // 2. If scores entered and both teams exist, update result
      if (teamAScore !== '' && teamBScore !== '' && selectedMatch.teamA && selectedMatch.teamB) {
        await updateMatchScore({
          matchId: selectedMatch._id,
          teamAScore: Number(teamAScore),
          teamBScore: Number(teamBScore),
        });
      }

      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Match Updated', subtitle: 'Scores and match status saved.' }
        })
      );
      setSelectedMatch(null);
    } catch (err: any) {
      alert(err.message || "Failed to update match");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (matches === undefined || rounds === undefined) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Sub Tabs */}
      <div className="flex border-b border-zinc-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('Bracket')}
          className={cn(
            "px-5 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap",
            activeTab === 'Bracket' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
          )}
        >
          Bracket View
        </button>

        {format.includes("Group") && (
          <button
            onClick={() => setActiveTab('Standings')}
            className={cn(
              "px-5 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap",
              activeTab === 'Standings' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
            )}
          >
            Group Standings
          </button>
        )}

        <button
          onClick={() => setActiveTab('Matches')}
          className={cn(
            "px-5 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap",
            activeTab === 'Matches' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
          )}
        >
          All Matches ({matches.length})
        </button>

        <button
          onClick={() => setActiveTab('Seeds')}
          className={cn(
            "px-5 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap",
            activeTab === 'Seeds' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
          )}
        >
          Seeding ({seeds?.length || 0})
        </button>
      </div>

      {/* Bracket Tab */}
      {activeTab === 'Bracket' && (
        <BracketView
          matches={matches}
          rounds={rounds}
          onMatchClick={handleMatchClick}
        />
      )}

      {/* Standings Tab */}
      {activeTab === 'Standings' && (
        <StandingsView standings={standings || []} />
      )}

      {/* Matches List Tab */}
      {activeTab === 'Matches' && (
        <div className="space-y-3">
          {matches.map((match) => (
            <div
              key={match._id}
              onClick={() => handleMatchClick(match)}
              className="p-4 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-400">Match #{match.matchIndex + 1}</span>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-zinc-900">
                    {match.teamA?.name || 'TBD'} vs {match.teamB?.name || 'TBD'}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium">
                    {match.stage?.name} • {match.round?.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {match.status === 'Completed' ? (
                  <div className="text-right">
                    <div className="font-black text-sm text-zinc-900">
                      {match.teamAScore} - {match.teamBScore}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600">Completed</div>
                  </div>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-bold uppercase">
                    {match.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seeds Tab */}
      {activeTab === 'Seeds' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {seeds?.map((seed) => (
            <div key={seed._id} className="p-4 rounded-2xl border border-zinc-200 bg-white flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0">
                #{seed.seedNumber}
              </div>
              <div className="font-bold text-zinc-900 text-sm">
                {seed.team?.name || 'Unassigned'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match Management Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMatch(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-zinc-900">Manage Match</h3>
                <p className="text-xs text-zinc-500 font-medium">{selectedMatch.stage?.name} • {selectedMatch.round?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Team Scores */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900">{selectedMatch.teamA?.name || 'Team A (TBD)'}</span>
                  <input
                    type="number"
                    value={teamAScore}
                    onChange={e => setTeamAScore(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={!selectedMatch.teamA || !selectedMatch.teamB}
                    placeholder="0"
                    className="w-16 rounded-xl border border-zinc-200 px-3 py-2 text-center font-black text-base focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900">{selectedMatch.teamB?.name || 'Team B (TBD)'}</span>
                  <input
                    type="number"
                    value={teamBScore}
                    onChange={e => setTeamBScore(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={!selectedMatch.teamA || !selectedMatch.teamB}
                    placeholder="0"
                    className="w-16 rounded-xl border border-zinc-200 px-3 py-2 text-center font-black text-base focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Status & Schedule */}
              <div>
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                  Match Status
                </label>
                <select
                  value={matchStatus}
                  onChange={e => setMatchStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Live">Live NOW</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                  Scheduled Date / Time
                </label>
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  placeholder="e.g. Sept 15, 18:00 UTC"
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2.5 font-bold text-xs text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMatch}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Match Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
