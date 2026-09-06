import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, UserPlus, Check, Sparkles } from 'lucide-react';
import Avatar from '../Avatar';
import { ProfileVerificationCheck } from '../VerificationBadge';
import { cn } from '../../lib/utils';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export interface SuggestedPerson {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  location?: string;
  bio?: string;
  isNINVerified?: boolean;
  isBlueVerified?: boolean;
  blueCheckStatus?: string;
  verificationStatus?: string;
  interests?: string[];
  followersCount?: number;
  isFollowing?: boolean;
}

interface SuggestedPeopleProps {
  people: SuggestedPerson[];
  currentUserId: string | null;
  layout?: 'horizontal' | 'grid' | 'sidebar';
}

export default function SuggestedPeople({
  people,
  currentUserId,
  layout = 'horizontal',
}: SuggestedPeopleProps) {
  const followMut = useMutation(api.follows.follow);
  const unfollowMut = useMutation(api.follows.unfollow);

  // Optimistic follow map
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const handleToggleFollow = async (e: React.MouseEvent, personId: string, currentlyFollowing: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Sign In Required', subtitle: 'Please sign in to follow people on Lalao.' },
        })
      );
      return;
    }

    const nextState = !currentlyFollowing;
    setFollowingMap((prev) => ({ ...prev, [personId]: nextState }));
    setLoadingMap((prev) => ({ ...prev, [personId]: true }));

    try {
      if (currentlyFollowing) {
        await unfollowMut({ followerId: currentUserId as any, followingId: personId as any });
      } else {
        await followMut({ followerId: currentUserId as any, followingId: personId as any });
      }
    } catch {
      // Revert optimistic update
      setFollowingMap((prev) => ({ ...prev, [personId]: currentlyFollowing }));
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { title: 'Error', subtitle: 'Could not update follow status.' },
        })
      );
    } finally {
      setLoadingMap((prev) => ({ ...prev, [personId]: false }));
    }
  };

  if (!people || people.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-50/70 rounded-2xl border border-zinc-200/60">
        <p className="text-sm font-semibold text-zinc-600">No suggested people right now</p>
        <p className="text-xs text-zinc-400 mt-0.5">Check back later as the community grows!</p>
      </div>
    );
  }

  // Sidebar Layout (Compact vertical list for Desktop right sidebar)
  if (layout === 'sidebar') {
    return (
      <div className="divide-y divide-zinc-100">
        {people.slice(0, 5).map((person) => {
          const isFollowing = followingMap[person._id] ?? (person.isFollowing || false);
          const isLoading = loadingMap[person._id] || false;
          const primaryInterest = person.interests?.[0];
          const cleanUsername = person.username?.replace(/^@+/, '') || '';

          return (
            <div key={person._id} className="py-2.5 flex items-center justify-between gap-3 group">
              <Link to={`/user/${person._id}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                <Avatar
                  src={person.avatar}
                  name={person.name}
                  size="md"
                  className="ring-2 ring-white shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                      {person.name}
                    </span>
                    <ProfileVerificationCheck user={person} size="xs" />
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium truncate">
                    @{cleanUsername}
                  </p>
                  {(person.location || primaryInterest) && (
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {[person.location, primaryInterest].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </Link>

              {currentUserId !== person._id && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => handleToggleFollow(e, person._id, isFollowing)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95",
                    isFollowing
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/60"
                      : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs"
                  )}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal Scroll / Mobile Cards
  return (
    <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-1 px-0.5 overscroll-x-contain">
      {people.map((person) => {
        const isFollowing = followingMap[person._id] ?? (person.isFollowing || false);
        const isLoading = loadingMap[person._id] || false;
        const primaryInterest = person.interests?.[0];
        const cleanUsername = person.username?.replace(/^@+/, '') || '';

        return (
          <div
            key={person._id}
            className="w-44 sm:w-48 bg-white rounded-2xl border border-zinc-200/80 p-3.5 flex flex-col justify-between shrink-0 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-200"
          >
            <Link to={`/user/${person._id}`} className="block text-center mb-3">
              <div className="relative inline-block mx-auto mb-2">
                <Avatar
                  src={person.avatar}
                  name={person.name}
                  size="xl"
                  className="mx-auto ring-2 ring-indigo-50 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-center gap-1 min-w-0">
                <span className="text-sm font-bold text-zinc-900 truncate">
                  {person.name}
                </span>
                <ProfileVerificationCheck user={person} size="sm" />
              </div>

              <p className="text-xs text-zinc-500 font-medium truncate mt-0.5">
                @{cleanUsername}
              </p>

              {(person.location || primaryInterest) && (
                <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 font-medium mt-1.5 truncate px-1">
                  {person.location && (
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      {person.location}
                    </span>
                  )}
                  {person.location && primaryInterest && <span>·</span>}
                  {primaryInterest && (
                    <span className="text-indigo-600 font-semibold truncate">
                      {primaryInterest}
                    </span>
                  )}
                </div>
              )}
            </Link>

            {currentUserId !== person._id && (
              <button
                type="button"
                disabled={isLoading}
                onClick={(e) => handleToggleFollow(e, person._id, isFollowing)}
                className={cn(
                  "w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs",
                  isFollowing
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/70"
                    : "bg-zinc-900 hover:bg-zinc-800 text-white"
                )}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
