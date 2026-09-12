import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Users,
  MessageCircle,
  ChevronRight,
  RefreshCw,
  Mic,
  Image as ImageIcon,
  CheckCheck,
  Send,
  UserPlus,
  SquarePen,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import BrandLogo from '../components/BrandLogo';
import { ProfileVerificationCheck } from '../components/VerificationBadge';
import { cn } from '../lib/utils';
import CycleCreator from '../components/CycleCreator';
import CycleViewer from '../components/CycleViewer';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ConversationItem = {
  key: string;
  kind: 'conversation' | 'incoming_request' | 'outgoing_request';
  timestamp: number;
  title: string;
  subtitle: string;
  subtitleKind: 'text' | 'voice' | 'image' | 'cycle' | 'request' | 'pending';
  avatar?: string;
  avatarName: string;
  unread: number;
  isRally?: boolean;
  isMe?: boolean;
  isNINVerified?: boolean;
  isBlueVerified?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
  badges?: string[];
  navigateTo: () => void;
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatTime(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function detectSubtitleKind(text: string): 'voice' | 'image' | 'cycle' | 'text' {
  if (text.toLowerCase().includes('voice note')) return 'voice';
  if (text.toLowerCase().includes('photo') || text.toLowerCase().includes('image')) return 'image';
  if (text.toLowerCase().includes('cycle')) return 'cycle';
  return 'text';
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SubtitleIcon({ kind, isMe }: { kind: string; isMe?: boolean }) {
  if (kind === 'voice') return <Mic className="w-3.5 h-3.5 shrink-0 text-primary" />;
  if (kind === 'image') return <ImageIcon className="w-3.5 h-3.5 shrink-0 text-primary" />;
  if (kind === 'cycle') return <RefreshCw className="w-3.5 h-3.5 shrink-0 text-primary" />;
  if (isMe) return <CheckCheck className="w-3.5 h-3.5 shrink-0 text-primary" />;
  return null;
}

function CycleAvatar({
  avatar, name, hasNew, isMe, isCreateAction, onClick,
}: {
  avatar?: string; name: string; hasNew: boolean; isMe?: boolean; isCreateAction?: boolean; onClick?: () => void;
}) {
  if (isCreateAction) {
    return (
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] cursor-pointer"
        type="button"
      >
        <div className="w-[58px] h-[58px] rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center">
          <Plus className="w-5 h-5 text-zinc-400" />
        </div>
        <span className="text-[11px] font-semibold text-zinc-500 text-center leading-tight">
          Create Cycle
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] cursor-pointer"
      type="button"
    >
      <div className={cn(
        'w-[58px] h-[58px] rounded-full p-[2.5px]',
        hasNew ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500' : 'bg-zinc-200'
      )}>
        <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px] relative">
          <Avatar src={avatar} name={name} className="w-full h-full" />
        </div>
      </div>
      <span className="text-[11px] font-semibold text-zinc-700 truncate w-full text-center leading-tight">
        {isMe ? 'Your Cycle' : name.split(' ')[0]}
      </span>
    </motion.button>
  );
}

function ConversationRow({ item }: { item: ConversationItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={item.navigateTo}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') item.navigateTo(); }}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors active:bg-zinc-100 group',
        item.unread > 0 ? 'bg-primary' : 'bg-white'
      )}
    >
      <div className="relative shrink-0">
        {item.isRally ? (
          <div className="w-[54px] h-[54px] rounded-2xl bg-primary-light/50 border border-primary-light flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
        ) : (
          <div className={cn(
            'w-[54px] h-[54px] rounded-full p-[2.5px]',
            item.unread > 0 ? 'bg-gradient-to-tr from-primary to-primary-light' : 'bg-transparent'
          )}>
            <div className="w-full h-full rounded-full overflow-hidden bg-white p-[1.5px]">
              <Avatar src={item.avatar} name={item.avatarName} className="w-full h-full" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span className={cn(
            'truncate text-[15px] leading-snug',
            item.unread > 0 ? 'font-extrabold text-zinc-950' : 'font-semibold text-zinc-900'
          )}>
            {item.title}
          </span>
          {!item.isRally && <ProfileVerificationCheck user={item} size="sm" />}
          {item.isRally && <MessageCircle className="w-3.5 h-3.5 text-primary shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5">
          <SubtitleIcon kind={item.subtitleKind} isMe={item.isMe} />
          <span className={cn(
            'truncate text-[13px] leading-normal',
            item.unread > 0 ? 'text-zinc-800 font-semibold'
              : item.kind === 'outgoing_request' ? 'text-zinc-400 font-medium italic'
              : 'text-zinc-500 font-normal'
          )}>
            {item.kind === 'outgoing_request'
              ? `Waiting for ${item.title.split(' ')[0]} to reply`
              : item.subtitle || 'Say hello!'}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={cn('text-[11px] font-medium', item.unread > 0 ? 'text-primary' : 'text-zinc-400')}>
          {formatTime(item.timestamp)}
        </span>
        {item.kind === 'incoming_request' ? (
          <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black">New</span>
        ) : item.unread > 0 ? (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
            {item.unread > 99 ? '99+' : item.unread}
          </span>
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-400 transition-colors" />
        )}
      </div>
    </motion.div>
  );
}



// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Messages() {
  const navigate = useNavigate();
  const { convexUserId, user } = useAuth();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Real Convex data â€” no mocks
  const conversations = useQuery(
    api.messages.listConversationsWithParticipants,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );


  const activeFriendCycles = useQuery(
    api.cycles.getActiveFriendCycles,
    convexUserId ? {} : 'skip'
  );

  const myActiveCycles = useQuery(
    api.cycles.getMyActiveCycles,
    convexUserId ? {} : 'skip'
  );

  const pendingIncomingCount = useQuery(
    api.chatRequests.getPendingIncomingCount,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  ) ?? 0;

  const [isCycleCreatorOpen, setIsCycleCreatorOpen] = useState(false);
  const [selectedCycleGroup, setSelectedCycleGroup] = useState<any>(null);

  // Synchronize the selected cycle group with live data from Convex
  // so that if a cycle is deleted, the viewer instantly updates or closes.
  React.useEffect(() => {
    if (selectedCycleGroup) {
      const allLiveGroups = [
        ...(myActiveCycles ? [myActiveCycles] : []),
        ...(activeFriendCycles || [])
      ];
      const liveGroup = allLiveGroups.find(g => g.key === selectedCycleGroup.key);
      if (liveGroup) {
        setSelectedCycleGroup(liveGroup);
      } else {
        setSelectedCycleGroup(null);
      }
    }
  }, [myActiveCycles, activeFriendCycles]);

  const loading = conversations === undefined || activeFriendCycles === undefined || myActiveCycles === undefined;

  const buildItems = (): ConversationItem[] => {
    const items: ConversationItem[] = [];
    (conversations ?? []).forEach((conv: any) => {
      const isRally = conv.isDirect === false || conv.type === 'rally';
      const title = isRally ? conv.rallyTitle || 'RALLY chat' : conv.otherParticipant?.name || 'Chat';
      const last = conv.lastMessage;
      const isMe = last?.senderId === convexUserId;
      const rawSub = isMe ? `You: ${last?.text ?? ''}` : (last?.text ?? '');
      items.push({
        key: `c-${conv._id}`,
        kind: 'conversation',
        timestamp: last?.timestamp ?? 0,
        title,
        subtitle: rawSub,
        subtitleKind: detectSubtitleKind(rawSub),
        avatar: isRally ? undefined : conv.otherParticipant?.avatar,
        avatarName: isRally ? title : conv.otherParticipant?.name || 'User',
        unread: conv.myUnread ?? 0,
        isRally,
        isMe,
        isNINVerified: conv.otherParticipant?.isNINVerified,
        isBlueVerified: conv.otherParticipant?.isBlueVerified,
        isVerified: conv.otherParticipant?.isVerified,
        verificationStatus: conv.otherParticipant?.verificationStatus,
        badges: conv.otherParticipant?.badges,
        navigateTo: () => navigate(`/messages/${conv._id}`),
      });
    });
    return items.sort((a, b) => b.timestamp - a.timestamp);
  };

  const allConversations = loading ? [] : buildItems();
  const q = search.trim().toLowerCase();
  
  // Filter out the 'feeling like' / 'RALLY chat started' item
  let validConversations = allConversations.filter(c => !(c.title === 'feeling like' || c.subtitle === 'RALLY chat started'));
    
  const filteredConversations = q ? validConversations.filter((i) => i.title.toLowerCase().includes(q)) : validConversations;

  const cycleParticipants: any[] = [];
  
  // Always add Create Cycle first
  cycleParticipants.push({
    key: 'create-cycle',
    name: 'Create Cycle',
    isCreateAction: true,
  });

  if (myActiveCycles && myActiveCycles.cycles && myActiveCycles.cycles.length > 0) {
    let previewAvatar = myActiveCycles.avatarUrl;
    const latestCycle = myActiveCycles.cycles[myActiveCycles.cycles.length - 1];
    if (latestCycle?.mediaUrl) {
      previewAvatar = latestCycle.mediaUrl;
    }
    
    cycleParticipants.push({
      key: myActiveCycles.key,
      name: 'Your Cycle',
      avatar: previewAvatar,
      hasNew: myActiveCycles.hasUnseen,
      isMe: true,
      cyclesGroup: myActiveCycles,
    });
  }

  if (activeFriendCycles) {
    activeFriendCycles.forEach(group => {
      cycleParticipants.push({
        key: group.key,
        name: group.name,
        avatar: group.avatarUrl,
        hasNew: group.hasUnseen,
        isMe: false,
        cyclesGroup: group,
      });
    });
  }

  const totalUnread = allConversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="flex flex-col min-h-full bg-white">

      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 safe-area-top md:hidden">
        <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            Messages
          </h1>
          <div className="flex items-center gap-0.5 shrink-0">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/messages/add-friends')}
              className="relative p-2 rounded-full text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 transition-colors" aria-label="Add Friends">
              <UserPlus className="w-[22px] h-[22px]" />
              {pendingIncomingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                  {pendingIncomingCount > 99 ? '99+' : pendingIncomingCount}
                </span>
              )}
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/messages/new')}
              className="p-2 rounded-full text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 transition-colors" aria-label="New Chat">
              <SquarePen className="w-[22px] h-[22px]" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 pt-8 pb-2">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 flex items-center gap-2">
          Messages
          {totalUnread > 0 && <span className="text-base font-black text-indigo-600">{totalUnread}</span>}
        </h1>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => navigate('/messages/add-friends')}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 shadow-sm transition-all" aria-label="Add Friends">
            <UserPlus className="w-5 h-5" />
            {pendingIncomingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                {pendingIncomingCount > 99 ? '99+' : pendingIncomingCount}
              </span>
            )}
          </motion.button>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => navigate('/messages/new')}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm transition-all" aria-label="New Chat">
            <SquarePen className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-100 rounded-2xl transition-all
          focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-white focus-within:shadow-sm cursor-text"
          onClick={() => searchRef.current?.focus()}>
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={searchRef}
            id="messages-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 outline-none font-medium"
          />
          <AnimatePresence>
            {search && (
              <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => setSearch('')} className="text-xs font-semibold text-primary hover:text-primary-dark">
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cycle Strip */}
      {!q && (
        <div className="mb-1">
          <div className="flex items-center justify-between px-4 md:px-6 mb-2.5">
            <span className="text-sm font-extrabold text-zinc-900 tracking-tight">Cycles</span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2 px-4 md:px-6 pb-3">
              {cycleParticipants.map((p) => (
                <CycleAvatar
                  key={p.key}
                  avatar={p.avatar}
                  name={p.name as string}
                  hasNew={p.hasNew as boolean}
                  isMe={p.isMe}
                  isCreateAction={p.isCreateAction}
                  onClick={() => {
                    if (p.isCreateAction) {
                      setIsCycleCreatorOpen(true);
                    } else if (p.isMe) {
                      // Open viewer for own cycle
                      setSelectedCycleGroup(p.cyclesGroup);
                    } else {
                      setSelectedCycleGroup(p.cyclesGroup);
                    }
                  }}
                />
              ))}
              {/* Removed redundant friend discovery button */}
            </div>
          </div>
          <div className="h-px bg-zinc-100" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredConversations.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Send className="w-9 h-9 text-indigo-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-2">
            {q ? `No results for "${q}"` : 'No messages yet'}
          </h2>
          <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6">
            {q ? 'Try a different name.' : 'Start a new conversation with a friend.'}
          </p>
          {!q && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/messages/new')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-sm transition-all">
              <SquarePen className="w-4 h-4" />
              New Chat
            </motion.button>
          )}
        </div>
      )}

      {/* Conversations */}
      {!loading && filteredConversations.length > 0 && (
        <div>
          <h2 className="text-sm font-extrabold text-zinc-900 px-4 md:px-6 mt-2 mb-2 tracking-tight">Chats</h2>
          {filteredConversations.map((item, i) => (
            <React.Fragment key={item.key}>
              <ConversationRow item={item} />
              {i < filteredConversations.length - 1 && <div className="h-px bg-zinc-50 mx-4" />}
            </React.Fragment>
          ))}
        </div>
      )}



      <div className="h-6 shrink-0" />
      <CycleCreator isOpen={isCycleCreatorOpen} onClose={() => setIsCycleCreatorOpen(false)} />
      <CycleViewer isOpen={!!selectedCycleGroup} onClose={() => setSelectedCycleGroup(null)} cyclesGroup={selectedCycleGroup} />
    </div>
  );
}


