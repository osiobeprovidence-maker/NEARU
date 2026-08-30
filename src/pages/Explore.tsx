import React, { useState, useMemo } from 'react';
import PageShell from '../components/PageShell';
import { Search, Tag, Users, Hash } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import { cn } from '../lib/utils';
import { Rally } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import { Link } from 'react-router-dom';
import { BadgeCheck, ChevronRight } from 'lucide-react';

export default function Explore() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');

  const { convexUserId, user, blockUser } = useAuth();
  const followingIds = useQuery(
    api.follows.listFollowingIds,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const convexRallies = useQuery(
    api.rallies.listWithCreators,
    convexUserId
      ? {
          userId: convexUserId as any,
          userInterests: user?.interests?.length ? user.interests : undefined,
          followingIds: (followingIds ?? []) as any,
        }
      : { userId: undefined }
  );
  const people = useQuery(
    api.users.listPeople,
    convexUserId
      ? { viewerId: convexUserId as any, query: searchQuery.trim() ? searchQuery.trim() : undefined }
      : 'skip'
  );
  const interests = useQuery(
    api.rallies.listInterests,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const followMut = useMutation(api.follows.follow);
  const unfollowMut = useMutation(api.follows.unfollow);

  const categories = ['Nearby', 'Trending', 'Events', 'Help', 'Paid', 'Free', 'People', 'Interests'];

  const showToast = (title: string, subtitle: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));

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

  const handleBlock = (p: any) => {
    blockUser(p._id, p.name, p.username, p.avatar);
    showToast('User blocked', `${p.name} has been blocked.`);
  };

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [activeCategory, sortBy]);

  const allRallies: Rally[] = useMemo(() => {
    if (!convexRallies) return [];
    return convexRallies.map((r) => ({
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
        accountType: r.creator.accountType || 'personal',
        organizationName: r.creator.organizationName,
        isPro: r.creator.isPro,
      } : {
        id: 'unknown',
        name: 'Unknown',
        username: '@unknown',
        avatar: '',
        isNINVerified: false,
        isPhoneVerified: false,
      },
      status: r.status,
      createdAt: new Date(r.createdAt).toISOString(),
      city: r.city,
      locationLabel: r.locationLabel,
      rallyLatitude: r.rallyLatitude,
      rallyLongitude: r.rallyLongitude,
      category: r.category as Rally['category'],
      hashtags: r.hashtags,
      eventDate: r.eventDate,
      mediaUrl: r.mediaUrl,
      mediaType: r.mediaType as Rally['mediaType'],
      capacity: r.capacity,
      likesCount: r.likesCount,
      commentsCount: r.commentsCount,
      rsvpsCount: r.rsvpsCount,
      isLiked: r.isLiked,
      isRsvpd: r.isRsvpd,
    }));
  }, [convexRallies]);

  const filteredRallies = useMemo(() => {
    let result = [...allRallies];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace(/^#/, '');
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.creator.name.toLowerCase().includes(q) ||
        (r.hashtags && r.hashtags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (activeCategory === 'Help') {
      result = result.filter(r => r.type === 'HELP' || r.type === 'ASK');
    } else if (activeCategory === 'Paid') {
      result = result.filter(r => r.isPaid);
    } else if (activeCategory === 'Free') {
      result = result.filter(r => !r.isPaid);
    } else if (activeCategory === 'Events') {
      result = result.filter(r => r.type === 'EVENT');
    } else if (activeCategory === 'Activities') {
      result = result.filter(r => r.type === 'JOIN');
    } else if (activeCategory === 'Trending') {
      result = result.sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0));
    } else if (activeCategory === 'Nearby') {
      result = result.sort((a, b) => a.distance - b.distance);
    }

    if (sortBy === 'Newest') {
      result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'Most interested') {
      result = result.sort((a, b) => b.peopleInterested - a.peopleInterested);
    } else if (sortBy === 'Nearest') {
      result = result.sort((a, b) => a.distance - b.distance);
    }

    return result;
  }, [activeCategory, searchQuery, sortBy, allRallies]);

  return (
    <PageShell title="Explore RALLY">
      <div className="px-4 sm:px-6 md:px-0 pt-3.5 sm:pt-4 md:pt-0">
        <div className="relative mb-3.5 sm:mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-zinc-400" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for something..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm shadow-zinc-100 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar overscroll-x-contain mb-5 sm:mb-6">
          {categories.map((category) => (
            <button 
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all shrink-0 whitespace-nowrap touch-manipulation active:scale-95",
                activeCategory === category
                  ? "bg-zinc-900 text-white shadow-xs shadow-zinc-900/20 font-bold"
                  : "bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {activeCategory !== 'People' && activeCategory !== 'Interests' && (
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-bold text-zinc-900 text-sm sm:text-base min-w-0 truncate">
              {activeCategory} RALLYS {filteredRallies.length > 0 && <span className="text-zinc-400 font-normal text-xs ml-1">({filteredRallies.length})</span>}
            </h3>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-zinc-500 focus:outline-none cursor-pointer shrink-0 min-w-0"
            >
              <option value="Nearest">Nearest</option>
              <option value="Newest">Newest</option>
              <option value="Most interested">Most interested</option>
              <option value="Ending soon">Ending soon</option>
            </select>
          </div>
        )}
      </div>

      {activeCategory === 'People' ? (
        <PeoplePanel
          people={people}
          convexUserId={convexUserId}
          handleToggleFollow={handleToggleFollow}
          handleBlock={handleBlock}
        />
      ) : activeCategory === 'Interests' ? (
        <InterestsPanel interests={interests} />
      ) : (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
          {isLoading || convexRallies === undefined ? (
            <>
              <RallyCardSkeleton />
              <RallyCardSkeleton />
              <RallyCardSkeleton />
            </>
          ) : filteredRallies.length > 0 ? (
            filteredRallies.map(rally => (
              <RallyCard key={rally.id} rally={rally} />
            ))
          ) : (
            <div className="p-12 text-center text-zinc-500">
              <p className="font-bold text-zinc-900 text-base mb-1">No RALLYS found</p>
              <p className="text-xs text-zinc-500">Try selecting another category or adjusting your search query.</p>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// People discovery panel
// ---------------------------------------------------------------------------
function PeoplePanel({ people, convexUserId, handleToggleFollow, handleBlock }: {
  people: any;
  convexUserId: string | null;
  handleToggleFollow: (id: string, isFollowing: boolean) => void;
  handleBlock: (p: any) => void;
}) {
  if (people === undefined) {
    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
        {[0, 1, 2].map((i) => <RallyCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
      {people.length > 0 ? (
        people.map((p: any) => (
          <div key={p._id} className="flex items-center gap-3 p-4 hover:bg-zinc-50/60 transition-colors">
            <Link to={`/user/${p._id}`} className="shrink-0">
              <Avatar src={p.avatar} name={p.name} size="lg" className="border-2 border-white shadow-sm" />
            </Link>
            <Link to={`/user/${p._id}`} className="flex-1 min-w-0 block">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-zinc-900 truncate">{p.name}</span>
                {p.isNINVerified && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
              </div>
              <p className="text-xs text-zinc-500 font-medium truncate">
                @{p.username} · {p.followersCount} followers
              </p>
              {p.bio && <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{p.bio}</p>}
            </Link>
            <div className="flex items-center gap-1.5 shrink-0">
              {convexUserId && p._id !== convexUserId && (
                <>
                  <button
                    onClick={() => handleToggleFollow(p._id, p.isFollowing)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95',
                      p.isFollowing
                        ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        : 'bg-zinc-900 hover:bg-zinc-700 text-white'
                    )}
                  >
                    {p.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={() => handleBlock(p)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                    title="Block"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="p-12 text-center text-zinc-500">
          <Users className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="font-bold text-zinc-900 text-base mb-1">No people found</p>
          <p className="text-xs text-zinc-500">Try a different search or come back later.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interests discovery panel
// ---------------------------------------------------------------------------
function InterestsPanel({ interests }: { interests: any }) {
  if (interests === undefined) {
    return (
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
        {[0, 1, 2].map((i) => <RallyCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
      {interests.length > 0 ? (
        interests.map((it: any) => (
          <Link
            key={it.label}
            to={`/interest/${encodeURIComponent(it.label)}`}
            className="flex items-center justify-between p-4 hover:bg-zinc-50/60 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 text-sm">{it.label}</p>
                <p className="text-xs text-zinc-400 font-medium">{it.count} post{it.count === 1 ? '' : 's'}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))
      ) : (
        <div className="p-12 text-center text-zinc-500">
          <Hash className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="font-bold text-zinc-900 text-base mb-1">No interests yet</p>
          <p className="text-xs text-zinc-500">Posts tagged with interests will show up here.</p>
        </div>
      )}
    </div>
  );
}
