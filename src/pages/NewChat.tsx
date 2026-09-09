import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, Search, UserPlus } from 'lucide-react';
import Avatar from '../components/Avatar';
import { cn } from '../lib/utils';
import { ProfileVerificationCheck } from '../components/VerificationBadge';

export default function NewChat() {
  const navigate = useNavigate();
  const { convexUserId } = useAuth();
  const [search, setSearch] = useState('');

  const friends = useQuery(
    api.friends.listMyFriends,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const getOrOpenDirect = useMutation(api.messages.getOrOpenDirect);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartChat = async (friendId: string) => {
    if (!convexUserId || isStarting) return;
    setIsStarting(true);
    try {
      const convId = await getOrOpenDirect({
        userIdA: convexUserId as any,
        userIdB: friendId as any,
      });
      navigate(`/messages/${convId}`);
    } catch (error) {
      console.error('Error opening chat:', error);
      setIsStarting(false);
    }
  };

  const loading = friends === undefined;
  const q = search.trim().toLowerCase();
  
  const filteredFriends = q
    ? friends?.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.username.toLowerCase().includes(q)
      )
    : friends;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 safe-area-top">
        <div className="flex items-center px-2 py-3 min-h-[56px] relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/messages')}
            className="p-2 -ml-1 text-zinc-600 hover:text-zinc-900 transition-colors absolute left-2 z-10"
            aria-label="Back"
          >
            <ChevronLeft className="w-[26px] h-[26px]" strokeWidth={2.5} />
          </motion.button>
          
          <h1 className="flex-1 text-center text-lg font-extrabold text-zinc-900 tracking-tight">
            New Chat
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white z-20">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-100 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-white focus-within:shadow-sm">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="flex-1 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 outline-none font-medium"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => setSearch('')}
                className="text-xs font-semibold text-primary hover:text-primary-dark"
              >
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="px-4 space-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3.5 animate-pulse">
                <div className="w-[46px] h-[46px] rounded-full bg-zinc-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-24 bg-zinc-100 rounded-full" />
                  <div className="h-3 w-32 bg-zinc-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFriends && filteredFriends.length > 0 ? (
          <div className="pb-6">
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-4 md:px-6 mb-2">
              Friends
            </h2>
            {filteredFriends.map((friend, i) => (
              <React.Fragment key={friend._id}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStartChat(friend._id)}
                  disabled={isStarting}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 md:px-6 py-3 cursor-pointer transition-colors active:bg-zinc-50 text-left",
                    isStarting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Avatar
                    src={friend.avatar}
                    name={friend.name}
                    className="w-[46px] h-[46px] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[15px] font-bold text-zinc-900 truncate">
                        {friend.name}
                      </span>
                      <ProfileVerificationCheck user={friend} size="sm" />
                    </div>
                    <span className="text-[13px] text-zinc-500 font-medium truncate block">
                      @{friend.username}
                    </span>
                  </div>
                </motion.button>
                {i < filteredFriends.length - 1 && (
                  <div className="h-px bg-zinc-50 mx-4 md:mx-6" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <UserPlus className="w-9 h-9 text-indigo-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-2">
              {q ? `No friends match "${q}"` : 'No friends yet'}
            </h2>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6">
              {q ? 'Try a different search term.' : 'Add friends to start a conversation.'}
            </p>
            {!q && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/messages/add-friends')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add Friends
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
