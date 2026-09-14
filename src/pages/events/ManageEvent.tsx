import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import { Id } from '../../../convex/_generated/dataModel';
import StatusBadge from '../../components/events/StatusBadge';
import { Calendar, Users, ChevronLeft, MapPin, Search, UserCheck, XCircle, CheckCircle, Trophy, Clock, Play, AlertCircle, Eye, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ManageEvent() {
  const { id } = useParams();
  const eventId = id as Id<"events">;
  
  const event = useQuery(api.events.getEvent, { eventId });
  const registrations = useQuery(api.events.getEventRegistrations, { eventId });
  const teams = useQuery(api.events.getEventTeams, { eventId });
  
  const approveMutation = useMutation(api.teams.approveRegistration);
  const updateStatusMutation = useMutation(api.events.updateEventStatus);

  const [activeStatusTab, setActiveStatusTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  const filteredRegistrations = registrations?.filter((r) => {
    if (activeStatusTab === 'All') return true;
    return r.status === activeStatusTab;
  }) || [];

  const handleApprove = async (regId: Id<"eventRegistrations">, approve: boolean) => {
    try {
      await approveMutation({ registrationId: regId, approve });
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: approve ? 'Approved!' : 'Rejected', subtitle: `Registration status updated.` }
        })
      );
    } catch (err: any) {
      alert(err.message || "Failed to update registration");
    }
  };

  const handleStatusChange = async (newStatus: "Draft" | "Published" | "Registration Open" | "Registration Closed" | "Completed") => {
    try {
      await updateStatusMutation({ eventId, status: newStatus });
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Status Updated', subtitle: `Event status changed to ${newStatus}` }
        })
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <PageShell title="Manage Event">
      <div className="max-w-4xl mx-auto pb-20">
        <Link to="/manage" className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Organization Dashboard
        </Link>
        
        {!event || registrations === undefined ? (
          <div className="animate-pulse bg-white md:rounded-[2rem] border border-zinc-200 h-64"></div>
        ) : (
          <div className="space-y-6">
            {/* Event Header Banner */}
            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
              {event.bannerUrl ? (
                <div className="w-full h-48 bg-zinc-900 relative">
                  <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-indigo-900 to-zinc-900 p-6 flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                      {event.game}
                    </span>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              )}

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-1">{event.name}</h1>
                    <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 flex-wrap">
                      <span className="text-indigo-600 font-bold">{event.game}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.eventDate || 'TBA'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Deadline: {event.registrationClosingDate || 'TBA'}</span>
                    </div>
                  </div>

                  <Link
                    to={`/events/${eventId}`}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> View Public Page
                  </Link>
                </div>

                {/* Status Transition Control Panel */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 mt-6">
                  <div className="text-xs font-black text-zinc-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" /> Event Status Lifecycle Controls
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleStatusChange('Draft')}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
                        event.status === 'Draft' ? "bg-zinc-900 text-white shadow-sm" : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                      )}
                    >
                      Draft
                    </button>
                    <button
                      onClick={() => handleStatusChange('Published')}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
                        event.status === 'Published' ? "bg-blue-600 text-white shadow-sm" : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                      )}
                    >
                      Publish Event
                    </button>
                    <button
                      onClick={() => handleStatusChange('Registration Open')}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
                        event.status === 'Registration Open' ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                      )}
                    >
                      Open Registration
                    </button>
                    <button
                      onClick={() => handleStatusChange('Registration Closed')}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
                        event.status === 'Registration Closed' ? "bg-orange-600 text-white shadow-sm" : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                      )}
                    >
                      Close Registration
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Registrations Management */}
            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-black text-zinc-900">Registered Teams ({registrations.length})</h2>
                  <p className="text-xs text-zinc-500 font-medium">Review and approve team registrations.</p>
                </div>

                <div className="flex bg-zinc-100 rounded-xl p-1">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveStatusTab(tab)}
                      className={cn(
                        "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors",
                        activeStatusTab === tab ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="divide-y divide-zinc-100">
                {filteredRegistrations.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 font-medium text-sm">
                    No registrations found in this category.
                  </div>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <div key={reg._id} className="p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 overflow-hidden shrink-0 flex items-center justify-center text-indigo-600 font-black">
                          {reg.team?.logoUrl ? (
                            <img src={reg.team.logoUrl} className="w-full h-full object-cover" />
                          ) : (
                            <Trophy className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <Link to={`/teams/${reg.teamId}`} className="font-bold text-zinc-900 hover:text-indigo-600 hover:underline">
                            {reg.team?.name || 'Unknown Team'}
                          </Link>
                          <p className="text-xs font-medium text-zinc-500 mt-0.5">
                            Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <StatusBadge status={reg.status} />
                        
                        {reg.status === 'Pending' && (
                          <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 ml-1">
                            <button
                              onClick={() => handleApprove(reg._id, true)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors flex items-center gap-1"
                              title="Approve Team"
                            >
                              <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                            <button
                              onClick={() => handleApprove(reg._id, false)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1"
                              title="Reject Team"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </PageShell>
  );
}
