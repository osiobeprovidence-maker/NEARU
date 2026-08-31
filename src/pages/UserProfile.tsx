import React, { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Avatar from '../components/Avatar';
import CoverBanner, { CoverBannerHandle } from '../components/CoverBanner';
import OrgSocialLinks from '../components/OrgSocialLinks';
import {
  BadgeCheck,
  MapPin,
  Globe,
  UserPlus,
  UserCheck,
  MessageCircle,
  MoreHorizontal,
  Flag,
  Ban,
  X,
  Send,
  Pencil,
  Camera,
  Check,
  Share2,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';
import { cn, getPublicInterests } from '../lib/utils';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import QueryErrorBoundary from '../components/QueryErrorBoundary';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, convexUserId, updateUser, blockUser } = useAuth();

  const isSelf = !!convexUserId && convexUserId === id;

  // Only query Convex with ids that look like real Convex user ids. A malformed
  // URL segment (e.g. /user/abc or an encoded/truncated value) makes Convex's
  // v.id("users") validator throw an ArgumentValidationError, which previously
  // surfaced as a full-app crash. We treat those as "user not found" instead.
  const validId = !!id && /^[A-Za-z0-9]{8,}$/.test(id) ? id : null;

  const [requestModal, setRequestModal] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [isMessaging, setIsMessaging] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [interestsOpen, setInterestsOpen] = useState(false);
  const [draftPublic, setDraftPublic] = useState<string[]>([]);

  const coverRef = useRef<CoverBannerHandle>(null);

  const target = useQuery(
    api.users.get,
    validId ? { userId: validId as any, viewerId: (convexUserId ?? undefined) as any } : 'skip'
  );
  const profile = useQuery(
    api.users.getProfile,
    validId ? { userId: validId as any, viewerId: (convexUserId ?? undefined) as any } : 'skip'
  );
  const stats = useQuery(api.rallies.getProfileStats, validId ? { userId: validId as any } : 'skip');
  const followerCount = useQuery(api.follows.getFollowerCount, validId ? { userId: validId as any } : 'skip');
  const followingCount = useQuery(api.follows.getFollowingCount, validId ? { userId: validId as any } : 'skip');
  const isFollowing = useQuery(
    api.follows.isFollowing,
    convexUserId && validId ? { followerId: convexUserId as any, followingId: validId as any } : 'skip'
  );
  const content = useQuery(
    api.rallies.listByCreator,
    validId ? { creatorId: validId as any, userId: (convexUserId ?? undefined) as any } : 'skip'
  );
  const directStatus = useQuery(
    api.chatRequests.getDirectStatus,
    convexUserId && validId ? { viewerId: convexUserId as any, targetId: validId as any } : 'skip'
  );

  const followMut = useMutation(api.follows.follow);
  const unfollowMut = useMutation(api.follows.unfollow);
  const openDirectMut = useMutation(api.messages.getOrOpenDirect);
  const sendDirectMut = useMutation(api.chatRequests.sendDirect);
  const updateUserMutation = useMutation(api.users.update);

  const [isFollowBusy, setIsFollowBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'rallies' | 'media'>('posts');

  const isOrgBiz =
    !!target && (target.accountType === 'organization' || target.accountType === 'business');
  const isPrivate = target?.privacySettings?.profileVisibility === 'private';
  const isLocked = !!target && isPrivate && !isSelf && !isFollowing;

  const displayName = target?.organizationName || target?.name || 'Loading…';
  const coverUrl =
    target?.coverImage && /^(https?:|blob:|data:)/.test(target.coverImage)
      ? target.coverImage
      : null;
  const websiteUrl =
    target?.website && /^(https?:|blob:|data:)/.test(target.website)
      ? target.website
      : target?.website
        ? `https://${target.website}`
        : null;

  const publicInterests = isLocked ? [] : getPublicInterests(target);
  const interestPool = useMemo<string[]>(() => {
    const pool: any[] = (target as any)?.interests || me.interests || [];
    return [...new Set(pool.filter(Boolean))] as string[];
  }, [target, me.interests]);

  const showToast = (title: string, subtitle: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));

  const openInterests = () => {
    setDraftPublic(getPublicInterests(target));
    setMoreOpen(false);
    setInterestsOpen(true);
  };

  const toggleDraft = (interest: string) => {
    setDraftPublic((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 3
          ? [...prev, interest]
          : prev
    );
  };

  const savePublicInterests = async () => {
    if (!convexUserId || !isSelf) return;
    try {
      await updateUserMutation({
        userId: convexUserId as any,
        publicInterests: draftPublic.length > 0 ? draftPublic : undefined,
      });
      updateUser({ publicInterests: draftPublic });
      setInterestsOpen(false);
      showToast('Interests updated', 'Shown on your public profile.');
    } catch {
      showToast('Error', 'Could not update interests.');
    }
  };

  const handleCoverUploaded = async (storageId: string, blobUrl: string) => {
    if (!convexUserId || !isSelf) return;
    try {
      await updateUserMutation({
        userId: convexUserId as any,
        coverImage: storageId,
      });
      updateUser({ coverImage: blobUrl });
      showToast('Cover photo updated', '');
    } catch {
      showToast('Error', 'Could not save cover photo.');
    }
  };

  const handleToggleFollow = async () => {
    if (!convexUserId || !id || isSelf) return;
    setIsFollowBusy(true);
    try {
      if (isFollowing) {
        await unfollowMut({ followerId: convexUserId as any, followingId: id as any });
      } else {
        await followMut({ followerId: convexUserId as any, followingId: id as any });
      }
    } catch {
      showToast('Error', 'Could not update follow status.');
    } finally {
      setIsFollowBusy(false);
    }
  };

  const handleBlock = () => {
    if (!target || isSelf) return;
    blockUser(target._id, target.name || 'User', target.username || '', target.avatar || '');
    showToast('User blocked', `${target.name} has been blocked.`);
    navigate('/');
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/user/${id}`;
    if (navigator.share) {
      navigator.share({ title: target?.name || 'Profile', url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('Link copied', 'Profile link copied to clipboard.'));
    }
  };

  const handleMessage = async () => {
    if (!convexUserId || !id || isSelf) return;
    if (!directStatus) return;
    setIsMessaging(true);
    try {
      const status = (directStatus as any).status;
      if (status === 'mutual') {
        const convId = await openDirectMut({ userIdA: convexUserId as any, userIdB: id as any });
        navigate(`/messages/${convId}`);
      } else if (status === 'pending_to_me') {
        navigate('/messages', { state: { tab: 'requests' } });
      } else if (status === 'request') {
        setRequestModal(true);
      } else if (status === 'pending_from_me') {
        navigate('/messages', { state: { tab: 'requests' } });
      }
    } catch (e: any) {
      showToast('Error', e.message || 'Could not start a chat.');
    } finally {
      setIsMessaging(false);
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convexUserId || !id || !requestText.trim()) return;
    try {
      const res = await sendDirectMut({
        fromUserId: convexUserId as any,
        toUserId: id as any,
        message: requestText.trim(),
      });
      setRequestModal(false);
      setRequestText('');
      if (res.type === 'direct') {
        showToast('Message sent', '');
        navigate(`/messages/${res.conversationId}`);
      } else {
        showToast('Request sent', 'They will be notified.');
      }
    } catch (e: any) {
      showToast('Error', e.message || 'Could not send request.');
    }
  };

  const tabbed = useMemo(() => {
    if (!content) return { posts: [], rallies: [], media: [] };
    const out = { posts: [] as any[], rallies: [] as any[], media: [] as any[] };
    for (const c of content) {
      if (c.type === 'POST') out.posts.push(c);
      else out.rallies.push(c);
      if (c.mediaUrl) out.media.push(c);
    }
    return out;
  }, [content]);

  const mapRally = (r: any) => ({
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
    pricing: r.pricing,
    creator: target
      ? {
          id: target._id,
          name: target.name,
          username: target.username,
          avatar: target.avatar,
          isNINVerified: target.isNINVerified,
          isPhoneVerified: false,
          badges: target.badges,
          accountType: target.accountType || 'personal',
          organizationName: target.organizationName,
          isPro: target.isPro,
        }
      : { id: id || '', name: 'User', username: '', avatar: '', isNINVerified: false, isPhoneVerified: false },
    status: r.status,
    createdAt: new Date(r.createdAt).toISOString(),
    city: r.city,
    locationLabel: r.locationLabel,
    rallyLatitude: r.rallyLatitude,
    rallyLongitude: r.rallyLongitude,
    category: r.category,
    hashtags: r.hashtags,
    eventDate: r.eventDate,
    mediaUrl: r.mediaUrl,
    mediaType: r.mediaType,
    capacity: r.capacity,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    rsvpsCount: r.rsvpsCount,
    isLiked: r.isLiked,
    isRsvpd: r.isRsvpd,
  });

  const activeList =
    activeTab === 'posts'
      ? tabbed.posts
      : activeTab === 'media'
        ? tabbed.media
        : tabbed.rallies;

  const messageLabel =
    !directStatus
      ? 'Message'
      : (directStatus as any).status === 'pending_from_me'
        ? 'Pending'
        : 'Message';

  // Malformed / unsupported profile URL — never send junk ids to Convex and
  // never crash the whole app via the error boundary. Show a clean empty state.
  if (id && !validId) {
    return (
      <PageShell title="Profile">
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-5">
              <UserIcon className="w-8 h-8 text-zinc-400" strokeWidth={1.75} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              Profile not found
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
              We couldn't find that account. It may have been removed or the link is incorrect.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <QueryErrorBoundary message="We couldn't load this profile right now. Please try again.">
    <PageShell title={profile?.name || target?.name ? `${profile?.name || target?.name}'s profile` : 'Profile'}>
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden max-w-2xl mx-auto">

        {/* -------- COVER -------- */}
        <CoverBanner
          ref={coverRef}
          coverImage={coverUrl}
          canEdit={isSelf}
          onCoverUploaded={handleCoverUploaded}
          onError={(msg) => showToast('Error', msg)}
        />

        {/* -------- IDENTITY (avatar overlaps cover, left-aligned) -------- */}
        <div className="px-4 sm:px-6 pb-2">
          <div className="relative -mt-10 sm:-mt-14 z-10 w-fit">
            <Avatar
              src={profile?.avatar || target?.avatar}
              name={profile?.name || target?.name || 'User'}
              size="xl"
              className="border-4 border-white shadow-lg"
            />
            {isSelf && convexUserId && (
              <Link
                to="/settings/personal-info"
                className="absolute bottom-0 right-0 p-1.5 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                title="Change Photo"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-3 mb-0.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              {profile?.name || target?.name || 'Loading…'}
            </h1>
            {(profile?.badge?.isNINVerified ?? target?.isNINVerified) && (
              <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            {(isOrgBiz) && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 shrink-0">
                {profile?.accountType === 'business' || target?.accountType === 'business' ? 'Business' : 'Organization'}
              </span>
            )}
            {(isOrgBiz && (profile?.category || target?.category)) && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 shrink-0">
                {profile?.category || target?.category}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-zinc-400 mb-1">
            {profile?.username || target?.username ? `@${profile?.username || target?.username}` : ''}
          </p>

          {/* Bio — directly under username */}
          {!isLocked ? (
            <p className="text-sm text-zinc-700 font-medium leading-relaxed mb-1 max-w-xl">
              {profile?.bio || target?.bio || (isOrgBiz
                ? 'Follow this page to stay updated on posts and events.'
                : 'Nothing here yet.')}
            </p>
          ) : (
            <p className="text-sm text-zinc-500 font-medium max-w-xs mb-1">
              This account is private. Follow to see more.
            </p>
          )}
        </div>

        {/* -------- SOCIAL ACTIONS (own dedicated row) -------- */}
        <div className="px-4 sm:px-6 mt-3">
          {isSelf && convexUserId ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/settings/personal-info"
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold inline-flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Pencil className="w-4 h-4" /> Edit Profile
              </Link>
              <button
                onClick={() => coverRef.current?.openPicker()}
                className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-bold inline-flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Camera className="w-4 h-4" /> Edit Cover
              </button>
              <div className="relative ml-auto">
                <button
                  onClick={() => setMoreOpen((o) => !o)}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 inline-flex items-center transition-colors active:scale-95"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-40 w-52 bg-white rounded-2xl shadow-lg border border-zinc-100 overflow-hidden py-1 text-left animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => { setMoreOpen(false); shareProfile(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-indigo-500" /> Share Profile
                      </button>
                      <button
                        onClick={openInterests}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-500" /> Edit Public Interests
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            convexUserId && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleToggleFollow}
                  disabled={isFollowBusy}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50',
                    isFollowing
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                      : 'bg-zinc-900 hover:bg-zinc-700 text-white shadow-sm'
                  )}
                >
                  {isFollowBusy ? (
                    '…'
                  ) : isFollowing ? (
                    <><UserCheck className="w-4 h-4" /> Following</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Follow</>
                  )}
                </button>
                {directStatus && (directStatus as any).status !== 'blocked' && (
                  <button
                    onClick={handleMessage}
                    disabled={isMessaging || (directStatus as any).status === 'pending_from_me'}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold inline-flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
                  >
                    {isMessaging ? (
                      '…'
                    ) : (
                      <><MessageCircle className="w-4 h-4" /> {messageLabel}</>
                    )}
                  </button>
                )}
                <div className="relative ml-auto">
                  <button
                    onClick={() => setMoreOpen((o) => !o)}
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 inline-flex items-center transition-colors active:scale-95"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {moreOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
                      <div className="absolute right-0 top-full mt-1.5 z-40 w-52 bg-white rounded-2xl shadow-lg border border-zinc-100 overflow-hidden py-1 text-left animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => { setMoreOpen(false); shareProfile(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                        >
                          <Share2 className="w-4 h-4 text-indigo-500" /> Share Profile
                        </button>
                        <Link
                          to={`/report/${id}`}
                          onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                        >
                          <Flag className="w-4 h-4 text-rose-500" /> Report
                        </Link>
                        <button
                          onClick={handleBlock}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-rose-600 text-xs font-bold transition-colors border-t border-zinc-100"
                        >
                          <Ban className="w-4 h-4 text-red-500" /> Block
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* -------- METADATA (location / gender) under bio -------- */}
        {!isLocked && (
          <div className="px-4 sm:px-6 mt-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 font-medium">
              {profile?.location || target?.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  {profile?.location || target?.location}
                </span>
              ) : null}
              {(profile?.location || target?.location) && (profile?.gender || target?.gender) && (
                <span className="text-zinc-300">•</span>
              )}
              {profile?.gender || target?.gender ? (
                <span>{(profile?.gender || target?.gender) === 'Prefer not to say' ? '' : profile?.gender || target?.gender}</span>
              ) : null}
            </div>

            {/* Interests under metadata */}
            {publicInterests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {publicInterests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold ring-1 ring-inset ring-indigo-100"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold text-sm"
              >
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="break-all">{target?.website}</span>
              </a>
            )}
            {isOrgBiz && <OrgSocialLinks links={target?.socialLinks || []} className="mt-3" />}

            {isLocked && (
              <p className="text-sm text-zinc-500 font-medium max-w-xs">
                Follow {isFollowing ? 'this account' : 'to see more'}.
              </p>
            )}
          </div>
        )}

        {/* -------- STATISTICS (dedicated section, no Following for public) -------- */}
        <div className="mt-5 py-4 sm:py-5 px-4 border-t border-zinc-200/70 bg-zinc-50/40">
          <div className={cn('grid divide-x divide-zinc-200/70 text-center max-w-md mx-auto', isSelf ? 'grid-cols-3' : 'grid-cols-2')}>
            <StatCell label="Posts" value={profile ? profile.postsCount : (stats?.posted ?? (stats === undefined ? null : 0))} />
            <StatCell label="Followers" value={profile ? profile.followersCount : (followerCount ?? (followerCount === undefined ? null : 0))} />
            {isSelf && (
              <StatCell label="Following" value={profile ? profile.followingCount : (followingCount ?? (followingCount === undefined ? null : 0))} />
            )}
          </div>
        </div>

        {/* Tabs */}
        {!isLocked && (
          <>
            <div className="flex border-b border-zinc-100">
              {(['posts', 'rallies', 'media'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold capitalize transition-colors',
                    activeTab === tab
                      ? 'text-zinc-900 border-b-2 border-zinc-900'
                      : 'text-zinc-400 hover:text-zinc-600'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="divide-y divide-zinc-100">
              {content === undefined ? (
                <>
                  <RallyCardSkeleton />
                  <RallyCardSkeleton />
                </>
              ) : activeList.length > 0 ? (
                activeList.map((r: any) => <RallyCard key={r._id} rally={mapRally(r)} />)
              ) : (
                <div className="p-10 text-center text-zinc-500">
                  <p className="font-bold text-zinc-900 text-sm mb-1">No {activeTab} yet</p>
                  <p className="text-xs text-zinc-400">Nothing to show here.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Interests modal (self only) */}
      {interestsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-black text-zinc-900">Public interests</h3>
              <button
                onClick={() => setInterestsOpen(false)}
                className="p-2 -mr-2 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 font-medium mb-4 leading-relaxed">
              Pick up to 3 interests to show on your public profile. The rest stay
              private and are only used for recommendations.
            </p>

            {interestPool.length === 0 ? (
              <Link
                to="/settings/personal-info"
                onClick={() => setInterestsOpen(false)}
                className="block text-center py-4 rounded-2xl border-2 border-dashed border-zinc-200 text-sm font-bold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
              >
                Add interests in Edit Profile first
              </Link>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {interestPool.map((interest) => {
                  const isSelected = draftPublic.includes(interest);
                  const atLimit = draftPublic.length >= 3 && !isSelected;
                  const addedOrder = draftPublic.indexOf(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      disabled={atLimit}
                      onClick={() => toggleDraft(interest)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40',
                        isSelected
                          ? 'bg-zinc-900 text-white shadow-xs ring-1 ring-zinc-900'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      )}
                    >
                      {interest}
                      {isSelected && (
                        <span className="text-[10px] font-black text-zinc-400">
                          #{addedOrder + 1}
                        </span>
                      )}
                      {!isSelected && atLimit && <span className="text-zinc-400">(private)</span>}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setInterestsOpen(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePublicInterests}
                className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
              >
                <Check className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message request modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900">Message {target?.name || 'user'}</h3>
              <button onClick={() => setRequestModal(false)} className="p-2 -mr-2 rounded-full hover:bg-zinc-100 transition-colors">
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 font-medium mb-3 leading-relaxed">
              You don't follow each other yet, so this will be sent as a <span className="font-bold text-zinc-700">message request</span>. They can accept it to start chatting.
            </p>
            <form onSubmit={submitRequest} className="space-y-3">
              <textarea
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="Send a short message..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-zinc-200 p-3 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={!requestText.trim()}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Send className="w-4 h-4" /> Send Request
              </button>
            </form>
          </div>
        </div>
      )}
    </PageShell>
    </QueryErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
function StatCell({ label, value, amber = false }: { label: string; value: number | null; amber?: boolean }) {
  return (
    <div className="px-2">
      <div className={`text-xl sm:text-2xl font-black ${amber ? 'text-amber-500' : 'text-zinc-900'}`}>
        {value === null ? <span className="text-zinc-300 text-lg">…</span> : value}
      </div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}