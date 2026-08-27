import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, ShieldCheck, AlertCircle, Heart, Users, CheckCircle2, Star, BadgeCheck, Calendar, Play, Hash } from 'lucide-react';
import { Rally, RallyCategory } from '../types';
import { cn } from '../lib/utils';

const CATEGORY_LABELS: Record<RallyCategory, string> = {
  sports: '🏃 Outdoor & Sports',
  music: '🎵 Music & Events',
  gaming: '🎮 Tech & Gaming',
  social: '☕ Social Hangouts',
  work: '💼 Work & Business',
  education: '📚 Learning & Skills',
  creative: '🎨 Art & Creativity',
  fitness: '💪 Fitness & Health',
  travel: '🧭 Travel & Explore',
  food: '🍽️ Food & Cooking',
  general: '📌 General',
};

interface RallyCardProps {
  rally: Rally;
}

export default function RallyCard({ rally }: RallyCardProps) {
  const [isActionTaken, setIsActionTaken] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isRequest = rally.type === 'ASK';
  const isOffer = rally.type === 'HELP';
  const isJoin = rally.type === 'JOIN';

  const typeConfig = {
    ASK: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100', badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
    HELP: { icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-100', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    JOIN: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  };

  const config = typeConfig[rally.type];
  const Icon = config.icon;

  const defaultActionText = isRequest ? 'I CAN HELP' : isOffer ? "I'M INTERESTED" : 'JOIN';
  const takenActionText = isRequest ? 'OFFER SENT' : isOffer ? 'INTEREST SENT' : 'JOINED';

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActionTaken) {
      setIsActionTaken(true);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: takenActionText,
          subtitle: `The creator will be notified.`
        }
      }));
    } else {
      setIsActionTaken(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 group hover:bg-zinc-50/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ring-1 ring-inset", config.badge)}>
            {rally.type}
          </div>
          {rally.hashtags && rally.hashtags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {rally.hashtags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {rally.isPaid ? (
            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
              {rally.price ? `₦${rally.price.toLocaleString()}` : 'PAID'}
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200">
              FREE
            </div>
          )}
        </div>
        <Icon className={cn("w-5 h-5 opacity-40 shrink-0", config.color)} />
      </div>

      <h3 className="text-xl font-bold text-zinc-900 mb-2 leading-tight">
        {rally.title}
      </h3>
      <p className="text-sm text-zinc-600 leading-relaxed mb-4 line-clamp-2">
        {rally.description}
      </p>

      {rally.mediaUrl && !imgError && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
          {rally.mediaType === 'image' ? (
            <img
              src={rally.mediaUrl}
              alt=""
              className="w-full h-48 object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="relative w-full h-48">
              <video src={rally.mediaUrl} className="w-full h-full object-cover" controls onError={() => setImgError(true)} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
          <MapPin className="w-3.5 h-3.5" />
          {rally.locationLabel || `${rally.distance} km away`}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
          <Clock className="w-3.5 h-3.5" />
          {rally.time}
        </div>
        {rally.eventDate && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
            <Calendar className="w-3.5 h-3.5" />
            {rally.eventDate}
          </div>
        )}
        {rally.peopleNeeded > 1 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            <Users className="w-3.5 h-3.5" />
            {rally.peopleNeeded - rally.peopleInterested} SPOTS LEFT
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={rally.creator.avatar}
            alt={rally.creator.name}
            className="w-10 h-10 rounded-full bg-zinc-200 object-cover border-2 border-white shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm font-bold text-zinc-900">
              <span className="truncate">{rally.creator.name}</span>
              {rally.creator.isNINVerified && (
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-0.5">
              {rally.creator.isNINVerified ? 'Verified' : 'Member'}
            </div>
          </div>
        </div>
        <button
          onClick={handleActionClick}
          className={cn(
            "px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 shrink-0",
            isActionTaken
              ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 shadow-none"
              : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-200"
          )}
        >
          {isActionTaken && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          {isActionTaken ? takenActionText : defaultActionText}
        </button>
      </div>
    </motion.div>
  );
}
