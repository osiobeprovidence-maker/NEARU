import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import { Id } from '../../../convex/_generated/dataModel';
import { ChevronLeft, Save, Loader2, Trophy, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function TeamRegistration() {
  const { id } = useParams();
  const eventId = id as Id<"events">;
  
  const { convexUserId } = useAuth();
  const navigate = useNavigate();
  
  const event = useQuery(api.events.getEvent, { eventId });
  const myTeams = useQuery(api.teams.getMyTeams, { userId: convexUserId as Id<"users"> });
  
  const registerTeam = useMutation(api.teams.registerTeam);
  
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | "NEW">("NEW");
  
  // New Team Fields
  const [newTeamName, setNewTeamName] = useState("");
  const createTeamMutation = useMutation(api.teams.createTeam);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!convexUserId) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      let teamIdToRegister: Id<"teams">;
      
      if (selectedTeamId === "NEW") {
        if (!newTeamName.trim()) {
          throw new Error("Please enter a team name.");
        }
        
        teamIdToRegister = await createTeamMutation({
          name: newTeamName,
          captainId: convexUserId as Id<"users">,
          game: event?.game || "Other",
        });
      } else {
        teamIdToRegister = selectedTeamId;
      }
      
      await registerTeam({
        eventId,
        teamId: teamIdToRegister,
        registeredBy: convexUserId as Id<"users">,
      });
      
      navigate(`/events/${eventId}`);
    } catch (err: any) {
      setError(err.message || "Failed to register");
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="Register">
      <div className="max-w-2xl mx-auto pb-20">
        <Link to={`/events/${eventId}`} className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Event
        </Link>
        
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-1">
                Event Registration
              </h1>
              <p className="text-sm text-zinc-500 font-medium">
                {event ? `Register for ${event.name}` : "Loading event..."}
              </p>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}
            
            {myTeams !== undefined && (
              <div className="space-y-4">
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-2">
                  Select Team
                </label>
                
                <div className="grid gap-3">
                  <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors border-zinc-200">
                    <input 
                      type="radio" 
                      name="team" 
                      checked={selectedTeamId === "NEW"} 
                      onChange={() => setSelectedTeamId("NEW")} 
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-600"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-zinc-900">Create New Team</p>
                      <p className="text-xs text-zinc-500 font-medium">Create a brand new team for this event.</p>
                    </div>
                  </label>
                  
                  {myTeams.map(team => (
                    <label key={team._id} className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors border-zinc-200">
                      <input 
                        type="radio" 
                        name="team" 
                        checked={selectedTeamId === team._id} 
                        onChange={() => setSelectedTeamId(team._id as Id<"teams">)} 
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-600"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-zinc-900">{team.name}</p>
                        <p className="text-xs text-zinc-500 font-medium">Existing team</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {selectedTeamId === "NEW" && (
              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-4">
                <h3 className="font-black text-sm text-zinc-900">New Team Details</h3>
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                    Team Name *
                  </label>
                  <input
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="e.g. Pro Players"
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                  />
                </div>
              </div>
            )}
            
          </div>
          
          <div className="p-5 bg-zinc-50 border-t border-zinc-200 flex justify-end shrink-0">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !event}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors inline-flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Complete Registration
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
