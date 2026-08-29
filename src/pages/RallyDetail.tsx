import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Bell,
  BellOff,
  Trophy,
  Megaphone,
  MessageCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  Play,
  Trash2,
  Hash,
  Send,
  Crown,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import { cn } from '../lib/utils';
import { waitForPlayback } from '../lib/mux';
import { Rally } from '../types';

type Tab = 'feed' | 'participants' | 'results' | 'leaderboard' | 'updates';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  LIVE: 'bg-rose-50 text-rose-600 ring-rose-200',
  COMPLETED: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  CANCELLED: 'bg-rose-50 text-rose-600 ring-rose-200',
};

function mapRally(r: any): Rally {
  return {
    id: r._id,
    type: r.type,
    title: r.title,
    description: r.description,
    distance: 0,
    time: r.time,
    peopleNeeded: r.peopleNeeded,
    peopleInterested: r.peopleInterested,
    isPaid: r.isPaid,
    price: r.price,
    creator: r.creator
      ? {
          id: r.creator._id,
          name: r.creator.name,
          username: r.creator.username,
          avatar: r.creator.avatar,
          isNINVerified: r.creator.isNINVerified,
          isPhoneVerified: false,
          badges: r.creator.badges,
        }
      : {
          id: 'unknown',
          name: 'Unknown',
          username: '@unknown',
          avatar: '',
          isNINVerified: false,
          isPhoneVerified: false,
        },
    status: r.status,
    createdAt: new Date(r.createdAt).toISOString(),
    city: r.city,
    locationLabel: r.locationLabel,
    rallyLatitude: r.rallyLatitude,
    rallyLongitude: r.rallyLongitude,
    category: r.category,
    hashtags: r.hashtags,
    eventDate: r.eventDate,
    endTime: r.endTime,
    mediaUrl: r.mediaUrl,
    mediaType: r.mediaType,
    capacity: r.capacity,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    rsvpsCount: r.rsvpsCount,
    isLiked: r.isLiked,
    isRsvpd: r.isRsvpd,
    eventTag: r.eventTag,
    interests: r.interests,
    scoring: r.scoring,
    rallyLinkId: r.rallyLinkId,
  };
}

function showToast(title: string, subtitle: string) {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));
}

export default function RallyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { convexUserId } = useAuth();
  const rallyId = id as any;

  const [tab, setTab] = useState<Tab>('feed');

  const rallyDoc = useQuery(api.rallies.get, { rallyId });
  const rel = useQuery(
    api.eventHub.getRelationship,
    convexUserId ? { rallyId, userId: convexUserId as any } : { rallyId }
  );
  const participants = useQuery(
    api.eventHub.getParticipants,
    convexUserId ? { rallyId, viewerId: convexUserId as any } : { rallyId }
  );
  const followers = useQuery(
    api.eventHub.getFollowers,
    convexUserId ? { rallyId, viewerId: convexUserId as any } : { rallyId }
  );
  const results = useQuery(
    api.eventHub.getResults,
    convexUserId ? { rallyId, viewerId: convexUserId as any } : { rallyId }
  );
  const leaderboard = useQuery(
    api.eventHub.getLeaderboard,
    convexUserId ? { rallyId, viewerId: convexUserId as any } : { rallyId }
  );
  const announcements = useQuery(api.eventHub.listAnnouncements, { rallyId });
  const eventsPosts = useQuery(
    api.rallies.getEventPosts,
    convexUserId ? { rallyId, viewerId: convexUserId as any } : { rallyId }
  );

  const joinMut = useMutation(api.eventHub.joinRally);
  const leaveMut = useMutation(api.eventHub.leaveRally);
  const followMut = useMutation(api.eventHub.followRally);
  const unfollowMut = useMutation(api.eventHub.unfollowRally);
  const removeMut = useMutation(api.eventHub.removeParticipant);
  const submitResultMut = useMutation(api.eventHub.submitResult);
  const approveMut = useMutation(api.eventHub.approveResult);
  const rejectMut = useMutation(api.eventHub.rejectResult);
  const announceMut = useMutation(api.eventHub.createAnnouncement);
  const deleteAnnounceMut = useMutation(api.eventHub.deleteAnnouncement);
  const setStatusMut = useMutation(api.eventHub.updateEventStatus);
  const openRallyChatMut = useMutation(api.messages.getOrOpenRallyChat);
  const saveMuxResult = useMutation(api.rallies.saveMuxResult);

  const [busyJoin, setBusyJoin] = useState(false);
  const [busyFollow, setBusyFollow] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [match, setMatch] = useState('');
  const [score, setScore] = useState('');
  const [opponent, setOpponent] = useState('');
  const [submittingResult, setSubmittingResult] = useState(false);
  const [retryingVideo, setRetryingVideo] = useState(false);

  const rally = useMemo(() => (rallyDoc ? mapRally(rallyDoc) : null), [rallyDoc]);
  const isOrg = rel?.isOrganizer ?? false;

  if (!rallyDoc) {
    return (
      <div className="px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-4 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  const handleJoin = async () => {
    if (!convexUserId) return showToast('Not logged in', 'Please log in to join.');
    setBusyJoin(true);
    try {
      await joinMut({ rallyId, userId: convexUserId as any });
      showToast('Joined!', 'You are now a participant.');
    } catch (e: any) {
      showToast('Error', e?.message || 'Could not join.');
    } finally {
      setBusyJoin(false);
    }
  };

  const handleLeave = async () => {
    if (!convexUserId) return;
    setBusyJoin(true);
    try {
      await leaveMut({ rallyId, userId: convexUserId as any });
      showToast('Left', 'You have left this RALLY.');
    } catch (e: any) {
      showToast('Error', e?.message || 'Could not leave.');
    } finally {
      setBusyJoin(false);
    }
  };

  const handleFollow = async () => {
    if (!convexUserId) return showToast('Not logged in', 'Please log in to follow.');
    setBusyFollow(true);
    try {
      if (rel?.following) await unfollowMut({ rallyId, userId: convexUserId as any });
      else await followMut({ rallyId, userId: convexUserId as any });
    } catch (e: any) {
      showToast('Error', e?.message || 'Could not update follow.');
    } finally {
      setBusyFollow(false);
    }
  };

  const handleChat = async () => {
    if (!convexUserId) return showToast('Not logged in', 'Please log in.');
    try {
      const convId = await openRallyChatMut({ rallyId, userId: convexUserId as any });
      navigate(`/messages/${convId}`);
    } catch (e: any) {
      showToast('Error', e?.message || 'You must be a participant to join the chat.');
    }
  };

  const handleRemove = async (targetUserId: string) => {
    if (!convexUserId) return;
    try {
      await removeMut({ rallyId, requestingUserId: convexUserId as any, targetUserId: targetUserId as any });
      showToast('Removed', 'Participant removed.');
    } catch (e: any) {
      showToast('Error', e?.message || 'Could not remove participant.');
    }
  };

  const handlePostUpdate = async () => {
    if (!convexUserId || !announceText.trim() || postingUpdate) return;
    setPostingUpdate(true);
    try {
      await announceMut({ rallyId, authorId: convexUserId as any, text: announceText.trim() });
      setAnnounceText('');
      showToast('Posted', 'Participants & followers were notified.');
    } catch (e: any) {
      showToast('Error', e?.message || 'Could not post update.');
    } finally {
      setPostingUpdate(false);
    }
  };

  // Resume processing for a Mux video that uploaded but never got a playback id
  // (e.g. the uploader closed the app before Mux finished transcoding, so the
  // fire-and-forget saveMuxResult never ran). The rally still holds muxUploadId;
  // we poll Mux again and persist the result.
  const handleRetryVideo = async () => {
    if (!convexUserId || retryingVideo) return;
    const uploadId = rallyDoc.muxUploadId as string | undefined;
    if (!uploadId) return;
    setRetryingVideo(true);
    try {
      const { assetId, playbackId } = await waitForPlayback(uploadId, undefined, 120);
      if (!assetId || !playbackId) throw new Error('Video is still processing.');
      await saveMuxResult({
        rallyId: rallyId as any,
        requestingUserId: convexUserId as any,
        assetId,
        playbackId,
      });
      showToast('Video ready', 'Your video is now playing.');
    } catch (e: any) {
      showToast('Still processing', e?.message || 'Try again in a moment.');
    } finally {
      setRetryingVideo(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!convexUserId || !match.trim() || score === '' || submittingResult) return;
    const scoreNum = Number(score);
    if (!Number.isFinite(scoreNum)) return showToast('Invalid score', 'Enter a number.');
    setSubmittingResult(true);
    try {
      await submitResultMut({
        rallyId,
        userId: convexUserId as any,
        match: match.trim(),
        score: scoreNum,
        opponent: opponent.trim() || undefined,
      });
      setShowResultForm(false);
      setMatch('');
      setScore('');
      setOpponent('');
      showToast('Submitted', 'The organizer will review your result.');
    } catch (e: any) {
      showToast('Error', e?.message || 'Could not submit result.');
    } finally {
      setSubmittingResult(false);
    }
  };

  const pending = (results ?? []).filter((r: any) => r.status === 'PENDING');

  return (
    <div className="px-0 md:px-8 pt-0 md:pt-8 pb-24 md:pb-8">
      {/* Back + title */}
      <div className="flex items-center gap-3 px-4 md:px-0 pt-3 md:pt-0 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black tracking-tight text-zinc-900 leading-tight">Event Hub</h1>
          {rel && (
            <p className="text-xs text-zinc-500 font-medium">
              {rel.participantCount} participants · {rel.followerCount} following
            </p>
          )}
        </div>
      </div>

      {/* Hero / event info */}
      <div className="bg-white md:rounded-2xl md:border md:border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ring-1 ring-inset', (STATUS_STYLES[rally.status] || STATUS_STYLES.ACTIVE))}>
            {rally.status}
          </span>
          {rally.eventTag && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100">
              <Hash className="w-3 h-3" /> {rally.eventTag.replace('#', '')}
            </span>
          )}
        </div>

        <h1 className="text-xl font-black text-zinc-900 leading-snug mb-1">{rally.title}</h1>
        <p className="text-sm text-zinc-600 leading-relaxed mb-4 whitespace-pre-wrap">{rally.description}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-500 mb-3">
          {rally.eventDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {rally.eventDate}
            </span>
          )}
          {rally.time && rally.time !== 'Soon' && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {rally.time}
            </span>
          )}
          {(rally.locationLabel || rally.city) && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {rally.locationLabel || rally.city}
            </span>
          )}
        </div>

        {(rally.interests?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {rally.interests!.map((i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                {i}
              </span>
            ))}
          </div>
        )}

        {rally.mediaType === 'video' && !rallyDoc.muxPlaybackId && rallyDoc.muxUploadId ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col items-center gap-2 text-center">
            <Loader2 className="w-6 h-6 text-amber-500" />
            <p className="text-sm font-bold text-amber-800">Video still processing</p>
            <p className="text-xs text-amber-700">
              Mux hasn't finished transcoding this video yet.
              {rallyDoc.creatorId?.toString() === convexUserId
                ? ' You can retry it now to attach the playback link.'
                : ' Check back shortly.'}
            </p>
            {rallyDoc.creatorId?.toString() === convexUserId && (
              <button
                onClick={handleRetryVideo}
                disabled={retryingVideo}
                className="mt-1 px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
              >
                {retryingVideo ? 'Checking…' : 'Retry video'}
              </button>
            )}
          </div>
        ) : rally.mediaUrl && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
            {rally.mediaType === 'video' ? (
              <div className="relative w-full h-52">
                <video src={rally.mediaUrl} className="w-full h-full object-cover" controls />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <img src={rally.mediaUrl} alt="" className="w-full max-h-72 object-cover" />
            )}
          </div>
        )}

        {/* Organizer card */}
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
          <Link to={`/user/${rally.creator.id}`} onClick={(e) => e.stopPropagation()}>
            <Avatar src={rally.creator.avatar} name={rally.creator.name} size="md" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-zinc-900 truncate">{rally.creator.name}</span>
              {rally.creator.isNINVerified && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
              </div>
            <span className="text-xs text-violet-600 font-semibold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> Organizer
            </span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap gap-2 mt-4">
          {isOrg ? (
            <button
              onClick={handleChat}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-bold transition-colors hover:bg-zinc-700"
            >
              <MessageCircle className="w-4 h-4" /> Open Chat
            </button>
          ) : (
            <button
              onClick={rel?.joined ? handleLeave : handleJoin}
              disabled={busyJoin}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-colors disabled:opacity-50',
                rel?.joined
                  ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
              )}
            >
              {busyJoin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              {rel?.joined ? 'Joined ✓' : 'Join RALLY'}
            </button>
          )}
          <button
            onClick={handleFollow}
            disabled={busyFollow}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-colors disabled:opacity-50',
              rel?.following ? 'bg-violet-50 text-violet-600 hover:bg-violet-100' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            )}
          >
            {busyFollow ? <Loader2 className="w-4 h-4 animate-spin" /> : rel?.following ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {rel?.following ? 'Following' : 'Follow'}
          </button>
          {!isOrg && rel?.joined && (
            <button
              onClick={() => setShowResultForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-50 text-amber-700 text-sm font-bold hover:bg-amber-100 transition-colors"
            >
              <Trophy className="w-4 h-4" /> Submit Result
            </button>
          )}
        </div>

        {/* Organizer status control */}
        {isOrg && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Control event status</p>
            <div className="flex flex-wrap gap-2">
              {(['ACTIVE', 'LIVE', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={async () => {
                    if (!convexUserId) return;
                    try {
                      await setStatusMut({ rallyId, requestingUserId: convexUserId as any, status: s });
                      showToast(s === 'LIVE' ? 'Event is LIVE!' : `Status: ${s}`, '');
                    } catch (e: any) {
                      showToast('Error', e?.message || 'Could not change status.');
                    }
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold ring-1 ring-inset transition-colors',
                    rally.status === s
                      ? STATUS_STYLES[s]
                      : 'ring-zinc-200 text-zinc-500 hover:bg-zinc-50'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-4 px-4 md:px-0 mb-4 overflow-x-auto">
        {([
          ['feed', 'Event Feed'],
          ['participants', 'Participants'],
          ['results', 'Results'],
          ['leaderboard', 'Leaderboard'],
          ['updates', 'Updates'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-3 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors',
              tab === key ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'
            )}
          >
            {label}
            {key === 'results' && pending.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-0">
        {tab === 'feed' && (
          <Section title="RALLY Feed" icon={<MessageCircle className="w-4 h-4" />}>
            {eventsPosts === undefined ? (
              <Loading />
            ) : eventsPosts.length === 0 ? (
              <Empty text="No posts linked to this RALLY yet." />
            ) : (
              <div className="space-y-3">
                {eventsPosts.map((p: any) => (
                  <PostCard key={p._id} post={p} />
                ))}
              </div>
            )}
          </Section>
        )}

        {tab === 'participants' && (
          <Section title="Participants" icon={<Users className="w-4 h-4" />}>
            {participants === undefined ? (
              <Loading />
            ) : participants.length === 0 ? (
              <Empty text="No participants yet. Be the first to join!" />
            ) : (
              <div className="space-y-2">
                {participants.map((p: any) => (
                  <div key={p._id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-200">
                    <Avatar src={p.avatar} name={p.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <Link to={`/user/${p._id}`} className="font-bold text-sm text-zinc-900 truncate flex items-center gap-1">
                        {p.name}
                        {p.isNINVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />}
                      </Link>
                      {p.role === 'organizer' && <span className="text-xs text-violet-600 font-semibold">Organizer</span>}
                    </div>
                    {isOrg && p.role !== 'organizer' && p._id !== convexUserId && (
                      <button
                        onClick={() => handleRemove(p._id)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <FollowersRow followers={followers} />
          </Section>
        )}

        {tab === 'results' && (
          <Section title="Results" icon={<Trophy className="w-4 h-4" />}>
            {showResultForm && !isOrg && (
              <div className="p-3 bg-white rounded-xl border border-zinc-200 mb-4 space-y-3">
                <h3 className="text-sm font-bold text-zinc-900">Submit your result</h3>
                <input
                  value={match}
                  onChange={(e) => setMatch(e.target.value)}
                  placeholder="Match label (e.g. Round 1)"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <input
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  inputMode="numeric"
                  placeholder="Score"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <input
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="Opponent (optional)"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSubmitResult}
                  disabled={submittingResult || !match.trim() || score === ''}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-40"
                >
                  {submittingResult ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'Submit Result'}
                </button>
              </div>
            )}

            {results === undefined ? (
              <Loading />
            ) : results.length === 0 ? (
              <Empty text="No results yet." />
            ) : (
              <div className="space-y-2">
                {results.map((r: any) => (
                  <div key={r._id} className="p-3 bg-white rounded-xl border border-zinc-200">
                    <div className="flex items-center gap-3">
                      <Avatar src={r.user?.avatar} name={r.user?.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-zinc-900 truncate">{r.user?.name || 'Participant'}</p>
                        <p className="text-xs text-zinc-500">
                          {r.match} · Score: <span className="font-bold text-zinc-900">{r.score}</span>
                          {r.opponent && <> vs {r.opponent}</>}
                        </p>
                      </div>
                      <StatusChip status={r.status} />
                    </div>
                    {r.organizerNote && (
                      <p className="mt-2 text-xs text-zinc-500 bg-zinc-50 rounded-lg px-2 py-1">
                        <span className="font-bold text-zinc-700">Note:</span> {r.organizerNote}
                      </p>
                    )}
                    {isOrg && r.status === 'PENDING' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={async () => {
                            try {
                              await approveMut({ resultId: r._id, rallyId, requestingUserId: convexUserId as any });
                              showToast('Approved', 'Result added to leaderboard.');
                            } catch (e: any) {
                              showToast('Error', e?.message || 'Could not approve.');
                            }
                          }}
                          className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Approve
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await rejectMut({ resultId: r._id, rallyId, requestingUserId: convexUserId as any });
                              showToast('Rejected', 'Result rejected.');
                            } catch (e: any) {
                              showToast('Error', e?.message || 'Could not reject.');
                            }
                          }}
                          className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5 inline mr-1" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {tab === 'leaderboard' && (
          <Section title="Leaderboard" icon={<Trophy className="w-4 h-4" />}>
            {leaderboard === undefined ? (
              <Loading />
            ) : leaderboard.entries.length === 0 ? (
              <Empty text="No approved results yet." />
            ) : (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                {leaderboard.entries.map((e: any, idx: number) => (
                  <div key={e.user._id} className={cn('flex items-center gap-3 p-3', idx !== 0 && 'border-t border-zinc-100')}>
                    <span className={cn('w-6 text-center text-sm font-black', idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-zinc-400' : idx === 2 ? 'text-amber-700' : 'text-zinc-300')}>
                      {idx + 1}
                    </span>
                    <Avatar src={e.user.avatar} name={e.user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-zinc-900 truncate">{e.user.name}</p>
                      <p className="text-xs text-zinc-500">{e.matches} {e.matches === 1 ? 'match' : 'matches'}</p>
                    </div>
                    <span className="text-base font-black text-zinc-900">{e.score}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {tab === 'updates' && (
          <Section title="Official Updates" icon={<Megaphone className="w-4 h-4" />}>
            {isOrg && (
              <div className="flex gap-2 mb-4">
                <input
                  value={announceText}
                  onChange={(e) => setAnnounceText(e.target.value)}
                  placeholder="Share an update with participants & followers…"
                  className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostUpdate();
                    }
                  }}
                />
                <button
                  onClick={handlePostUpdate}
                  disabled={postingUpdate || !announceText.trim()}
                  className="px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-40"
                >
                  {postingUpdate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}
            {announcements === undefined ? (
              <Loading />
            ) : announcements.length === 0 ? (
              <Empty text="No official updates yet." />
            ) : (
              <div className="space-y-2">
                {announcements.map((a: any) => (
                  <div key={a._id} className="p-3 bg-white rounded-xl border border-zinc-200">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Avatar src={a.author?.avatar} name={a.author?.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 flex items-center gap-1">
                          {a.author?.name || 'Organizer'}
                          <Megaphone className="w-3.5 h-3.5 text-violet-500" />
                        </p>
                        <p className="text-[10px] text-zinc-400">{new Date(a.createdAt).toLocaleString()}</p>
                      </div>
                      {isOrg && a.authorId === convexUserId && (
                        <button
                          onClick={async () => {
                            try {
                              await deleteAnnounceMut({ announcementId: a._id, rallyId, requestingUserId: convexUserId as any });
                            } catch {}
                          }}
                          className="text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">{a.text}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2 mb-3 uppercase tracking-wide">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center py-12 text-zinc-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-zinc-400">{text}</div>;
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-600',
    APPROVED: 'bg-emerald-50 text-emerald-600',
    REJECTED: 'bg-rose-50 text-rose-600',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide', map[status] || 'bg-zinc-100 text-zinc-500')}>
      {status}
    </span>
  );
}

function FollowersRow({ followers }: { followers: any[] | undefined }) {
  if (!followers || followers.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Following</p>
      <div className="flex flex-wrap gap-2">
        {followers.map((f: any) => (
          <Link key={f._id} to={`/user/${f._id}`} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-zinc-200">
            <Avatar src={f.avatar} name={f.name} size="sm" />
            <span className="text-xs font-bold text-zinc-800">{f.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="p-4 bg-white rounded-xl border border-zinc-200">
      <div className="flex items-center gap-2.5 mb-2">
        <Link to={`/user/${post.creator?._id}`}>
          <Avatar src={post.creator?.avatar} name={post.creator?.name} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-zinc-900 truncate">{post.creator?.name || 'User'}</p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Hash className="w-3 h-3 text-violet-500" />
            <span className="text-violet-600 font-semibold">Event post</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-zinc-800 mb-2 whitespace-pre-wrap">{post.description}</p>
      {post.mediaUrl && !imgError && (
        <div className="mb-2 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50">
          {post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls className="w-full h-44 object-cover" onError={() => setImgError(true)} />
          ) : (
            <img src={post.mediaUrl} alt="" className="w-full max-h-60 object-cover" onError={() => setImgError(true)} />
          )}
        </div>
      )}
      <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400">
        <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likesCount ?? 0}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {post.commentsCount ?? 0}</span>
      </div>
    </div>
  );
}
