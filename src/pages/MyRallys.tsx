import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import { cn } from '../lib/utils';
import { Users, Calendar, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Rally } from '../types';

export default function MyRallys() {
  const navigate = useNavigate();
  const { convexUserId, isPro, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Created');
  // Optimistic local delete — remove card immediately without waiting for re-query
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const canCreateEvent =
    isPro &&
    (user.accountType === 'organization' || user.accountType === 'business');

  const openCreateEvent = () => {
    window.dispatchEvent(
      new CustomEvent('open-create-rally', { detail: { type: 'EVENT' } })
    );
  };

  const myRallies = useQuery(
    api.rallies.listByCreator,
    convexUserId
      ? { creatorId: convexUserId as any, userId: convexUserId as any }
      : 'skip'
  );

  const tabs = ['Created', 'Interested', 'Completed'];

  // Map raw Convex result to the Rally shape that RallyCard expects
  const mappedRallies: Rally[] = React.useMemo(() => {
    if (!myRallies) return [];
    return myRallies.map((r) => ({
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
      creator: r.creator
        ? {
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
          }
        : {
            id: convexUserId || 'me',
            name: 'You',
            username: '',
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
  }, [myRallies, convexUserId]);

  const createdRallies = mappedRallies.filter((r) => !deletedIds.has(r.id));
  const isLoading = myRallies === undefined;

  const handleDeleted = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
  };

  return (
    <PageShell title="My RALLYS">
      <div className="px-6 md:px-0 flex items-center justify-between gap-6 border-b border-zinc-200 mb-6">
        <div className="flex items-center gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 text-sm font-bold transition-colors relative shrink-0',
                activeTab === tab
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
        {canCreateEvent && (
          <button
            onClick={openCreateEvent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all active:scale-95 shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            Create Event
            <Crown className="w-3 h-3 text-amber-400" />
          </button>
        )}
      </div>

      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
        {isLoading && activeTab === 'Created' ? (
          <>
            <RallyCardSkeleton />
            <RallyCardSkeleton />
          </>
        ) : activeTab === 'Created' ? (
          createdRallies.length > 0 ? (
            createdRallies.map((rally) => (
              <RallyCard key={rally.id} rally={rally} onDeleted={handleDeleted} />
            ))
          ) : (
            <EmptyState
              message="You haven't created any RALLYS yet. Time to start an adventure!"
            />
          )
        ) : (
          <EmptyState
            message={`You don't have any ${activeTab.toLowerCase()} RALLYS yet.`}
          />
        )}
      </div>
    </PageShell>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 border-none">
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 bg-emerald-50 rounded-full animate-pulse blur-xl opacity-60" />
        <div className="relative bg-white border border-emerald-100 shadow-xl shadow-emerald-100/50 w-full h-full rounded-[2.5rem] flex items-center justify-center rotate-6 hover:rotate-0 transition-transform duration-500">
          <Users className="w-14 h-14 text-emerald-500" strokeWidth={1.5} />
          <div className="absolute -top-2 -left-2 bg-indigo-400 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
            <span className="text-white text-[10px] font-black">?</span>
          </div>
        </div>
      </div>
      <h3 className="text-2xl font-black text-zinc-900 tracking-tight">No RALLYS here</h3>
      <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[220px] mx-auto mb-8">
        {message}
      </p>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-create-rally'))}
        className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-bold shadow-md shadow-zinc-200 transition-all hover:scale-105 active:scale-95"
      >
        Create a RALLY
      </button>
    </div>
  );
}
