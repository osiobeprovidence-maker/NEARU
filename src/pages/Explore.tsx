import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import QueryErrorBoundary from '../components/QueryErrorBoundary';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import { ProfileVerificationCheck } from '../components/VerificationBadge';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

// Reusable Explore Components
import ExploreHeader, { SearchCategory } from '../components/explore/ExploreHeader';
import ExploreTabs, { ExploreTabType } from '../components/explore/ExploreTabs';
import DiscoverySection from '../components/explore/DiscoverySection';
import SuggestedPeople from '../components/explore/SuggestedPeople';
import RallyDiscoveryCard from '../components/explore/RallyDiscoveryCard';
import VideoDiscoveryGrid from '../components/explore/VideoDiscoveryGrid';
import TrendingSection from '../components/explore/TrendingSection';
import InterestChannel from '../components/explore/InterestChannel';
import ExploreRightSidebar from '../components/explore/ExploreRightSidebar';

import {
  MessageSquare,
  Users,
  HandMetal,
  Play,
  Flame,
  Tag,
  Sparkles,
  Filter,
  Search,
} from 'lucide-react';

function ExploreContent() {
  const { convexUserId, user } = useAuth();

  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<ExploreTabType>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const [rallyFilter, setRallyFilter] = useState<'Nearby' | 'Popular' | 'Newest' | 'Paid' | 'Free'>('Nearby');

  // Main Explore Reactive Feed
  const feed = useQuery(
    api.rallies.getExploreFeed,
    convexUserId ? { userId: convexUserId as any } : {}
  );

  // Compute personalized interest tabs from user profile or feed
  const personalizedInterests = useMemo(() => {
    const fromUser = (user?.interests?.length ? user.interests : user?.publicInterests) || [];
    if (fromUser.length >= 2) return fromUser.slice(0, 2);

    const fromFeed = (feed?.popularInterests || []).map((i: any) => i.label);
    const combined = Array.from(new Set([...fromUser, ...fromFeed]));
    return combined.slice(0, 2);
  }, [user, feed]);

  // Loading state
  const isLoading = feed === undefined;

  // Filtered RALLYS for dedicated RALLYS tab
  const filteredRallies = useMemo(() => {
    if (!feed?.rallies) return [];
    let list = [...feed.rallies];

    if (rallyFilter === 'Paid') {
      list = list.filter((r) => r.isPaid || (r.rewardAmount && r.rewardAmount > 0));
    } else if (rallyFilter === 'Free') {
      list = list.filter((r) => !r.isPaid && (!r.rewardAmount || r.rewardAmount === 0));
    } else if (rallyFilter === 'Popular') {
      list = list.sort((a, b) => (b.rsvpsCount || 0) - (a.rsvpsCount || 0));
    } else if (rallyFilter === 'Newest') {
      list = list.sort((a, b) => b.createdAt - a.createdAt);
    } else if (rallyFilter === 'Nearby') {
      list = list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return list;
  }, [feed?.rallies, rallyFilter]);

  // Multi-Category Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !feed) return null;
    const q = searchQuery.toLowerCase().trim().replace(/^#/, '');

    const matchingPeople = (feed.suggestedPeople || []).filter(
      (p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        (p.interests || []).some((i: string) => i.toLowerCase().includes(q))
    );

    const matchingRallies = (feed.rallies || []).filter(
      (r: any) =>
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.locationLabel?.toLowerCase().includes(q) ||
        r.creator?.name?.toLowerCase().includes(q) ||
        (r.hashtags || []).some((h: string) => h.toLowerCase().includes(q))
    );

    const matchingPosts = (feed.posts || []).filter(
      (p: any) =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.creator?.name?.toLowerCase().includes(q) ||
        (p.hashtags || []).some((h: string) => h.toLowerCase().includes(q))
    );

    const matchingVideos = (feed.videos || []).filter(
      (v: any) =>
        v.title?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.creator?.name?.toLowerCase().includes(q)
    );

    const matchingTopics = (feed.trendingTopics || []).filter((t: any) =>
      t.label?.toLowerCase().includes(q)
    );

    return {
      people: matchingPeople,
      rallies: matchingRallies,
      posts: matchingPosts,
      videos: matchingVideos,
      topics: matchingTopics,
    };
  }, [searchQuery, feed]);

  // Topic click helper
  const handleSelectTopic = (topic: string) => {
    setSearchQuery(topic);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select Interest helper
  const handleSelectInterest = (interest: string) => {
    setActiveTab(`interest:${interest.toLowerCase()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full pb-20 md:pb-12">
      {/* 1. TOP SEARCH BAR */}
      <ExploreHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchCategory={searchCategory}
        onCategoryChange={setSearchCategory}
      />

      {/* 2. HORIZONTAL NAVIGATION TABS (Shown when not searching) */}
      {!searchQuery.trim() && (
        <ExploreTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          personalizedInterests={personalizedInterests}
        />
      )}

      {/* 3. MAIN 3-COLUMN LAYOUT CONTAINER */}
      <div className="mt-4 sm:mt-5 lg:flex lg:gap-8 items-start">
        {/* CENTER DISCOVERY COLUMN */}
        <div className="flex-1 min-w-0 max-w-3xl">
          {/* SEARCH ACTIVE VIEW */}
          {searchQuery.trim() && searchResults ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-zinc-900">
                  Search results for &ldquo;{searchQuery}&rdquo;
                </h3>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Clear search
                </button>
              </div>

              {/* People Results */}
              {(searchCategory === 'all' || searchCategory === 'people') &&
                searchResults.people.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                      People
                    </h4>
                    <SuggestedPeople
                      people={searchResults.people}
                      currentUserId={convexUserId}
                      layout="horizontal"
                    />
                  </div>
                )}

              {/* RALLYS Results */}
              {(searchCategory === 'all' || searchCategory === 'rallies') &&
                searchResults.rallies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                      RALLYS
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {searchResults.rallies.map((rally: any) => (
                        <RallyDiscoveryCard
                          key={rally._id}
                          rally={rally}
                          currentUserId={convexUserId}
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Videos Results */}
              {(searchCategory === 'all' || searchCategory === 'videos') &&
                searchResults.videos.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                      Videos
                    </h4>
                    <VideoDiscoveryGrid videos={searchResults.videos} layout="carousel" />
                  </div>
                )}

              {/* Posts / Conversations Results */}
              {(searchCategory === 'all' || searchCategory === 'posts') &&
                searchResults.posts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                      Conversations
                    </h4>
                    {searchResults.posts.map((post: any) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                )}

              {/* Empty Search State */}
              {searchResults.people.length === 0 &&
                searchResults.rallies.length === 0 &&
                searchResults.posts.length === 0 &&
                searchResults.videos.length === 0 && (
                  <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 text-zinc-500">
                    <Search className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                    <p className="font-bold text-zinc-900 text-base mb-1">
                      No results found for &ldquo;{searchQuery}&rdquo;
                    </p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Try searching with different keywords, locations, or topics.
                    </p>
                  </div>
                )}
            </div>
          ) : isLoading ? (
            /* SKELETON LOADING STATE */
            <div className="space-y-4">
              <div className="h-44 bg-zinc-100 rounded-3xl animate-pulse" />
              <div className="h-64 bg-zinc-100 rounded-3xl animate-pulse" />
              <div className="h-64 bg-zinc-100 rounded-3xl animate-pulse" />
            </div>
          ) : activeTab === 'explore' ? (
            /* ========================================================================= */
            /* TAB 1: CURATED DEFAULT EXPLORE                                            */
            /* ========================================================================= */
            <div className="space-y-4 sm:space-y-6">
              {/* 1. WHAT'S HAPPENING (Conversations & Questions from non-followed people) */}
              <DiscoverySection
                title="What's Happening"
                subtitle="Interesting conversations and questions from around your community"
                icon={MessageSquare}
                actionLabel={feed.posts.length > 2 ? 'See all' : undefined}
                onAction={() => setActiveTab('trending')}
              >
                {feed.posts.length > 0 ? (
                  <div className="space-y-3">
                    {feed.posts.slice(0, 3).map((post: any) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200/80">
                    <p className="text-sm font-semibold text-zinc-600">No conversations yet</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Start a conversation by posting a question or story!</p>
                  </div>
                )}
              </DiscoverySection>

              {/* 2. PEOPLE YOU MIGHT WANT TO KNOW */}
              <DiscoverySection
                title="People You Might Want to Know"
                subtitle="Discover active creators and community members"
                icon={Users}
                badge="Connect"
              >
                <SuggestedPeople
                  people={feed.suggestedPeople}
                  currentUserId={convexUserId}
                  layout="horizontal"
                />
              </DiscoverySection>

              {/* 3. RALLYS TO DISCOVER */}
              <DiscoverySection
                title="RALLYS to Discover"
                subtitle="Active requests, help, and community activities you can join"
                icon={HandMetal}
                actionLabel="View all RALLYS"
                onAction={() => setActiveTab('rallies')}
              >
                {feed.rallies.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {feed.rallies.slice(0, 4).map((rally: any) => (
                      <RallyDiscoveryCard
                        key={rally._id}
                        rally={rally}
                        currentUserId={convexUserId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200/80">
                    <p className="text-sm font-semibold text-zinc-600">No active RALLYS right now</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Create a RALLY to get help or bring people together!</p>
                  </div>
                )}
              </DiscoverySection>

              {/* 4. VIDEOS YOU MIGHT LIKE */}
              <DiscoverySection
                title="Videos You Might Like"
                subtitle="Watch moments, highlights, and stories from creators"
                icon={Play}
                actionLabel="More videos"
                onAction={() => setActiveTab('videos')}
              >
                <VideoDiscoveryGrid videos={feed.videos} layout="carousel" />
              </DiscoverySection>

              {/* 5. DISCOVER INTERESTS */}
              <DiscoverySection
                title="Discover Interests"
                subtitle="Topics you can explore and connect around"
                icon={Tag}
              >
                <div className="flex flex-wrap gap-2">
                  {feed.popularInterests.map((item: any) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSelectInterest(item.label)}
                      className="px-4 py-2 rounded-2xl bg-white hover:bg-indigo-50 border border-zinc-200/80 hover:border-indigo-200 text-zinc-800 hover:text-indigo-700 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-2xs flex items-center gap-2 group"
                    >
                      <span>{item.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 group-hover:bg-indigo-100 text-[10px] text-zinc-500 group-hover:text-indigo-600 font-semibold">
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              </DiscoverySection>
            </div>
          ) : activeTab === 'trending' ? (
            /* ========================================================================= */
            /* TAB 2: TRENDING INSIDE LALAO                                              */
            /* ========================================================================= */
            <TrendingSection
              trendingTopics={feed.trendingTopics}
              trendingRallies={feed.trendingRallies}
              trendingPosts={feed.trendingPosts}
              trendingVideos={feed.trendingVideos}
              currentUserId={convexUserId}
              onSelectTopic={handleSelectTopic}
            />
          ) : activeTab === 'rallies' ? (
            /* ========================================================================= */
            /* TAB 3: DEDICATED RALLYS DISCOVERY                                         */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Filters Header */}
              <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pb-1">
                <div className="flex items-center gap-1.5 shrink-0">
                  {(['Nearby', 'Popular', 'Newest', 'Paid', 'Free'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setRallyFilter(filter)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap",
                        rallyFilter === filter
                          ? "bg-zinc-900 text-white shadow-xs"
                          : "bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-zinc-400 font-medium shrink-0">
                  {filteredRallies.length} active
                </span>
              </div>

              {filteredRallies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredRallies.map((rally: any) => (
                    <RallyDiscoveryCard
                      key={rally._id}
                      rally={rally}
                      currentUserId={convexUserId}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 text-zinc-500">
                  <HandMetal className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                  <p className="font-bold text-zinc-900 text-base mb-1">
                    No {rallyFilter} RALLYS found
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Try switching filters or be the first to create one!
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'videos' ? (
            /* ========================================================================= */
            /* TAB 4: DEDICATED VIDEOS DISCOVERY                                         */
            /* ========================================================================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-zinc-900">
                  Discover Videos
                </h3>
                <span className="text-xs text-zinc-400 font-medium">
                  {feed.videos.length} videos
                </span>
              </div>
              <VideoDiscoveryGrid videos={feed.videos} layout="grid" columns={3} />
            </div>
          ) : activeTab.startsWith('interest:') ? (
            /* ========================================================================= */
            /* TABS 5 & 6: PERSONALIZED INTEREST CHANNELS                                */
            /* ========================================================================= */
            <InterestChannel
              interest={activeTab.replace(/^interest:/, '')}
              posts={feed.posts}
              rallies={feed.rallies}
              videos={feed.videos}
              creators={feed.suggestedPeople}
              currentUserId={convexUserId}
            />
          ) : null}
        </div>

        {/* RIGHT DISCOVERY SIDEBAR (Desktop only) */}
        {!isLoading && (
          <div className="hidden lg:block">
            <ExploreRightSidebar
              suggestedPeople={feed.suggestedPeople}
              trendingTopics={feed.trendingTopics}
              popularInterests={feed.popularInterests}
              currentUserId={convexUserId}
              onSelectTopic={handleSelectTopic}
              onSelectInterest={handleSelectInterest}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Explore() {
  return (
    <QueryErrorBoundary message="Could not load Explore right now. Please try again.">
      <ExploreContent />
    </QueryErrorBoundary>
  );
}
