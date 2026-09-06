import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, Hash, Tag, MessageSquare, HandMetal, Users } from 'lucide-react';
import RallyDiscoveryCard from './RallyDiscoveryCard';
import VideoDiscoveryGrid from './VideoDiscoveryGrid';
import PostCard from '../PostCard';
import { cn } from '../../lib/utils';

interface TrendingSectionProps {
  trendingTopics: { label: string; count: number; type: 'hashtag' | 'interest' }[];
  trendingRallies: any[];
  trendingPosts: any[];
  trendingVideos: any[];
  currentUserId: string | null;
  onSelectTopic?: (topic: string) => void;
}

export default function TrendingSection({
  trendingTopics,
  trendingRallies,
  trendingPosts,
  trendingVideos,
  currentUserId,
  onSelectTopic,
}: TrendingSectionProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Trending Around You Topics Card */}
      <div className="bg-gradient-to-br from-indigo-900/5 via-white to-amber-500/5 rounded-3xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              Trending around you
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              Popular topics, discussions, and activities on Lalao right now
            </p>
          </div>
        </div>

        {trendingTopics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {trendingTopics.slice(0, 6).map((topic, idx) => (
              <button
                key={topic.label}
                type="button"
                onClick={() => onSelectTopic && onSelectTopic(topic.label.replace(/^#/, ''))}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-zinc-200/70 hover:border-indigo-300 hover:shadow-xs text-left transition-all duration-150 group active:scale-98"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-black text-zinc-400 w-4 text-center">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                      {topic.label}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {topic.count} {topic.count === 1 ? 'activity' : 'activities'}
                    </p>
                  </div>
                </div>
                <div className="p-1.5 rounded-full text-zinc-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Trending topics will appear here as activity grows.</p>
        )}
      </div>

      {/* 2. Trending RALLYS */}
      {trendingRallies.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <HandMetal className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-black text-zinc-900 tracking-tight">
                Trending RALLYS
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              High engagement
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {trendingRallies.slice(0, 4).map((rally) => (
              <RallyDiscoveryCard
                key={rally._id}
                rally={rally}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Trending Videos */}
      {trendingVideos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-black text-zinc-900 tracking-tight">
                Trending Videos
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              Most watched
            </span>
          </div>

          <VideoDiscoveryGrid videos={trendingVideos.slice(0, 3)} layout="grid" columns={3} />
        </section>
      )}

      {/* 4. Trending Conversations */}
      {trendingPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-black text-zinc-900 tracking-tight">
                Active Conversations
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              Join the discussion
            </span>
          </div>

          <div className="space-y-3">
            {trendingPosts.slice(0, 4).map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
