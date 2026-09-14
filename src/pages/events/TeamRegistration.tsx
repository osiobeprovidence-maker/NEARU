import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import { Id } from '../../../convex/_generated/dataModel';
import { ChevronLeft, Save, Loader2, Trophy, Users, Image as ImageIcon, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  processAndCompressImage,
  uploadToConvexStorage,
} from '../../utils/imageUpload';
import { cn } from '../../lib/utils';

export default function TeamRegistration() {
  const { id } = useParams();
  const eventId = id as Id<"events">;
  
  const { convexUserId } = useAuth();
  const navigate = useNavigate();
  
  const event = useQuery(api.events.getEvent, { eventId });
  const myTeams = useQuery(api.teams.getMyTeams, convexUserId ? { userId: convexUserId as Id<"users"> } : "skip");
  
  const registerTeam = useMutation(api.teams.registerTeam);
  const createTeamMutation = useMutation(api.teams.createTeam);
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | "NEW">("NEW");
  
  // New Team Fields
  const [newTeamName, setNewTeamName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!convexUserId) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      if (event?.status !== 'Registration Open') {
        throw new Error('Registration is currently closed for this event.');
      }

      let teamIdToRegister: Id<"teams">;
      
      if (selectedTeamId === "NEW") {
        if (!newTeamName.trim()) {
          throw new Error("Please enter a team name.");
        }

        let logoStorageId = undefined;
        if (logoFile) {
          const compressedBlob = await processAndCompressImage(logoFile, {
            maxWidth: 512,
            maxHeight: 512,
            quality: 0.85,
          });
          logoStorageId = await uploadToConvexStorage(compressedBlob, generateUploadUrl);
        }
        
        teamIdToRegister = await createTeamMutation({
          eventId,
          name: newTeamName.trim(),
          logoStorageId,
        });
      } else {
        teamIdToRegister = selectedTeamId;
      }
      
      await registerTeam({
        teamId: teamIdToRegister,
      });

      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Registration Submitted!',
            subtitle: event.requireApproval ? 'Your registration is pending approval.' : 'Your team is registered!'
          }
        })
      );

      navigate(`/events/${eventId}`);
    } catch (err: any) {
      setError(err.message || "Failed to register");
      setIsSubmitting(false);
    }
  };

  const myEligibleTeams = myTeams?.filter(t => t.eventId === eventId) || [];

  return (
    <PageShell title="Register Team">
      <div className="max-w-2xl mx-auto pb-20">
        <Link to={`/events/${eventId}`} className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Event
        </Link>
        
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            <div>
              <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 mb-2 inline-block">
                {event?.game || 'Esports Event'}
              </span>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-1">
                Event Registration
              </h1>
              <p className="text-sm text-zinc-500 font-medium">
                {event ? `Register your team for ${event.name}` : "Loading event details..."}
              </p>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                {error}
              </div>
            )}
            
            {/* Team Selection */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-2">
                Registration Option
              </label>
              
              <div className="grid gap-3">
                <label className={cn(
                  "flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-colors",
                  selectedTeamId === "NEW" ? "border-indigo-600 bg-indigo-50/50" : "border-zinc-200 hover:bg-zinc-50"
                )}>
                  <input 
                    type="radio" 
                    name="team" 
                    checked={selectedTeamId === "NEW"} 
                    onChange={() => setSelectedTeamId("NEW")} 
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-600"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-zinc-900">Create New Team</p>
                    <p className="text-xs text-zinc-500 font-medium">Create a new team for this tournament and invite teammates.</p>
                  </div>
                </label>
                
                {myEligibleTeams.map(team => (
                  <label key={team._id} className={cn(
                    "flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-colors",
                    selectedTeamId === team._id ? "border-indigo-600 bg-indigo-50/50" : "border-zinc-200 hover:bg-zinc-50"
                  )}>
                    <input 
                      type="radio" 
                      name="team" 
                      checked={selectedTeamId === team._id} 
                      onChange={() => setSelectedTeamId(team._id as Id<"teams">)} 
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-600"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-zinc-900">{team.name}</p>
                      <p className="text-xs text-zinc-500 font-medium">Your existing team for this event</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* New Team Creation Sub-form */}
            {selectedTeamId === "NEW" && (
              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-4">
                <h3 className="font-black text-sm text-zinc-900">New Team Details</h3>
                
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                    Team Name *
                  </label>
                  <input
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="e.g. Apex Predators"
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
                    Team Logo (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-zinc-300 bg-white flex items-center justify-center cursor-pointer overflow-hidden relative shrink-0"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                      >
                        Upload Logo
                      </button>
                      <p className="text-[10px] text-zinc-400 mt-1 font-medium">Square image recommended</p>
                    </div>
                  </div>
                  <input 
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            )}
            
          </div>
          
          <div className="p-5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
            <div className="text-xs font-medium text-zinc-500">
              {event?.requireApproval ? 'Approval required by organizer' : 'Automatic registration approval'}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !event || event.status !== 'Registration Open'}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors inline-flex items-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50"
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
