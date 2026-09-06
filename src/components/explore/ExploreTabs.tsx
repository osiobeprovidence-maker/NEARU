import React, { useRef, useEffect } from 'react';
import { Compass, Flame, HandMetal, Play, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ExploreTabType = 'explore' | 'trending' | 'rallies' | 'videos' | string;

interface ExploreTabsProps {
  activeTab: ExploreTabType;
  onSelectTab: (tab: ExploreTabType) => void;
  personalizedInterests: string[];
}

interface TabDef {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isPersonalized?: boolean;
}

export default function ExploreTabs({
  activeTab,
  onSelectTab,
  personalizedInterests,
}: ExploreTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // First 4 permanent tabs
  const permanentTabs: TabDef[] = [
    { key: 'explore', label: 'Explore', icon: Compass },
    { key: 'trending', label: 'Trending', icon: Flame },
    { key: 'rallies', label: 'RALLYS', icon: HandMetal },
    { key: 'videos', label: 'Videos', icon: Play },
  ];

  // Dynamic 2 personalized interest tabs
  // Fallbacks if user hasn't selected 2 interests
  const fallbackInterests = ['Tech', 'Gaming', 'Music', 'Football', 'Food', 'Fashion'];
  const interest1 = personalizedInterests[0] || fallbackInterests[0];
  const interest2 = personalizedInterests[1] || fallbackInterests[1];

  const dynamicTabs: TabDef[] = [
    {
      key: `interest:${interest1.toLowerCase()}`,
      label: interest1.charAt(0).toUpperCase() + interest1.slice(1),
      isPersonalized: true,
      icon: Sparkles,
    },
    {
      key: `interest:${interest2.toLowerCase()}`,
      label: interest2.charAt(0).toUpperCase() + interest2.slice(1),
      isPersonalized: true,
      icon: Sparkles,
    },
  ];

  const allTabs = [...permanentTabs, ...dynamicTabs];

  // Auto-scroll active tab into view
  useEffect(() => {
    const activeEl = scrollRef.current?.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  return (
    <div className="w-full relative border-b border-zinc-200/80 bg-white/70 backdrop-blur-md sticky top-[53px] md:top-0 z-30">
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-2.5 px-0.5 sm:px-0 overscroll-x-contain"
      >
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              data-active={isActive ? "true" : "false"}
              onClick={() => onSelectTab(tab.key)}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 whitespace-nowrap active:scale-95 touch-manipulation select-none",
                isActive
                  ? "bg-zinc-900 text-white shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 bg-zinc-50/80 border border-zinc-200/60"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors",
                    isActive ? "text-white" : tab.isPersonalized ? "text-indigo-500" : "text-zinc-400"
                  )}
                />
              )}
              <span>{tab.label}</span>
              {tab.isPersonalized && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
