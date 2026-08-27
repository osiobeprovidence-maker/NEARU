import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, Heart, Users, Share2, Compass, Bell, X, MapPin, MapPinOff, Loader2, MessageCircleQuestion } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { cn } from '../lib/utils';
import { useLocation } from '../contexts/LocationContext';
import { haversineDistance, formatDistance } from '../lib/geo';
import { Rally } from '../types';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import AdCard from '../components/AdCard';

const NOTIF_DISMISSED_KEY = 'rally_notif_dismissed';
const EXPLAINER_DISMISSED_KEY = 'rally_explainer_dismissed';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('All');
  const {
    city,
    radiusKm,
    geoState,
    position,
    error,
    requestLocation,
    startWatching,
    openLocationModal,
  } = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [showExplainer, setShowExplainer] = useState(() => {
    return !localStorage.getItem(EXPLAINER_DISMISSED_KEY);
  });

  const convexRallies = useQuery(api.rallies.listWithCreators);

  const feedIsLoaded = convexRallies !== undefined;

  useEffect(() => {
    const dismissed = localStorage.getItem(NOTIF_DISMISSED_KEY);
    if (!dismissed && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => setShowNotifPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (geoState === 'active' || geoState === 'manual') {
      startWatching();
    }
  }, [geoState, startWatching]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [activeFilter, city, radiusKm, geoState]);

  const openCreateModal = () => {
    window.dispatchEvent(new CustomEvent('open-create-rally'));
  };

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: 'Notifications enabled!',
            subtitle: 'You\'ll get alerted when someone rallies near you.'
          }
        }));
      }
    }
    localStorage.setItem(NOTIF_DISMISSED_KEY, '1');
    setShowNotifPrompt(false);
  };

  const handleDismissNotif = () => {
    localStorage.setItem(NOTIF_DISMISSED_KEY, '1');
    setShowNotifPrompt(false);
  };

  const handleDismissExplainer = () => {
    localStorage.setItem(EXPLAINER_DISMISSED_KEY, '1');
    setShowExplainer(false);
  };

  const handleInvite = async () => {
    const shareCity = city || 'your area';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on RALLY',
          text: `Join me on RALLY — see what people in ${shareCity} are asking, helping with, and doing together!`,
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
    
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        title: 'Invite Link Copied!',
        subtitle: `Share it with people around ${shareCity} to get RALLYS started.`
      }
    }));
  };

  const filters = ['All', 'Help', 'Join', 'Paid', 'Free'];

  const hasLocation = geoState === 'active' || geoState === 'manual' || geoState === 'updating';
  const isLocating = geoState === 'requesting' || geoState === 'locating';
  const isDenied = geoState === 'denied';
  const isUnavailable = geoState === 'unavailable' || geoState === 'error';

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
        creator: r.creator ? {
          id: r.creator._id,
          name: r.creator.name,
          username: r.creator.username,
          avatar: r.creator.avatar,
          isNINVerified: r.creator.isNINVerified,
          isPhoneVerified: false,
          badges: r.creator.badges,
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
        eventDate: r.eventDate,
        mediaUrl: r.mediaUrl,
        mediaType: r.mediaType as Rally['mediaType'],
      }));
    }
    return [];
  }, [convexRallies]);

  const hasRealPosts = allRallies.length > 0;
  const showFilters = feedIsLoaded && !isLoading && hasRealPosts;

  const nearbyRallies = useMemo(() => {
    if (!hasLocation) return [];

    return allRallies
      .map((rally) => {
        const dist = computeDistance(rally.rallyLatitude, rally.rallyLongitude);
        return { ...rally, computedDistance: dist };
      })
      .filter((rally) => {
        if (rally.computedDistance === null) return false;
        if (rally.computedDistance > radiusKm) return false;

        const matchesFilter =
          activeFilter === 'All' ||
          rally.type === activeFilter.toUpperCase() ||
          (activeFilter === 'Free' && !rally.isPaid) ||
          (activeFilter === 'Paid' && rally.isPaid);

        return matchesFilter;
      })
      .sort((a, b) => (a.computedDistance ?? Infinity) - (b.computedDistance ?? Infinity));
  }, [hasLocation, radiusKm, activeFilter, computeDistance, allRallies]);

  return (
    <div className="w-full pt-4 md:pt-6">
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

      {showExplainer && (
        <div className="px-4 md:px-6 mb-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <MessageCircleQuestion className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-black text-zinc-900 tracking-tight">What's your RALLY?</h3>
              </div>
              <button
                onClick={handleDismissExplainer}
                className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              Ask for help, offer help, or invite people nearby to join you. Post what you need and connect with people around you.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ring-rose-200 shrink-0 mt-0.5">ASK</div>
                <p className="text-xs text-zinc-600 leading-relaxed">"Anyone know a good plumber around here?"</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ring-emerald-200 shrink-0 mt-0.5">HELP</div>
                <p className="text-xs text-zinc-600 leading-relaxed">"I can help move furniture this afternoon."</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ring-indigo-200 shrink-0 mt-0.5">JOIN</div>
                <p className="text-xs text-zinc-600 leading-relaxed">"I have an extra ticket. Anyone want to come?"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-0 md:px-6 pb-24 md:pb-6">
        <div className="px-6 md:px-0">
          <div className="flex items-end justify-between mb-1">
            <h3 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Around You</h3>
            {hasLocation && (
              <button
                onClick={openLocationModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold hover:bg-zinc-200 active:scale-95 transition-all"
              >
                <MapPin className="w-3 h-3" />
                {city || 'Set location'} · {radiusKm} km
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mb-4">
            {hasLocation
              ? 'See what people nearby are asking, offering and looking for.'
              : isLocating
                ? 'Finding your location...'
                : 'Enable location to see nearby RALLYS.'}
          </p>

          {showFilters && (
            <div className="flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar mb-4">
              {filters.map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-semibold transition-all shrink-0 active:scale-95",
                    activeFilter === filter 
                      ? "bg-zinc-900 text-white shadow-xs shadow-zinc-900/20 font-bold" 
                      : "bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100 mb-6">
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">What's your RALLY?</h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Tell people around you what you need, what you can offer, or what you'd like to do together.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <button 
                onClick={openCreateModal}
                className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-rose-100 group-hover:bg-rose-200 text-rose-600 flex items-center justify-center transition-colors">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-rose-900 text-xs">ASK</div>
                  <div className="text-[9px] text-rose-600 font-medium mt-0.5 leading-tight px-0.5">I need something</div>
                </div>
              </button>

              <button 
                onClick={openCreateModal}
                className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 group-hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-colors">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-emerald-900 text-xs">HELP</div>
                  <div className="text-[9px] text-emerald-600 font-medium mt-0.5 leading-tight px-0.5">I can help</div>
                </div>
              </button>

              <button 
                onClick={openCreateModal}
                className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-indigo-900 text-xs">JOIN</div>
                  <div className="text-[9px] text-indigo-600 font-medium mt-0.5 leading-tight px-0.5">I want company</div>
                </div>
              </button>
            </div>

            <button 
              onClick={openCreateModal}
              className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-md shadow-zinc-200"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs font-black">+</span>
              </div>
              CREATE A RALLY
            </button>
          </div>

          <AdCard />

          {isLocating ? (
            <div className="p-8 sm:p-10 text-center">
              <Loader2 className="w-10 h-10 text-zinc-300 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold text-zinc-900 mb-1">Finding your location</h3>
              <p className="text-xs text-zinc-500">Hang tight while we pinpoint where you are.</p>
            </div>
          ) : isDenied ? (
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5">
                <MapPinOff className="w-8 h-8 text-rose-500" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                Location access is off
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto mb-7 leading-relaxed">
                Turn on location permission in your browser settings to see RALLYS near you.
              </p>
              <button
                onClick={requestLocation}
                className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-xs sm:text-sm active:scale-95 transition-all"
              >
                TRY AGAIN
              </button>
            </div>
          ) : isUnavailable ? (
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5">
                <MapPinOff className="w-8 h-8 text-amber-500" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                We need your location
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto mb-2 leading-relaxed">
                RALLY uses your location to show people and activities near you.
              </p>
              {error && (
                <p className="text-xs text-rose-500 font-medium mb-4">{error.message}</p>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
                <button
                  onClick={requestLocation}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs sm:text-sm active:scale-95 transition-all"
                >
                  ENABLE LOCATION
                </button>
                <button
                  onClick={openLocationModal}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl font-bold text-xs sm:text-sm active:scale-95 transition-all border border-zinc-200/80"
                >
                  Set manually
                </button>
              </div>
            </div>
          ) : !feedIsLoaded || isLoading ? (
            <>
              <RallyCardSkeleton />
              <RallyCardSkeleton />
              <RallyCardSkeleton />
            </>
          ) : !hasRealPosts ? (
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center mx-auto mb-5 text-zinc-900 shadow-xs">
                <Compass className="w-8 h-8 text-zinc-800" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                Nothing nearby? Be the first to RALLY!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto mb-7 leading-relaxed">
                Start the conversation. Ask for something, offer help, or invite people nearby to join you.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-zinc-200 active:scale-95 transition-all"
              >
                Create a RALLY
              </button>
            </div>
          ) : nearbyRallies.length > 0 ? (
            <>
              {nearbyRallies.map(rally => (
                <RallyCard
                  key={rally.id}
                  rally={{
                    ...rally,
                    distance: rally.computedDistance ?? rally.distance,
                    locationLabel: rally.computedDistance != null
                      ? `${city || 'Nearby'} · ${formatDistance(rally.computedDistance)}`
                      : rally.locationLabel,
                  }}
                />
              ))}
            </>
          ) : (
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center mx-auto mb-5 text-zinc-900 shadow-xs">
                <Compass className="w-8 h-8 text-zinc-800" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                Nothing nearby? Be the first to RALLY!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto mb-7 leading-relaxed">
                Start the conversation. Ask for something, offer help, or invite people nearby to join you.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-zinc-200 active:scale-95 transition-all"
                >
                  Create a RALLY
                </button>
                <button
                  type="button"
                  onClick={handleInvite}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl font-bold text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 border border-zinc-200/80"
                >
                  <Share2 className="w-4 h-4 text-zinc-600" />
                  Invite people near you
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 mb-4 px-4 md:px-0">
          <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-zinc-200 flex-shrink-0 flex items-center justify-center">
              <Users className="w-5 h-5 text-zinc-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-zinc-900 text-sm">Grow your community</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Invite friends to RALLY and make things happen together.</p>
            </div>
            <button
              onClick={handleInvite}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 active:scale-95 transition-all shrink-0"
            >
              Invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
