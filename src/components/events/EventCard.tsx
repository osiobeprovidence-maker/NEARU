import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, Trophy, Shield } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function EventCard({ event }: { event: any }) {
  return (
    <div className="p-5 hover:bg-zinc-50/80 transition-colors flex flex-col sm:flex-row gap-4 border-b border-zinc-100 last:border-0">
      {/* Banner */}
      <div className="w-full sm:w-36 h-28 rounded-xl bg-zinc-900 overflow-hidden shrink-0 border border-zinc-200 relative">
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-indigo-400">
            <Trophy className="w-8 h-8 opacity-60" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={event.registrationStatus || event.status} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 mb-1 inline-block">
              {event.game}
            </span>
            <h3 className="font-black text-lg text-zinc-900 tracking-tight truncate">
              {event.name}
            </h3>
          </div>
        </div>
        
        {/* Team & Player Role Info */}
        {event.team && (
          <div className="flex items-center gap-2 mb-3 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100 w-fit">
            <span className="text-xs text-zinc-500 font-medium">Team:</span>
            <Link to={`/teams/${event.team._id}`} className="text-xs font-bold text-zinc-900 hover:text-indigo-600 hover:underline">
              {event.team.name}
            </Link>
            {event.playerRole && (
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5 text-amber-500" /> {event.playerRole}
              </span>
            )}
          </div>
        )}
        
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
              <span>{event.approvedTeamsCount ?? 0} / {event.maxTeams || '∞'} Teams</span>
            ) : (
              <span>{event.registrationCount ?? 0} Registered</span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-zinc-400" />
            <span>{event.isOnline ? 'Online' : event.location || 'TBA'}</span>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Link
            to={`/events/${event._id}`}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            View Event
          </Link>
          {event.team && (
            <Link
              to={`/teams/${event.team._id}`}
              className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl transition-colors"
            >
              My Team
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
