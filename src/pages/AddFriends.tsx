import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ChevronLeft,
  Search,
  UserPlus,
  Users,
  Check,
  X,
  Share2,
  RefreshCw,
  Star
} from 'lucide-react';
import Avatar from '../components/Avatar';
import { cn } from '../lib/utils';
import { ProfileVerificationCheck } from '../components/VerificationBadge';

export default function AddFriends() {
  const navigate = useNavigate();
  const { convexUserId } = useAuth();

  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Optimistic tracking states to hide things instantly
  const [acceptedRequestIds, setAcceptedRequestIds] = useState<Set<string>>(new Set());
  const [declinedRequestIds, setDeclinedRequestIds] = useState<Set<string>>(new Set());
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());

  // Data Queries
  const incomingRequests = useQuery(
    api.chatRequests.listByUser,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const recommendations = useQuery(
    api.friends.getFriendRecommendations,
    convexUserId ? { userId: convexUserId as any, limit: 30 } : 'skip'
  );

  // Mutations
  const acceptRequest = useMutation(api.chatRequests.accept);
  const declineRequest = useMutation(api.chatRequests.decline);
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);

  // Filter pending incoming requests
  const pendingRequests = (incomingRequests ?? []).filter(
    (req: any) =>
      req.status === 'PENDING' &&
      !acceptedRequestIds.has(req._id) &&
      !declinedRequestIds.has(req._id)
  );

  const handleAccept = async (requestId: string) => {
    if (!convexUserId || processingId) return;
    setProcessingId(requestId);
    setAcceptedRequestIds((prev) => new Set([...prev, requestId]));
    try {
      await acceptRequest({
        requestId: requestId as any,
        userId: convexUserId as any,
      });
    } catch (err) {
      console.error('Failed to accept request:', err);
      setAcceptedRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!convexUserId || processingId) return;
    setProcessingId(requestId);
    setDeclinedRequestIds((prev) => new Set([...prev, requestId]));
    try {
      await declineRequest({
        requestId: requestId as any,
        userId: convexUserId as any,
      });
    } catch (err) {
      console.error('Failed to decline request:', err);
      setDeclinedRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!convexUserId || processingId) return;
    setProcessingId(targetUserId);
    setSentRequestIds((prev) => new Set([...prev, targetUserId]));
    try {
      await sendFriendRequest({
        fromUserId: convexUserId as any,
        toUserId: targetUserId as any,
      });
    } catch (err) {
      console.error('Failed to send friend request:', err);
      setSentRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleShareInvite = () => {
    navigate('/messages/invite');
  };

  // Safe recommendations (filter out searched/friends/sent)
  let displayRecommendations = (recommendations || []).filter((user: any) => !user.isFriend && !sentRequestIds.has(user._id) && !user.isPendingOutgoing);

  const q = search.trim().toLowerCase();
  if (q) {
    displayRecommendations = displayRecommendations.filter((u: any) =>
      u.name.toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q)
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative max-w-2xl mx-auto w-full md:border-x md:border-zinc-100 shadow-sm md:shadow-none min-h-[100dvh]">
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
            Add friends
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* Search */}
        <div className="px-4 py-3 bg-white">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-100 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-white focus-within:shadow-sm">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
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

        {/* Invite Your Friends */}
        <div className="px-4 mb-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleShareInvite}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-sm transition-colors"
          >
            Invite your friends!
          </motion.button>
        </div>

        {/* Added Me */}
        {!q && (
          <div className="mb-2">
            <div className="flex items-center gap-2 px-4 py-2">
              <h2 className="text-sm font-extrabold text-zinc-900">
                Added Me
              </h2>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md">
                  {pendingRequests.length} New
                </span>
              )}
            </div>

            {incomingRequests === undefined ? (
              <div className="px-4 space-y-3 pt-1">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-[46px] h-[46px] rounded-full bg-zinc-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-24 bg-zinc-100 rounded-full" />
                      <div className="h-3 w-32 bg-zinc-100 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="px-4 py-4 text-center border-b border-zinc-100">
                <p className="text-sm text-zinc-500 font-medium">No new requests yet.</p>
              </div>
            ) : (
              <div className="border-t border-b border-zinc-100 bg-white">
                {pendingRequests.map((req: any, i: number) => {
                  const sender = req.sender;
                  if (!sender) return null;
                  const isBusy = processingId === req._id;

                  return (
                    <React.Fragment key={req._id}>
                      <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
                        <div
                          onClick={() => navigate(`/user/${sender._id}`)}
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        >
                          <Avatar
                            src={sender.avatar}
                            name={sender.name}
                            className="w-[46px] h-[46px] shrink-0 border border-zinc-200"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-[15px] font-bold text-zinc-900 truncate">
                                {sender.name}
                              </span>
                              <ProfileVerificationCheck user={sender} size="sm" />
                            </div>
                            <span className="text-[13px] text-zinc-500 font-medium truncate block mt-0.5">
                              {req.message && req.message !== 'Friend request' 
                                ? req.message 
                                : 'Say hi!'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleAccept(req._id)}
                            disabled={isBusy}
                            className="w-[40px] h-[34px] rounded-full bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 flex items-center justify-center transition-colors disabled:opacity-50"
                            aria-label="Accept"
                          >
                            {isBusy ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-zinc-500" />
                            ) : (
                              <Check className="w-5 h-5" strokeWidth={2.5} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDecline(req._id)}
                            disabled={isBusy}
                            className="w-[40px] h-[34px] rounded-full bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-500 flex items-center justify-center transition-colors disabled:opacity-50"
                            aria-label="Decline"
                          >
                            <X className="w-5 h-5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                      {i < pendingRequests.length - 1 && (
                        <div className="h-px bg-zinc-100 mx-4" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Find Friends */}
        <div>
          <div className="flex items-center justify-between px-4 py-2 mt-2">
            <h2 className="text-sm font-extrabold text-zinc-900">
              Find friends
            </h2>
            {!q && (
              <span className="text-xs font-bold text-zinc-400">
                See all
              </span>
            )}
          </div>

          {recommendations === undefined ? (
            <div className="px-4 space-y-3 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-[46px] h-[46px] rounded-full bg-zinc-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-24 bg-zinc-100 rounded-full" />
                    <div className="h-3 w-32 bg-zinc-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayRecommendations.length === 0 ? (
            <div className="px-4 py-8 text-center border-t border-zinc-100">
              <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-sm font-bold text-zinc-800">
                {q ? 'No people found.' : 'No recommendations yet.'}
              </p>
            </div>
          ) : (
            <div className="border-t border-b border-zinc-100 bg-white">
              {displayRecommendations.map((user: any, i: number) => {
                const isBusy = processingId === user._id;
                const isSentLocal = sentRequestIds.has(user._id);
                // In convex request, sometimes the recommendation includes isPendingOutgoing
                const isRequested = isSentLocal || user.isPendingOutgoing;

                return (
                  <React.Fragment key={user._id}>
                    <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
                      <div
                        onClick={() => navigate(`/user/${user._id}`)}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <Avatar
                          src={user.avatar}
                          name={user.name}
                          className="w-[46px] h-[46px] shrink-0 border border-zinc-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[15px] font-bold text-zinc-900 truncate">
                              {user.name}
                            </span>
                            <ProfileVerificationCheck user={user} size="sm" />
                          </div>
                          <span className="text-[11px] font-bold text-zinc-400 tracking-wide uppercase truncate block mt-0.5">
                            {user.mutualCount > 0 
                              ? `${user.mutualCount}+ MUTUALS`
                              : 'NEW CONTACT'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isRequested ? (
                          <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-500 text-[13px] font-bold min-w-[70px] text-center inline-block">
                            Requested
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(user._id)}
                            disabled={isBusy}
                            className="px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                          >
                            {isBusy ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-zinc-500" />
                            ) : (
                              'Add'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {i < displayRecommendations.length - 1 && (
                      <div className="h-px bg-zinc-100 mx-4" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
