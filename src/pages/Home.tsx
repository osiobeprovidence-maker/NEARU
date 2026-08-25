import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Heart, Users, Zap, Sparkles, Share2, Compass, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { mockRallies } from '../data/mock';
import { useLocation } from '../contexts/LocationContext';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('All');
  const { city, radius } = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400); // Simulate network request delay
    return () => clearTimeout(timer);
  }, [activeFilter, city, radius]);

  const openCreateModal = () => {
    window.dispatchEvent(new CustomEvent('open-create-rally'));
  };

  const handleInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on RALLY',
          text: `Join me on RALLY — see what people in ${city} are asking, helping with, and doing together!`,
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
        subtitle: `Share it with people around ${city} to get RALLYS started.`
      }
    }));
  };

  const filters = ['All', 'Help', 'Join', 'Paid', 'Free'];

  // Parse numeric radius limit
  const maxRadius = parseFloat(radius) || 5;

  // 1. Strictly local / nearby feed filtered by user's selected city & radius
  const nearbyRallies = useMemo(() => {
    return mockRallies.filter(rally => {
      const rallyCity = (rally.city || 'Lagos').toLowerCase();
      const currentCity = city.toLowerCase();
      const matchesCity = rallyCity === currentCity;
      const matchesRadius = rally.distance <= maxRadius;
      
      const matchesFilter = activeFilter === 'All' 
        || rally.type === activeFilter.toUpperCase() 
        || (activeFilter === 'Free' && !rally.isPaid) 
        || (activeFilter === 'Paid' && rally.isPaid);

      return matchesCity && matchesRadius && matchesFilter;
    });
  }, [city, maxRadius, activeFilter]);

  // 2. Buzzing locations / Discovery feed (shown when nearby is empty to showcase varied ASK/HELP/JOIN/Paid/Free posts)
  const buzzingRallies = useMemo(() => {
    return mockRallies.filter(rally => {
      const matchesFilter = activeFilter === 'All' 
        || rally.type === activeFilter.toUpperCase() 
        || (activeFilter === 'Free' && !rally.isPaid) 
        || (activeFilter === 'Paid' && rally.isPaid);

      return matchesFilter;
    });
  }, [activeFilter]);

  return (
    <div className="w-full pt-4 md:pt-6">
      {/* Around You Feed */}
      <div className="px-0 md:px-6 pb-24 md:pb-6">
        <div className="px-6 md:px-0">
          <div className="flex items-end justify-between mb-1">
            <h3 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Around You</h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mb-4">
            See what people nearby are asking, offering and looking for.
          </p>

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
        </div>

        {/* What's your RALLY? Card */}
        <div className="mb-6 p-6 bg-white border-y md:border border-zinc-200 md:rounded-[2rem] shadow-sm">
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

        {/* Dynamic Feed Section */}
        {isLoading ? (
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            <RallyCardSkeleton />
            <RallyCardSkeleton />
            <RallyCardSkeleton />
          </div>
        ) : nearbyRallies.length > 0 ? (
          /* Active Nearby Feed */
          <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
            {nearbyRallies.map(rally => (
              <RallyCard key={rally.id} rally={rally} />
            ))}
          </div>
        ) : (
          /* Empty Nearby State + Buzzing Locations Onboarding Feed */
          <div className="space-y-6">
            {/* 1. Nearby Empty State Card */}
            <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center mx-auto mb-5 text-zinc-900 shadow-xs">
                <Compass className="w-8 h-8 text-zinc-800" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
                Nothing nearby right now
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto mb-7 leading-relaxed">
                We'll notify you when someone posts near you.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-zinc-200 active:scale-95 transition-all"
                >
                  BE THE FIRST TO RALLY
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

            {/* 2. Buzzing Locations Discovery / Passive Onboarding Feed */}
            <div>
              <div className="px-6 md:px-0 mb-3 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                    See what's happening around RALLY
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500">
                  Get a feel for what's happening in other buzzing locations.
                </p>
              </div>

              <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
                {buzzingRallies.map(rally => (
                  <RallyCard key={`buzzing-${rally.id}`} rally={rally} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder Ad */}
        <div className="mt-8 mb-4 px-4 md:px-0">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Sponsored</div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-indigo-100/50 transition-colors">
            <div className="w-16 h-16 rounded-xl bg-indigo-200 flex-shrink-0 flex items-center justify-center">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-indigo-900">Get RALLY+</h4>
              <p className="text-xs text-indigo-700 mt-0.5">Remove ads and unlock premium features for just ₦1,000/mo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
