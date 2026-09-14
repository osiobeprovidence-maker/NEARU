import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Link } from 'react-router-dom';
import { Plus, Trophy, Calendar, MapPin, Users } from 'lucide-react';
import StatusBadge from './events/StatusBadge';

export default function PageEventsTab({ pageId, isManager }: { pageId: Id<"pages">, isManager: boolean }) {
  const events = useQuery(api.events.getOrganizationEvents, { pageId });

  if (events === undefined) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isManager && (
        <div className="flex justify-end">
          <Link
            to={`/manage/events/create?pageId=${pageId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-16 bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm">
          <Trophy className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-zinc-900 mb-1">No Events Yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
            This page hasn't hosted any events recently.
          </p>
          {isManager && (
            <Link
              to={`/manage/events/create?pageId=${pageId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create an Event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event._id}
              to={`/events/${event._id}`}
              className="group bg-white md:rounded-2xl border-y md:border border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
            >
              {event.bannerUrl ? (
                <div className="w-full h-32 sm:h-40 bg-zinc-100 overflow-hidden relative">
                  <img
                    src={event.bannerUrl}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 sm:h-40 bg-zinc-900 flex flex-col items-center justify-center relative">
                  <Trophy className="w-8 h-8 text-zinc-800 mb-2" />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              )}
              
              <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700">
                      {event.game}
                    </span>
                  </div>
                  <h3 className="font-black text-zinc-900 text-lg leading-tight mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {event.name}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-xs font-semibold text-zinc-500 mt-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate">{event.eventDate || 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate">{event.isOnline ? 'Online' : event.location || 'TBA'}</span>
                  </div>
                  {event.registrationType === 'team' && (
                    <div className="flex items-center gap-1.5 col-span-2 mt-1 pt-3 border-t border-zinc-100">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {event.approvedTeamsCount} / {event.maxTeams || '∞'} Teams registered
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <div className="w-full text-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 rounded-xl text-sm font-bold transition-colors">
                    Join Event
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
