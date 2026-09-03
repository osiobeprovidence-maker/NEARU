import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  ExternalLink,
  Globe,
  BadgeCheck,
  Megaphone,
  MoreVertical,
  Info,
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
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || url;
  }
}

function cleanHref(url: string): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isStorageId(val?: string | null): boolean {
  return Boolean(
    val &&
      typeof val === 'string' &&
      !val.startsWith('http') &&
      !val.startsWith('blob:') &&
      !val.startsWith('data:') &&
      !val.startsWith('/')
  );
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
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(18);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(4);
  const [commentCount] = useState(3);

  // Storage ID resolution fallback if the backend hasn't pre-resolved it
  const isImageStorage = isStorageId(imageUrl);
  const resolvedImageFromStorage = useQuery(
    api.media.getMediaUrl,
    isImageStorage ? { storageId: imageUrl as string } : 'skip'
  );

  const isLogoStorage = isStorageId(brandLogoUrl);
  const resolvedLogoFromStorage = useQuery(
    api.media.getMediaUrl,
    isLogoStorage ? { storageId: brandLogoUrl as string } : 'skip'
  );

  const effectiveImageUrl = resolvedImageFromStorage || (isImageStorage ? '' : imageUrl);
  const effectiveLogoUrl = resolvedLogoFromStorage || (isLogoStorage ? '' : brandLogoUrl);

  // Reset media error if the imageUrl changes
  useEffect(() => {
    setMediaError(false);
  }, [effectiveImageUrl]);

  const isVideo =
    mediaType === 'video' ||
    Boolean(
      effectiveImageUrl &&
        (effectiveImageUrl.endsWith('.mp4') ||
          effectiveImageUrl.endsWith('.webm') ||
          effectiveImageUrl.endsWith('.mov') ||
          effectiveImageUrl.includes('stream.mux.com') ||
          effectiveImageUrl.includes('type=video'))
    );

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
      window.open(cleanHref(linkUrl), '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = linkUrl ? cleanHref(linkUrl) : window.location.origin;
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
      {/* ── 1. SPONSORED LABEL ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
        <Megaphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>Sponsored</span>
      </div>

      {/* ── 2. ADVERTISER HEADER ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo / Avatar */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-100 border border-zinc-200/80 overflow-hidden shrink-0 flex items-center justify-center">
            {effectiveLogoUrl ? (
              <img
                src={effectiveLogoUrl}
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
            </div>
          </div>
        </div>

        {/* Three-dot options menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Ad options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-xl border border-zinc-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    window.dispatchEvent(
                      new CustomEvent('show-toast', {
                        detail: {
                          title: 'Sponsored Ad',
                          subtitle: 'You are seeing this ad based on relevance and general location.',
                        },
                      })
                    );
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors"
                >
                  <Info className="w-4 h-4 text-zinc-400" />
                  <span>About this ad</span>
                </button>
                {linkUrl && (
                  <a
                    href={cleanHref(linkUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                    <span>Open destination</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    handleShare(e);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-zinc-400" />
                  <span>Share ad</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 3. AD HEADLINE / TITLE ───────────────────────────────────────── */}
      {title && title.toLowerCase() !== displayName.toLowerCase() && (
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 mt-3 leading-snug">
          {title}
        </h3>
      )}

      {/* ── 4. AD DESCRIPTION ───────────────────────────────────────────── */}
      {description && (
        <p className="text-[15px] leading-relaxed text-zinc-800 whitespace-pre-wrap break-words mt-1.5">
          {description}
        </p>
      )}

      {/* ── 5. MEDIA (IMAGE OR VIDEO) ───────────────────────────────────── */}
      {effectiveImageUrl && !mediaError && (
        <div className="mt-3.5 rounded-2xl overflow-hidden bg-zinc-950/5 relative border border-zinc-100 flex items-center justify-center">
          {isVideo ? (
            <video
              src={effectiveImageUrl}
              controls
              muted
              playsInline
              preload="metadata"
              className="w-full max-h-[520px] rounded-2xl bg-black mx-auto"
              onError={() => setMediaError(true)}
            />
          ) : (
            <img
              src={effectiveImageUrl}
              alt={title || displayName}
              className="w-full max-h-[520px] object-contain rounded-2xl mx-auto"
              loading="lazy"
              onError={() => setMediaError(true)}
            />
          )}
        </div>
      )}

      {/* ── 6. CTA / DESTINATION SECTION ─────────────────────────────────── */}
      {linkUrl && (
        <a
          href={cleanHref(linkUrl)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3.5 flex items-center justify-between p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/80 transition-all group cursor-pointer"
        >
          <div className="flex-1 min-w-0 mr-3">
            <div className="text-[12px] font-semibold text-zinc-500 truncate flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{cleanDomain(linkUrl)}</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-zinc-900 truncate mt-0.5 group-hover:text-indigo-600 transition-colors">
              {title || displayName}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 group-hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shrink-0 shadow-xs active:scale-95">
            <span>{ctaText || 'Learn More'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </a>
      )}

      {/* ── 7. ENGAGEMENT / ACTION ROW ───────────────────────────────────── */}
      <div className="mt-3.5 pt-2.5 flex items-center justify-between sm:justify-start sm:gap-6 border-t border-zinc-100/90 text-zinc-500 text-xs sm:text-sm">
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

        {/* Comment / Destination */}
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
