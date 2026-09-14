import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import { Id } from '../../../convex/_generated/dataModel';
import {
  ChevronLeft,
  CheckCircle2,
  UploadCloud,
  ShieldAlert,
  Clock,
  UserCheck,
  AlertCircle,
  FileText,
  ExternalLink,
  Award,
} from 'lucide-react';

export default function MatchDashboard() {
  const { matchId } = useParams();
  const mId = matchId as Id<"matches">;

  return (
    <PageShell title="Match Room & Operations">
      <div className="max-w-4xl mx-auto pb-20 p-4 md:p-6">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Return to Event
        </Link>
        <MatchContent matchId={mId} />
      </div>
    </PageShell>
  );
}

function MatchContent({ matchId }: { matchId: Id<"matches"> }) {
  const match = useQuery(api.operations.getMatchDetails, { matchId });

  const checkInMutation = useMutation(api.operations.checkInPlayer);
  const submitResult = useMutation(api.operations.submitMatchResult);
  const confirmResult = useMutation(api.operations.confirmMatchResult);
  const reportDispute = useMutation(api.operations.reportDispute);
  const uploadEvidence = useMutation(api.operations.uploadMatchEvidence);

  const [teamAScoreInput, setTeamAScoreInput] = useState<number>(0);
  const [teamBScoreInput, setTeamBScoreInput] = useState<number>(0);
  const [evidenceUrlInput, setEvidenceUrlInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  const [disputeReason, setDisputeReason] = useState<string>('Score Discrepancy');
  const [disputeDesc, setDisputeDesc] = useState<string>('');
  const [disputeEvidenceUrl, setDisputeEvidenceUrl] = useState<string>('');
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);

  if (match === undefined) {
    return <div className="animate-pulse bg-white rounded-3xl h-96 border border-zinc-200" />;
  }
  if (match === null) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 space-y-3">
        <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
        <h2 className="text-xl font-black text-zinc-900">Match Not Found</h2>
        <p className="text-zinc-500 text-sm">This match ID does not exist or has been deleted.</p>
      </div>
    );
  }

  // Determine current user team
  const isTeamA = true; // In a full app, compare currentUser._id against match.teamAPlayers
  const currentTeamId = match.teamAId;

  const handleCheckIn = async (teamId: Id<"teams">) => {
    try {
      // Demo: pass current user or team member
      await checkInMutation({ matchId, teamId, userId: match.teamAPlayers[0]?.userId || ("user_demo" as any) });
      alert('Checked in successfully!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeamId) return;
    try {
      await submitResult({
        matchId,
        teamAScore: teamAScoreInput,
        teamBScore: teamBScoreInput,
        submittedByTeamId: currentTeamId,
        notes: notesInput,
        evidenceUrl: evidenceUrlInput || undefined,
      });
      alert('Match result submitted! Waiting for opponent or referee confirmation.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleConfirmResult = async () => {
    try {
      await confirmResult({ matchId, confirmedByTeamId: currentTeamId });
      alert('Match result confirmed! Winner has been advanced in the tournament bracket.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeamId || !disputeDesc) return;
    try {
      await reportDispute({
        matchId,
        reportingTeamId: currentTeamId,
        reason: disputeReason,
        description: disputeDesc,
        evidenceUrl: disputeEvidenceUrl || undefined,
      });
      setShowDisputeModal(false);
      setDisputeDesc('');
      alert('Dispute submitted. Tournament admins have been notified.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Match Scoreboard Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 text-white rounded-[2.5rem] border border-zinc-800 shadow-xl p-8 relative overflow-hidden">
        <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider mb-6">
          <span>{match.round?.name || 'Tournament Round'} &bull; {match.stage?.name || 'Stage'}</span>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-black ${
              match.status === 'Live'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                : match.status === 'Completed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}
          >
            {match.status === 'Live' ? '🔴 LIVE NOW' : match.status}
          </span>
        </div>

        <div className="flex justify-around items-center gap-4 text-center">
          {/* Team A */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-20 h-20 bg-zinc-800 border-2 border-zinc-700 rounded-2xl flex items-center justify-center font-black text-2xl mb-3 shadow-inner">
              {match.teamA?.logoUrl ? (
                <img src={match.teamA.logoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                match.teamA?.name?.[0] || 'A'
              )}
            </div>
            <h3 className="font-bold text-base md:text-lg">{match.teamA?.name || 'TBD'}</h3>
            <span className="text-4xl font-black text-indigo-400 mt-2">{match.teamAScore ?? '-'}</span>
          </div>

          <div className="text-zinc-600 font-black text-2xl">VS</div>

          {/* Team B */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-20 h-20 bg-zinc-800 border-2 border-zinc-700 rounded-2xl flex items-center justify-center font-black text-2xl mb-3 shadow-inner">
              {match.teamB?.logoUrl ? (
                <img src={match.teamB.logoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                match.teamB?.name?.[0] || 'B'
              )}
            </div>
            <h3 className="font-bold text-base md:text-lg">{match.teamB?.name || 'TBD'}</h3>
            <span className="text-4xl font-black text-indigo-400 mt-2">{match.teamBScore ?? '-'}</span>
          </div>
        </div>

        {match.scheduledTime && (
          <div className="mt-6 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-400 font-semibold flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" /> Scheduled: {new Date(match.scheduledTime).toLocaleString()}
          </div>
        )}
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CHECK-IN SECTION */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" /> Match Check-in
            </h3>
            <span className="text-xs font-bold text-zinc-500">
              Window: 30m before
            </span>
          </div>

          <div className="space-y-3">
            {/* Team A Status */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-zinc-900">{match.teamA?.name || 'Team A'}</div>
                <div className="text-xs text-zinc-500">
                  {match.teamACheckInCount} / {match.teamAPlayers.length || 1} Players Checked In
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  match.teamACheckInState === 'Checked in'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {match.teamACheckInState}
              </span>
            </div>

            {/* Team B Status */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-zinc-900">{match.teamB?.name || 'Team B'}</div>
                <div className="text-xs text-zinc-500">
                  {match.teamBCheckInCount} / {match.teamBPlayers.length || 1} Players Checked In
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  match.teamBCheckInState === 'Checked in'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {match.teamBCheckInState}
              </span>
            </div>
          </div>

          {match.teamAId && (
            <button
              onClick={() => handleCheckIn(match.teamAId!)}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs shadow-sm transition-all"
            >
              Check In My Player / Team
            </button>
          )}
        </div>

        {/* RESULT & CONFIRMATION SECTION */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" /> Result Submission & Verification
          </h3>

          {match.resultStatus === 'Pending Confirmation' ? (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs space-y-3">
              <div className="font-bold text-amber-900 text-sm">Result Pending Confirmation</div>
              <p className="text-amber-700">
                Score submitted: <strong>{match.teamAScore}</strong> - <strong>{match.teamBScore}</strong>.
              </p>
              <button
                onClick={handleConfirmResult}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
              >
                Confirm Opponent's Score Submission
              </button>
            </div>
          ) : match.resultStatus === 'Confirmed' || match.status === 'Completed' ? (
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs space-y-2 text-emerald-900">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Match Completed & Confirmed
              </div>
              <p>Winner: <strong>{match.teamA?._id === match.winnerId ? match.teamA?.name : match.teamB?.name || 'TBD'}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleSubmitResult} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">{match.teamA?.name || 'Team A'} Score</label>
                  <input
                    type="number"
                    value={teamAScoreInput}
                    onChange={(e) => setTeamAScoreInput(Number(e.target.value))}
                    className="w-full border border-zinc-200 rounded-xl p-2.5 font-bold text-center text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">{match.teamB?.name || 'Team B'} Score</label>
                  <input
                    type="number"
                    value={teamBScoreInput}
                    onChange={(e) => setTeamBScoreInput(Number(e.target.value))}
                    className="w-full border border-zinc-200 rounded-xl p-2.5 font-bold text-center text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Evidence Screenshot / Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={evidenceUrlInput}
                  onChange={(e) => setEvidenceUrlInput(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs shadow-sm"
              >
                Submit Official Match Result
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Disputes Box */}
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="font-black text-rose-900 text-base flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" /> Match Dispute or Rule Violation?
          </h4>
          <p className="text-xs text-rose-700 mt-1">
            If your opponent failed to check in, cheated, or submitted an incorrect score, file an official dispute.
          </p>
        </div>
        <button
          onClick={() => setShowDisputeModal(true)}
          className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs shadow-sm"
        >
          File Official Dispute
        </button>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleFileDispute} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" /> Report Match Dispute
            </h3>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Dispute Reason</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl p-3 text-xs"
              >
                <option value="Score Discrepancy">Score Discrepancy</option>
                <option value="No Show / Failed Check-in">No Show / Failed Check-in</option>
                <option value="Rule Violation / Cheating">Rule Violation / Cheating</option>
                <option value="Other">Other Administrative Concern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Detailed Description</label>
              <textarea
                value={disputeDesc}
                onChange={(e) => setDisputeDesc(e.target.value)}
                placeholder="Explain what happened in detail..."
                className="w-full border border-zinc-200 rounded-xl p-3 text-xs h-28"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Evidence URL (Screenshot Image Link)</label>
              <input
                type="url"
                value={disputeEvidenceUrl}
                onChange={(e) => setDisputeEvidenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-zinc-200 rounded-xl p-3 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
              >
                Submit Dispute
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
