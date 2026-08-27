import React, { useState, useMemo } from 'react';
import PageShell from '../components/PageShell';
import { Search } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import { cn } from '../lib/utils';
import { Rally } from '../types';

export default function Explore() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Nearest');

  const convexRallies = useQuery(api.rallies.listWithCreators);

  const categories = ['Nearby', 'Trending', 'Events', 'Help', 'Paid', 'Free', 'Activities', 'Transport', 'Errands', 'Community'];

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
      hashtags: r.hashtags,
      eventDate: r.eventDate,
      mediaUrl: r.mediaUrl,
      mediaType: r.mediaType as Rally['mediaType'],
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
    } else if (activeCategory === 'Events' || activeCategory === 'Activities') {
      result = result.filter(r => r.type === 'JOIN');
    } else if (activeCategory === 'Trending') {
      result = result.sort((a, b) => b.peopleInterested - a.peopleInterested);
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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mb-5 sm:mb-6">
          {categories.map((category) => (
            <button 
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold transition-all shrink-0 active:scale-95",
                activeCategory === category
                  ? "bg-zinc-900 text-white shadow-xs shadow-zinc-900/20 font-bold"
                  : "bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-zinc-900 text-sm sm:text-base">
            {activeCategory} RALLYS {filteredRallies.length > 0 && <span className="text-zinc-400 font-normal text-xs ml-1">({filteredRallies.length})</span>}
          </h3>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-semibold text-zinc-500 focus:outline-none cursor-pointer"
          >
            <option value="Nearest">Nearest</option>
            <option value="Newest">Newest</option>
            <option value="Most interested">Most interested</option>
            <option value="Ending soon">Ending soon</option>
          </select>
        </div>
      </div>

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
    </PageShell>
  );
}
