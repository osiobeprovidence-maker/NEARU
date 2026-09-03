import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  ExternalLink,
  Globe,
  BadgeCheck,
  Megaphone,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AdCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  linkUrl?: string;
  ctaText?: string;
  brandName?: string;
  brandLogoUrl?: string;
}

function cleanDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || url;
  }
}

export default function AdCard({
  title,
  description,
  imageUrl,
  mediaType,
  linkUrl,
  ctaText = 'Learn More',
  brandName,
  brandLogoUrl,
}: AdCardProps) {
  const [mediaError, setMediaError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(14);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(3);
  const [commentCount] = useState(2);

  // Reset media error if the imageUrl changes
  useEffect(() => {
    setMediaError(false);
  }, [imageUrl]);

  const isVideo =
    mediaType === 'video' ||
    (imageUrl &&
      (imageUrl.endsWith('.mp4') ||
        imageUrl.endsWith('.webm') ||
        imageUrl.endsWith('.mov') ||
        imageUrl.includes('stream.mux.com')));

  const displayName = brandName || title || 'Sponsored';
  const handle = brandName
    ? `@${brandName.toLowerCase().replace(/[^a-z0-9_]/g, '')}`
    : '@promoted';

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReposted(!reposted);
    setRepostCount((c) => (reposted ? c - 1 : c + 1));
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = linkUrl || window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: description,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Link Copied',
            subtitle: 'Sponsored link copied to clipboard.',
          },
        })
      );
    }
  };

  return (
    <article className="p-4 sm:p-5 hover:bg-zinc-50/50 transition-colors relative block text-left bg-white">
      {/* ── 1. PROMOTED / SPONSORED LABEL ───────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
        <Megaphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>Sponsored</span>
      </div>

      {/* ── 2. ADVERTISER HEADER ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo / Avatar */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-100 border border-zinc-200/80 overflow-hidden shrink-0 flex items-center justify-center">
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Identity & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[15px] text-zinc-900 truncate">
                {displayName}
              </span>
              <BadgeCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 shrink-0">
                Ad
              </span>
            </div>

            <div className="text-[13px] text-zinc-500 flex items-center gap-1 mt-0.5">
              <span className="truncate">{handle}</span>
              <span>·</span>
              <span className="text-zinc-400 font-medium">Promoted</span>
              {linkUrl && (
                <>
                  <span>·</span>
                  <span className="text-zinc-400 truncate flex items-center gap-0.5">
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">{cleanDomain(linkUrl)}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            title="Open link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* ── 3. AD TEXT / DESCRIPTION ────────────────────────────────────── */}
      <div className="mt-2.5 text-[15px] leading-relaxed text-zinc-900 whitespace-pre-wrap break-words">
        {title && title.toLowerCase() !== displayName.toLowerCase() && (
          <p className="font-bold text-zinc-900 mb-1 leading-snug">{title}</p>
        )}
        <p>{description}</p>
      </div>

      {/* ── 4. UPLOADED ADVERTISER MEDIA (IMAGE OR VIDEO) ─────────────────── */}
      {imageUrl && !mediaError && (
        <div className="mt-3 rounded-2xl overflow-hidden bg-zinc-950/5 relative border border-zinc-100">
          {isVideo ? (
            <video
              src={imageUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[480px] object-cover bg-black"
              onError={() => setMediaError(true)}
            />
          ) : (
            <img
              src={imageUrl}
              alt={title || displayName}
              className="w-full max-h-[480px] object-cover"
              onError={() => setMediaError(true)}
            />
          )}
        </div>
      )}

      {/* ── 5. CALL TO ACTION (CTA) ─────────────────────────────────────── */}
      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex items-center justify-between p-3 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 transition-all group cursor-pointer"
        >
          <div className="flex-1 min-w-0 mr-3">
            <div className="text-[11px] font-semibold text-zinc-500 truncate flex items-center gap-1">
              <Globe className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">{cleanDomain(linkUrl)}</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-zinc-900 truncate mt-0.5 group-hover:text-indigo-600 transition-colors">
              {title || displayName}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 group-hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shrink-0 shadow-xs active:scale-95">
            <span>{ctaText || 'Learn More'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </a>
      )}

      {/* ── 6. SOCIAL INTERACTION ROW ───────────────────────────────────── */}
      <div className="mt-3 pt-2.5 flex items-center justify-between sm:justify-start sm:gap-6 border-t border-zinc-100/90 text-zinc-500 text-xs sm:text-sm">
        {/* Like */}
        <button
          type="button"
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm transition-colors hover:bg-zinc-100 active:scale-90 cursor-pointer',
            liked ? 'text-rose-500 font-semibold' : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          <Heart
            className={cn(
              'w-4 h-4 sm:w-4.5 sm:h-4.5',
              liked && 'fill-current text-rose-500'
            )}
          />
          <span>{likeCount}</span>
        </button>

        {/* Comment / CTA */}
        <button
          type="button"
          onClick={handleComment}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm transition-colors hover:bg-zinc-100 active:scale-90 cursor-pointer text-zinc-500 hover:text-zinc-700"
        >
          <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>{commentCount}</span>
        </button>

        {/* Repost */}
        <button
          type="button"
          onClick={handleRepost}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm transition-colors hover:bg-zinc-100 active:scale-90 cursor-pointer',
            reposted ? 'text-emerald-600 font-semibold' : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          <Repeat2
            className={cn(
              'w-4 h-4 sm:w-4.5 sm:h-4.5',
              reposted && 'text-emerald-600 stroke-[2.5]'
            )}
          />
          <span>{repostCount}</span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm text-zinc-500 hover:text-zinc-700 transition-colors hover:bg-zinc-100 active:scale-90 cursor-pointer"
          title="Share"
        >
          <Share2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>
      </div>
    </article>
  );
}
