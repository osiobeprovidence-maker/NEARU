import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MoreHorizontal, Heart, Eye, Trash2, Send, Play, Pause, Volume2, VolumeX, EyeOff, Flag, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import Avatar from './Avatar';
import { cn } from '../lib/utils';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CycleViewerProps {
  isOpen: boolean;
  onClose: () => void;
  allGroups: any[];
  initialGroupId: string;
}

export default function CycleViewer({ isOpen, onClose, allGroups, initialGroupId }: CycleViewerProps) {
  const { convexUserId } = useAuth();
  const navigate = useNavigate();

  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0); 
  
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState<'likes' | 'views' | null>(null);

  const [replyText, setReplyText] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  const markViewed = useMutation(api.cycles.markCycleViewed);
  const likeCycle = useMutation(api.cycles.likeCycle);
  const unlikeCycle = useMutation(api.cycles.unlikeCycle);
  const deleteCycle = useMutation(api.cycles.deleteCycle);
  const addCommentMutation = useMutation(api.cycles.addComment);

  const [imgError, setImgError] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [activeGroupIndex, currentIndex]);

  const CYCLE_DURATION_MS = 5000;

  useEffect(() => {
    if (isOpen && allGroups.length > 0) {
      const idx = allGroups.findIndex(g => (g.key || g.authorId) === initialGroupId);
      setActiveGroupIndex(idx >= 0 ? idx : 0);
      setCurrentIndex(0);
      setProgress(0);
      setIsPaused(false);
      setShowMenu(false);
      setShowDeleteConfirm(false);
      setShowEngagementModal(null);
      setShowCommentsModal(false);
      setReplyText('');
    }
  }, [isOpen, initialGroupId, allGroups]);

  const activeGroup = allGroups[activeGroupIndex];
  const currentCycle = activeGroup?.cycles?.[currentIndex];

  const engagement = useQuery(
    api.cycles.getCycleEngagement,
    isOpen && currentCycle ? { cycleId: currentCycle._id as Id<"cycles"> } : 'skip'
  );

  const cycleComments = useQuery(
    api.cycles.getComments,
    showCommentsModal && currentCycle ? { cycleId: currentCycle._id as Id<"cycles"> } : 'skip'
  );

  const handleNextGroup = useCallback(() => {
    if (activeGroupIndex < allGroups.length - 1) {
      setActiveGroupIndex(prev => prev + 1);
      setCurrentIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [activeGroupIndex, allGroups.length, onClose]);

  const handlePrevGroup = useCallback(() => {
    if (activeGroupIndex > 0) {
      setActiveGroupIndex(prev => prev - 1);
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [activeGroupIndex]);

  const handleNextCycle = useCallback(() => {
    if (!activeGroup) return;
    if (currentIndex < activeGroup.cycles.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      handleNextGroup();
    }
  }, [activeGroup, currentIndex, handleNextGroup]);

  const handlePrevCycle = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      handlePrevGroup();
    }
  }, [currentIndex, handlePrevGroup]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') {
        handleNextCycle();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCycle();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNextCycle, handlePrevCycle, onClose]);

  useEffect(() => {
    if (!isOpen || !activeGroup || activeGroup.cycles.length === 0 || !currentCycle) return;
    
    document.body.style.overflow = 'hidden';

    if (isPaused || showMenu || showDeleteConfirm || showEngagementModal || showCommentsModal || replyText.length > 0) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      return () => { document.body.style.overflow = 'auto'; };
    } else {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }

    markViewed({ cycleId: currentCycle._id as Id<"cycles"> }).catch(console.error);

    let animationFrame: number;
    let startTime: number | null = null;
    let expectedDuration = CYCLE_DURATION_MS;
    const isVideo = currentCycle.contentType === 'video';

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;

      if (isVideo && videoRef.current) {
        expectedDuration = (videoRef.current.duration || 5) * 1000;
        const currentProg = (videoRef.current.currentTime / (videoRef.current.duration || 5)) * 100;
        setProgress(currentProg);
        
        if (videoRef.current.ended) {
          handleNextCycle();
          return;
        }
      } else {
        const elapsed = timestamp - startTime;
        const currentProg = (elapsed / expectedDuration) * 100;
        setProgress(Math.min(currentProg, 100));

        if (elapsed >= expectedDuration) {
          handleNextCycle();
          return;
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.body.style.overflow = 'auto';
    };
  }, [currentIndex, activeGroupIndex, isPaused, showMenu, showDeleteConfirm, showEngagementModal, showCommentsModal, isOpen, activeGroup, currentCycle, replyText, handleNextCycle]);

  const handleDelete = async () => {
    if (!currentCycle) return;
    try {
      await deleteCycle({ cycleId: currentCycle._id as Id<"cycles"> });
      if (activeGroup && activeGroup.cycles.length > 1) {
         if (currentIndex === activeGroup.cycles.length - 1) {
             handlePrevCycle();
         } else {
             handleNextCycle();
         }
      } else {
         onClose(); // In a real app we'd refresh groups, but closing is safe.
      }
    } catch (e) {
      console.error("Failed to delete cycle", e);
    } finally {
      setShowDeleteConfirm(false);
      setShowMenu(false);
    }
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCycle) return;
    if (engagement?.likedByMe) {
      unlikeCycle({ cycleId: currentCycle._id as Id<"cycles"> });
    } else {
      likeCycle({ cycleId: currentCycle._id as Id<"cycles"> });
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !currentCycle) return;
    try {
      setIsSubmittingComment(true);
      await addCommentMutation({
        cycleId: currentCycle._id as Id<"cycles">,
        text: replyText
      });
      setReplyText('');
    } catch (error) {
      console.error("Failed to post comment:", error);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: "Failed to post comment", type: "error" } 
      }));
    } finally {
      setIsSubmittingComment(false);
      setIsPaused(false);
    }
  };

  if (!isOpen || !activeGroup || !currentCycle) return null;

  const isOwner = convexUserId && (currentCycle.authorId === convexUserId || currentCycle.pageId === convexUserId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl text-white flex items-center justify-center overflow-hidden"
      >
        <div className="w-full h-full max-w-7xl mx-auto flex flex-row items-center justify-center sm:gap-4 md:gap-8 lg:gap-12 relative p-0 sm:p-4">
          
          {/* Close button top right desktop */}
          <button onClick={onClose} className="hidden sm:flex absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50">
            <X className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>

          {/* Left Previews (Desktop) */}
          <div className="hidden md:flex flex-col items-end justify-center w-[200px] lg:w-[250px] gap-4">
            {allGroups.slice(Math.max(0, activeGroupIndex - 3), activeGroupIndex).map((group, idx) => (
              <div 
                key={group.key || group.authorId} 
                onClick={() => { setActiveGroupIndex(activeGroupIndex - (activeGroupIndex - Math.max(0, activeGroupIndex - 3)) + idx); setCurrentIndex(0); }}
                className="flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors opacity-60 hover:opacity-100"
              >
                <div className="flex-1 text-right">
                  <p className="font-bold text-sm text-white truncate">{group.name}</p>
                  <p className="text-xs text-zinc-400">View cycle</p>
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-indigo-500/50">
                  <img src={group.avatarUrl || `https://ui-avatars.com/api/?name=${group.name}`} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>

          {/* Center Main Viewer */}
          <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-[2rem] bg-zinc-900 overflow-hidden flex flex-col shadow-2xl shrink-0">
            
            {/* Progress Bars */}
            <div className="absolute top-0 inset-x-0 pt-safe-top z-30 flex gap-1 px-3 py-3 bg-gradient-to-b from-black/60 to-transparent">
              {activeGroup.cycles.map((c: any, i: number) => (
                <div key={c._id} className="h-0.5 sm:h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all ease-linear"
                    style={{
                      width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header Controls */}
            <div className="absolute top-0 inset-x-0 pt-safe-top mt-5 px-4 flex items-center justify-between z-30 pointer-events-auto">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => { onClose(); navigate(`/user/${activeGroup.authorId}`); }}
              >
                <Avatar src={activeGroup.avatarUrl} name={activeGroup.name} size="sm" className="border border-white/20" />
                <div>
                  <p className="font-bold text-[15px] leading-tight drop-shadow-md hover:underline">{activeGroup.name}</p>
                  <p className="text-[13px] font-medium text-white/80 drop-shadow-md">
                    {new Date(currentCycle.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
                  className="p-1.5 rounded-full hover:bg-black/40 transition-colors"
                >
                  {isPaused ? <Play className="w-5 h-5 text-white" /> : <Pause className="w-5 h-5 text-white" />}
                </button>
                {currentCycle.contentType === 'video' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="p-1.5 rounded-full hover:bg-black/40 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(true); setIsPaused(true); }}
                  className="p-1.5 rounded-full hover:bg-black/40 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </button>
                {/* Mobile Close Button inside viewer */}
                <button onClick={onClose} className="p-1.5 sm:hidden rounded-full hover:bg-black/40 transition-colors">
                  <X className="w-6 h-6 text-white" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div 
              className="flex-1 relative w-full h-full flex items-center justify-center bg-zinc-950 cursor-pointer"
              onClick={() => setIsPaused(!isPaused)}
            >
              {/* Tap Zones for Nav */}
              {!showMenu && !showDeleteConfirm && !showEngagementModal && !showCommentsModal && (
                <>
                  <div className="absolute inset-y-0 left-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); handlePrevCycle(); }} />
                  <div className="absolute inset-y-0 right-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); handleNextCycle(); }} />
                </>
              )}

              {currentCycle.contentType === 'text' && (
                <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-primary">
                  <p className="text-[28px] sm:text-3xl font-bold text-center text-white drop-shadow-lg leading-tight max-w-[90%] break-words">
                    {currentCycle.text}
                  </p>
                </div>
              )}

              {currentCycle.contentType === 'image' && currentCycle.mediaUrl && !imgError && (
                <img 
                  src={currentCycle.mediaUrl} 
                  alt="Cycle" 
                  className="w-full h-full object-contain"
                  draggable={false}
                  onError={() => setImgError(true)}
                />
              )}

              {currentCycle.contentType === 'image' && (!currentCycle.mediaUrl || imgError) && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-900">
                  <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
                  <p className="text-zinc-500 font-medium text-center">Media unavailable</p>
                </div>
              )}

              {currentCycle.contentType === 'video' && currentCycle.mediaUrl && (
                <video 
                  ref={videoRef}
                  src={currentCycle.mediaUrl} 
                  autoPlay
                  playsInline
                  muted={isMuted}
                  controlsList="nodownload no-remote-playback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  className="w-full h-full object-contain select-none"
                />
              )}
            </div>

            {/* Bottom Bar: Reply & Like */}
            <div className="absolute bottom-0 inset-x-0 pb-safe-bottom z-20 pointer-events-auto bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="px-4 py-4 pt-8 flex items-center gap-3">
                {!isOwner ? (
                  <>
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onFocus={() => setIsPaused(true)}
                        onBlur={() => setIsPaused(false)}
                        onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
                        placeholder={`Comment on this story...`}
                        className="w-full bg-white/10 border border-white/20 text-white placeholder-white/60 text-sm rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:bg-white/20 transition-colors"
                      />
                      {replyText && (
                        <button 
                          onClick={handleReplySubmit} 
                          disabled={isSubmittingComment}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                          {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    <button onClick={handleToggleLike} className="p-2 group shrink-0">
                      <Heart className={cn("w-7 h-7 transition-colors", engagement?.likedByMe ? "fill-rose-500 text-rose-500" : "text-white group-hover:text-rose-200")} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowCommentsModal(true); setIsPaused(true); }} 
                      className="flex items-center gap-1.5 p-2 text-white hover:text-indigo-300 transition-colors shrink-0"
                    >
                      <MessageSquare className="w-6 h-6" />
                      {engagement?.commentCount ? (
                        <span className="font-bold text-sm">{engagement.commentCount}</span>
                      ) : null}
                    </button>
                  </>
                ) : (
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setShowEngagementModal('views')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-[13px] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{engagement?.viewCount || 0}</span>
                      </button>
                      <button 
                        onClick={() => setShowEngagementModal('likes')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-[13px] transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span>{engagement?.likeCount || 0}</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowCommentsModal(true); setIsPaused(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-[13px] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{engagement?.commentCount || 0}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Three-Dot Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-black/50 flex flex-col justify-end"
                  onClick={() => { setShowMenu(false); setIsPaused(false); }}
                >
                  <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    className="bg-zinc-900 rounded-t-3xl pb-safe-bottom overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="p-2">
                      {isOwner ? (
                        <button 
                          onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                          className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-red-500 font-bold transition-colors"
                        >
                          Delete Cycle
                          <Trash2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => { setShowMenu(false); setIsPaused(false); }}
                            className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition-colors"
                          >
                            Mute Cycles
                            <VolumeX className="w-5 h-5 text-zinc-400" />
                          </button>
                          <button 
                            onClick={() => { setShowMenu(false); setIsPaused(false); }}
                            className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition-colors border-t border-white/5"
                          >
                            Hide Cycles
                            <EyeOff className="w-5 h-5 text-zinc-400" />
                          </button>
                          <button 
                            onClick={() => { setShowMenu(false); setIsPaused(false); }}
                            className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-red-500 font-bold transition-colors border-t border-white/5"
                          >
                            Report
                            <Flag className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => { setShowMenu(false); setIsPaused(false); }}
                        className="w-full flex items-center justify-center mt-2 py-4 rounded-xl bg-zinc-800 text-white font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                    className="bg-zinc-900 p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl border border-white/5"
                  >
                    <h3 className="text-xl font-bold text-white mb-2">Delete this Cycle?</h3>
                    <p className="text-zinc-400 text-sm mb-6 font-medium">This cannot be undone.</p>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setShowDeleteConfirm(false); setIsPaused(false); }}
                        className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDelete}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Engagement Modals (Views / Likes) */}
            <AnimatePresence>
              {showEngagementModal && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-black/80 flex flex-col justify-end"
                  onClick={() => setShowEngagementModal(null)}
                >
                  <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    className="bg-zinc-900 rounded-t-3xl h-[60%] flex flex-col pb-safe-bottom"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <h3 className="font-bold text-white text-lg">
                        {showEngagementModal === 'likes' ? 'Likes' : 'Viewed by'}
                      </h3>
                      <button onClick={() => { setShowEngagementModal(null); setIsPaused(false); }} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700">
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                      {showEngagementModal === 'likes' && engagement?.likers?.length === 0 && (
                        <p className="text-zinc-500 text-center font-medium mt-10">No likes yet.</p>
                      )}
                      {showEngagementModal === 'views' && engagement?.viewers?.length === 0 && (
                        <p className="text-zinc-500 text-center font-medium mt-10">No views yet.</p>
                      )}

                      {(showEngagementModal === 'likes' ? engagement?.likers : engagement?.viewers)?.map((u: any) => (
                        <div 
                          key={u._id} 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => {
                            setShowEngagementModal(null);
                            onClose();
                            navigate(`/user/${u._id}`);
                          }}
                        >
                          <Avatar src={u.avatar} name={u.name} size="sm" />
                          <div>
                            <p className="font-bold text-white text-sm">{u.name}</p>
                            <p className="text-zinc-400 text-xs font-medium">@{u.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comments Modal */}
            <AnimatePresence>
              {showCommentsModal && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black/60 flex flex-col justify-end"
                  onClick={() => { setShowCommentsModal(false); setIsPaused(false); }}
                >
                  <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="bg-zinc-900 w-full h-[70%] sm:h-[80%] rounded-t-3xl flex flex-col overflow-hidden border-t border-white/10"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                      <h3 className="text-white font-bold text-lg">Comments</h3>
                      <button 
                        onClick={() => { setShowCommentsModal(false); setIsPaused(false); }}
                        className="p-2 rounded-full hover:bg-white/10 text-zinc-400 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                      {cycleComments === undefined ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                        </div>
                      ) : cycleComments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <MessageSquare className="w-12 h-12 text-zinc-700 mb-3" />
                          <p className="text-zinc-400 font-bold">No comments yet</p>
                          <p className="text-sm text-zinc-500">Be the first to comment on this story.</p>
                        </div>
                      ) : (
                        cycleComments.map(comment => (
                          <div key={comment._id} className="flex gap-3">
                            <Avatar src={comment.author?.avatar} name={comment.author?.name || 'User'} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="font-bold text-white text-[13px]">{comment.author?.name || 'Unknown'}</span>
                                <span className="text-[11px] text-zinc-500">
                                  {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[14px] text-zinc-200 mt-0.5 break-words whitespace-pre-wrap">{comment.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-zinc-900 pb-safe-bottom">
                      <div className="flex items-center gap-3">
                        <Avatar src={undefined} name="You" size="sm" />
                        <div className="flex-1 relative">
                          <input 
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
                            placeholder="Add a comment..."
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:border-white/40 transition-colors"
                          />
                          {replyText && (
                            <button 
                              onClick={handleReplySubmit}
                              disabled={isSubmittingComment}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                            >
                              {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Right Previews (Desktop) */}
          <div className="hidden md:flex flex-col items-start justify-center w-[200px] lg:w-[250px] gap-4">
            {allGroups.slice(activeGroupIndex + 1, activeGroupIndex + 4).map((group, idx) => (
              <div 
                key={group.key || group.authorId} 
                onClick={() => { setActiveGroupIndex(activeGroupIndex + 1 + idx); setCurrentIndex(0); }}
                className="flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors opacity-60 hover:opacity-100"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-indigo-500/50">
                  <img src={group.avatarUrl || `https://ui-avatars.com/api/?name=${group.name}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm text-white truncate">{group.name}</p>
                  <p className="text-xs text-zinc-400">View cycle</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
