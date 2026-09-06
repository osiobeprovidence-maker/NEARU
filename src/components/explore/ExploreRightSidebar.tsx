import React from 'react';
import { Users, Flame, Tag, Sparkles, TrendingUp } from 'lucide-react';
import SuggestedPeople, { SuggestedPerson } from './SuggestedPeople';
import { Link } from 'react-router-dom';

interface ExploreRightSidebarProps {
  suggestedPeople: SuggestedPerson[];
  trendingTopics: { label: string; count: number; type: 'hashtag' | 'interest' }[];
  popularInterests: { label: string; count: number }[];
  currentUserId: string | null;
  onSelectTopic?: (topic: string) => void;
  onSelectInterest?: (interest: string) => void;
}

export default function ExploreRightSidebar({
  suggestedPeople,
  trendingTopics,
  popularInterests,
  currentUserId,
  onSelectTopic,
  onSelectInterest,
}: ExploreRightSidebarProps) {
  return (
    <aside className="w-80 shrink-0 space-y-5">
      {/* 1. People to Follow Card */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-zinc-900 tracking-tight">
              People to follow
            </h3>
          </div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Suggested
          </span>
        </div>

        <SuggestedPeople
          people={suggestedPeople}
          currentUserId={currentUserId}
          layout="sidebar"
        />
      </div>

      {/* 2. Trending Nearby Card */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="text-sm font-black text-zinc-900 tracking-tight">
              Trending nearby
            </h3>
          </div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Active
          </span>
        </div>

        {trendingTopics.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {trendingTopics.slice(0, 5).map((t, idx) => (
              <button
                key={t.label}
                type="button"
                onClick={() => onSelectTopic && onSelectTopic(t.label.replace(/^#/, ''))}
                className="w-full py-2.5 flex items-center justify-between gap-2 text-left group hover:bg-zinc-50/70 rounded-xl px-1 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                    {t.label}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {t.count} {t.count === 1 ? 'activity' : 'activities'}
                  </p>
                </div>
                <div className="text-zinc-300 group-hover:text-indigo-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 py-3 text-center">No trending topics yet</p>
        )}
      </div>

      {/* 3. Popular Interests Card */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-zinc-900 tracking-tight">
              Popular interests
            </h3>
          </div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Explore
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {popularInterests.slice(0, 8).map((interest) => (
            <button
              key={interest.label}
              type="button"
              onClick={() => onSelectInterest && onSelectInterest(interest.label)}
              className="px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-indigo-50 border border-zinc-200/70 hover:border-indigo-200 text-zinc-700 hover:text-indigo-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>{interest.label}</span>
              <span className="text-[10px] text-zinc-400 font-normal">
                {interest.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
