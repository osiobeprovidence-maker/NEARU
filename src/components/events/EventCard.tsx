import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, Trophy } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function EventCard({ event }: { event: any }) {
  return (
    <div className="p-5 hover:bg-zinc-50/80 transition-colors flex flex-col sm:flex-row gap-4">
      {/* Banner */}
      <div className="w-full sm:w-32 h-24 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <Trophy className="w-8 h-8" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-black text-lg text-zinc-900 tracking-tight truncate">
            {event.name}
          </h3>
          <StatusBadge status={event.status} />
        </div>
        
        <p className="text-sm font-bold text-indigo-600 mb-2">{event.game}</p>
        
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-zinc-500">
          {event.eventDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              {event.eventDate}
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-zinc-400" />
            {event.registrationType === 'team' ? (
              <span>{event.approvedTeamsCount} / {event.maxTeams || '∞'} Teams</span>
            ) : (
              <span>{event.registrationCount} Registered</span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-zinc-400" />
            <span>{event.isOnline ? 'Online' : event.location || 'TBA'}</span>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Link
            to={`/manage/events/${event._id}`}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Manage Event
          </Link>
          <Link
            to={`/events/${event._id}`}
            className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-lg transition-colors"
          >
            View Page
          </Link>
        </div>
      </div>
    </div>
  );
}
