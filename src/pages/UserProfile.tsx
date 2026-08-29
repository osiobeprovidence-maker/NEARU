import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Avatar from '../components/Avatar';
import { BadgeCheck, MapPin, UserPlus, UserCheck, Flag, Ban, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, convexUserId, blockUser } = useAuth();

  const isSelf = !!convexUserId && convexUserId === id;

  const target = useQuery(api.users.get, id ? { userId: id as any } : 'skip');
  const stats = useQuery(api.rallies.getProfileStats, id ? { userId: id as any } : 'skip');
  const followerCount = useQuery(api.follows.getFollowerCount, id ? { userId: id as any } : 'skip');
  const followingCount = useQuery(api.follows.getFollowingCount, id ? { userId: id as any } : 'skip');
  const isFollowing = useQuery(
    api.follows.isFollowing,
    convexUserId && id ? { followerId: convexUserId as any, followingId: id as any } : 'skip'
  );
  const content = useQuery(
    api.rallies.listByCreator,
    id ? { creatorId: id as any, userId: convexUserId as any } : 'skip'
  );

  const followMut = useMutation(api.follows.follow);
  const unfollowMut = useMutation(api.follows.unfollow);

  const [isFollowBusy, setIsFollowBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'rallies' | 'media'>('posts');

  const isPrivate = target?.privacySettings?.profileVisibility === 'private';
  const isLocked = !!target && isPrivate && !isSelf && !isFollowing;
  const showInterests = target?.showInterests !== false && !isLocked;

  const showToast = (title: string, subtitle: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));

  const handleToggleFollow = async () => {
    if (!convexUserId || !id || isSelf) return;
    setIsFollowBusy(true);
    try {
      if (isFollowing) {
        await unfollowMut({ followerId: convexUserId as any, followingId: id as any });
      } else {
        await followMut({ followerId: convexUserId as any, followingId: id as any });
      }
    } catch {
      showToast('Error', 'Could not update follow status.');
    } finally {
      setIsFollowBusy(false);
    }
  };

  const handleBlock = () => {
    if (!target || isSelf) return;
    blockUser(target._id, target.name || 'User', target.username || '', target.avatar || '');
    showToast('User blocked', `${target.name} has been blocked.`);
    navigate('/');
  };

  const tabbed = useMemo(() => {
    if (!content) return { posts: [], rallies: [], media: [] };
    const out = { posts: [] as any[], rallies: [] as any[], media: [] as any[] };
    for (const c of content) {
      out.rallies.push(c);
      if (c.type === 'POST') out.posts.push(c);
      if (c.mediaUrl) out.media.push(c);
    }
    return out;
  }, [content]);

  const mapRally = (r: any) => ({
    id: r._id,
    type: r.type,
    title: r.title,
    description: r.description,
    distance: 0,
    time: r.time,
    peopleNeeded: r.peopleNeeded,
    peopleInterested: r.peopleInterested,
    isPaid: r.isPaid,
    price: r.price,
    creator: target
      ? {
          id: target._id,
          name: target.name,
          username: target.username,
          avatar: target.avatar,
          isNINVerified: target.isNINVerified,
          isPhoneVerified: false,
          badges: target.badges,
        }
      : { id: id || '', name: 'User', username: '', avatar: '', isNINVerified: false, isPhoneVerified: false },
    status: r.status,
    createdAt: new Date(r.createdAt).toISOString(),
    city: r.city,
    locationLabel: r.locationLabel,
    rallyLatitude: r.rallyLatitude,
    rallyLongitude: r.rallyLongitude,
    category: r.category,
    hashtags: r.hashtags,
    eventDate: r.eventDate,
    mediaUrl: r.mediaUrl,
    mediaType: r.mediaType,
    capacity: r.capacity,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    rsvpsCount: r.rsvpsCount,
    isLiked: r.isLiked,
    isRsvpd: r.isRsvpd,
  });

  const activeList = activeTab === 'posts' ? tabbed.posts : activeTab === 'media' ? tabbed.media : tabbed.rallies;

  return (
    <PageShell title={target?.name ? `${target.name}'s profile` : 'Profile'}>
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden max-w-2xl mx-auto">
        {/* Identity */}
        <div className="p-6 sm:p-8 text-center">
          <Avatar src={target?.avatar} name={target?.name || 'User'} size="xl" className="mx-auto mb-3 shadow-sm border-2 border-white ring-1 ring-zinc-200" />

          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              {target?.name || 'Loading…'}
            </h2>
            {target?.isNINVerified && <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
          </div>
          <p className="text-xs font-bold text-zinc-400 mb-2.5">{target ? `@${target.username}` : ''}</p>

          {!isLocked && (
            <>
              <p className="text-sm text-zinc-700 font-medium max-w-sm mx-auto leading-relaxed mb-3">
                {target?.bio ? `"${target.bio}"` : 'Nothing here yet.'}
              </p>
              <div className="text-xs text-zinc-500 font-medium space-y-1 mb-4">
                <div className="flex items-center justify-center gap-1 text-zinc-600">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{target?.location || 'Location not set'}</span>
                </div>
                {showInterests && target?.interests && target.interests.length > 0 && (
                  <p className="text-zinc-400 px-4 line-clamp-2">{target.interests.join(' · ')}</p>
                )}
              </div>
            </>
          )}

          {isLocked && (
            <p className="text-sm text-zinc-500 font-medium max-w-xs mx-auto mb-4">
              This account is private. Follow to see more.
            </p>
          )}

          <div className="flex items-center justify-center gap-2">
            {!isSelf && convexUserId && (
              <button
                onClick={handleToggleFollow}
                disabled={isFollowBusy}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50',
                  isFollowing
                    ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-700 text-white shadow-sm'
                )}
              >
                {isFollowBusy ? (
                  '…'
                ) : isFollowing ? (
                  <><UserCheck className="w-4 h-4" /> Following</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Follow</>
                )}
              </button>
            )}
            {!isSelf && convexUserId && (
              <Link
                to={`/report/${id}`}
                className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Flag className="w-4 h-4" /> Report
              </Link>
            )}
            {!isSelf && convexUserId && (
              <button
                onClick={handleBlock}
                className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-zinc-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Ban className="w-4 h-4" /> Block
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="py-4 sm:py-5 px-4 bg-zinc-50/50">
          <div className="grid grid-cols-3 divide-x divide-zinc-200/70 text-center max-w-md mx-auto">
            <StatCell label="Posts" value={stats?.posted ?? (stats === undefined ? null : 0)} />
            <StatCell label="Followers" value={followerCount ?? (followerCount === undefined ? null : 0)} />
            <StatCell label="Following" value={followingCount ?? (followingCount === undefined ? null : 0)} />
          </div>
        </div>

        {/* Tabs */}
        {!isLocked && (
          <>
            <div className="flex border-b border-zinc-100">
              {(['posts', 'rallies', 'media'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold capitalize transition-colors',
                    activeTab === tab
                      ? 'text-zinc-900 border-b-2 border-zinc-900'
                      : 'text-zinc-400 hover:text-zinc-600'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="divide-y divide-zinc-100">
              {content === undefined ? (
                <>
                  <RallyCardSkeleton />
                  <RallyCardSkeleton />
                </>
              ) : activeList.length > 0 ? (
                activeList.map((r: any) => <RallyCard key={r._id} rally={mapRally(r)} />)
              ) : (
                <div className="p-10 text-center text-zinc-500">
                  <p className="font-bold text-zinc-900 text-sm mb-1">No {activeTab} yet</p>
                  <p className="text-xs text-zinc-400">Nothing to show here.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Self: link to edit */}
        {isSelf && (
          <Link
            to="/settings/personal-info"
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group"
          >
            <span>Edit Profile Information</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
        )}
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
function StatCell({ label, value, amber = false }: { label: string; value: number | null; amber?: boolean }) {
  return (
    <div className="px-2">
      <div className={`text-xl sm:text-2xl font-black ${amber ? 'text-amber-500' : 'text-zinc-900'}`}>
        {value === null ? <span className="text-zinc-300 text-lg">…</span> : value}
      </div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
