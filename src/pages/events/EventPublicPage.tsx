import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import PageShell from '../../components/PageShell';
import { Id } from '../../../convex/_generated/dataModel';
import StatusBadge from '../../components/events/StatusBadge';
import { Calendar, Users, MapPin, Trophy, ShieldAlert, ArrowRight, Megaphone, PlayCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import BracketView from '../../components/events/BracketView';

export default function EventPublicPage() {
  const { id } = useParams();
  const eventId = id as Id<"events">;
  
  const event = useQuery(api.events.getEvent, { eventId });
  const announcements = useQuery(api.operations.getEventAnnouncements, { eventId });
  
  const [activeTab, setActiveTab] = useState<'Details' | 'Bracket' | 'Live'>('Details');

  return (
    <PageShell title="Event Details">
      <div className="max-w-4xl mx-auto pb-20">
        {!event ? (
          <div className="animate-pulse bg-white md:rounded-[2rem] border border-zinc-200 h-64"></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden">
              {event.bannerUrl ? (
                <div className="w-full h-48 sm:h-64 bg-zinc-100">
                  <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-48 sm:h-64 bg-zinc-900 flex items-center justify-center">
                  <Trophy className="w-16 h-16 text-zinc-800" />
                </div>
              )}
              
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">{event.name}</h1>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200">
                        {event.game}
                      </div>
                      <span className="text-sm font-semibold text-zinc-500">
                        Organized by <Link to={`/pages/${event.page?.slug || event.pageId}`} className="text-indigo-600 hover:underline">{event.page?.name}</Link>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={event.status} />
                    {event.status === 'Registration Open' && (
                      <Link
                        to={`/events/${eventId}/register`}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                      >
                        Register Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-zinc-100 mb-6">
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date
                    </div>
                    <div className="text-sm font-bold text-zinc-900">{event.eventDate || 'TBA'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Location
                    </div>
                    <div className="text-sm font-bold text-zinc-900">{event.isOnline ? 'Online' : event.location || 'TBA'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Format
                    </div>
                    <div className="text-sm font-bold text-zinc-900 capitalize">{event.registrationType} Based</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" /> Prize Pool
                    </div>
                    <div className="text-sm font-bold text-zinc-900">{event.prizePool || 'No Prize Listed'}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex border-b border-zinc-200 bg-white md:rounded-[2rem] px-4 pt-2 shadow-sm overflow-x-auto">
              <button
                onClick={() => setActiveTab('Details')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                  activeTab === 'Details' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                Event Details
              </button>
              <button
                onClick={() => setActiveTab('Bracket')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                  activeTab === 'Bracket' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                Bracket & Standings
              </button>
              <button
                onClick={() => setActiveTab('Live')}
                className={cn(
                  "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2",
                  activeTab === 'Live' ? "border-rose-600 text-rose-600" : "border-transparent text-zinc-500 hover:text-rose-600"
                )}
              >
                <PlayCircle className="w-4 h-4" /> Live
              </button>
            </div>

            {/* Details Tab */}
            {activeTab === 'Details' && (
              <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8 space-y-8">
                {event.description && (
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 mb-2">About this event</h2>
                    <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed text-sm">
                      {event.description}
                    </p>
                  </div>
                )}
                
                {event.rules && (
                  <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200">
                    <div className="flex items-center gap-2 text-zinc-900 font-black mb-3">
                      <ShieldAlert className="w-5 h-5" /> Event Rules & Requirements
                    </div>
                    <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed text-sm">
                      {event.rules}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bracket Tab */}
            {activeTab === 'Bracket' && (
              <PublicBracketView eventId={eventId} />
            )}

            {/* Live Tab */}
            {activeTab === 'Live' && (
              <div className="space-y-6">
                <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Megaphone className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-black text-zinc-900">Announcements</h2>
                  </div>
                  
                  {announcements && announcements.length > 0 ? (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement._id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-zinc-900">{announcement.title}</h3>
                            <span className="text-xs font-semibold text-zinc-400">
                              {new Date(announcement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-600 whitespace-pre-wrap">{announcement.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm">No announcements at this time.</p>
                  )}
                </div>

                <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-6 md:p-8">
                  <h2 className="text-xl font-black text-zinc-900 mb-6">Live Matches</h2>
                  <div className="p-12 text-center text-zinc-500 font-bold bg-zinc-50 border border-zinc-100 rounded-2xl">
                    No live matches found. Check the bracket for scheduled games.
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </PageShell>
  );
}

function PublicBracketView({ eventId }: { eventId: Id<"events"> }) {
  const competition = useQuery(api.competitions.getCompetition, { eventId });
  const matches = useQuery(api.competitions.getMatches, competition ? { competitionId: competition._id } : "skip");
  const rounds = useQuery(api.competitions.getRounds, competition ? { competitionId: competition._id } : "skip");

  if (competition === undefined) {
    return <div className="p-12 text-center text-zinc-500">Loading bracket...</div>;
  }

  if (competition === null) {
    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm p-12 text-center">
        <Trophy className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <h3 className="text-lg font-black text-zinc-900 mb-1">Bracket Not Available</h3>
        <p className="text-sm text-zinc-500">The bracket for this event has not been generated yet.</p>
      </div>
    );
  }

  if (matches === undefined || rounds === undefined) {
    return <div className="p-12 text-center text-zinc-500">Loading matches...</div>;
  }

  return (
    <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm overflow-hidden p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-black text-zinc-900">{competition.name}</h2>
        <p className="text-sm text-zinc-500">{competition.format}</p>
      </div>
      <BracketView matches={matches} rounds={rounds} readOnly={true} />
    </div>
  );
}
