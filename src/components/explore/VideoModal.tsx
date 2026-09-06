import React, { useRef, useEffect, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Share2, MapPin } from 'lucide-react';
import Avatar from '../Avatar';
import { ProfileVerificationCheck } from '../VerificationBadge';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface VideoModalProps {
  video: any;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (id: string) => void;
}

export default function VideoModal({ video, isOpen, onClose, onLike }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(video?.isLiked || false);
  const [likesCount, setLikesCount] = useState(video?.likesCount || 0);

  useEffect(() => {
    if (video) {
      setLiked(video.isLiked || false);
      setLikesCount(video.likesCount || 0);
      setIsPlaying(true);
    }
  }, [video]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !video) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c: number) => (next ? c + 1 : Math.max(0, c - 1)));
    if (onLike) onLike(video._id);
  };

  const videoSrc = video.mediaUrl || (video.mediaUrls && video.mediaUrls[0]) || '';
  const cleanUsername = video.creator?.username?.replace(/^@+/, '') || '';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-zinc-900/80 text-white/80 hover:text-white hover:bg-zinc-800 transition-colors active:scale-95"
        aria-label="Close video modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Video Modal Container */}
      <div className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[92vh]">
        {/* Video Player */}
        <div className="relative flex-1 bg-black flex items-center justify-center cursor-pointer min-h-[380px] sm:min-h-[480px]" onClick={togglePlay}>
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              playsInline
              muted={isMuted}
              className="w-full h-full max-h-[75vh] object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <div className="text-white text-center p-8">
              <p className="font-bold">Video stream not available</p>
            </div>
          )}

          {/* Play/Pause Overlay indicator when paused */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                <Play className="w-8 h-8 fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Top Controls Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
            {video.interest && (
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs border border-white/15">
                #{video.interest}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="ml-auto p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Action sidebar over video */}
          <div
            className="absolute right-3 bottom-24 flex flex-col items-center gap-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleLike}
              className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors",
                  liked ? "bg-rose-500 text-white" : "bg-black/60 text-white hover:bg-black/80"
                )}
              >
                <Heart className={cn("w-5 h-5", liked ? "fill-white" : "")} />
              </div>
              <span className="text-white font-bold text-[11px] drop-shadow-md">
                {likesCount}
              </span>
            </button>

            <Link
              to={`/rally/${video._id}`}
              onClick={onClose}
              className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            >
              <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-white font-bold text-[11px] drop-shadow-md">
                {video.commentsCount || 0}
              </span>
            </Link>
          </div>
        </div>

        {/* Video Footer Info (Creator + Caption) */}
        <div className="p-4 sm:p-5 bg-gradient-to-t from-zinc-950 via-zinc-900 to-zinc-900/90 text-white border-t border-white/10">
          <div className="flex items-center gap-3 mb-2.5">
            <Link
              to={video.creator?._id ? `/user/${video.creator._id}` : '#'}
              onClick={onClose}
              className="flex items-center gap-2.5 group"
            >
              <Avatar
                src={video.creator?.avatar}
                name={video.creator?.name || 'Creator'}
                size="sm"
                className="ring-1 ring-white/30"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-white group-hover:underline truncate">
                    {video.creator?.name || 'Creator'}
                  </span>
                  <ProfileVerificationCheck user={video.creator} size="xs" />
                </div>
                {cleanUsername && (
                  <p className="text-xs text-white/60 font-medium truncate">
                    @{cleanUsername}
                  </p>
                )}
              </div>
            </Link>
          </div>

          <h4 className="text-sm sm:text-base font-bold text-white leading-snug mb-1">
            {video.title}
          </h4>

          {video.description && (
            <p className="text-xs text-white/70 leading-relaxed line-clamp-3">
              {video.description}
            </p>
          )}

          {video.locationLabel && (
            <div className="flex items-center gap-1 text-[11px] text-white/50 mt-2 font-medium">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>{video.locationLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
