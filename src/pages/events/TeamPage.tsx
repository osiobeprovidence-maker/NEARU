import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, LogOut, Users, Shield, Trophy } from 'lucide-react';
import Avatar from '../../components/Avatar';

export default function TeamPage() {
  const { id } = useParams();
  const teamId = id as Id<"teams">;
  
  const { convexUserId } = useAuth();
  const navigate = useNavigate();

  const teamWithMembers = useQuery(api.teams.getTeam, { teamId });
  const leaveTeam = useMutation(api.teams.leaveTeam);
  
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveTeam = async () => {
    if (!window.confirm("Are you sure you want to leave this team?")) return;
    
    setIsLeaving(true);
    try {
      await leaveTeam({ teamId });
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Success', subtitle: 'You have left the team.' }
        })
      );
      navigate(-1);
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Failed to leave', subtitle: err.message }
        })
      );
    } finally {
      setIsLeaving(false);
    }
  };

  if (teamWithMembers === undefined) {
    return (
      <PageShell title="Team Details">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
      </PageShell>
    );
  }

  if (teamWithMembers === null) {
    return (
      <PageShell title="Team Not Found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-black text-zinc-900 mb-2">Team not found</h2>
          <Link to="/" className="text-indigo-600 font-bold hover:underline">Go Home</Link>
        </div>
      </PageShell>
    );
  }

  const isCaptain = teamWithMembers.captainId === convexUserId;
  const isMember = teamWithMembers.members.some(m => m.userId === convexUserId);
  const captain = teamWithMembers.members.find(m => m.role === 'captain')?.user;

  return (
    <PageShell title={teamWithMembers.name}>
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
          {/* Cover/Banner */}
          <div className="w-full h-32 sm:h-48 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

          <div className="px-6 md:px-8 pb-8 relative">
            <div className="flex justify-between items-start">
              {/* Logo */}
              <div className="-mt-16 w-32 h-32 rounded-2xl bg-white p-1.5 shadow-lg border border-zinc-100">
                {teamWithMembers.logoUrl ? (
                  <img src={teamWithMembers.logoUrl} alt={teamWithMembers.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-zinc-100 rounded-xl flex items-center justify-center text-4xl font-black text-zinc-400">
                    {teamWithMembers.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-2">
                {isMember && !isCaptain && (
                  <button
                    onClick={handleLeaveTeam}
                    disabled={isLeaving}
                    className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {isLeaving ? 'Leaving...' : 'Leave Team'}
                  </button>
                )}
                {isCaptain && (
                  <Link
                    to={`/manage/events/${teamWithMembers.eventId}`}
                    className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-sm transition-colors flex items-center gap-2"
                  >
                    Manage Team
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-3xl font-black text-zinc-900 mb-1">{teamWithMembers.name}</h1>
              <p className="text-sm font-semibold text-zinc-500">
                Event: <Link to={`/events/${teamWithMembers.eventId}`} className="text-indigo-600 hover:underline">View Event Details</Link>
              </p>
            </div>
            
            {captain && (
              <div className="mt-6 inline-flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100">
                <Trophy className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-600">Captain</div>
                  <div className="text-sm font-bold text-amber-900">{captain.name || captain.username}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Members Roster */}
        <div className="mt-6 bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xl font-black text-zinc-900">Team Roster ({teamWithMembers.members.length})</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {teamWithMembers.members.map((member) => (
              <div key={member._id} className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100/80 transition-colors">
                <Link to={`/user/${member.userId}`}>
                  <Avatar src={member.user?.avatar} fallback={(member.user?.name || member.user?.username || '?').charAt(0)} size="md" />
                </Link>
                <div className="flex-1">
                  <Link to={`/user/${member.userId}`} className="font-bold text-zinc-900 hover:text-indigo-600 hover:underline">
                    {member.user?.name || member.user?.username}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {member.role === 'captain' && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                    <span className="text-xs font-semibold text-zinc-500 capitalize">{member.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
