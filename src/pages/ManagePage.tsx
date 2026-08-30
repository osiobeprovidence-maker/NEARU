import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Avatar from '../components/Avatar';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import {
  BadgeCheck,
  MapPin,
  Crown,
  Calendar,
  Building2,
  Store,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Rally } from '../types';

export default function ManagePage() {
  const { user, convexUserId, isPro } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'content'>('events');

  const isOrgBiz =
    user.accountType === 'organization' || user.accountType === 'business';

  const showToast = (t: string, s: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title: t, subtitle: s } }));

  const openCreateEvent = () => {
    if (!isPro) {
      showToast('LALOA Pro required', 'Upgrade to create an event.');
      return;
    }
    window.dispatchEvent(
      new CustomEvent('open-create-rally', { detail: { type: 'EVENT' } })
    );
  };

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
  const content = useQuery(
    api.rallies.listByCreator,
    convexUserId
      ? { creatorId: convexUserId as any, userId: convexUserId as any }
      : 'skip'
  );

  const mapped: Rally[] = useMemo(() => {
    if (!content) return [];
    return content.map((r) => ({
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
      creator: {
        id: convexUserId || 'me',
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        isNINVerified: user.isNINVerified,
        isPhoneVerified: false,
        badges: user.badges,
        accountType: user.accountType || 'personal',
        organizationName: user.organizationName,
        isPro: user.isPro,
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
  }, [content, convexUserId, user]);

  const events = mapped.filter((r) => r.type === 'EVENT');
  const posts = mapped.filter((r) => r.type !== 'EVENT');
  const isLoading = content === undefined;

  const displayName = user.organizationName || user.name;
  const isBusiness = user.accountType === 'business';

  // Not an org/business account — show a helpful gate instead of the page.
  if (!isOrgBiz) {
    return (
      <PageShell title="My Page">
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight">
              This Page is for Organizations & Businesses
            </h3>
            <p className="text-sm text-zinc-500 font-medium max-w-sm mx-auto mt-2 mb-7 leading-relaxed">
              Switch your account to an Organization or Business to get a dedicated
              page for managing events and content. Both require LALOA Pro.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/profile"
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-bold transition-all active:scale-95"
              >
                Change account type
              </Link>
              {!isPro && (
                <Link
                  to="/plus"
                  className="px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-full text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                  Upgrade to LALOA Pro
                </Link>
              )}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="My Page"
      subtitle="Manage your events, RALLYs and posts."
      headerAction={
        <button
          onClick={openCreateEvent}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all active:scale-95 shrink-0"
        >
          <Calendar className="w-3.5 h-3.5" />
          Create Event
          <Crown className="w-3 h-3 text-amber-400" />
        </button>
      }
    >
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
        {/* Identity */}
        <div className="p-6 sm:p-8 text-center">
          <Avatar
            src={user.avatar}
            name={displayName}
            size="xl"
            className="mx-auto mb-3 shadow-sm border-2 border-white ring-1 ring-zinc-200"
          />

          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              {displayName}
            </h2>
            {user.isNINVerified && <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
            <span className="px-1.5 py-0.5 ml-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 shrink-0">
              {isBusiness ? 'Business' : 'Organization'}
            </span>
          </div>

          <p className="text-xs font-bold text-zinc-400 mb-2.5">{user.username}</p>

          <p className="text-sm text-zinc-700 font-medium max-w-sm mx-auto leading-relaxed mb-3">
            "{user.bio || 'We create events and share updates with our community.'}"
          </p>

          <div className="text-xs text-zinc-500 font-medium mb-4 flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <span>{user.location || 'Location not set'}</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Link
              to={`/user/${convexUserId}`}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              View public page
            </Link>
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
        <div className="flex border-b border-zinc-100">
          {(
            [
              { key: 'events', label: `Events (${isLoading ? '…' : events.length})` },
              { key: 'content', label: `Posts & RALLYs (${isLoading ? '…' : posts.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 py-3 text-xs font-bold transition-colors',
                activeTab === tab.key
                  ? 'text-zinc-900 border-b-2 border-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-zinc-100">
          {isLoading ? (
            <>
              <RallyCardSkeleton />
              <RallyCardSkeleton />
            </>
          ) : activeTab === 'events' ? (
            events.length > 0 ? (
              events.map((rally) => <RallyCard key={rally.id} rally={rally} />)
            ) : (
              <EmptyList
                icon={<Calendar className="w-8 h-8" />}
                title="No events yet"
                body="Create an event to share with people around you."
                actionLabel="Create Event"
                onAction={openCreateEvent}
              />
            )
          ) : posts.length > 0 ? (
            posts.map((rally) => <RallyCard key={rally.id} rally={rally} />)
          ) : (
            <EmptyList
              icon={<Building2 className="w-8 h-8" />}
              title="No posts or RALLYs yet"
              body="Share updates with your community."
              actionLabel="Create a Post"
              onAction={() =>
                window.dispatchEvent(
                  new CustomEvent('open-create-rally', { detail: { type: 'POST' } })
                )
              }
            />
          )}
        </div>

        {/* Manage events shortcut */}
        <Link
          to="/my-rallys"
          className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100"
        >
          <span>Manage RALLYs</span>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
function StatCell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="px-2">
      <div className="text-xl sm:text-2xl font-black text-zinc-900">
        {value === null ? <span className="text-zinc-300 text-lg">…</span> : value}
      </div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function EmptyList({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="py-14 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="font-bold text-zinc-900 text-sm mb-1">{title}</p>
      <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto mb-6">{body}</p>
      <button
        onClick={onAction}
        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all active:scale-95"
      >
        {actionLabel}
      </button>
    </div>
  );
}