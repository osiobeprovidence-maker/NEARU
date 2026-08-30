import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  HandMetal,
  HandHeart,
  Handshake,
  Heart,
  Users,
  CheckCircle2,
  BadgeCheck,
  Calendar,
  Play,
  Hash,
  MessageCircle,
  X,
  Share2,
  MoreVertical,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Rally } from '../types';
import { cn } from '../lib/utils';
import Avatar from './Avatar';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';

interface RallyCardProps {
  rally: Rally;
  /** Called after successful deletion so parent can remove the card */
  onDeleted?: (id: string) => void;
}

export default function RallyCard({ rally, onDeleted }: RallyCardProps) {
  // Optimistic like state
  const [localLiked, setLocalLiked] = useState(rally.isLiked ?? false);
  const [localLikeCount, setLocalLikeCount] = useState(rally.likesCount ?? 0);
  // Optimistic RSVP state
  const [localRsvpd, setLocalRsvpd] = useState(rally.isRsvpd ?? false);
  const [localRsvpCount, setLocalRsvpCount] = useState(rally.rsvpsCount ?? 0);

  const [imgError, setImgError] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Delete state
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
    showComments ? { rallyId: rally.id as any } : 'skip'
  );

  const isOwner = !!convexUserId && convexUserId === rally.creator.id;

  const isEvent = rally.type === 'EVENT';
  const isPost = rally.type === 'POST';
  const isAsk = rally.type === 'ASK';
  const isHelp = rally.type === 'HELP';
  const isJoin = rally.type === 'JOIN';

  const typeConfig = {
    ASK: {
      icon: HandMetal,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    },
    HELP: {
      icon: HandHeart,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    JOIN: {
      icon: Handshake,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    },
    EVENT: {
      icon: Calendar,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
      badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    },
    POST: {
      icon: Hash,
      color: 'text-zinc-600',
      bg: 'bg-zinc-100',
      badge: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
    },
  };

  const config = typeConfig[rally.type];
  const Icon = config.icon;

  // Action button labels
  const defaultActionText = isAsk
    ? 'I CAN HELP'
    : isHelp
    ? "I'M INTERESTED"
    : isEvent
    ? "I'm Coming"
    : isJoin
    ? 'JOIN'
    : null; // POST type has no action CTA

  const takenActionText = isAsk
    ? 'OFFER SENT'
    : isHelp
    ? 'INTEREST SENT'
    : isEvent
    ? "✓ You're coming"
    : 'JOINED';

  // Is the event at capacity?
  const isFull =
    isEvent &&
    rally.capacity &&
    rally.capacity > 0 &&
    localRsvpCount >= rally.capacity &&
    !localRsvpd;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!convexUserId) {
      showToast('Not logged in', 'Please log in to like posts.');
      return;
    }
    // Optimistic update
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    try {
      await toggleLikeMut({
        rallyId: rally.id as any,
        userId: convexUserId as any,
      });
    } catch {
      // Revert on failure
      setLocalLiked(wasLiked);
      setLocalLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!convexUserId) {
      showToast('Not logged in', 'Please log in to respond.');
      return;
    }
    if (isFull) {
      showToast('Event Full', 'This event has reached its capacity.');
      return;
    }

    // Optimistic update
    const wasRsvpd = localRsvpd;
    setLocalRsvpd(!wasRsvpd);
    setLocalRsvpCount((c) => (wasRsvpd ? Math.max(0, c - 1) : c + 1));

    try {
      await toggleRsvpMut({
        rallyId: rally.id as any,
        userId: convexUserId as any,
      });
      showToast(
        !wasRsvpd ? takenActionText : 'Cancelled',
        !wasRsvpd ? 'The creator will be notified.' : ''
      );
    } catch (err) {
      // Revert
      setLocalRsvpd(wasRsvpd);
      setLocalRsvpCount((c) => (wasRsvpd ? c + 1 : Math.max(0, c - 1)));
      const msg =
        err instanceof Error ? err.message : 'Something went wrong.';
      showToast('Error', msg);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !convexUserId || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      await addCommentMut({
        rallyId: rally.id as any,
        userId: convexUserId as any,
        text: commentText.trim(),
      });
      setCommentText('');
    } catch (err) {
      showToast('Error', 'Could not post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${rally.title} — ${rally.locationLabel || rally.city || 'Nearby'}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: rally.title, text, url: window.location.origin });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied!', 'Post details copied to clipboard.');
    } catch {}
  };

  const handleDeleteConfirmed = async () => {
    if (!convexUserId) return;
    setIsDeleting(true);
    try {
      await deleteRallyMut({
        rallyId: rally.id as any,
        requestingUserId: convexUserId as any,
      });
      setShowDeleteConfirm(false);
      showToast('RALLY deleted.', '');
      // Notify parent to remove card from list
      onDeleted?.(rally.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast("Couldn't delete this RALLY.", msg || 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 group hover:bg-zinc-50/50 transition-colors"
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
                Delete this RALLY?
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

      {/* Creator row */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to={`/user/${rally.creator.id}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <Avatar
            src={rally.creator.avatar}
            name={rally.creator.name}
            size="md"
            className="border-2 border-white shadow-sm"
          />
        </Link>
        <Link
          to={`/user/${rally.creator.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 block"
        >
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm text-zinc-900 truncate">
              {rally.creator.organizationName || rally.creator.name}
            </span>
            {rally.creator.isNINVerified && (
              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {(rally.creator.accountType === 'organization' || rally.creator.accountType === 'business') && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 shrink-0">
                {rally.creator.accountType === 'business' ? 'Biz' : 'Org'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
            <span>
              {rally.creator.username
                ? rally.creator.username.startsWith('@')
                  ? rally.creator.username
                  : `@${rally.creator.username}`
                : ''}
            </span>
            {rally.city && (
              <>
                <span>·</span>
                <span>{rally.city}</span>
              </>
            )}
          </div>
        </Link>

        {/* Type + paid badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ring-1 ring-inset',
              config.badge
            )}
          >
            {rally.type}
          </div>
          {rally.isPaid ? (
            <div className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
              {rally.price ? `₦${rally.price.toLocaleString()}` : 'PAID'}
            </div>
          ) : (
            <div className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200">
              FREE
            </div>
          )}
        </div>

        {/* Three-dot menu — only for the owner */}
        {isOwner && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
              className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
            >
              <MoreVertical className="w-4 h-4" />
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
                    className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden z-[40] py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Hashtags */}
      {rally.hashtags && rally.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {rally.hashtags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Event association (event posts in feed) */}
      {rally.rallyLinkId && rally.linkedEvent && (
        <Link
          to={`/rally/${rally.rallyLinkId}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 text-[11px] font-bold mb-3 hover:bg-violet-100 transition-colors"
        >
          <Calendar className="w-3 h-3" />
          Event: {rally.linkedEvent}
        </Link>
      )}

      {/* Title + Description */}
      {!isPost ? (
        <Link
          to={`/rally/${rally.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block"
        >
          <h3 className="text-base font-bold text-zinc-900 hover:text-indigo-600 transition-colors mb-1.5 leading-snug">
            {rally.title}
          </h3>
        </Link>
      ) : (
        <h3 className="text-base font-bold text-zinc-900 mb-1.5 leading-snug">
          {rally.title}
        </h3>
      )}
      <p className="text-sm text-zinc-600 leading-relaxed mb-4 line-clamp-3">
        {rally.description}
      </p>

      {/* Media */}
      {rally.mediaUrl && !imgError && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
          {rally.mediaType === 'image' ? (
            <img
              src={rally.mediaUrl}
              alt=""
              className="w-full max-h-72 object-cover"
              onError={() => setImgError(true)}
            />
          ) : rally.mediaType === 'video' ? (
            <div className="relative w-full h-48">
              <video
                src={rally.mediaUrl}
                className="w-full h-full object-cover"
                controls
                onError={() => setImgError(true)}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {(rally.locationLabel || rally.city) && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
            <MapPin className="w-3.5 h-3.5" />
            {rally.locationLabel || rally.city}
          </div>
        )}
        {rally.time && rally.time !== 'Soon' && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            {rally.time}
          </div>
        )}
        {rally.eventDate && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
            <Calendar className="w-3.5 h-3.5" />
            {rally.eventDate}
          </div>
        )}
        {isEvent && rally.capacity && rally.capacity > 0 && (
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md',
              isFull
                ? 'bg-rose-50 text-rose-600'
                : 'bg-indigo-50 text-indigo-600'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            {isFull
              ? 'SOLD OUT'
              : `${Math.max(0, rally.capacity - localRsvpCount)} SPOTS LEFT`}
          </div>
        )}
      </div>

      {/* RSVP count for events */}
      {isEvent && localRsvpCount > 0 && (
        <p className="text-xs font-semibold text-zinc-500 mb-3">
          <span className="font-bold text-zinc-900">{localRsvpCount}</span>{' '}
          {localRsvpCount === 1 ? 'person is' : 'people are'} coming
          {rally.capacity && rally.capacity > 0
            ? ` · ${rally.capacity} max`
            : ''}
        </p>
      )}

      {/* Engagement row */}
      <div className="flex items-center gap-4 pt-4 border-t border-zinc-100">
        {/* Like */}
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 text-sm font-semibold transition-colors active:scale-90',
            localLiked
              ? 'text-rose-500'
              : 'text-zinc-400 hover:text-zinc-600'
          )}
        >
          <Heart className={cn('w-5 h-5', localLiked && 'fill-current')} />
          <span>{localLikeCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(!showComments);
          }}
          className={cn(
            'flex items-center gap-1.5 text-sm font-semibold transition-colors',
            showComments
              ? 'text-indigo-600'
              : 'text-zinc-400 hover:text-zinc-600'
          )}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{rally.commentsCount ?? 0}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Spacer + action CTA */}
        {defaultActionText && (
          <button
            onClick={handleActionClick}
            disabled={!!isFull}
            className={cn(
              'ml-auto px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 shrink-0',
              isFull
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : localRsvpd
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                : 'bg-zinc-900 hover:bg-zinc-700 text-white shadow-sm'
            )}
          >
            {localRsvpd && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />}
            {isFull ? 'FULL' : localRsvpd ? takenActionText : defaultActionText}
          </button>
        )}
      </div>

      {/* Comments panel */}
      {showComments && (
        <div
          className="mt-4 pt-4 border-t border-zinc-100 space-y-4"
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
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tiny helper — avoids importing toast context in card
// ---------------------------------------------------------------------------
function showToast(title: string, subtitle: string) {
  window.dispatchEvent(
    new CustomEvent('show-toast', { detail: { title, subtitle } })
  );
}
