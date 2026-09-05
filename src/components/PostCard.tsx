import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Trash2,
  Loader2,
  BadgeCheck,
  Users,
  CheckCircle2,
  HelpingHand,
  X,
  ChevronRight,
  Repeat2,
} from 'lucide-react';
import { Rally } from '../types';
import { rallyAccess } from '../lib/rallyPricing';
import { cn } from '../lib/utils';
import Avatar from './Avatar';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';

interface PostCardProps {
  post: Rally;
  onDeleted?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------
function showToast(title: string, subtitle: string) {
  window.dispatchEvent(
    new CustomEvent('show-toast', { detail: { title, subtitle } })
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

const RALLY_ACTION: Record<string, { label: string; done: string }> = {
  ASK: { label: "I can help", done: 'Offer sent' },
  HELP: { label: "I'm interested", done: 'Sent' },
  JOIN: { label: 'Join', done: 'Joined' },
  EVENT: { label: "I'm coming", done: "You're coming" },
};

interface RallyCardMeta {
  isGiveaway: boolean;
  primaryTitle: string;
  categoryIcon: string;
  subtitle: string;
  rewardValue: string | null;
  secondaryMeta: string;
}

function getRallyDetails(post: Rally, displayLocation: string, formattedAge: string): RallyCardMeta {
  const fullText = `${post.title || ''} ${post.description || ''}`.trim();
  const lower = fullText.toLowerCase();

  const isAirtime =
    lower.includes('airtime') ||
    lower.includes('recharge') ||
    lower.includes('airtel') ||
    lower.includes('mtn') ||
    lower.includes('glo') ||
    lower.includes('9mobile');

  const isCash =
    lower.includes('cash') ||
    lower.includes('naira') ||
    lower.includes('transfer') ||
    lower.includes('credit alert');

  const isGiveaway =
    isAirtime ||
    isCash ||
    lower.includes('giveaway') ||
    lower.includes('giving out') ||
    lower.includes('give out');

  // 1. Primary Title
  let primaryTitle = 'RALLY';
  let categoryIcon = '⚡';
  if (isAirtime) {
    primaryTitle = 'AIRTIME GIVEAWAY';
    categoryIcon = '🎁';
  } else if (isCash) {
    primaryTitle = 'CASH GIVEAWAY';
    categoryIcon = '🎁';
  } else if (isGiveaway) {
    primaryTitle = 'COMMUNITY GIVEAWAY';
    categoryIcon = '🎁';
  } else if (post.type === 'EVENT') {
    primaryTitle = post.title && post.title.length <= 35 ? post.title.toUpperCase() : 'COMMUNITY EVENT';
    categoryIcon = '📅';
  } else if (post.type === 'HELP') {
    primaryTitle = post.title && post.title.length <= 35 ? post.title.toUpperCase() : 'COMMUNITY HELP';
    categoryIcon = '🤝';
  } else if (post.type === 'ASK') {
    primaryTitle = post.title && post.title.length <= 35 ? post.title.toUpperCase() : 'HELP REQUEST';
    categoryIcon = '🙋';
  } else if (post.type === 'JOIN') {
    primaryTitle = post.title && post.title.length <= 35 ? post.title.toUpperCase() : 'MEETUP & HANGOUT';
    categoryIcon = '👥';
  }

  // 2. Subtitle / What is happening
  let subtitle = '';
  if (post.description) {
    const firstLine = post.description.split('\n')[0].trim();
    subtitle = firstLine;
  } else if (post.title) {
    subtitle = post.title.trim();
  }
  if (subtitle.length > 95) {
    subtitle = subtitle.slice(0, 95) + '…';
  }

  // 3. Value / Reward Extraction (Highly visible)
  let rewardValue: string | null = null;
  const nairaMatch = fullText.match(/(?:₦|N|NGN)\s*([0-9,]+(?:\.[0-9]+)?(?:\s*(?:k|thousand|m))?)/i);
  const kMatch = fullText.match(/\b([0-9]+(?:\.[0-9]+)?k)\b/i);
  const numberAirtimeMatch = fullText.match(/\b([0-9]+(?:,[0-9]+)?)\s*(?:airtime|cash|recharge|data)/i);

  if (nairaMatch) {
    const val = nairaMatch[1].trim();
    rewardValue = `₦${val}${isAirtime && !val.toLowerCase().includes('airtime') ? ' Airtime' : ''}`;
  } else if (kMatch) {
    rewardValue = `₦${kMatch[1].toUpperCase()}${isAirtime ? ' Airtime' : ''}`;
  } else if (numberAirtimeMatch) {
    rewardValue = `₦${numberAirtimeMatch[1].trim()} Airtime`;
  } else if (post.price && post.price > 0) {
    rewardValue = `₦${post.price.toLocaleString()}${isAirtime ? ' Airtime' : ''}`;
  } else if (isAirtime) {
    rewardValue = '₦5,000 Airtime';
  } else if (isGiveaway) {
    rewardValue = 'Free Giveaway';
  } else if (post.pricing === 'free' || post.price === 0) {
    rewardValue = 'Free to Join';
  } else if (post.isPaid && post.price) {
    rewardValue = `₦${post.price.toLocaleString()} Entry`;
  }

  // 4. Secondary Metadata (Where / When)
  const loc = displayLocation || post.city || 'Nearby';
  const time = post.eventDate || post.time || formattedAge || 'Soon';
  const secondaryMeta = `${loc} · ${time}`;

  return {
    isGiveaway,
    primaryTitle,
    categoryIcon,
    subtitle,
    rewardValue,
    secondaryMeta,
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PostCard({ post, onDeleted }: PostCardProps) {
  // Optimistic like state
  const [localLiked, setLocalLiked] = useState(post.isLiked ?? false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likesCount ?? 0);
  // Optimistic RSVP / Rally Request state
  const [localRsvpd, setLocalRsvpd] = useState(post.isRsvpd ?? false);
  const [localRsvpCount, setLocalRsvpCount] = useState(post.rsvpsCount ?? 0);
  // Optimistic Repost state
  const [localReposted, setLocalReposted] = useState(false);
  const [localRepostCount, setLocalRepostCount] = useState(
    (post as any).repostsCount ?? 0
  );

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [post.mediaUrl]);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { convexUserId } = useAuth();

  const toggleLikeMut   = useMutation(api.rallies.toggleLike);
  const toggleRsvpMut   = useMutation(api.rallies.toggleRsvp);
  const addCommentMut   = useMutation(api.rallies.addComment);
  const deleteCommentMut = useMutation(api.rallies.deleteComment);
  const deleteRallyMut  = useMutation(api.rallies.deleteRally);

  const comments = useQuery(
    api.rallies.getComments,
    showComments ? { rallyId: post.id as any } : 'skip'
  );

  const isPagePost = post.authorType === 'page' && !!post.pageAuthor;
  const isOwner = !!convexUserId && (
    convexUserId === post.creator?.id ||
    (isPagePost && post.created_by_user_id === convexUserId)
  );

  // Normal social posts (POST type) have no Rally context by default.
  const isPost = post.type === 'POST';
  const isRallyContent = !isPost; // ASK / HELP / JOIN / EVENT
  const action = post.type !== 'POST' ? RALLY_ACTION[post.type] : undefined;
  const access = rallyAccess(post);

  // Is the event at capacity?
  const isFull =
    post.type === 'EVENT' &&
    !!post.capacity &&
    post.capacity > 0 &&
    localRsvpCount >= (post.capacity as number) &&
    !localRsvpd;

  // Primary user content — render exactly once.
  const content = post.description?.trim() || '';
  const hashtags = (post.hashtags ?? []).slice(0, 5);

  // The location to display comes from the user's actual data (never hardcoded).
  const displayLocation = post.locationLabel || post.city || '';

  const rallyMeta = getRallyDetails(post, displayLocation, timeAgo(post.createdAt));
  const isRally = isRallyContent || rallyMeta.isGiveaway || Boolean(post.rallyLinkId);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!convexUserId) {
      showToast('Not logged in', 'Please log in to like posts.');
      return;
    }
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    try {
      await toggleLikeMut({ rallyId: post.id as any, userId: convexUserId as any });
    } catch {
      setLocalLiked(wasLiked);
      setLocalLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const handleRsvp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!convexUserId) {
      showToast('Not logged in', 'Please log in to respond.');
      return;
    }
    if (isFull) {
      showToast('Event Full', 'This event has reached its capacity.');
      return;
    }
    const wasRsvpd = localRsvpd;
    setLocalRsvpd(!wasRsvpd);
    setLocalRsvpCount((c) => (wasRsvpd ? Math.max(0, c - 1) : c + 1));
    try {
      await toggleRsvpMut({ rallyId: post.id as any, userId: convexUserId as any });
      showToast(
        !wasRsvpd ? "Joined Rally" : 'Left Rally',
        !wasRsvpd ? 'Your request has been sent to the organizer.' : ''
      );
    } catch {
      setLocalRsvpd(wasRsvpd);
      setLocalRsvpCount((c) => (wasRsvpd ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!convexUserId) {
      showToast('Not logged in', 'Please log in to repost.');
      return;
    }
    const wasReposted = localReposted;
    setLocalReposted(!wasReposted);
    setLocalRepostCount((c) => (wasReposted ? Math.max(0, c - 1) : c + 1));
    showToast(
      !wasReposted ? 'Reposted' : 'Removed repost',
      !wasReposted ? 'Post shared to your network.' : ''
    );
  };

  const handleComment = async () => {
    if (!commentText.trim() || !convexUserId || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      await addCommentMut({
        rallyId: post.id as any,
        userId: convexUserId as any,
        text: commentText.trim(),
      });
      setCommentText('');
    } catch {
      showToast('Error', 'Could not post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = content
      ? `${content.slice(0, 120)}${content.length > 120 ? '…' : ''}`
      : `${post.title} — ${displayLocation || 'Lalao'}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Lalao', text, url: window.location.origin });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied!', 'Post copied to clipboard.');
    } catch {}
  };

  const handleDeleteConfirmed = async () => {
    if (!convexUserId) return;
    setIsDeleting(true);
    try {
      await deleteRallyMut({
        rallyId: post.id as any,
        requestingUserId: convexUserId as any,
      });
      setShowDeleteConfirm(false);
      showToast('Post deleted.', '');
      onDeleted?.(post.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast("Couldn't delete this post.", msg || 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 md:px-6 py-4 hover:bg-zinc-50/60 transition-colors"
    >
      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[80]"
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl z-[90] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-black text-zinc-900 text-center mb-1">
                Delete this post?
              </h3>
              <p className="text-sm text-zinc-500 text-center mb-6 leading-relaxed">
                This action cannot be undone. Likes, comments, and RSVPs will also be removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 1. AUTHOR HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {isPagePost && post.pageAuthor ? (
          <>
            <Link
              to={`/pages/${post.pageAuthor.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            >
              <Avatar
                src={post.pageAuthor.avatar}
                name={post.pageAuthor.name}
                size="md"
                className="shadow-sm ring-1 ring-zinc-200"
              />
            </Link>
            <Link
              to={`/pages/${post.pageAuthor.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 block"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] text-zinc-900 truncate">
                  {post.pageAuthor.name}
                </span>
                {post.pageAuthor.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 shrink-0">
                  {post.pageAuthor.category || 'Page'}
                </span>
              </div>
              <div className="text-[13px] text-zinc-500 flex items-center gap-1 mt-0.5">
                <span className="truncate font-medium text-zinc-600">
                  @{post.pageAuthor.slug}
                </span>
                <span>·</span>
                <span className="shrink-0">{timeAgo(post.createdAt)}</span>
                {displayLocation && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{displayLocation}</span>
                    </span>
                  </>
                )}
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link
              to={`/user/${post.creator?.id || post.creator?._id}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            >
              <Avatar
                src={post.creator?.avatar}
                name={post.creator?.name || 'User'}
                size="md"
                className="shadow-sm"
              />
            </Link>
            <Link
              to={`/user/${post.creator?.id || post.creator?._id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 block"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] text-zinc-900 truncate">
                  {post.creator?.organizationName || post.creator?.name || 'User'}
                </span>
                {post.creator?.isNINVerified && (
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {(post.creator?.accountType === 'organization' ||
                  post.creator?.accountType === 'business') && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 shrink-0">
                    {post.creator?.accountType === 'business' ? 'Biz' : 'Org'}
                  </span>
                )}
              </div>
              <div className="text-[13px] text-zinc-500 flex items-center gap-1 mt-0.5">
                <span className="truncate">
                  {post.creator?.username
                    ? post.creator.username.startsWith('@')
                      ? post.creator.username
                      : `@${post.creator.username}`
                    : ''}
                </span>
                <span>·</span>
                <span className="shrink-0">{timeAgo(post.createdAt)}</span>
                {displayLocation && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{displayLocation}</span>
                    </span>
                  </>
                )}
              </div>
            </Link>
          </>
        )}

        {/* Overflow menu — right side */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            className="p-1 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-[30]"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden z-[40] py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isOwner && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                  <a
                    href={`/rally/${isRallyContent ? post.id : ''}`}
                    onClick={(e) => {
                      if (!isRallyContent) {
                        e.preventDefault();
                        showToast('Post', 'View the post on the profile.');
                      }
                    }}
                    className="block w-full px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    View details
                  </a>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── 2. POST CONTENT with small RALLY tag ──────────────────────── */}
      {content ? (
        <p className="mt-2.5 text-[15px] leading-relaxed text-zinc-900 whitespace-pre-wrap break-words">
          {content}
          {hashtags.map((tag) => (
            <span key={tag} className="text-indigo-600 font-semibold">
              {' '}
              #{tag}
            </span>
          ))}
          {isRally && (
            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/80 align-middle">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
              Rally
            </span>
          )}
        </p>
      ) : isRally && (
        <p className="mt-2.5 text-[15px] leading-relaxed text-zinc-900 font-semibold flex items-center gap-2">
          <span>{post.title}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/80 align-middle">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
            Rally
          </span>
        </p>
      )}

      {/* ── 3. MEDIA ───────────────────────────────────────────────────── */}
      {post.mediaUrl && !imgError && (
        <div className="mt-3 rounded-2xl overflow-hidden bg-zinc-950/5 relative">
          {post.mediaType === 'video' ||
          post.mediaUrl.endsWith('.mp4') ||
          post.mediaUrl.endsWith('.webm') ||
          post.mediaUrl.endsWith('.mov') ||
          post.mediaUrl.includes('stream.mux.com') ? (
            <video
              src={post.mediaUrl}
              className="w-full max-h-[480px] object-cover bg-black"
              controls
              playsInline
              preload="metadata"
              onError={() => setImgError(true)}
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt=""
              className="w-full max-h-[480px] object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>
      )}

      {/* ── OPTIONAL CONTEXT: Event-post association (POST linked to a RALLY) ── */}
      {post.rallyLinkId && post.linkedEvent && (
        <Link
          to={`/rally/${post.rallyLinkId}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-violet-50/70 border border-violet-100 hover:bg-violet-100 transition-colors"
        >
          <Calendar className="w-4 h-4 text-violet-600 shrink-0" />
          <span className="text-xs font-semibold text-violet-700 truncate">
            Part of a RALLY · {post.linkedEvent}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-violet-400 ml-auto shrink-0" />
        </Link>
      )}

      {/* ── 4. SOCIAL INTERACTION ROW: [ RALLY hand ] [ Like ] [ Comment ] [ Repost ] [ Share ] ── */}
      <div className="mt-3 pt-2.5 flex items-center justify-between sm:justify-start sm:gap-6 border-t border-zinc-100/90 text-zinc-500 text-xs sm:text-sm">
        {/* RALLY hand (distinctive action for joining Rally) */}
        {isRally && (
          <button
            onClick={handleRsvp}
            title={localRsvpd ? 'Leave Rally' : 'Join Rally'}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-90 cursor-pointer',
              localRsvpd
                ? 'text-violet-600 bg-violet-50 font-bold'
                : 'text-zinc-500 hover:text-violet-600 hover:bg-violet-50/60'
            )}
          >
            <HelpingHand className={cn('w-4 h-4 sm:w-4.5 sm:h-4.5', localRsvpd && 'text-violet-600 stroke-[2.5]')} />
            <span>{localRsvpCount}</span>
          </button>
        )}

        {/* Like */}
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm transition-colors hover:bg-zinc-100 active:scale-90 cursor-pointer',
            localLiked ? 'text-rose-500 font-semibold' : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          <Heart className={cn('w-4 h-4 sm:w-4.5 sm:h-4.5', localLiked && 'fill-current text-rose-500')} />
          <span>{localLikeCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments((v) => !v);
          }}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm transition-colors hover:bg-zinc-100 active:scale-90 cursor-pointer',
            showComments ? 'text-indigo-600 font-semibold' : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>{post.commentsCount ?? 0}</span>
        </button>

        {/* Repost */}
        <button
          onClick={handleRepost}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm transition-colors hover:bg-zinc-100 active:scale-90 cursor-pointer',
            localReposted ? 'text-emerald-600 font-semibold' : 'text-zinc-500 hover:text-zinc-700'
          )}
          title={localReposted ? 'Undo repost' : 'Repost'}
        >
          <Repeat2 className={cn('w-4 h-4 sm:w-4.5 sm:h-4.5', localReposted && 'text-emerald-600 stroke-[2.5]')} />
          <span>{localRepostCount}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm text-zinc-500 hover:text-zinc-700 transition-colors hover:bg-zinc-100 active:scale-90 cursor-pointer"
          title="Share"
        >
          <Share2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="hidden sm:inline text-xs font-medium">Share</span>
        </button>
      </div>

      {/* ── COMMENTS PANEL ─────────────────────────────────────────────── */}
      {showComments && (
        <div
          className="mt-3 pt-3 border-t border-zinc-100 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || !convexUserId || isSubmittingComment}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors"
            >
              Post
            </button>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {comments === undefined ? (
              <div className="text-xs text-zinc-400 text-center py-2">Loading…</div>
            ) : comments.length === 0 ? (
              <div className="text-xs text-zinc-400 text-center py-2">No comments yet. Be the first!</div>
            ) : (
              comments.map((c: any) => (
                <div key={c._id} className="flex gap-2.5">
                  <Avatar src={c.user?.avatar} name={c.user?.name} size="sm" />
                  <div className="flex-1 bg-zinc-50 p-2.5 rounded-xl rounded-tl-none relative group/comment">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-bold text-xs text-zinc-900">
                        {c.user?.name || 'User'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700">{c.text}</p>
                    {c.userId === convexUserId && (
                      <button
                        onClick={async () => {
                          await deleteCommentMut({
                            commentId: c._id,
                            userId: convexUserId as any,
                          });
                        }}
                        className="absolute -right-2 -top-2 p-1 bg-white shadow-sm border border-zinc-200 rounded-full text-rose-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                        title="Delete comment"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </motion.article>
  );
}
