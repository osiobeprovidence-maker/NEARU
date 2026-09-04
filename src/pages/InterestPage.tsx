import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import Avatar from '../components/Avatar';
import { Tag, BadgeCheck, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export default function InterestPage() {
  const { label } = useParams();
  const decoded = decodeURIComponent(label || '');
  const { convexUserId, user } = useAuth();

  const posts = useQuery(
    api.rallies.listByInterest,
    decoded ? { interest: decoded, userId: (convexUserId ?? undefined) as any } : 'skip'
  );
  const people = useQuery(
    api.users.listPeople,
    convexUserId && decoded
      ? { viewerId: convexUserId as any, filteredInterest: decoded }
      : 'skip'
  );

  const followMut = useMutation(api.follows.follow);
  const unfollowMut = useMutation(api.follows.unfollow);

  const showToast = (t: string, s: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title: t, subtitle: s } }));

  const handleToggleFollow = async (personId: string, isFollowing: boolean) => {
    if (!convexUserId) return;
    try {
      if (isFollowing) {
        await unfollowMut({ followerId: convexUserId as any, followingId: personId as any });
      } else {
        await followMut({ followerId: convexUserId as any, followingId: personId as any });
      }
    } catch {
      showToast('Error', 'Could not update follow status.');
    }
  };

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
    pricing: r.pricing,
    creator: r.creator ? {
      id: r.creator._id,
      name: r.creator.name,
      username: r.creator.username,
      avatar: r.creator.avatar,
      isNINVerified: r.creator.isNINVerified,
      isPhoneVerified: false,
      badges: r.creator.badges,
    } : { id: '', name: 'User', username: '', avatar: '', isNINVerified: false, isPhoneVerified: false },
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

  return (
    <PageShell title={decoded}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-6 flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-zinc-900 tracking-tight truncate">{decoded}</h2>
            <p className="text-xs text-zinc-500 font-medium">
              {posts === undefined ? '…' : posts.length} post{posts?.length === 1 ? '' : 's'} tagged
            </p>
          </div>
        </div>

        {/* People who share this interest */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100 mb-6">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <h3 className="font-bold text-zinc-900 text-sm">People who share this</h3>
          </div>
          {people === undefined ? (
            <div className="divide-y divide-zinc-100">
              <RallyCardSkeleton />
            </div>
          ) : people.length > 0 ? (
            people.map((p: any) => (
              <div key={p._id} className="flex items-center gap-3 p-4 hover:bg-zinc-50/60 transition-colors">
                <Link to={`/user/${p._id}`} className="shrink-0">
                  <Avatar src={p.avatar} name={p.name} size="md" className="border-2 border-white shadow-sm" />
                </Link>
                <Link to={`/user/${p._id}`} className="flex-1 min-w-0 block">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm text-zinc-900 truncate">{p.name}</span>
                    {p.isNINVerified && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-zinc-500 font-medium truncate">@{p.username ? p.username.replace(/^@+/, '') : ''} · {p.followersCount} followers</p>
                </Link>
                {convexUserId && p._id !== convexUserId && (
                  <button
                    onClick={() => handleToggleFollow(p._id, p.isFollowing)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shrink-0',
                      p.isFollowing
                        ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        : 'bg-zinc-900 hover:bg-zinc-700 text-white'
                    )}
                  >
                    {p.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-xs text-zinc-400 font-medium">No public members here yet.</p>
          )}
        </div>

        {/* Posts */}
        <h3 className="font-bold text-zinc-900 text-sm mb-2 px-1">Latest posts</h3>
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
          {posts === undefined ? (
            <>
              <RallyCardSkeleton />
              <RallyCardSkeleton />
            </>
          ) : posts.length > 0 ? (
            posts.map((r: any) => <RallyCard key={r._id} rally={mapRally(r)} />)
          ) : (
            <div className="p-12 text-center text-zinc-500">
              <p className="font-bold text-zinc-900 text-base mb-1">No posts yet</p>
              <p className="text-xs text-zinc-500">Be the first to post about {decoded}.</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
