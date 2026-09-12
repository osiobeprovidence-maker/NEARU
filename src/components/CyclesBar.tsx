import React, { useState } from 'react';
import { Plus, Sparkles, Video, Image as ImageIcon, FileText } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import CycleViewer from './CycleViewer';
import CycleCreator from './CycleCreator';

export default function CyclesBar() {
  const { convexUserId, user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  // Queries for live cycles / stories from Convex backend
  // NOTE: both functions declare args:{} and resolve the caller from ctx.auth
  // internally — do NOT pass a userId arg or Convex's validator will throw.
  const myCyclesGroup = useQuery(
    api.cycles.getMyActiveCycles,
    convexUserId ? {} : 'skip'
  );

  const friendCyclesGroups = useQuery(
    api.cycles.getActiveFriendCycles,
    convexUserId ? {} : 'skip'
  );

  const hasMyActiveCycles = myCyclesGroup && myCyclesGroup.cycles && myCyclesGroup.cycles.length > 0;
  const myLatestCycle = hasMyActiveCycles ? myCyclesGroup.cycles[myCyclesGroup.cycles.length - 1] : null;

  return (
    <>
      <div className="w-full bg-white rounded-3xl border border-zinc-200/80 p-3 sm:p-4 mb-4 sm:mb-6 shadow-2xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Cycles & Stories
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowCreator(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Cycle</span>
          </button>
        </div>

        {/* Stories Horizontal Carousel */}
        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1 px-0.5 overscroll-x-contain">
          {/* 1. Add / View My Cycle Bubble */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer">
            <div className="relative" onClick={() => (hasMyActiveCycles ? setSelectedGroup(myCyclesGroup) : setShowCreator(true))}>
              <Avatar
                src={user?.avatar || (user as any)?.imageUrl}
                name={user?.name || 'My Story'}
                size="md"
                className={`ring-2 ${hasMyActiveCycles ? 'ring-indigo-600 ring-offset-2' : 'ring-zinc-200'}`}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreator(true);
                }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-90 border-2 border-white"
                title="Add Cycle"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
            <span className="text-[11px] font-bold text-zinc-800 truncate max-w-[64px] text-center">
              {hasMyActiveCycles ? 'Your Cycle' : 'Add Cycle'}
            </span>
          </div>

          {/* 2. Friend Cycles Bubbles */}
          {friendCyclesGroups && friendCyclesGroups.length > 0 ? (
            friendCyclesGroups.map((group: any) => (
              <div
                key={group.key || group.authorId}
                onClick={() => setSelectedGroup(group)}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 transition-transform group-hover:scale-105 active:scale-95 shadow-xs">
                  <Avatar
                    src={group.avatarUrl}
                    name={group.name}
                    size="md"
                    className="ring-2 ring-white"
                  />
                </div>
                <span className="text-[11px] font-bold text-zinc-700 group-hover:text-indigo-600 truncate max-w-[68px] text-center transition-colors">
                  {group.name?.split(' ')[0]}
                </span>
              </div>
            ))
          ) : (
            /* Sample Creator Stories placeholder when feed is quiet */
            [
              {
                id: 's1',
                name: 'Blessing',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              },
              {
                id: 's2',
                name: 'Emeka',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
              },
              {
                id: 's3',
                name: 'Kemi',
                avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
              },
            ].map((sample) => (
              <div
                key={sample.id}
                onClick={() => setShowCreator(true)}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer opacity-85 hover:opacity-100"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 transition-transform group-hover:scale-105 shadow-xs">
                  <Avatar src={sample.avatar} name={sample.name} size="md" className="ring-2 ring-white" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-600 truncate max-w-[64px] text-center">
                  {sample.name}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cycle Creator Modal */}
      {showCreator && (
        <CycleCreator isOpen={showCreator} onClose={() => setShowCreator(false)} />
      )}

      {/* Cycle Viewer Modal */}
      {selectedGroup && (
        <CycleViewer
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          cyclesGroup={selectedGroup}
        />
      )}
    </>
  );
}
