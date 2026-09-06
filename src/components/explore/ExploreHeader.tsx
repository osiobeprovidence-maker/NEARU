import React, { useState, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Users, MessageSquare, HandMetal, Play, Tag, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SearchCategory = 'all' | 'people' | 'rallies' | 'posts' | 'videos' | 'topics';

interface ExploreHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchCategory: SearchCategory;
  onCategoryChange: (cat: SearchCategory) => void;
  onOpenFilters?: () => void;
}

const SEARCH_PILLS: { key: SearchCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'people', label: 'People', icon: Users },
  { key: 'rallies', label: 'RALLYS', icon: HandMetal },
  { key: 'posts', label: 'Conversations', icon: MessageSquare },
  { key: 'videos', label: 'Videos', icon: Play },
  { key: 'topics', label: 'Topics', icon: Tag },
];

export default function ExploreHeader({
  searchQuery,
  onSearchChange,
  searchCategory,
  onCategoryChange,
  onOpenFilters,
}: ExploreHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full pt-3 sm:pt-4 pb-2">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "relative flex-1 flex items-center rounded-2xl bg-white border transition-all shadow-xs duration-200",
            isFocused
              ? "border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm shadow-indigo-100"
              : "border-zinc-200/90 hover:border-zinc-300"
          )}
        >
          <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-zinc-400">
            <Search className={cn("w-4.5 h-4.5 transition-colors", isFocused ? "text-indigo-600" : "text-zinc-400")} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search Lalao"
            className="w-full py-2.5 sm:py-3 pr-9 bg-transparent text-sm sm:text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors active:scale-95"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter / Settings Button (Desktop & Mobile) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setFilterMenuOpen((prev) => !prev)}
            className={cn(
              "p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex items-center justify-center active:scale-95",
              filterMenuOpen || searchCategory !== 'all'
                ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xs"
                : "bg-white border-zinc-200/90 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900"
            )}
            title="Search filters"
            aria-label="Filter search results"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>

          {/* Filter Dropdown Popover */}
          {filterMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-zinc-900/10 border border-zinc-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Filter Search By
              </div>
              <div className="space-y-1 mt-1">
                {SEARCH_PILLS.map((pill) => {
                  const Icon = pill.icon;
                  const isSelected = searchCategory === pill.key;
                  return (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={() => {
                        onCategoryChange(pill.key);
                        setFilterMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left",
                        isSelected
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-zinc-400")} />
                      <span>{pill.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Pills (Shown whenever search is active) */}
      {searchQuery.trim().length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5 pb-0.5">
          {SEARCH_PILLS.map((pill) => {
            const Icon = pill.icon;
            const isSelected = searchCategory === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => onCategoryChange(pill.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 whitespace-nowrap active:scale-95",
                  isSelected
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <Icon className={cn("w-3 h-3", isSelected ? "text-white" : "text-zinc-400")} />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
