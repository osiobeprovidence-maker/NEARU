import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Music2,
  UserPlus,
  UserCheck,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Avatar from '../Avatar';
import { ProfileVerificationCheck } from '../VerificationBadge';
import { cn } from '../../lib/utils';
import VideoCommentDrawer from './VideoCommentDrawer';

interface EndlessVideoViewerProps {
  videos: any[];
  initialVideoId?: string;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (id: string) => void;
}

export default function EndlessVideoViewer({
  videos,
  initialVideoId,
  isOpen,
  onClose,
  onLike,
}: EndlessVideoViewerProps) {
  // Find initial index
  const initialIndex = React.useMemo(() => {
    if (!initialVideoId || !videos?.length) return 0;
    const foundIdx = videos.findIndex((v) => v._id === initialVideoId || v.id === initialVideoId);
    return foundIdx !== -1 ? foundIdx : 0;
  }, [initialVideoId, videos]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState<{ x: number; y: number } | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({});
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareToast, setShareToast] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Sync initial index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(true);
    }
  }, [isOpen, initialIndex]);

  const currentVideo = videos[currentIndex];

  // Initialize video stats maps
  useEffect(() => {
    if (currentVideo) {
      const vId = currentVideo._id || currentVideo.id;
      if (likedMap[vId] === undefined) {
        setLikedMap((prev) => ({ ...prev, [vId]: !!currentVideo.isLiked }));
      }
      if (likesCountMap[vId] === undefined) {
        setLikesCountMap((prev) => ({ ...prev, [vId]: currentVideo.likesCount || 0 }));
      }
    }
  }, [currentVideo]);

  // Video playback management on index change
  useEffect(() => {
    videoRefs.current.forEach((ref, idx) => {
      if (!ref) return;
      if (idx === currentIndex) {
        ref.currentTime = 0;
        ref
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay failed due to policy -> mute and play
            ref.muted = true;
            setIsMuted(true);
            ref.play();
            setIsPlaying(true);
          });
      } else {
        ref.pause();
      }
    });
  }, [currentIndex]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') handleNextVideo();
      if (e.key === 'ArrowUp') handlePrevVideo();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || !videos?.length || !currentVideo) return null;

  const handleNextVideo = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const togglePlay = () => {
    const videoEl = videoRefs.current[currentIndex];
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play();
      setIsPlaying(true);
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRefs.current.forEach((ref) => {
      if (ref) ref.muted = nextMute;
    });
  };

  const handleDoubleTapLike = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setShowHeartAnim({ x, y });
    setTimeout(() => setShowHeartAnim(null), 900);

    const vId = currentVideo._id || currentVideo.id;
    if (!likedMap[vId]) {
      setLikedMap((prev) => ({ ...prev, [vId]: true }));
      setLikesCountMap((prev) => ({ ...prev, [vId]: (prev[vId] || 0) + 1 }));
      if (onLike) onLike(vId);
    }
  };

  const toggleLike = () => {
    const vId = currentVideo._id || currentVideo.id;
    const next = !likedMap[vId];
    setLikedMap((prev) => ({ ...prev, [vId]: next }));
    setLikesCountMap((prev) => ({
      ...prev,
      [vId]: next ? (prev[vId] || 0) + 1 : Math.max(0, (prev[vId] || 0) - 1),
    }));
    if (onLike) onLike(vId);
  };

  const toggleFollow = () => {
    const creatorId = currentVideo.creator?._id || currentVideo.creator?.id || 'creator';
    setFollowingMap((prev) => ({ ...prev, [creatorId]: !prev[creatorId] }));
  };

  const toggleBookmark = () => {
    const vId = currentVideo._id || currentVideo.id;
    setBookmarkedMap((prev) => ({ ...prev, [vId]: !prev[vId] }));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentVideo.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  const handleTimeUpdate = (idx: number) => {
    if (idx !== currentIndex) return;
    const el = videoRefs.current[idx];
    if (el && el.duration) {
      setProgress((el.currentTime / el.duration) * 100);
    }
  };

  const currentVideoId = currentVideo._id || currentVideo.id;
  const isCurrentLiked = !!likedMap[currentVideoId];
  const currentLikesCount = likesCountMap[currentVideoId] ?? (currentVideo.likesCount || 0);
  const creatorId = currentVideo.creator?._id || currentVideo.creator?.id;
  const isFollowing = !!followingMap[creatorId];
  const isBookmarked = !!bookmarkedMap[currentVideoId];
  const cleanUsername = currentVideo.creator?.username?.replace(/^@+/, '') || '';

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-200 select-none">
      {/* Top Left Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 z-50 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-95 border border-white/10"
        aria-label="Close video feed"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Top Controls Overlay */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMute}
          className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-95 border border-white/10"
          aria-label="Toggle mute"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-indigo-400" />}
        </button>
      </div>

      {/* Main Full-Screen Vertical Video Carousel */}
      <div className="relative w-full h-full max-w-md md:max-w-lg bg-black overflow-hidden flex flex-col justify-center shadow-2xl">
        {/* Render Single Active Video Container */}
        <div
          ref={containerRef}
          className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
          onDoubleClick={handleDoubleTapLike}
        >
          {/* Video Element */}
          <video
            ref={(el) => (videoRefs.current[currentIndex] = el)}
            src={currentVideo.mediaUrl || currentVideo.mediaUrls?.[0] || ''}
            loop
            playsInline
            muted={isMuted}
            controlsList="nodownload no-remote-playback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onTimeUpdate={() => handleTimeUpdate(currentIndex)}
            className="w-full h-full object-cover select-none"
          />


          {/* Double Tap Heart Animation */}
          {showHeartAnim && (
            <div
              className="absolute pointer-events-none z-40 animate-ping duration-700"
              style={{ left: showHeartAnim.x - 30, top: showHeartAnim.y - 30 }}
            >
              <Heart className="w-16 h-16 fill-rose-500 text-rose-500 drop-shadow-2xl" />
            </div>
          )}

          {/* Play/Pause Overlay hint */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-30">
              <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white shadow-2xl">
                <Play className="w-8 h-8 fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Vertical Navigation Arrow Controls (Desktop / Tap indicator) */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevVideo();
                }}
                className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
                title="Previous Video (Up Arrow)"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            )}
            {currentIndex < videos.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextVideo();
                }}
                className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
                title="Next Video (Down Arrow)"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Right Action Bar (TikTok Style) */}
          <div
            className="absolute right-3 bottom-24 z-40 flex flex-col items-center gap-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Creator Avatar & Follow Button */}
            <div className="relative mb-2">
              <Avatar
                src={currentVideo.creator?.avatar}
                name={currentVideo.creator?.name || 'Creator'}
                size="md"
                className="ring-2 ring-white/60 shadow-lg"
              />
              <button
                type="button"
                onClick={toggleFollow}
                className={cn(
                  'absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md transition-transform active:scale-90',
                  isFollowing ? 'bg-zinc-700' : 'bg-rose-500'
                )}
                title={isFollowing ? 'Following' : 'Follow Creator'}
              >
                {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
              </button>
            </div>

            {/* Like Action */}
            <button
              type="button"
              onClick={toggleLike}
              className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg',
                  isCurrentLiked ? 'bg-rose-500 text-white scale-105' : 'bg-black/50 text-white hover:bg-black/70'
                )}
              >
                <Heart className={cn('w-6 h-6', isCurrentLiked ? 'fill-white' : '')} />
              </div>
              <span className="text-[11px] font-bold drop-shadow-md">
                {currentLikesCount}
              </span>
            </button>

            {/* Comment Action */}
            <button
              type="button"
              onClick={() => setShowCommentDrawer(true)}
              className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 shadow-lg">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold drop-shadow-md">
                {currentVideo.commentsCount || 0}
              </span>
            </button>

            {/* Bookmark Action */}
            <button
              type="button"
              onClick={toggleBookmark}
              className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-colors shadow-lg',
                  isBookmarked ? 'bg-amber-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                )}
              >
                <Bookmark className={cn('w-5 h-5', isBookmarked ? 'fill-white' : '')} />
              </div>
              <span className="text-[11px] font-bold drop-shadow-md">Save</span>
            </button>

            {/* Share Action */}
            <button
              type="button"
              onClick={handleShare}
              className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 shadow-lg">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold drop-shadow-md">Share</span>
            </button>

            {/* Rotating Vinyl Disc Audio Icon */}
            <div className="w-10 h-10 rounded-full bg-zinc-900 ring-2 ring-white/30 flex items-center justify-center animate-spin duration-[4000ms] shadow-2xl mt-2">
              <Music2 className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          {/* Bottom Info Section (Creator, Title, Hashtags, Audio) */}
          <div
            className="absolute left-0 right-16 bottom-0 z-40 p-4 sm:p-5 bg-gradient-to-t from-black via-black/70 to-transparent text-white pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm sm:text-base font-extrabold text-white drop-shadow-md">
                {currentVideo.creator?.name || 'Creator'}
              </span>
              <ProfileVerificationCheck user={currentVideo.creator} size="xs" />
              {cleanUsername && (
                <span className="text-xs text-white/70 font-medium">@{cleanUsername}</span>
              )}
            </div>

            <h3 className="text-sm font-bold text-white leading-snug mb-1 drop-shadow-sm">
              {currentVideo.title}
            </h3>

            {currentVideo.description && (
              <p className="text-xs text-white/80 line-clamp-2 leading-relaxed mb-2 drop-shadow-xs">
                {currentVideo.description}
              </p>
            )}

            {currentVideo.interest && (
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-[11px] mb-2">
                #{currentVideo.interest}
              </span>
            )}

            {currentVideo.locationLabel && (
              <div className="flex items-center gap-1 text-[11px] text-rose-300 font-medium mb-1">
                <MapPin className="w-3 h-3" />
                <span>{currentVideo.locationLabel}</span>
              </div>
            )}

            {/* Music Track Marquee */}
            <div className="flex items-center gap-2 text-xs text-white/80 font-medium mt-1">
              <Music2 className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span className="truncate">
                Original Sound - {currentVideo.creator?.name || 'Lalao Creator'}
              </span>
            </div>
          </div>

          {/* Video Bottom Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-40">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-2">
          Link copied to clipboard!
        </div>
      )}

      {/* Slide-Up Comment Drawer */}
      <VideoCommentDrawer
        isOpen={showCommentDrawer}
        onClose={() => setShowCommentDrawer(false)}
        videoId={currentVideoId}
        videoTitle={currentVideo.title}
        commentsCount={currentVideo.commentsCount}
      />
    </div>
  );
}
