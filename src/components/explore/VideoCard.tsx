import React, { useState } from 'react';
import { Play, Heart, MessageCircle, MapPin } from 'lucide-react';
import Avatar from '../Avatar';
import { ProfileVerificationCheck } from '../VerificationBadge';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface VideoCardProps {
  video: any;
  onClick: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);

  const videoSrc = video.mediaUrl || (video.mediaUrls && video.mediaUrls[0]) || '';
  const cleanUsername = video.creator?.username?.replace(/^@+/, '') || '';
  const topic = video.interest || (video.hashtags && video.hashtags[0]) || '';

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden bg-zinc-950 aspect-9/14 sm:aspect-3/4 flex flex-col justify-between p-3.5 sm:p-4 cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300 border border-zinc-200/50 hover:border-indigo-400 select-none"
    >
      {/* Background Media */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-900">
        {videoSrc ? (
          <video
            src={videoSrc}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 text-xs font-semibold">
            Video
          </div>
        )}
      </div>

      {/* Gradient Overlays for readable text */}
      <div className="absolute inset-0 z-1 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

      {/* Top Header: Topic Tag & Play Indicator */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {topic ? (
          <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 uppercase tracking-wider truncate max-w-[120px]">
            #{topic}
          </span>
        ) : (
          <div />
        )}

        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-indigo-600 group-hover:scale-110 transition-all duration-200 shadow-sm">
          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom Info: Title, Creator, Metrics */}
      <div className="relative z-10 space-y-2">
        <h4 className="text-white text-xs sm:text-sm font-bold leading-snug line-clamp-2 drop-shadow-sm group-hover:text-indigo-200 transition-colors">
          {video.title}
        </h4>

        {/* Creator Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Avatar
              src={video.creator?.avatar}
              name={video.creator?.name || 'Creator'}
              size="xs"
              className="ring-1 ring-white/50 shrink-0"
            />
            <span className="text-[11px] font-semibold text-white/90 truncate">
              {video.creator?.name || 'Creator'}
            </span>
            <ProfileVerificationCheck user={video.creator} size="xs" />
          </div>

          {/* Likes metric */}
          <div className="flex items-center gap-1 text-[11px] text-white/80 font-bold shrink-0">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            <span>{video.likesCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
