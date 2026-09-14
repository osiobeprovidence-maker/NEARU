import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import { Id } from '../../../convex/_generated/dataModel';
import StatusBadge from '../../components/events/StatusBadge';
import { Calendar, Users, MapPin, Trophy, ShieldAlert, ArrowRight, Megaphone, Plus, Clock, Info, CheckCircle2, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export default function EventPublicPage() {
  const { id } = useParams();
  const eventId = id as Id<"events">;
  const { convexUserId } = useAuth();
  
  const event = useQuery(api.events.getEvent, { eventId });
  const announcements = useQuery(api.operations.getEventAnnouncements, { eventId });
  const teams = useQuery(api.events.getEventTeams, { eventId });
  const registrations = useQuery(api.events.getEventRegistrations, { eventId });
  const myTeams = useQuery(api.teams.getMyTeams, convexUserId ? { userId: convexUserId as Id<"users"> } : "skip");
  
  const joinTeam = useMutation(api.teams.joinTeam);
  
  const [activeTab, setActiveTab] = useState<'Details' | 'Teams' | 'Rules' | 'Announcements'>('Details');
  const [isJoining, setIsJoining] = useState<string | null>(null);

  // Check if player is already on a team in this event
  const playerCurrentTeam = myTeams?.find(t => t.eventId === eventId);
  const teamRegistration = playerCurrentTeam
    ? registrations?.find(r => r.teamId === playerCurrentTeam._id)
    : null;

  const handleJoinTeam = async (teamId: Id<"teams">) => {
    setIsJoining(teamId);
    try {
      await joinTeam({ teamId });
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Success', subtitle: 'You have joined the team!' }
        })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Failed to join', subtitle: err.message }
        })
      );
    } finally {
      setIsJoining(null);
    }
  };

  const isRegistrationOpen = event?.status === 'Registration Open';
  const isRegistrationClosed = event?.status === 'Registration Closed' || event?.status === 'Completed';

  return (
    <PageShell title="Event Details">
      <div className="max-w-4xl mx-auto pb-20">
        {!event ? (
          <div className="animate-pulse bg-white md:rounded-[2rem] border border-zinc-200 h-64"></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
              {/* Banner Header */}
              {event.bannerUrl ? (
                <div className="w-full h-48 sm:h-64 bg-zinc-900 relative">
                  <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-indigo-900 via-zinc-900 to-black flex items-center justify-center relative">
                  <Trophy className="w-20 h-20 text-indigo-500/20" />
                  <div className="absolute top-4 right-4">
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              )}
              
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200">
                        {event.game}
                      </span>
                      {event.page && (
                        <span className="text-sm font-semibold text-zinc-500">
                          Organized by <Link to={`/user/${event.pageId}`} className="text-indigo-600 font-bold hover:underline">{event.page.name || event.page.organizationName}</Link>
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{event.name}</h1>
                  </div>

                  {/* Player Status / Actions */}
                  <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                    {playerCurrentTeam ? (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 w-full sm:w-auto flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                          <div className="text-xs font-black text-indigo-900">You are registered!</div>
                          <div className="text-xs text-indigo-700 font-medium">
                            Team: <Link to={`/teams/${playerCurrentTeam._id}`} className="font-bold underline">{playerCurrentTeam.name}</Link> ({teamRegistration?.status || 'Registered'})
                          </div>
                        </div>
                      </div>
                    ) : isRegistrationOpen ? (
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                          to={`/events/${eventId}/register`}
                          className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
                        >
                          <Trophy className="w-4 h-4" /> Create or Join Team
                        </Link>
                      </div>
                    ) : (
                      <div className="px-6 py-3.5 rounded-xl bg-zinc-100 text-zinc-500 font-bold text-sm flex items-center gap-2 cursor-not-allowed">
                        <Clock className="w-4 h-4" /> Registration Closed
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-zinc-100 my-6">
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Event Date
                    </div>
                    <div className="text-sm font-bold text-zinc-900">{event.eventDate || 'TBA'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Deadline
                    </div>
                    <div className="text-sm font-bold text-zinc-900">{event.registrationClosingDate || 'TBA'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Registered Teams
                    </div>
                    <div className="text-sm font-bold text-zinc-900">
                      {teams?.length || 0} / {event.maxTeams || '∞'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" /> Prize Pool
                    </div>
                    <div className="text-sm font-bold text-zinc-900">{event.prizePool || 'Bragging Rights'}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Content Navigation Tabs */}
            <div className="flex border-b border-zinc-200 bg-white md:rounded-[2rem] px-4 pt-2 shadow-sm overflow-x-auto">
              <button
                onClick={() => setActiveTab('Details')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                  activeTab === 'Details' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                Overview & Details
              </button>
              <button
                onClick={() => setActiveTab('Teams')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                  activeTab === 'Teams' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                Registered Teams ({teams?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('Rules')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                  activeTab === 'Rules' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                Rules & Requirements
              </button>
              <button
                onClick={() => setActiveTab('Announcements')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2",
                  activeTab === 'Announcements' ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Megaphone className="w-4 h-4" /> Announcements ({announcements?.length || 0})
              </button>
            </div>

            {/* Details Tab */}
            {activeTab === 'Details' && (
              <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8 space-y-8">
                {event.description ? (
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 mb-2">About this event</h2>
                    <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed text-sm">
                      {event.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm font-medium">No description provided for this event.</p>
                )}
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <h3 className="font-black text-sm text-zinc-900 mb-2">Format & Location</h3>
                    <p className="text-xs text-zinc-600">
                      <strong>Location:</strong> {event.isOnline ? 'Online Event' : event.location || 'TBA'}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      <strong>Registration Type:</strong> {event.registrationType === 'team' ? 'Team Roster' : 'Individual'}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      <strong>Team Capacity:</strong> {event.minPlayersPerTeam || 1} - {event.maxPlayersPerTeam || '∞'} players (+{event.maxSubstitutes || 0} subs)
                    </p>
                  </div>

                  <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <h3 className="font-black text-sm text-zinc-900 mb-2">Organizer Contact</h3>
                    <p className="text-xs text-zinc-600">
                      {event.contactInfo || 'Contact via Organization page.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'Teams' && (
              <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-zinc-900">Registered Teams</h2>
                    <p className="text-xs text-zinc-500 font-medium">View teams participating in this tournament.</p>
                  </div>
                  {isRegistrationOpen && !playerCurrentTeam && (
                    <Link
                      to={`/events/${eventId}/register`}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Create Team
                    </Link>
                  )}
                </div>

                {!teams ? (
                  <div className="text-center py-12 text-zinc-500 font-medium">Loading teams...</div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <Trophy className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-900 mb-1">No Teams Registered</h3>
                    <p className="text-sm text-zinc-500">Be the first to register a team for this event!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {teams.map((team) => (
                      <div key={team._id} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <Link to={`/teams/${team._id}`} className="flex items-center gap-4 mb-4">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                              {team.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-zinc-900 hover:text-indigo-600 transition-colors truncate">{team.name}</h3>
                            <p className="text-xs text-zinc-500 font-medium truncate">Captain: {team.captainName}</p>
                          </div>
                        </Link>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
                            <Users className="w-4 h-4 text-zinc-400" />
                            {team.memberCount} / {event.maxPlayersPerTeam || '∞'} members
                          </div>
                          
                          {isRegistrationOpen && !playerCurrentTeam && (!event.maxPlayersPerTeam || team.memberCount < event.maxPlayersPerTeam) ? (
                            <button
                              onClick={() => handleJoinTeam(team._id)}
                              disabled={isJoining === team._id}
                              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              {isJoining === team._id ? 'Joining...' : 'Join Team'}
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-wider">
                              {isRegistrationClosed ? 'Closed' : team.memberCount >= (event.maxPlayersPerTeam || 99) ? 'Full' : 'In Roster'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'Rules' && (
              <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 mb-2">Tournament Rules & Requirements</h2>
                  <p className="text-xs text-zinc-500 font-medium">Please review carefully before participating.</p>
                </div>

                {event.entryRequirements && (
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                    <h3 className="font-black text-amber-900 text-sm mb-1 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" /> Entry Requirements
                    </h3>
                    <p className="text-amber-800 text-sm whitespace-pre-wrap">{event.entryRequirements}</p>
                  </div>
                )}

                {event.rules ? (
                  <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200">
                    <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed text-sm">{event.rules}</p>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm font-medium">Standard tournament rules apply.</p>
                )}
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'Announcements' && (
              <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Megaphone className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-black text-zinc-900">Official Announcements</h2>
                </div>
                
                {announcements && announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div key={announcement._id} className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-zinc-900">{announcement.title}</h3>
                          <span className="text-xs font-semibold text-zinc-400">
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 whitespace-pre-wrap">{announcement.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-100">
                    No announcements published yet.
                  </p>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </PageShell>
  );
}
