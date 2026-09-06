import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Calendar, Clock, HandMetal, Check, ArrowUpRight } from 'lucide-react';
import Avatar from '../Avatar';
import { ProfileVerificationCheck } from '../VerificationBadge';
import { cn } from '../../lib/utils';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface RallyDiscoveryCardProps {
  rally: any;
  currentUserId: string | null;
}

export default function RallyDiscoveryCard({ rally, currentUserId }: RallyDiscoveryCardProps) {
  const joinRallyMut = useMutation(api.rallies.joinRally);
  const leaveRallyMut = useMutation(api.rallies.leaveRally);

  const [isJoined, setIsJoined] = useState(rally.isRsvpd || false);
  const [joinedCount, setJoinedCount] = useState(rally.rsvpsCount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
    ASK: { label: 'ASK', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-700' },
    HELP: { label: 'HELP', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-700' },
    JOIN: { label: 'JOIN', bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-700' },
    OFFER: { label: 'OFFER', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-700' },
    COMMUNITY: { label: 'COMMUNITY', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-700' },
    POST: { label: 'POST', bg: 'bg-zinc-500/10 border-zinc-500/30', text: 'text-zinc-700' },
  };

  const currentType = typeConfig[rally.type] || typeConfig.ASK;

  // Reward / Price display
  let rewardBadge = null;
  if (rally.rewardAmount && rally.rewardAmount > 0) {
    const currency = rally.rewardCurrency || '₦';
    rewardBadge = `${currency}${rally.rewardAmount.toLocaleString()}`;
  } else if (rally.isPaid && rally.price && rally.price > 0) {
    rewardBadge = `₦${rally.price.toLocaleString()}`;
  } else if (rally.pricing === 'free' || (!rally.isPaid && !rally.rewardAmount)) {
    rewardBadge = 'Free';
  }

  const handleToggleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Sign In Required', subtitle: 'Please sign in to join RALLYS.' },
        })
      );
      return;
    }

    const nextState = !isJoined;
    setIsJoined(nextState);
    setJoinedCount((c: number) => (nextState ? c + 1 : Math.max(0, c - 1)));
    setIsSubmitting(true);

    try {
      if (isJoined) {
        await leaveRallyMut({ rallyId: rally._id, userId: currentUserId as any });
      } else {
        await joinRallyMut({ rallyId: rally._id, userId: currentUserId as any });
      }
    } catch {
      // Revert optimistic update
      setIsJoined(!nextState);
      setJoinedCount((c: number) => (!nextState ? c + 1 : Math.max(0, c - 1)));
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Error', subtitle: 'Could not update your RALLY status.' },
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanUsername = rally.creator?.username?.replace(/^@+/, '') || '';
  const locationText = rally.locationLabel || rally.city || 'Near you';
  const peopleNeeded = rally.peopleNeeded || 1;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
      <div>
        {/* Creator Header & Type Tag */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Link
            to={rally.creator?._id ? `/user/${rally.creator._id}` : '#'}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar
              src={rally.creator?.avatar}
              name={rally.creator?.name || 'Creator'}
              size="sm"
              className="ring-1 ring-zinc-200 shadow-2xs shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-zinc-900 truncate">
                  {rally.creator?.name || 'Creator'}
                </span>
                <ProfileVerificationCheck user={rally.creator} size="xs" />
              </div>
              {cleanUsername && (
                <p className="text-[11px] text-zinc-400 font-medium truncate">
                  @{cleanUsername}
                </p>
              )}
            </div>
          </Link>

          {/* Type Badge */}
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border shrink-0",
              currentType.bg,
              currentType.text
            )}
          >
            {currentType.label}
          </span>
        </div>

        {/* Title / Main Request */}
        <Link to={`/rally/${rally._id}`} className="block mb-2">
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
            {rally.title}
          </h3>
        </Link>

        {/* Description snippet */}
        {rally.description && (
          <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2 mb-3.5">
            {rally.description}
          </p>
        )}

        {/* Key Attributes: Location, Date/Time, People Needed */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-zinc-500 font-medium mb-4">
          <div className="flex items-center gap-1 text-zinc-700 font-semibold truncate">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>

          {(rally.eventDate || rally.time) && (
            <div className="flex items-center gap-1 text-zinc-500 truncate">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{[rally.eventDate, rally.time].filter(Boolean).join(' · ')}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-zinc-500">
            <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>
              {joinedCount > 0 ? `${joinedCount}/${peopleNeeded} joined` : `${peopleNeeded} needed`}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Reward + Action Button */}
      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
        {/* Reward */}
        <div>
          {rewardBadge && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-400 font-medium">Reward:</span>
              <span className="text-xs sm:text-sm font-black text-emerald-600">
                {rewardBadge}
              </span>
            </div>
          )}
        </div>

        {/* Join Rally Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleToggleJoin}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-95 shadow-xs flex items-center gap-1.5",
            isJoined
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          )}
        >
          {isJoined ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Joined</span>
            </>
          ) : (
            <>
              <HandMetal className="w-3.5 h-3.5" />
              <span>JOIN RALLY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
