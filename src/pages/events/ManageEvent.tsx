import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import { Id } from '../../../convex/_generated/dataModel';
import StatusBadge from '../../components/events/StatusBadge';
import { Calendar, Users, ChevronLeft, MapPin, Search, UserCheck, XCircle, CheckCircle, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import CompetitionManager from '../../components/events/CompetitionManager';

export default function ManageEvent() {
  const { id } = useParams();
  const eventId = id as Id<"events">;
  
  const eventData = useQuery(api.events.getEvent, { eventId });
  const event = eventData;
  const registrations = useQuery(api.events.getEventRegistrations, { eventId });
  const approveMutation = useMutation(api.teams.approveRegistration);

  const [mainTab, setMainTab] = useState<'Registrations' | 'Competition' | 'Operations' | 'Announcements'>('Registrations');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const filteredRegistrations = registrations?.filter((r) => {
    if (activeTab === 'All') return true;
    return r.status === activeTab;
  }) || [];

  const handleApprove = async (regId: Id<"eventRegistrations">, approve: boolean) => {
    try {
      await approveMutation({ registrationId: regId, approve });
    } catch (err: any) {
      alert(err.message || "Failed to update registration");
    }
  };

  return (
    <PageShell title="Manage Event">
      <div className="max-w-4xl mx-auto pb-20">
        <Link to="/manage" className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        {!event || registrations === undefined ? (
          <div className="animate-pulse bg-white md:rounded-[2rem] border border-zinc-200 h-64"></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
              {event.bannerUrl && (
                <div className="w-full h-48 bg-zinc-100">
                  <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">{event.name}</h1>
                    <div className="flex gap-4 text-sm font-semibold text-zinc-500">
                      <div className="flex items-center gap-1.5 text-indigo-600">
                        {event.game}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {event.eventDate || 'No Date Set'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {event.isOnline ? 'Online' : event.location || 'TBA'}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              </div>
            </div>

            <div className="flex border-b border-zinc-200 mb-6 bg-white md:rounded-[2rem] px-4 pt-2 shadow-sm overflow-x-auto">
              <button
                onClick={() => setMainTab('Registrations')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                  mainTab === 'Registrations' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                Registrations
              </button>
              <button
                onClick={() => setMainTab('Competition')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                  mainTab === 'Competition' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                Competition
              </button>
              <button
                onClick={() => setMainTab('Operations')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                  mainTab === 'Operations' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                Operations
              </button>
              <button
                onClick={() => setMainTab('Announcements')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                  mainTab === 'Announcements' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                Announcements
              </button>
            </div>

            {mainTab === 'Registrations' && (
              <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h2 className="text-lg font-black text-zinc-900">Registrations</h2>
                  <div className="flex bg-zinc-100 rounded-lg p-1">
                    {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                          activeTab === tab ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
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
                      No registrations found.
                    </div>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <div key={reg._id} className="p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden border border-zinc-200 shrink-0">
                            {reg.team?.logoUrl ? (
                              <img src={reg.team.logoUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                <Trophy className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-900">{reg.team?.name || 'Unknown Team'}</h4>
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
                                className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleApprove(reg._id, false)}
                                className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {mainTab === 'Competition' && (
              <CompetitionManager eventId={eventId} />
            )}

            {mainTab === 'Operations' && (
              <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden p-6 md:p-8">
                <h2 className="text-xl font-black text-zinc-900 mb-6">Operations Center</h2>
                <p className="text-zinc-500 mb-6">Manage disputes, disqualify teams, and review match evidence here.</p>
                <div className="p-12 text-center bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-500 font-bold">
                  No active disputes at this time.
                </div>
              </div>
            )}

            {mainTab === 'Announcements' && (
              <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden p-6 md:p-8">
                <h2 className="text-xl font-black text-zinc-900 mb-6">Announcements</h2>
                <div className="flex gap-4">
                  <input type="text" placeholder="Announcement title..." className="flex-1 border border-zinc-200 rounded-xl p-3" />
                  <button className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold">Publish</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
