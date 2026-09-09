import React, { useMemo, useRef, useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { ProfileVerificationCheck } from '../components/VerificationBadge';
import {
  Edit3,
  MapPin,
  MoreHorizontal,
  Share2,
  Camera,
  Star,
  Users,
  UserCheck,
  FileText,
  Loader2,
  Calendar,
  Clock,
  Heart,
  Image,
  Zap,
  ShieldCheck,
  ChevronRight,
  X,
  BarChart2,
  Info,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import UserAvatarCropModal from '../components/UserAvatarCropModal';
import GetVerifiedModal from '../components/GetVerifiedModal';
import CoverBanner, { CoverBannerHandle } from '../components/CoverBanner';
import QueryErrorBoundary from '../components/QueryErrorBoundary';
import RallyCard from '../components/RallyCard';
import PostCard from '../components/PostCard';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { cn, getPublicInterests } from '../lib/utils';
import { Rally } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProfileTab = 'posts' | 'media' | 'likes' | 'about';
const VALID_TABS: ProfileTab[] = ['posts', 'media', 'likes', 'about'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return '…';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function joinedDate(ts?: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Profile Stats Modal
// ---------------------------------------------------------------------------
interface ProfileStatsModalProps {
  rating: number | null;
  reviewsCount: number | null;
  postsCount: number | null;
  followersCount: number | null;
  followingCount: number | null;
  onClose: () => void;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  onRatingClick: () => void;
}

function ProfileStatsModal({
  rating,
  reviewsCount,
  postsCount,
  followersCount,
  followingCount,
  onClose,
  onFollowersClick,
  onFollowingClick,
  onRatingClick,
}: ProfileStatsModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal panel — centered on desktop, bottom sheet on mobile */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4">
        <div className="w-full sm:w-[360px] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">Profile Stats</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            {/* Rating */}
            <button
              type="button"
              onClick={() => { onClose(); onRatingClick(); }}
              className="w-full flex items-center justify-between group hover:bg-zinc-50 px-3 py-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-base font-black text-zinc-900 leading-tight">
                    {rating !== null ? rating?.toFixed(1) : '—'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-medium">
                    {reviewsCount === null ? '…' : `${reviewsCount} Review${reviewsCount === 1 ? '' : 's'}`}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
            </button>

            {/* Posts */}
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-zinc-500" />
              </div>
              <div>
                <div className="text-base font-black text-zinc-900 leading-tight">{formatCount(postsCount)}</div>
                <div className="text-[11px] text-zinc-400 font-medium">Posts</div>
              </div>
            </div>

            {/* Followers */}
            <button
              type="button"
              onClick={() => { onClose(); onFollowersClick(); }}
              className="w-full flex items-center justify-between group hover:bg-zinc-50 px-3 py-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <div className="text-left">
                  <div className="text-base font-black text-zinc-900 leading-tight">{formatCount(followersCount)}</div>
                  <div className="text-[11px] text-zinc-400 font-medium">Followers</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
            </button>

            {/* Following */}
            <button
              type="button"
              onClick={() => { onClose(); onFollowingClick(); }}
              className="w-full flex items-center justify-between group hover:bg-zinc-50 px-3 py-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <UserCheck className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <div className="text-base font-black text-zinc-900 leading-tight">{formatCount(followingCount)}</div>
                  <div className="text-[11px] text-zinc-400 font-medium">Following</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Followers / Following List Row
// ---------------------------------------------------------------------------
function UserRow({
  targetUser,
  currentViewerId,
}: {
  targetUser: {
    _id: string;
    name: string;
    username?: string;
    avatar?: string;
    bio?: string;
    isNINVerified?: boolean;
    isBlueVerified?: boolean;
    blueCheckStatus?: string;
    isVerified?: boolean;
    verificationType?: any;
    isFollowing?: boolean;
  };
  currentViewerId?: string | null;
}) {
  const followMut = useMutation(api.follows.follow);
  const unfollowMut = useMutation(api.follows.unfollow);
  const [busy, setBusy] = useState(false);
  const [localFollowing, setLocalFollowing] = useState(targetUser.isFollowing ?? false);

  const isMe = currentViewerId === targetUser._id;

  const toggleFollow = async () => {
    if (!currentViewerId || busy || isMe) return;
    setBusy(true);
    try {
      if (localFollowing) {
        await unfollowMut({
          followerId: currentViewerId as any,
          followingId: targetUser._id as any,
        });
        setLocalFollowing(false);
      } else {
        await followMut({
          followerId: currentViewerId as any,
          followingId: targetUser._id as any,
        });
        setLocalFollowing(true);
      }
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('show-toast', { detail: { title: 'Error', subtitle: err?.message || 'Action failed' } })
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-zinc-50/60 transition-colors">
      <Link to={`/user/${targetUser._id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
        <Avatar src={targetUser.avatar} name={targetUser.name} size="md" className="ring-1 ring-zinc-200" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-zinc-900 text-sm group-hover:text-indigo-600 transition-colors truncate">
              {targetUser.name}
            </h4>
            <ProfileVerificationCheck user={targetUser} size="md" />
          </div>
          <p className="text-xs text-zinc-400 font-medium truncate">
            {targetUser.username ? `@${targetUser.username.replace(/^@+/, '')}` : ''}
          </p>
          {targetUser.bio && (
            <p className="text-xs text-zinc-600 font-medium line-clamp-1 mt-0.5">{targetUser.bio}</p>
          )}
        </div>
      </Link>

      {!isMe && currentViewerId && (
        <button
          type="button"
          onClick={toggleFollow}
          disabled={busy}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 flex items-center gap-1 shadow-xs',
            localFollowing
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
              : 'bg-zinc-900 hover:bg-zinc-800 text-white'
          )}
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : localFollowing ? (
            <>
              <UserCheck className="w-3.5 h-3.5" />
              <span>Following</span>
            </>
          ) : (
            <>
              <span>Follow</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Profile Content
// ---------------------------------------------------------------------------
function ProfileContent() {
  const { user, convexUserId, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const coverRef = useRef<CoverBannerHandle>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const updateUserMutation = useMutation(api.users.update);
  const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const rawTab = searchParams.get('tab');
  const activeTab: ProfileTab = VALID_TABS.includes(rawTab as ProfileTab)
    ? (rawTab as ProfileTab)
    : 'posts';

  const setTab = (tab: ProfileTab) => {
    setSearchParams({ tab });
  };

  const showToast = (t: string, s: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title: t, subtitle: s } }));

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [isGetVerifiedOpen, setIsGetVerifiedOpen] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !convexUserId) return;
    setCropFile(file);
    setIsCropModalOpen(true);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  // ---------------------------------------------------------------------------
  // Live Stats Queries
  // ---------------------------------------------------------------------------
  const stats = useQuery(
    api.rallies.getProfileStats,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const followerCount = useQuery(
    api.follows.getFollowerCount,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const followingCount = useQuery(
    api.follows.getFollowingCount,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const postedCount = stats?.posted ?? (stats === undefined ? null : 0);
  const followersTotal = followerCount ?? (followerCount === undefined ? null : 0);
  const followingTotal = followingCount ?? (followingCount === undefined ? null : 0);

  // ---------------------------------------------------------------------------
  // Tab Content Queries
  // ---------------------------------------------------------------------------
  const rawPosts = useQuery(
    api.rallies.listByCreator,
    convexUserId && (activeTab === 'posts' || activeTab === 'media')
      ? { creatorId: convexUserId as any, userId: convexUserId as any }
      : 'skip'
  );

  // Reviews — loaded for About tab
  const ratingsData = useQuery(
    api.rallies.listRatingsForUser,
    convexUserId && activeTab === 'about'
      ? { userId: convexUserId as any }
      : 'skip'
  );

  // ---------------------------------------------------------------------------
  // Map raw convex data to Rally shape
  // ---------------------------------------------------------------------------
  const mapRally = (r: any): Rally => ({
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
    creator: r.creator
      ? {
          id: r.creator._id,
          name: r.creator.name,
          username: r.creator.username,
          avatar: r.creator.avatar,
          isBlueVerified: r.creator.isBlueVerified,
          isVerified: r.creator.isVerified,
          verificationStatus: r.creator.verificationStatus,
          isNINVerified: r.creator.isNINVerified,
          isPhoneVerified: false,
          badges: r.creator.badges,
          accountType: r.creator.accountType || 'personal',
          organizationName: r.creator.organizationName,
          isPro: r.creator.isPro,
        }
      : {
          id: convexUserId || 'me',
          name: user.name || 'You',
          username: user.username || '',
          avatar: user.avatar || '',
          isBlueVerified: user.isBlueVerified,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus,
          isNINVerified: user.isNINVerified ?? false,
          isPhoneVerified: false,
        },
    status: r.status,
    createdAt: new Date(r.createdAt).toISOString(),
    city: r.city,
    locationLabel: r.locationLabel,
    rallyLatitude: r.rallyLatitude,
    rallyLongitude: r.rallyLongitude,
    category: r.category as Rally['category'],
    hashtags: r.hashtags,
    eventDate: r.eventDate,
    mediaUrl: r.mediaUrl,
    mediaUrls: r.mediaUrls && r.mediaUrls.length > 0 ? r.mediaUrls : (r.mediaUrl ? [r.mediaUrl] : []),
    mediaType: r.mediaType as Rally['mediaType'],
    capacity: r.capacity,
    authorType: r.authorType,
    pageId: r.pageId,
    created_by_user_id: r.created_by_user_id,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    rsvpsCount: r.rsvpsCount,
    isLiked: r.isLiked,
    isRsvpd: r.isRsvpd,
  });

  const allContent: Rally[] = useMemo(() => {
    if (!rawPosts) return [];
    return rawPosts.map(mapRally).filter((p) => !deletedIds.has(p.id));
  }, [rawPosts, deletedIds]);

  const postsList = useMemo(() => allContent.filter((p) => p.type === 'POST'), [allContent]);
  const mediaList = useMemo(
    () => allContent.filter((p) => p.mediaUrls && p.mediaUrls.length > 0),
    [allContent]
  );

  const handleDeleted = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/user/${convexUserId}`;
    if (navigator.share) {
      navigator.share({ title: user.name || 'Profile', url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('Link copied', 'Profile link copied to clipboard.'));
    }
  };

  const handleCoverUploaded = async (storageId: string, blobUrl: string) => {
    if (!convexUserId) return;
    try {
      await updateUserMutation({ userId: convexUserId as any, coverImage: storageId });
      updateUser({ coverImage: blobUrl });
      showToast('Cover photo updated', '');
    } catch {
      showToast('Error', 'Could not save cover photo.');
    }
  };

  const coverUrl =
    user.coverImage && /^(https?:|blob:|data:)/.test(user.coverImage)
      ? user.coverImage
      : null;

  const publicInterests = user.showInterests !== false ? getPublicInterests(user) : [];
  const isOrgBiz = user.accountType === 'organization' || user.accountType === 'business';
  const rating = ratingsData?.averageScore ?? null;
  const reviewsCountVal = ratingsData?.totalCount ?? (stats?.rated ?? null);

  const isVerified = user?.isBlueVerified || user?.isVerified || user?.verificationStatus === 'verified';
  const joined = joinedDate((user as any)?._creationTime as number | undefined);

  // Stats modal handlers
  const handleFollowersClick = () => {
    showToast('Followers', 'See your followers in Profile Stats.');
  };
  const handleFollowingClick = () => {
    showToast('Following', 'See the accounts you follow in Profile Stats.');
  };
  const handleRatingClick = () => {
    if (isOrgBiz) setTab('about');
  };

  // ---------------------------------------------------------------------------
  // Tab definitions — conditional on account type
  // ---------------------------------------------------------------------------
  const profileTabs: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { key: 'posts', label: 'Posts', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'media', label: 'Media', icon: <Image className="w-3.5 h-3.5" /> },
    { key: 'likes', label: 'Likes', icon: <Heart className="w-3.5 h-3.5" /> },
    ...(isOrgBiz ? [{ key: 'about' as ProfileTab, label: 'About', icon: <Info className="w-3.5 h-3.5" /> }] : []),
  ];

  return (
    <PageShell title="Profile">
      <div className="w-full max-w-2xl mx-auto">

        {/* ================================================================ */}
        {/* Profile Card + Feed — single column, full-width                  */}
        {/* ================================================================ */}
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">

          {/* ---- Cover Banner ---- */}
          <CoverBanner
            ref={coverRef}
            coverImage={coverUrl}
            canEdit
            onCoverUploaded={handleCoverUploaded}
            onError={(msg) => showToast('Error', msg)}
          />

          {/* ---- Profile Identity ---- */}
          <div className="px-4 sm:px-6 pb-2">
            {/* Avatar overlapping cover */}
            <div className="relative -mt-10 sm:-mt-14 z-10 w-fit">
              <div className="relative">
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size="xl"
                  className="border-4 border-white shadow-lg"
                />
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-20">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setCropFile(null); setIsCropModalOpen(true); }}
                className="absolute bottom-0 right-0 p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full transition-all shadow-md active:scale-95 cursor-pointer z-20"
                title="Edit Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                id="profile-avatar-input"
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                disabled={avatarUploading}
                onChange={handleAvatarChange}
              />
            </div>

            {/* Name & Verification Badge */}
            <div className="flex items-center gap-1.5 mt-3 mb-0.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                {user.name}
              </h2>
              <ProfileVerificationCheck user={user} size="lg" />
            </div>

            {/* Username */}
            <p className="text-sm font-semibold text-zinc-400 mb-1.5">
              {user.username ? `@${user.username.replace(/^@+/, '')}` : ''}
            </p>

            {/* Bio */}
            <p className="text-sm text-zinc-700 font-medium leading-relaxed mb-2 max-w-xl">
              {user.bio || 'Always looking for something fun to do.'}
            </p>

            {/* Location + Gender */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-zinc-600 font-medium">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                {user.location || 'Location not set'}
              </span>
              {user.gender && user.gender !== 'Prefer not to say' && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span>{user.gender}</span>
                </>
              )}
            </div>

            {/* Public Interests Tags */}
            {publicInterests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {publicInterests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold ring-1 ring-inset ring-indigo-100"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* ── Social Stats Row (Following | Followers | Likes) ── */}
            <div className="flex items-center gap-5 mt-3.5">
              <button
                type="button"
                onClick={handleFollowingClick}
                className="flex items-center gap-1.5 hover:opacity-75 active:scale-95 transition-all"
              >
                <span className="text-sm font-black text-zinc-900">{formatCount(followingTotal)}</span>
                <span className="text-sm text-zinc-500 font-medium">Following</span>
              </button>
              <button
                type="button"
                onClick={handleFollowersClick}
                className="flex items-center gap-1.5 hover:opacity-75 active:scale-95 transition-all"
              >
                <span className="text-sm font-black text-zinc-900">{formatCount(followersTotal)}</span>
                <span className="text-sm text-zinc-500 font-medium">Followers</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-zinc-900">—</span>
                <span className="text-sm text-zinc-500 font-medium">Likes</span>
              </div>
            </div>
          </div>

          {/* ---- Action Buttons ---- */}
          <div className="px-4 sm:px-6 mt-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/settings/personal-info"
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </Link>
              <button
                onClick={() => coverRef.current?.openPicker()}
                className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-bold inline-flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Camera className="w-4 h-4" /> Edit Cover
              </button>

              {/* Get Verified button — only if not yet verified */}
              {!user.isBlueVerified && !user.isVerified && user.blueCheckStatus !== 'pending' && (
                <button
                  type="button"
                  onClick={() => setIsGetVerifiedOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#1D9BF0] hover:bg-blue-600 text-white text-sm font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" /> Get Verified
                </button>
              )}

              {/* Three-dot menu */}
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
                      {/* Profile Stats */}
                      <button
                        onClick={() => { setMoreOpen(false); setStatsModalOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                      >
                        <BarChart2 className="w-4 h-4 text-indigo-500" /> Profile Stats
                      </button>
                      {/* About & Reviews — only for business/organization */}
                      {isOrgBiz && (
                        <button
                          onClick={() => { setMoreOpen(false); setTab('about'); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                        >
                          <Info className="w-4 h-4 text-zinc-500" /> About &amp; Reviews
                        </button>
                      )}
                      {/* Share Profile */}
                      <button
                        onClick={() => { setMoreOpen(false); shareProfile(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-zinc-500" /> Share Profile
                      </button>
                      {/* Verification Status (if already verified) */}
                      {(user.isBlueVerified || user.isVerified) && (
                        <button
                          onClick={() => { setMoreOpen(false); setIsGetVerifiedOpen(true); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verification Status
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ---- Pending verification banner ---- */}
          {user.blueCheckStatus === 'pending' && (
            <div className="mx-4 sm:mx-6 mb-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Verification Under Review</h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Your RALLY profile verification request is being reviewed by our team.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGetVerifiedOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-900/10 hover:bg-amber-900/20 text-amber-900 text-xs font-bold transition-colors shrink-0 text-center cursor-pointer"
              >
                View Status →
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB NAVIGATION: Posts | Media | Likes | About                   */}
          {/* ================================================================ */}
          <div className="border-t border-zinc-200/80 overflow-x-auto no-scrollbar">
            <div className="flex items-stretch min-w-full sm:min-w-0">
              {profileTabs.map((tab) => {
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTab(tab.key)}
                    className={cn(
                      'flex-1 min-w-[72px] py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all relative select-none group',
                      isSelected
                        ? 'text-zinc-900'
                        : 'text-zinc-400 hover:text-zinc-700'
                    )}
                  >
                    <span className={cn('transition-transform group-hover:scale-110', isSelected ? 'text-zinc-900' : 'text-zinc-400')}>
                      {tab.icon}
                    </span>
                    <span className={cn(
                      'text-[10px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap',
                      isSelected ? 'text-zinc-900' : 'text-zinc-400'
                    )}>
                      {tab.label}
                    </span>
                    {isSelected && (
                      <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-zinc-900 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================================ */}
          {/* TAB CONTENT                                                      */}
          {/* ================================================================ */}
          <div className="min-h-[260px]">

            {/* POSTS */}
            {activeTab === 'posts' && (
              <div className="divide-y divide-zinc-100">
                {rawPosts === undefined ? null : postsList.length > 0 ? (
                  postsList.map((post) => (
                    <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
                  ))
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">No posts yet</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto">
                      Posts you create will appear here.
                    </p>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-create-rally'))}
                      className="mt-4 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
                    >
                      Create a Post
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MEDIA */}
            {activeTab === 'media' && (
              <div>
                {rawPosts === undefined ? null : mediaList.length > 0 ? (
                  <div className="grid grid-cols-3 gap-0.5 p-0.5">
                    {mediaList.map((item) => {
                      const thumb = item.mediaUrls?.[0] || item.mediaUrl;
                      return (
                        <Link
                          key={item.id}
                          to={`/rally/${item.id}`}
                          className="relative aspect-square bg-zinc-100 overflow-hidden group"
                        >
                          {item.mediaType === 'video' ? (
                            <video
                              src={thumb}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={thumb}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          {item.mediaUrls && item.mediaUrls.length > 1 && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-black/60 flex items-center justify-center">
                              <Image className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                      <Image className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">No media yet</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto">
                      Posts and RALLYS with photos or videos will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* LIKES */}
            {activeTab === 'likes' && (
              <div className="text-center py-16 px-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 tracking-tight">Liked posts</h3>
                <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto">
                  Posts you like will appear here soon.
                </p>
              </div>
            )}

            {/* ABOUT */}
            {activeTab === 'about' && (
              <div className="p-4 sm:p-6 space-y-6">

                {/* Info section */}
                <div className="space-y-3">
                  {user?.bio && (
                    <p className="text-sm text-zinc-700 font-medium leading-relaxed">{user.bio}</p>
                  )}
                  {user?.location && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600 font-medium">
                      <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {joined && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                      <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Joined {joined}</span>
                    </div>
                  )}
                  {isVerified && (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Verified Account</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-100" />

                {/* Reviews section */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4">Reviews</h3>

                  {ratingsData === undefined ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
                    </div>
                  ) : ratingsData.ratings.length > 0 ? (
                    <div>
                      {/* Rating Banner */}
                      <div className="mb-4 p-4 bg-gradient-to-r from-amber-50/70 to-orange-50/50 rounded-2xl border border-amber-100 flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-zinc-900">
                              {ratingsData.averageScore}
                            </span>
                            <div className="flex items-center text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    'w-4 h-4 sm:w-5 sm:h-5',
                                    Math.round(ratingsData.averageScore) >= star
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-zinc-300'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-600 font-medium mt-0.5">
                            Based on {ratingsData.totalCount} review{ratingsData.totalCount === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>

                      {/* Reviews List */}
                      <div className="space-y-1 divide-y divide-zinc-100">
                        {ratingsData.ratings.map((r: any) => (
                          <div key={r._id} className="py-4 hover:bg-zinc-50/50 transition-colors rounded-xl px-1">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar src={r.rater?.avatar} name={r.rater?.name} size="md" className="ring-1 ring-zinc-200" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-zinc-900 text-sm truncate">
                                      {r.rater?.name || 'Anonymous Neighbor'}
                                    </span>
                                    <ProfileVerificationCheck user={r.rater} size="sm" />
                                  </div>
                                  <p className="text-xs text-zinc-400 font-medium truncate">
                                    {r.rater?.username ? `@${r.rater.username.replace(/^@+/, '')}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="flex items-center gap-0.5 text-amber-400">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={cn(
                                        'w-3.5 h-3.5',
                                        r.score >= star ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
                                      )}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] text-zinc-400 font-medium mt-0.5 block">
                                  {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {r.review && (
                              <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed mt-2 pl-11">
                                "{r.review}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                        <Star className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-black text-zinc-900 tracking-tight">No reviews yet</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto">
                        When neighbors rate and review their experiences with you, they will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Profile Stats Modal */}
      {statsModalOpen && (
        <ProfileStatsModal
          rating={rating}
          reviewsCount={reviewsCountVal}
          postsCount={postedCount}
          followersCount={followersTotal}
          followingCount={followingTotal}
          onClose={() => setStatsModalOpen(false)}
          onFollowersClick={handleFollowersClick}
          onFollowingClick={handleFollowingClick}
          onRatingClick={handleRatingClick}
        />
      )}

      {/* Modals */}
      <UserAvatarCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        initialFile={cropFile}
        currentImageUrl={user.avatar}
        userName={user.name}
      />
      <GetVerifiedModal
        isOpen={isGetVerifiedOpen}
        onClose={() => setIsGetVerifiedOpen(false)}
      />
    </PageShell>
  );
}

export default function Profile() {
  return (
    <QueryErrorBoundary message="Your profile couldn't be loaded right now. Please try again.">
      <ProfileContent />
    </QueryErrorBoundary>
  );
}
