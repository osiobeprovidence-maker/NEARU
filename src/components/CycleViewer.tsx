import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MoreHorizontal, Heart, Eye, Trash2 } from 'lucide-react';
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
  cyclesGroup: {
    key: string;
    name: string;
    avatarUrl?: string;
    authorId?: string;
    pageId?: string;
    cycles: any[];
  } | null;
}

export default function CycleViewer({ isOpen, onClose, cyclesGroup }: CycleViewerProps) {
  const { convexUserId } = useAuth();
  const navigate = useNavigate();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState<'likes' | 'views' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const markViewed = useMutation(api.cycles.markCycleViewed);
  const likeCycle = useMutation(api.cycles.likeCycle);
  const unlikeCycle = useMutation(api.cycles.unlikeCycle);
  const deleteCycle = useMutation(api.cycles.deleteCycle);

  const CYCLE_DURATION_MS = 5000;

  useEffect(() => {
    if (isOpen && cyclesGroup && cyclesGroup.cycles.length > 0) {
      setCurrentIndex(0);
      setProgress(0);
      setIsPaused(false);
      setShowMenu(false);
      setShowDeleteConfirm(false);
      setShowEngagementModal(null);
    }
  }, [isOpen, cyclesGroup]);

  const currentCycle = cyclesGroup?.cycles[currentIndex];

  const engagement = useQuery(
    api.cycles.getCycleEngagement,
    isOpen && currentCycle ? { cycleId: currentCycle._id as Id<"cycles"> } : 'skip'
  );

  useEffect(() => {
    if (!isOpen || !cyclesGroup || cyclesGroup.cycles.length === 0 || !currentCycle) return;
    
    // Disable background scrolling
    document.body.style.overflow = 'hidden';

    // Don't advance if paused or a modal is open
    if (isPaused || showMenu || showDeleteConfirm || showEngagementModal) {
      return () => { document.body.style.overflow = 'auto'; };
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
          handleNext();
          return;
        }
      } else {
        const elapsed = timestamp - startTime;
        const currentProg = (elapsed / expectedDuration) * 100;
        setProgress(Math.min(currentProg, 100));

        if (elapsed >= expectedDuration) {
          handleNext();
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
  }, [currentIndex, isPaused, showMenu, showDeleteConfirm, showEngagementModal, isOpen, cyclesGroup, currentCycle]);

  const handleNext = () => {
    if (!cyclesGroup) return;
    if (currentIndex < cyclesGroup.cycles.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!currentCycle) return;
    try {
      await deleteCycle({ cycleId: currentCycle._id as Id<"cycles"> });
      // Remove locally or close if it's the last one
      if (cyclesGroup && cyclesGroup.cycles.length > 1) {
         if (currentIndex === cyclesGroup.cycles.length - 1) {
             handlePrev();
         } else {
             handleNext();
         }
      } else {
         onClose();
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (showMenu || showDeleteConfirm || showEngagementModal) return;
    setIsPaused(true);
  };
  
  const handlePointerUp = () => setIsPaused(false);

  if (!isOpen || !cyclesGroup || !currentCycle) return null;

  const isOwner = convexUserId && (currentCycle.authorId === convexUserId || currentCycle.pageId === convexUserId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col sm:p-4 overflow-hidden"
      >
        <div className="relative flex-1 w-full max-w-md mx-auto sm:rounded-[2rem] overflow-hidden bg-zinc-900 flex flex-col shadow-2xl">
          
          {/* Progress Bars */}
          <div className="absolute top-0 inset-x-0 pt-safe-top z-30 flex gap-1 px-3 py-3 bg-gradient-to-b from-black/50 to-transparent">
            {cyclesGroup.cycles.map((c, i) => (
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

          {/* Header */}
          <div className="absolute top-0 inset-x-0 pt-safe-top mt-5 px-4 flex items-center justify-between z-30 pointer-events-auto">
            <div className="flex items-center gap-3">
              <Avatar src={cyclesGroup.avatarUrl} name={cyclesGroup.name} size="sm" className="border border-white/20" />
              <div>
                <p className="font-bold text-[15px] leading-tight drop-shadow-md">{cyclesGroup.name}</p>
                <p className="text-[13px] font-medium text-white/80 drop-shadow-md">
                  {new Date(currentCycle.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {isOwner && (
                <button 
                  onClick={() => setShowMenu(true)}
                  className="p-2 rounded-full hover:bg-black/40 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/40 transition-colors">
                <X className="w-6 h-6 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Media Content Wrapper */}
          <div 
            className="flex-1 relative w-full h-full flex items-center justify-center bg-zinc-950"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Tap Zones for Nav (only active if no modal is open) */}
            {!showMenu && !showDeleteConfirm && !showEngagementModal && (
              <>
                <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={handlePrev} />
                <div className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer" onClick={handleNext} />
              </>
            )}

            {currentCycle.contentType === 'text' && (
              <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-primary">
                <p className="text-[28px] sm:text-3xl font-bold text-center text-white drop-shadow-lg leading-tight max-w-[90%] break-words">
                  {currentCycle.text}
                </p>
              </div>
            )}

            {currentCycle.contentType === 'image' && currentCycle.mediaUrl && (
              <img 
                src={currentCycle.mediaUrl} 
                alt="Cycle" 
                className="w-full h-full object-contain"
                draggable={false}
              />
            )}

            {currentCycle.contentType === 'video' && currentCycle.mediaUrl && (
              <video 
                ref={videoRef}
                src={currentCycle.mediaUrl} 
                autoPlay
                playsInline
                muted={false}
                controlsList="nodownload no-remote-playback"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                className="w-full h-full object-contain select-none"
              />
            )}

          </div>

          {/* Engagement Footer */}
          <div className="absolute bottom-0 inset-x-0 pb-safe-bottom z-20 pointer-events-auto bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="flex items-center justify-between px-4 py-4 pt-8">
              {isOwner ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowEngagementModal('views')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-bold text-[13px] transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{engagement?.viewCount || 0}</span>
                  </button>
                  <button 
                    onClick={() => setShowEngagementModal('likes')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-bold text-[13px] transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{engagement?.likeCount || 0}</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1" /> // Spacer
              )}
              
              {!isOwner && (
                <button 
                  onClick={handleToggleLike}
                  className="flex items-center gap-1.5 ml-auto p-2 group"
                >
                  <Heart 
                    className={cn(
                      "w-7 h-7 transition-colors", 
                      engagement?.likedByMe ? "fill-rose-500 text-rose-500" : "text-white group-hover:text-rose-200"
                    )} 
                  />
                  {engagement?.likeCount && engagement.likeCount > 0 ? (
                    <span className="font-bold text-sm text-white drop-shadow-md">
                      {engagement.likeCount}
                    </span>
                  ) : null}
                </button>
              )}
            </div>
          </div>

          {/* Modals & Overlays */}
          
          {/* Owner Context Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/50 flex flex-col justify-end"
                onClick={() => setShowMenu(false)}
              >
                <motion.div 
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  className="bg-zinc-900 rounded-t-3xl pb-safe-bottom"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-4 space-y-2">
                    <button 
                      onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-800/50 hover:bg-red-500/10 text-red-500 font-bold transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete Cycle
                    </button>
                    <button 
                      onClick={() => setShowMenu(false)}
                      className="w-full flex items-center justify-center py-4 rounded-2xl bg-zinc-800 text-white font-bold transition-colors"
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
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                  className="bg-zinc-900 p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl border border-white/5"
                >
                  <h3 className="text-xl font-bold text-white mb-2">Delete this Cycle?</h3>
                  <p className="text-zinc-400 text-sm mb-6 font-medium">This cannot be undone.</p>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
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
                    <button onClick={() => setShowEngagementModal(null)} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700">
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

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
