import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, LogOut, Users, Shield, Trophy, UserPlus, UserMinus, Check, X, Mail, AlertCircle } from 'lucide-react';
import Avatar from '../../components/Avatar';
import { cn } from '../../lib/utils';

export default function TeamPage() {
  const { id } = useParams();
  const teamId = id as Id<"teams">;
  
  const { convexUserId } = useAuth();
  const navigate = useNavigate();

  const teamWithMembers = useQuery(api.teams.getTeam, { teamId });
  const event = useQuery(api.events.getEvent, teamWithMembers ? { eventId: teamWithMembers.eventId } : "skip");
  const teamInvitations = useQuery(api.teams.getTeamInvitations, teamWithMembers ? { teamId } : "skip");
  
  const leaveTeam = useMutation(api.teams.leaveTeam);
  const removeMember = useMutation(api.teams.removeMember);
  const invitePlayer = useMutation(api.teams.invitePlayer);
  
  const [isLeaving, setIsLeaving] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

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

  const handleRemoveMember = async (memberUserId: Id<"users">, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    try {
      await removeMember({ teamId, memberUserId });
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Member removed', subtitle: `${memberName} was removed from the roster.` }
        })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Error', subtitle: err.message }
        })
      );
    }
  };

  const handleInvitePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId.trim()) return;

    setIsInviting(true);
    setInviteError(null);
    try {
      // Expecting user ID or handle
      await invitePlayer({
        teamId,
        inviteeId: inviteUserId.trim() as Id<"users">,
      });
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Invitation Sent!', subtitle: 'Player has been invited to join your team.' }
        })
      );
      setInviteUserId('');
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
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
  const players = teamWithMembers.members.filter(m => m.role === 'player' || m.role === 'captain');
  const substitutes = teamWithMembers.members.filter(m => m.role === 'substitute');

  return (
    <PageShell title={teamWithMembers.name}>
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          
          {event && (
            <Link to={`/events/${event._id}`} className="text-xs font-bold text-indigo-600 hover:underline">
              View Event: {event.name}
            </Link>
          )}
        </div>

        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
          {/* Cover/Banner */}
          <div className="w-full h-32 sm:h-48 bg-gradient-to-r from-indigo-900 via-purple-900 to-zinc-900 relative">
            <div className="absolute inset-0 bg-black/20" />
          </div>

          <div className="px-6 md:px-8 pb-8 relative">
            <div className="flex justify-between items-start">
              {/* Logo */}
              <div className="-mt-16 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white p-1.5 shadow-lg border border-zinc-100 relative shrink-0">
                {teamWithMembers.logoUrl ? (
                  <img src={teamWithMembers.logoUrl} alt={teamWithMembers.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center text-3xl font-black text-indigo-600">
                    {teamWithMembers.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center gap-2">
                {isMember && !isCaptain && (
                  <button
                    onClick={handleLeaveTeam}
                    disabled={isLeaving}
                    className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    {isLeaving ? 'Leaving...' : 'Leave Team'}
                  </button>
                )}
                {isCaptain && (
                  <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-black text-[10px] uppercase tracking-wider border border-amber-200 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-500" /> Captain Admin
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-3xl font-black text-zinc-900 mb-1">{teamWithMembers.name}</h1>
              {event && (
                <p className="text-sm font-semibold text-zinc-500">
                  Competing in: <Link to={`/events/${event._id}`} className="text-indigo-600 hover:underline">{event.name}</Link> ({event.game})
                </p>
              )}
            </div>
            
            {captain && (
              <div className="mt-6 inline-flex items-center gap-3 px-4 py-2.5 bg-amber-50 rounded-2xl border border-amber-100">
                <Trophy className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-600">Team Captain</div>
                  <div className="text-xs font-bold text-amber-900">{captain.name || captain.username}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Captain Invite Player Card */}
        {isCaptain && (
          <div className="mt-6 bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Invite Players to Team
            </h2>
            <p className="text-xs text-zinc-500 font-medium mb-4">
              Enter a user's Convex ID to send a team invitation.
            </p>

            {inviteError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInvitePlayer} className="flex gap-3">
              <input
                type="text"
                value={inviteUserId}
                onChange={e => setInviteUserId(e.target.value)}
                placeholder="User ID (e.g. j57...)"
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
              />
              <button
                type="submit"
                disabled={isInviting || !inviteUserId.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
              >
                <Mail className="w-4 h-4" /> Send Invite
              </button>
            </form>

            {teamInvitations && teamInvitations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-zinc-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Pending Invitations</h3>
                <div className="space-y-2">
                  {teamInvitations.map((inv) => (
                    <div key={inv._id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-zinc-900">{inv.invitee?.name || inv.invitee?.username || 'Player'}</span>
                        <span className="text-zinc-400 ml-2">({inv.status})</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Sent {new Date(inv.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Members Roster */}
        <div className="mt-6 bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" />
              <h2 className="text-xl font-black text-zinc-900">Team Roster ({teamWithMembers.members.length})</h2>
            </div>
            {event && (
              <span className="text-xs font-semibold text-zinc-500">
                Limit: {event.maxPlayersPerTeam || '∞'} players
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {teamWithMembers.members.map((member) => (
              <div key={member._id} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100/80 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Link to={`/user/${member.userId}`}>
                    <Avatar src={member.user?.avatar} fallback={(member.user?.name || member.user?.username || '?').charAt(0)} size="md" />
                  </Link>
                  <div className="min-w-0">
                    <Link to={`/user/${member.userId}`} className="font-bold text-zinc-900 hover:text-indigo-600 hover:underline truncate block">
                      {member.user?.name || member.user?.username}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {member.role === 'captain' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                          <Shield className="w-3 h-3 text-amber-500" /> Captain
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-zinc-500 capitalize">{member.role}</span>
                      )}
                    </div>
                  </div>
                </div>

                {isCaptain && member.role !== 'captain' && (
                  <button
                    onClick={() => handleRemoveMember(member.userId, member.user?.name || member.user?.username || 'Member')}
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                    title="Remove player"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
