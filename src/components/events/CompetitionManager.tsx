import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import BracketView from './BracketView';
import { Loader2, Play } from 'lucide-react';

export default function CompetitionManager({ eventId }: { eventId: Id<"events"> }) {
  const competition = useQuery(api.competitions.getCompetition, { eventId });
  const generateSingleElimination = useMutation(api.competitions.generateSingleElimination);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await generateSingleElimination({
        eventId,
        name: "Main Tournament",
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate competition.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (competition === undefined) {
    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (competition === null) {
    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Play className="w-8 h-8 ml-1" />
        </div>
        <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-2">Ready to Start?</h3>
        <p className="text-sm text-zinc-500 font-medium max-w-md mx-auto mb-6">
          Once registration is closed, you can generate the competition bracket. For this phase, only Single Elimination is supported.
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100 max-w-md mx-auto">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-all active:scale-95 inline-flex items-center gap-2"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Generate Single Elimination Bracket
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">{competition.name}</h2>
            <p className="text-sm text-zinc-500 font-medium">Format: {competition.format}</p>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
            {competition.status}
          </div>
        </div>
        
        <CompetitionData competitionId={competition._id} />
      </div>
    </div>
  );
}

function CompetitionData({ competitionId }: { competitionId: Id<"competitions"> }) {
  const matches = useQuery(api.competitions.getMatches, { competitionId });
  const rounds = useQuery(api.competitions.getRounds, { competitionId });
  
  const updateMatchScore = useMutation(api.competitions.updateMatchScore);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  
  const [teamAScore, setTeamAScore] = useState<number | ''>('');
  const [teamBScore, setTeamBScore] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMatchClick = (match: any) => {
    if (match.status === "Completed") return; // Keep simple for now
    if (!match.teamA || !match.teamB) {
      alert("Cannot score a match without both teams decided yet.");
      return;
    }
    setSelectedMatch(match);
    setTeamAScore(match.teamAScore ?? '');
    setTeamBScore(match.teamBScore ?? '');
  };

  const handleSaveScore = async () => {
    if (!selectedMatch) return;
    if (teamAScore === '' || teamBScore === '') return;
    
    setIsSubmitting(true);
    try {
      await updateMatchScore({
        matchId: selectedMatch._id,
        teamAScore: Number(teamAScore),
        teamBScore: Number(teamBScore)
      });
      setSelectedMatch(null);
    } catch (err: any) {
      alert(err.message || "Failed to update score");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (matches === undefined || rounds === undefined) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <BracketView 
        matches={matches} 
        rounds={rounds} 
        onMatchClick={handleMatchClick}
      />
      
      {/* Basic Match Scoring Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMatch(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6">
            <h3 className="text-lg font-black text-zinc-900 mb-4">Enter Match Result</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900">{selectedMatch.teamA.name}</span>
                <input 
                  type="number" 
                  value={teamAScore}
                  onChange={e => setTeamAScore(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-20 rounded-xl border border-zinc-200 px-3 py-2 text-center font-black"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900">{selectedMatch.teamB.name}</span>
                <input 
                  type="number" 
                  value={teamBScore}
                  onChange={e => setTeamBScore(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-20 rounded-xl border border-zinc-200 px-3 py-2 text-center font-black"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 font-bold text-sm text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveScore}
                disabled={isSubmitting || teamAScore === '' || teamBScore === '' || teamAScore === teamBScore}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
