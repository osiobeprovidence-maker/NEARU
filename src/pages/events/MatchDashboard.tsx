import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import { Id } from '../../../convex/_generated/dataModel';
import { ChevronLeft, CheckCircle, UploadCloud, ShieldAlert, FileWarning } from 'lucide-react';

export default function MatchDashboard() {
  const { matchId } = useParams();
  const mId = matchId as Id<"matches">;
  
  // NOTE: For a real app, we would query the match directly, but for now we'll fetch competitions and find it,
  // or we need a specific query `getMatch` in our operations. Let's assume we need to fetch it.
  // I will just add a query in operations.ts and use it here. Wait, I should add `getMatch` to `operations.ts`.

  return (
    <PageShell title="Match Dashboard">
      <div className="max-w-4xl mx-auto pb-20 p-6">
        <Link to="/my-rallys" className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
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

  // Mocked current user ID / team ID for demo purposes
  const currentUserTeamId = match?.teamA?._id; // Assume current user is on Team A for this demo

  const [teamAScore, setTeamAScore] = useState<number>(0);
  const [teamBScore, setTeamBScore] = useState<number>(0);
  const [disputeReason, setDisputeReason] = useState('');

  if (match === undefined) return <div className="animate-pulse bg-white rounded-xl h-64 border border-zinc-200"></div>;
  if (match === null) return <div>Match not found</div>;

  const handleCheckIn = async () => {
    try {
      // In a real app we pass the actual user ID and their team ID
      await checkInMutation({ matchId, teamId: currentUserTeamId!, userId: "user123" as any });
      alert("Checked in successfully!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmitResult = async () => {
    try {
      await submitResult({
        matchId,
        teamAScore,
        teamBScore,
        submittedByTeamId: currentUserTeamId!
      });
      alert("Result submitted!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleConfirmResult = async () => {
    try {
      await confirmResult({ matchId, confirmedByTeamId: currentUserTeamId! });
      alert("Result confirmed!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDispute = async () => {
    try {
      await reportDispute({
        matchId,
        reportingTeamId: currentUserTeamId!,
        reason: "Score Discrepancy",
        description: disputeReason
      });
      alert("Dispute reported!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-8 text-center">
        <h2 className="text-2xl font-black text-zinc-900 mb-6">Match Details</h2>
        <div className="flex justify-center items-center gap-8">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-100 rounded-2xl mb-3"></div>
            <span className="font-bold">{match.teamA?.name || "TBD"}</span>
            <span className="text-3xl font-black text-indigo-600 mt-2">{match.teamAScore ?? "-"}</span>
          </div>
          <div className="text-zinc-300 font-black text-xl">VS</div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-100 rounded-2xl mb-3"></div>
            <span className="font-bold">{match.teamB?.name || "TBD"}</span>
            <span className="text-3xl font-black text-indigo-600 mt-2">{match.teamBScore ?? "-"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Check In</h3>
          <p className="text-sm text-zinc-500 mb-4">All players must check in before the match begins.</p>
          <button onClick={handleCheckIn} className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold">
            Check In Now
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2"><UploadCloud className="w-5 h-5 text-indigo-500" /> Submit Result</h3>
          
          {match.resultStatus === "Pending Confirmation" ? (
            <div>
              <p className="text-sm text-amber-600 font-bold mb-4">Result submitted. Waiting for confirmation.</p>
              <button onClick={handleConfirmResult} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">
                Confirm Opponent's Result
              </button>
            </div>
          ) : match.resultStatus === "Confirmed" ? (
            <p className="text-sm text-emerald-600 font-bold">Match has been confirmed and completed.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4">
                <input type="number" value={teamAScore} onChange={e => setTeamAScore(Number(e.target.value))} className="w-full border rounded-lg p-2 text-center" placeholder="Team A Score" />
                <input type="number" value={teamBScore} onChange={e => setTeamBScore(Number(e.target.value))} className="w-full border rounded-lg p-2 text-center" placeholder="Team B Score" />
              </div>
              <button onClick={handleSubmitResult} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">
                Submit Scores
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-rose-200 p-6 md:col-span-2">
          <h3 className="text-lg font-black mb-4 text-rose-600 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Report a Dispute</h3>
          <p className="text-sm text-zinc-500 mb-4">If your opponent submitted an incorrect score or broke a rule, report it here.</p>
          <div className="flex gap-4">
            <input type="text" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Describe the issue..." className="flex-1 border rounded-xl p-3 text-sm" />
            <button onClick={handleDispute} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold">
              Submit Dispute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
