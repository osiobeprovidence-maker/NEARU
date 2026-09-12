import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Share2, Compass, Bell, X, MapPin } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocation } from '../contexts/LocationContext';
import { haversineDistance, formatDistance } from '../lib/geo';
import { Rally } from '../types';
import PostCard from '../components/PostCard';
import AdCard from '../components/AdCard';


import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';
import { subscribeUserToPush } from '../utils/pushManager';

const NOTIF_DISMISSED_KEY = 'rally_notif_dismissed';

export default function Home() {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const {
    city,
    radiusKm,
    geoState,
    position,
    startWatching,
    openLocationModal,
  } = useLocation();
  const { requestWithRationale, checkPermission } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  const { convexUserId, user } = useAuth();
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
  const activeAds = useQuery(api.ads.listActive);

  const feedIsLoaded = convexRallies !== undefined;

  useEffect(() => {
    const dismissed = localStorage.getItem(NOTIF_DISMISSED_KEY);
    if (!dismissed) {
      checkPermission('notifications').then((res) => {
        if (res.status === 'prompt') {
          const timer = setTimeout(() => setShowNotifPrompt(true), 2000);
          return () => clearTimeout(timer);
        }
      });
    }
  }, [checkPermission]);

  useEffect(() => {
    if (geoState === 'active' || geoState === 'manual') {
      startWatching();
    }
  }, [geoState, startWatching]);

  // Loading is derived from data availability; no artificial timeout needed.
  const loading = !feedIsLoaded;

  const openCreateModal = () => {
    window.dispatchEvent(new CustomEvent('open-create-rally'));
  };

  const handleDeleted = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
  };

  const savePushSubscription = useMutation(api.notifications.savePushSubscription);

  const handleEnableNotifications = async () => {
    const permResult = await requestWithRationale('notifications');
    if (!permResult.granted) {
      localStorage.setItem(NOTIF_DISMISSED_KEY, '1');
      setShowNotifPrompt(false);
      return;
    }

    if (convexUserId || user.id) {
      const res = await subscribeUserToPush((convexUserId || user.id) as string, savePushSubscription);
      if (res.success) {
        window.dispatchEvent(
          new CustomEvent('show-toast', {
            detail: {
              title: 'Push notifications enabled!',
              subtitle: "You'll get real OS alerts even when Lalao is minimized.",
            },
          })
        );
      }
    }
    localStorage.setItem(NOTIF_DISMISSED_KEY, '1');
    setShowNotifPrompt(false);
  };

  const handleDismissNotif = () => {
    localStorage.setItem(NOTIF_DISMISSED_KEY, '1');
    setShowNotifPrompt(false);
  };

  const handleInvite = async () => {
    const shareCity = city || 'your area';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Lalao',
          text: `Join me on Lalao — see what people in ${shareCity} are sharing, doing, and helping with!`,
          url: window.location.origin,
        });
        return;
      } catch {
        // User dismissed share sheet
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.origin);
      } catch {
        // Ignore clipboard failure
      }
    }

    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: {
          title: 'Invite Link Copied!',
          subtitle: `Share it with people around ${shareCity} to keep the community going.`,
        },
      })
    );
  };

  const computeDistance = useCallback(
    (rallyLat?: number, rallyLng?: number): number | null => {
      if (!position || rallyLat == null || rallyLng == null) return null;
      return haversineDistance(
        { latitude: position.latitude, longitude: position.longitude },
        { latitude: rallyLat, longitude: rallyLng }
      );
    },
    [position]
  );

  const allRallies: Rally[] = useMemo(() => {
    if (convexRallies && convexRallies.length > 0) {
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
        creator: r.creator
          ? {
              id: r.creator._id,
              name: r.creator.name,
              username: r.creator.username,
              avatar: r.creator.avatar,
              isNINVerified: r.creator.isNINVerified,
              isBlueVerified: r.creator.isBlueVerified,
              isVerified: r.creator.isVerified,
              verificationStatus: r.creator.verificationStatus,
              verificationType: r.creator.verificationType,
              isPhoneVerified: false,
              badges: r.creator.badges,
              accountType: r.creator.accountType,
              organizationName: r.creator.organizationName,
            }
          : {
              id: 'unknown',
              name: 'Unknown',
              username: '@unknown',
              avatar: '',
              isBlueVerified: false,
              isVerified: false,
              verificationStatus: 'unverified',
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
        mediaUrls: r.mediaUrls && r.mediaUrls.length > 0 ? r.mediaUrls : (r.mediaUrl ? [r.mediaUrl] : []),
        mediaType: r.mediaType as Rally['mediaType'],
        capacity: r.capacity,
        likesCount: r.likesCount,
        commentsCount: r.commentsCount,
        rsvpsCount: r.rsvpsCount,
        isLiked: r.isLiked,
        isRsvpd: r.isRsvpd,
        eventTag: r.eventTag,
        interests: r.interests,
        rallyLinkId: r.rallyLinkId,
        linkedEvent: r.linkedEvent,
        authorType: r.authorType,
        pageId: r.pageId,
        created_by_user_id: r.created_by_user_id,
        pageAuthor: r.pageAuthor,
      }));
    }
    return [];
  }, [convexRallies]);

  const nearbyRallies = useMemo(() => {
    return allRallies
      .filter((rally) => !deletedIds.has(rally.id))
      .map((rally) => {
        const dist = computeDistance(rally.rallyLatitude, rally.rallyLongitude);
        return { ...rally, computedDistance: dist };
      })
      .filter((rally) => {
        // Radius filter if GPS coords available
        if (rally.computedDistance !== null) {
          if (rally.computedDistance > radiusKm) return false;
        }
        return true;
      })
      .sort((a, b) => (a.computedDistance ?? Infinity) - (b.computedDistance ?? Infinity));
  }, [radiusKm, computeDistance, allRallies]);

  return (
    <div className="w-full pt-2 md:pt-4 flex flex-col items-center">

      {/* Optional Notification Opt-in Prompt */}
      {showNotifPrompt && (
        <div className="px-4 md:px-6 mb-4">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-4 flex items-start gap-3 shadow-lg shadow-indigo-500/20">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm">Stay in the loop</h4>
              <p className="text-xs text-indigo-100 mt-0.5 leading-relaxed">
                Get notified when someone rallies near you or responds to your post.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleEnableNotifications}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 active:scale-95 transition-all"
                >
                  Turn On
                </button>
                <button
                  onClick={handleDismissNotif}
                  className="px-3 py-2 text-indigo-100 text-xs font-bold hover:text-white transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismissNotif}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-indigo-200" />
            </button>
          </div>
        </div>
      )}

       {/* Main Feed Container */}
       <div className="px-0 md:px-6 pb-8 md:pb-4">

        {/* Content Feed */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100 mb-6">

          {loading ? (
            <></>
          ) : nearbyRallies.length > 0 ? (
            <>
              {nearbyRallies.flatMap((rally, index) => {
                const items: React.ReactNode[] = [];
                items.push(
                  <PostCard
                    key={rally.id}
                    post={{
                      ...rally,
                      distance: rally.computedDistance ?? rally.distance,
                      locationLabel:
                        rally.computedDistance != null
                          ? `${city || 'Nearby'} · ${formatDistance(rally.computedDistance)}`
                          : rally.locationLabel,
                    }}
                    onDeleted={handleDeleted}
                  />
                );

                const adIndex = Math.floor(index / 3);
                if (activeAds && activeAds.length > 0 && (index + 1) % 3 === 0) {
                  const ad = activeAds[adIndex % activeAds.length];
                  items.push(
                    <AdCard
                      key={`ad-${ad._id}`}
                      title={ad.title}
                      description={ad.description}
                      imageUrl={ad.imageUrl}
                      mediaType={ad.mediaType}
                      linkUrl={ad.linkUrl}
                      ctaText={ad.ctaText}
                      brandName={ad.brandName}
                      brandLogoUrl={ad.brandLogoUrl}
                      isVerified={ad.isVerified}
                      isBlueVerified={ad.isBlueVerified}
                      verificationStatus={ad.verificationStatus}
                    />
                  );
                }
                return items;
              })}
            </>
          ) : (
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center mx-auto mb-5 text-zinc-900 shadow-xs">
                <Compass className="w-8 h-8 text-zinc-800" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                Nothing here yet — be the first to post
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto mb-7 leading-relaxed">
                Share what's on your mind, ask for help, or rally people nearby to do something together.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-zinc-200 active:scale-95 transition-all cursor-pointer"
                >
                  Start posting
                </button>
                <button
                  type="button"
                  onClick={handleInvite}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl font-bold text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 border border-zinc-200/80 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-zinc-600" />
                  Invite people near you
                </button>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}

