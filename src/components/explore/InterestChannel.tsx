import React, { useState, useMemo } from 'react';
import { Tag, Sparkles, MessageSquare, HandMetal, Play, Users } from 'lucide-react';
import RallyDiscoveryCard from './RallyDiscoveryCard';
import VideoDiscoveryGrid from './VideoDiscoveryGrid';
import SuggestedPeople from './SuggestedPeople';
import PostCard from '../PostCard';
import { cn } from '../../lib/utils';

interface InterestChannelProps {
  interest: string;
  posts: any[];
  rallies: any[];
  videos: any[];
  creators: any[];
  currentUserId: string | null;
}

type SubTab = 'all' | 'conversations' | 'rallies' | 'videos' | 'creators';

export default function InterestChannel({
  interest,
  posts,
  rallies,
  videos,
  creators,
  currentUserId,
}: InterestChannelProps) {
  const [subTab, setSubTab] = useState<SubTab>('all');

  const normalizedInterest = interest.toLowerCase().trim();

  // Filter content matching this interest
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchInterest = p.interest?.toLowerCase().trim() === normalizedInterest;
      const matchHash = p.hashtags?.some((h: string) => h.toLowerCase().includes(normalizedInterest));
      const matchText = p.title?.toLowerCase().includes(normalizedInterest) || p.description?.toLowerCase().includes(normalizedInterest);
      return matchInterest || matchHash || matchText;
    });
  }, [posts, normalizedInterest]);

  const filteredRallies = useMemo(() => {
    return rallies.filter((r) => {
      const matchInterest = r.interest?.toLowerCase().trim() === normalizedInterest;
      const matchCategory = r.category?.toLowerCase() === normalizedInterest;
      const matchHash = r.hashtags?.some((h: string) => h.toLowerCase().includes(normalizedInterest));
      const matchText = r.title?.toLowerCase().includes(normalizedInterest) || r.description?.toLowerCase().includes(normalizedInterest);
      return matchInterest || matchCategory || matchHash || matchText;
    });
  }, [rallies, normalizedInterest]);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchInterest = v.interest?.toLowerCase().trim() === normalizedInterest;
      const matchHash = v.hashtags?.some((h: string) => h.toLowerCase().includes(normalizedInterest));
      const matchText = v.title?.toLowerCase().includes(normalizedInterest);
      return matchInterest || matchHash || matchText;
    });
  }, [videos, normalizedInterest]);

  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      return (c.interests ?? []).some((i: string) => i.toLowerCase().includes(normalizedInterest));
    });
  }, [creators, normalizedInterest]);

  const displayTitle = interest.charAt(0).toUpperCase() + interest.slice(1);

  return (
    <div className="space-y-5">
      {/* Interest Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Personalized Discovery Channel</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            {displayTitle}
          </h2>

          <p className="text-xs sm:text-sm text-white/80 max-w-lg leading-relaxed">
            Discover community conversations, active RALLYS, videos, and creators around {displayTitle}.
          </p>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/15 text-xs text-white/90 font-semibold">
            <span>{filteredPosts.length} conversations</span>
            <span>·</span>
            <span>{filteredRallies.length} RALLYS</span>
            <span>·</span>
            <span>{filteredVideos.length} videos</span>
          </div>
        </div>
      </div>

      {/* Sub Filter Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'conversations', label: `Conversations (${filteredPosts.length})` },
          { key: 'rallies', label: `RALLYS (${filteredRallies.length})` },
          { key: 'videos', label: `Videos (${filteredVideos.length})` },
          { key: 'creators', label: `Creators (${filteredCreators.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key as SubTab)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap active:scale-95",
              subTab === tab.key
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* All View */}
      {subTab === 'all' && (
        <div className="space-y-6">
          {/* Creators Row */}
          {filteredCreators.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2.5 px-1">
                Creators into {displayTitle}
              </h3>
              <SuggestedPeople people={filteredCreators} currentUserId={currentUserId} layout="horizontal" />
            </div>
          )}

          {/* Videos Grid */}
          {filteredVideos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2.5 px-1">
                {displayTitle} Videos
              </h3>
              <VideoDiscoveryGrid videos={filteredVideos} layout="carousel" />
            </div>
          )}

          {/* RALLYS */}
          {filteredRallies.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2.5 px-1">
                Active RALLYS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredRallies.map((rally) => (
                  <RallyDiscoveryCard key={rally._id} rally={rally} currentUserId={currentUserId} />
                ))}
              </div>
            </div>
          )}

          {/* Conversations */}
          {filteredPosts.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2.5 px-1">
                Community Discussions
              </h3>
              <div className="space-y-3">
                {filteredPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            </div>
          )}

          {filteredPosts.length === 0 && filteredRallies.length === 0 && filteredVideos.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 text-zinc-500">
              <p className="font-bold text-zinc-900 text-base mb-1">
                Be the first to post about {displayTitle}!
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No one has created a RALLY or shared a post in this topic yet. Start the conversation!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Specific SubTab Views */}
      {subTab === 'conversations' && (
        <div className="space-y-3">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => <PostCard key={post._id} post={post} />)
          ) : (
            <p className="text-xs text-zinc-500 p-8 text-center">No discussions yet in {displayTitle}.</p>
          )}
        </div>
      )}

      {subTab === 'rallies' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredRallies.length > 0 ? (
            filteredRallies.map((rally) => (
              <RallyDiscoveryCard key={rally._id} rally={rally} currentUserId={currentUserId} />
            ))
          ) : (
            <p className="text-xs text-zinc-500 p-8 text-center col-span-2">No active RALLYS yet in {displayTitle}.</p>
          )}
        </div>
      )}

      {subTab === 'videos' && (
        <VideoDiscoveryGrid videos={filteredVideos} layout="grid" columns={3} />
      )}

      {subTab === 'creators' && (
        <div>
          {filteredCreators.length > 0 ? (
            <SuggestedPeople people={filteredCreators} currentUserId={currentUserId} layout="horizontal" />
          ) : (
            <p className="text-xs text-zinc-500 p-8 text-center">No creators tagged with {displayTitle} yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
