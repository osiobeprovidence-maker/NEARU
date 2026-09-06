import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  XCircle,
  Play,
  Trash2,
  Loader2,
  Send,
  MoreVertical,
  Banknote,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { ProfileVerificationCheck } from '../components/VerificationBadge';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import { cn } from '../lib/utils';
import { waitForPlayback } from '../lib/mux';

function showToast(title: string, subtitle: string) {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));
}

function timeAgo(dateInput: string | number): string {
  const then = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(then).toLocaleDateString();
}

export default function RallyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { convexUserId } = useAuth();
  const rallyId = id as any;

  const rallyDoc = useQuery(
    api.rallies.get,
    convexUserId ? { rallyId, viewerId: convexUserId as any } : { rallyId }
  );

  const comments = useQuery(api.rallies.getComments, { rallyId });

  const joinRallyMut = useMutation(api.rallies.joinRally);
  const leaveRallyMut = useMutation(api.rallies.leaveRally);
  const updateStatusMut = useMutation(api.rallies.updateStatus);
  const toggleLikeMut = useMutation(api.rallies.toggleLike);
  const addCommentMut = useMutation(api.rallies.addComment);
  const deleteCommentMut = useMutation(api.rallies.deleteComment);
  const deleteRallyMut = useMutation(api.rallies.deleteRally);
  const saveMuxResult = useMutation(api.rallies.saveMuxResult);

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [retryingVideo, setRetryingVideo] = useState(false);

  // Deletion modal
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (rallyDoc === undefined) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-6 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Loading Rally details…</p>
        </div>
      </div>
    );
  }

  if (rallyDoc === null) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">RALLY Not Found</h2>
        <p className="text-sm text-zinc-500 mb-6">This request may have been removed or deleted.</p>
        <button
          onClick={() => navigate('/rallies')}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-bold hover:bg-zinc-800 transition-colors"
        >
          Browse Rallies
        </button>
      </div>
    );
  }

  const isOwner = !!convexUserId && convexUserId === rallyDoc.creatorId?.toString();
  const isAsk = rallyDoc.type === 'ASK';
  const isHelp = rallyDoc.type === 'HELP';
  const isJoined = Boolean(rallyDoc.isParticipant || rallyDoc.isRsvpd);

  const effectiveReward =
    rallyDoc.rewardAmount ||
    (rallyDoc.pricing === 'paid' && rallyDoc.price ? rallyDoc.price : undefined);
  const rewardCurrency = rallyDoc.rewardCurrency || 'NGN';
  const formattedReward = effectiveReward
    ? rewardCurrency === 'NGN'
      ? `₦${Number(effectiveReward).toLocaleString()}`
      : `${rewardCurrency} ${Number(effectiveReward).toLocaleString()}`
    : null;

  const currentCount = rallyDoc.participantCount ?? (rallyDoc.peopleInterested || 0);
  const targetCapacity = rallyDoc.peopleNeeded || rallyDoc.capacity || 0;
  const isAtCapacity = targetCapacity > 0 && currentCount >= targetCapacity;
  const isFull = rallyDoc.status === 'FULL' || isAtCapacity;

  const handleLike = async () => {
    if (!convexUserId) {
      showToast('Not logged in', 'Please log in to like this Rally.');
      return;
    }
    try {
      await toggleLikeMut({
        rallyId,
        userId: convexUserId as any,
      });
    } catch {
      showToast('Error', 'Could not update like.');
    }
  };

  const handleShare = async () => {
    const text = `${rallyDoc.title} — ${rallyDoc.locationLabel || rallyDoc.city || 'Nearby'}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: rallyDoc.title, text, url: window.location.href });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link Copied!', 'Rally link copied to clipboard.');
    } catch {}
  };

  const handleJoin = async () => {
    if (!convexUserId) {
      showToast('Not logged in', 'Please log in to respond.');
      return;
    }
    if (isOwner) {
      showToast('Your Rally', 'You are the creator of this Rally.');
      return;
    }
    if (isFull) {
      showToast('Rally Full', 'This Rally has reached helper capacity.');
      return;
    }

    setIsJoining(true);
    try {
      const res = await joinRallyMut({ rallyId });
      showToast('Offer Sent!', 'A private conversation with the creator has been opened.');
      if (res?.conversationId) {
        navigate(`/messages`);
      }
    } catch (err: any) {
      showToast('Could not respond', err?.message || 'Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!convexUserId) return;
    setIsLeaving(true);
    try {
      await leaveRallyMut({ rallyId });
      showToast('Cancelled', 'You left this Rally.');
    } catch (err: any) {
      showToast('Error', err?.message || 'Could not leave Rally.');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'ACTIVE' | 'FULL' | 'COMPLETED' | 'CANCELLED') => {
    if (!convexUserId || !isOwner) return;
    setIsUpdatingStatus(true);
    try {
      await updateStatusMut({
        rallyId,
        requestingUserId: convexUserId as any,
        status: newStatus,
      });
      showToast('Status Updated', `Rally marked as ${newStatus}.`);
    } catch (err: any) {
      showToast('Error', err?.message || 'Could not update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!convexUserId || !isOwner) return;
    setIsDeleting(true);
    try {
      await deleteRallyMut({
        rallyId,
        requestingUserId: convexUserId as any,
      });
      showToast('Rally Deleted', '');
      navigate('/my-rallies');
    } catch (err: any) {
      showToast("Couldn't delete Rally", err?.message || 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !convexUserId || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      await addCommentMut({
        rallyId,
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

  const handleRetryVideo = async () => {
    if (!convexUserId || retryingVideo) return;
    const uploadId = rallyDoc.muxUploadId as string | undefined;
    if (!uploadId) return;
    setRetryingVideo(true);
    try {
      const { assetId, playbackId } = await waitForPlayback(uploadId, undefined, 120);
      if (!assetId || !playbackId) throw new Error('Video is still processing.');
      await saveMuxResult({
        rallyId,
        requestingUserId: convexUserId as any,
        assetId,
        playbackId,
      });
      showToast('Video ready', 'Your video is now available.');
    } catch (e: any) {
      showToast('Still processing', e?.message || 'Try again in a moment.');
    } finally {
      setRetryingVideo(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 pb-28">
      {/* Delete confirmation modal */}
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
                This action cannot be undone. All responses, comments, and records will be deleted.
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

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 -ml-2 rounded-full text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title="Share Rally"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="p-2 rounded-full text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
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
                      className="absolute right-0 top-10 w-40 bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden z-[40] py-1"
                    >
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Rally
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Main Request Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden mb-6">
        <div className="p-5 sm:p-7">
          {/* Header Badges: [TYPE] [STATUS] [REWARD] */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Type badge */}
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ring-1 ring-inset',
                rallyDoc.type === 'ASK'
                  ? 'bg-rose-50 text-rose-700 ring-rose-200'
                  : rallyDoc.type === 'HELP'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : rallyDoc.type === 'JOIN'
                  ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                  : 'bg-zinc-100 text-zinc-700 ring-zinc-200'
              )}
            >
              {rallyDoc.type}
            </span>

            {/* Status badge */}
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ring-1 ring-inset',
                rallyDoc.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : rallyDoc.status === 'FULL' || isFull
                  ? 'bg-amber-50 text-amber-700 ring-amber-200'
                  : rallyDoc.status === 'COMPLETED'
                  ? 'bg-zinc-100 text-zinc-600 ring-zinc-200'
                  : 'bg-rose-50 text-rose-600 ring-rose-200'
              )}
            >
              {rallyDoc.status === 'FULL' || isFull
                ? 'FULL · CAPACITY REACHED'
                : rallyDoc.status}
            </span>

            {/* Reward pill */}
            {formattedReward && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-300">
                <span>💰</span>
                <span>{formattedReward} Reward</span>
              </span>
            )}
          </div>

          {/* Topic / Headline */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 leading-tight mb-4 tracking-tight">
            {rallyDoc.title}
          </h1>

          {/* Posted by card */}
          {rallyDoc.creator && (
            <div className="flex items-center gap-3 p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-100 mb-6">
              <Link
                to={`/user/${rallyDoc.creator._id}`}
                className="shrink-0 hover:opacity-90 transition-opacity"
              >
                <Avatar
                  src={rallyDoc.creator.avatar}
                  name={rallyDoc.creator.name}
                  size="md"
                  className="border border-white shadow-2xs"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    to={`/user/${rallyDoc.creator._id}`}
                    className="font-bold text-sm text-zinc-900 hover:text-indigo-600 transition-colors truncate"
                  >
                    {rallyDoc.creator.name}
                  </Link>
                  <ProfileVerificationCheck user={rallyDoc.creator} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                  <span>@{rallyDoc.creator.username || 'user'}</span>
                  <span>·</span>
                  <span>{timeAgo(rallyDoc.createdAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Media Section */}
          {rallyDoc.mediaType === 'video' && !rallyDoc.muxPlaybackId && rallyDoc.muxUploadId ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col items-center gap-2 text-center">
              <Loader2 className="w-6 h-6 text-amber-500" />
              <p className="text-sm font-bold text-amber-800">Video is processing</p>
              <p className="text-xs text-amber-700">
                Transcoding in progress.
                {isOwner ? ' You can retry checking for playback now.' : ' Please check back shortly.'}
              </p>
              {isOwner && (
                <button
                  onClick={handleRetryVideo}
                  disabled={retryingVideo}
                  className="mt-1 px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
                >
                  {retryingVideo ? 'Checking…' : 'Retry video'}
                </button>
              )}
            </div>
          ) : rallyDoc.mediaUrl ? (
            <div className="mb-6 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
              {rallyDoc.mediaType === 'video' ? (
                <div className="relative w-full aspect-video">
                  <video src={rallyDoc.mediaUrl} className="w-full h-full object-cover" controls />
                </div>
              ) : (
                <img
                  src={rallyDoc.mediaUrl}
                  alt=""
                  className="w-full max-h-[480px] object-cover"
                />
              )}
            </div>
          ) : null}

          {/* Request Details */}
          <div className="mb-6">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Request Details
            </h2>
            <div className="text-base leading-relaxed text-zinc-800 whitespace-pre-wrap break-words">
              {rallyDoc.description}
            </div>
            {rallyDoc.hashtags && rallyDoc.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {rallyDoc.hashtags.map((tag: string) => (
                  <span key={tag} className="text-xs font-semibold text-indigo-600">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Structured Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-6 border-t border-zinc-100">
            {/* Reward */}
            {formattedReward && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-700">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Reward</p>
                  <p className="text-sm font-black text-emerald-800 mt-0.5">{formattedReward}</p>
                </div>
              </div>
            )}

            {/* Helpers Capacity */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
              <div className="p-2 rounded-lg bg-indigo-100/70 text-indigo-700">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Helpers</p>
                <p className="text-sm font-black text-zinc-900 mt-0.5">
                  {targetCapacity > 0 ? (
                    <>
                      {currentCount} / {targetCapacity} joined
                      {isFull && <span className="ml-1.5 text-xs text-amber-600 font-bold">(Full)</span>}
                    </>
                  ) : (
                    <>{currentCount} joined</>
                  )}
                </p>
              </div>
            </div>

            {/* Location */}
            {(rallyDoc.locationLabel || rallyDoc.city) && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="p-2 rounded-lg bg-rose-100/70 text-rose-700">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Location</p>
                  <p className="text-sm font-semibold text-zinc-800 mt-0.5 truncate">
                    {rallyDoc.locationLabel || rallyDoc.city}
                  </p>
                </div>
              </div>
            )}

            {/* Date & Time */}
            {(rallyDoc.eventDate || (rallyDoc.time && rallyDoc.time !== 'Soon')) && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="p-2 rounded-lg bg-amber-100/70 text-amber-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Date & Time</p>
                  <p className="text-sm font-semibold text-zinc-800 mt-0.5">
                    {rallyDoc.eventDate ? rallyDoc.eventDate : ''}
                    {rallyDoc.time && rallyDoc.time !== 'Soon'
                      ? ` · ${rallyDoc.time}`
                      : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action CTA Section */}
          <div className="mt-7 pt-6 border-t border-zinc-100">
            {isOwner ? (
              /* Owner View */
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-zinc-200 text-zinc-700 text-xs font-bold uppercase tracking-wider mb-1">
                      Your Rally
                    </span>
                    <p className="text-xs text-zinc-500">
                      Manage the progress of this request.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {rallyDoc.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus('COMPLETED')}
                      disabled={isUpdatingStatus}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Completed
                    </button>
                  )}
                  {rallyDoc.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus('ACTIVE')}
                      disabled={isUpdatingStatus}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-2xs disabled:opacity-50"
                    >
                      Reopen Rally
                    </button>
                  )}
                  {rallyDoc.status !== 'CANCELLED' && rallyDoc.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus('CANCELLED')}
                      disabled={isUpdatingStatus}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs sm:text-sm transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Rally
                    </button>
                  )}
                </div>
              </div>
            ) : isJoined ? (
              /* Viewer has joined */
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">You joined this Rally!</h3>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      A private 1:1 conversation with the creator has been opened in Messages.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <Link
                    to="/messages"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Open Conversation
                  </Link>
                  <button
                    onClick={handleLeave}
                    disabled={isLeaving}
                    className="px-4 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isLeaving ? 'Leaving…' : 'Leave Rally'}
                  </button>
                </div>
              </div>
            ) : rallyDoc.status === 'COMPLETED' ? (
              /* Completed notice */
              <div className="p-4 rounded-xl bg-zinc-100 text-center text-zinc-600 text-sm font-medium">
                This Rally has been marked as completed.
              </div>
            ) : rallyDoc.status === 'CANCELLED' ? (
              /* Cancelled notice */
              <div className="p-4 rounded-xl bg-rose-50 text-center text-rose-700 text-sm font-medium">
                This Rally has been cancelled by the creator.
              </div>
            ) : isFull ? (
              /* Full capacity */
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-sm font-bold text-amber-900">Rally Capacity Reached</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  All helper spots have been filled for this request.
                </p>
              </div>
            ) : (
              /* Active CTA button */
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm tracking-wide shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Responding…
                  </>
                ) : isAsk ? (
                  'I CAN HELP'
                ) : isHelp ? (
                  "I'M INTERESTED"
                ) : (
                  'JOIN RALLY'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Engagement Row */}
        <div className="px-5 sm:px-7 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center gap-6 text-sm">
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-1.5 font-semibold transition-colors',
              rallyDoc.isLiked
                ? 'text-rose-600 font-bold'
                : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            <Heart className={cn('w-4 h-4', rallyDoc.isLiked && 'fill-current')} />
            <span>{rallyDoc.likesCount ?? 0}</span>
          </button>

          <div className="flex items-center gap-1.5 text-zinc-500 font-semibold">
            <MessageCircle className="w-4 h-4" />
            <span>{rallyDoc.commentsCount ?? 0} comments</span>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Social Comments Section */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs p-5 sm:p-7">
        <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
          <span>Comments</span>
          <span className="text-xs text-zinc-400 font-bold">
            ({comments?.length ?? rallyDoc.commentsCount ?? 0})
          </span>
        </h2>

        {/* Comment input */}
        <div className="flex gap-2.5 mb-6">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment or ask a question…"
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
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors shrink-0 flex items-center gap-1.5"
          >
            {isSubmittingComment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </>
            )}
          </button>
        </div>

        {/* Comments list */}
        <div className="space-y-3.5">
          {comments === undefined ? (
            <div className="text-center py-6 text-xs text-zinc-400">Loading comments…</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-400">
              No comments yet. Be the first to leave a thought!
            </div>
          ) : (
            comments.map((c: any) => (
              <div key={c._id} className="flex gap-3 items-start group/comment">
                <Link to={`/user/${c.userId}`} className="shrink-0">
                  <Avatar src={c.user?.avatar} name={c.user?.name} size="sm" />
                </Link>
                <div className="flex-1 bg-zinc-50/90 rounded-2xl p-3 border border-zinc-100">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/user/${c.userId}`}
                        className="font-bold text-xs text-zinc-900 hover:text-indigo-600 transition-colors"
                      >
                        {c.user?.name || 'User'}
                      </Link>
                      <ProfileVerificationCheck user={c.user} size="sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400">
                        {timeAgo(c.createdAt)}
                      </span>
                      {c.userId === convexUserId && (
                        <button
                          onClick={async () => {
                            await deleteCommentMut({
                              commentId: c._id,
                              userId: convexUserId as any,
                            });
                          }}
                          className="text-zinc-400 hover:text-rose-500 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">
                    {c.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
