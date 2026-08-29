import React from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { BadgeCheck, Edit3, ChevronRight, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function Profile() {
  const { user, convexUserId, persistProfile } = useAuth();

  // Live stats derived from actual database records
  const stats = useQuery(
    api.rallies.getProfileStats,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const followerCount = useQuery(
    api.follows.getFollowerCount,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const followingCount = useQuery(
    api.follows.getFollowingCount,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const defaultInterests = ['Outdoor & Sports', 'Social Hangouts', 'Music & Events'];
  const interestsList =
    user.interests && user.interests.length > 0 ? user.interests : defaultInterests;

  // Three distinct stat states: loading (undefined), loaded, or fallback zero
  const posted   = stats?.posted   ?? (stats === undefined ? null : 0);
  const completed = stats?.completed ?? (stats === undefined ? null : 0);
  const rated    = stats?.rated    ?? (stats === undefined ? null : 0);

  return (
    <PageShell title="Profile">
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">

        {/* 1. Identity */}
        <div className="p-6 sm:p-8 text-center">
          <div className="relative inline-block mb-3">
            <Avatar
              src={user.avatar}
              name={user.name}
              size="xl"
              className="mx-auto shadow-sm border-2 border-white ring-1 ring-zinc-200"
            />
            <Link
              to="/settings/personal-info"
              className="absolute bottom-0 right-0 p-1.5 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95"
              title="Change Photo"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              {user.name}
            </h2>
            {user.isNINVerified && (
              <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
          </div>

          <p className="text-xs font-bold text-zinc-400 mb-2.5">{user.username}</p>

          <p className="text-sm text-zinc-700 font-medium max-w-sm mx-auto leading-relaxed mb-2">
            "{user.bio || 'Always looking for something fun to do.'}"
          </p>

          <div className="text-xs text-zinc-500 font-medium space-y-1 mb-4">
            <div className="flex items-center justify-center gap-1 text-zinc-600">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>{user.location || 'Location not set'}</span>
            </div>
            {user.gender && user.gender !== 'Prefer not to say' && (
              <p className="text-zinc-400">{user.gender}</p>
            )}
            <p className="text-zinc-400">{interestsList.join(' · ')}</p>
          </div>

          <Link
            to="/settings/personal-info"
            className="w-full sm:w-auto sm:px-8 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
            Edit Profile
          </Link>
        </div>

        {/* Interests visibility toggle */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-900 text-xs sm:text-sm">Show interests on profile</p>
              <p className="text-[11px] text-zinc-500 font-medium">Your interest tags are always used for recommendations, but you control whether they appear publicly.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={user.showInterests !== false}
              onChange={(e) => persistProfile({ showInterests: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
          </label>
        </div>

        {/* 2. Statistics — live from DB */}
        <div className="py-4 sm:py-5 px-4 bg-zinc-50/50">
          <div className="grid grid-cols-5 divide-x divide-zinc-200/70 text-center max-w-lg mx-auto">
            <StatCell label="Posted"    value={posted} />
            <StatCell label="Followers" value={followerCount ?? (followerCount === undefined ? null : 0)} />
            <StatCell label="Following" value={followingCount ?? (followingCount === undefined ? null : 0)} />
            <StatCell label="Rated"     value={rated} amber />
            <StatCell label="Done"      value={completed} />
          </div>
        </div>

        {/* Public profile + navigation */}
        <div>
          <Link
            to={`/user/${convexUserId}`}
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group"
          >
            <span>View Public Profile</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            to="/settings/personal-info"
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group"
          >
            <span>Edit Profile Information</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            to="/my-rallys"
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100"
          >
            <span>My RALLYS</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            to="/verification"
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100"
          >
            <span>NIN Verification & Badges</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            to="/safety"
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100"
          >
            <span>Safety Center & Emergency Contacts</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Stat cell: shows "…" while loading, real number when ready, "0" as a valid state
// ---------------------------------------------------------------------------
function StatCell({
  label,
  value,
  amber = false,
}: {
  label: string;
  value: number | null;
  amber?: boolean;
}) {
  return (
    <div className="px-2">
      <div
        className={`text-xl sm:text-2xl font-black ${
          amber ? 'text-amber-500' : 'text-zinc-900'
        }`}
      >
        {value === null ? (
          <span className="text-zinc-300 text-lg">…</span>
        ) : (
          value
        )}
      </div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}
