import React, { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Avatar from '../components/Avatar';
import CoverBanner, { CoverBannerHandle } from '../components/CoverBanner';
import OrgSocialLinks from '../components/OrgSocialLinks';
import { ProfileVerificationCheck } from '../components/VerificationBadge';
import {
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
  ShieldCheck,
  Loader2,
  User as UserIcon,
  Star,
  FileText,
  Image,
  Users,
  ChevronRight,
  Calendar,
  Heart,
  BarChart2,
  Info,
} from 'lucide-react';
import { cn, getPublicInterests } from '../lib/utils';
import RallyCard from '../components/RallyCard';
import PostCard from '../components/PostCard';
import QueryErrorBoundary from '../components/QueryErrorBoundary';
import UserAvatarCropModal from '../components/UserAvatarCropModal';
import {
  processAndCompressImage,
  uploadToConvexStorage,
  logUploadStage,
} from '../utils/imageUpload';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PublicTab = 'posts' | 'media' | 'likes' | 'about';
const PUBLIC_TABS: PublicTab[] = ['posts', 'media', 'likes', 'about'];

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
// Profile Stats Modal (public view)
// ---------------------------------------------------------------------------
interface PublicStatsModalProps {
  rating: number | null;
  reviewsCount: number | null;
  postsCount: number | null;
  followersCount: number | null;
  followingCount: number | null;
  onClose: () => void;
  onRatingClick: () => void;
}

function PublicStatsModal({
  rating,
  reviewsCount,
  postsCount,
  followersCount,
  followingCount,
  onClose,
  onRatingClick,
}: PublicStatsModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4">
        <div className="w-full sm:w-[360px] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">Profile Stats</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors" aria-label="Close">
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            <button type="button" onClick={() => { onClose(); onRatingClick(); }} className="w-full flex items-center justify-between group hover:bg-zinc-50 px-3 py-3 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-base font-black text-zinc-900 leading-tight">{rating !== null ? rating.toFixed(1) : '—'}</div>
                  <div className="text-[11px] text-zinc-400 font-medium">{reviewsCount === null ? '…' : `${reviewsCount} Review${reviewsCount === 1 ? '' : 's'}`}</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
            </button>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-zinc-500" />
              </div>
              <div>
                <div className="text-base font-black text-zinc-900 leading-tight">{formatCount(postsCount)}</div>
                <div className="text-[11px] text-zinc-400 font-medium">Posts</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <div className="text-base font-black text-zinc-900 leading-tight">{formatCount(followersCount)}</div>
                <div className="text-[11px] text-zinc-400 font-medium">Followers</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-base font-black text-zinc-900 leading-tight">{formatCount(followingCount)}</div>
                <div className="text-[11px] text-zinc-400 font-medium">Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
function UserProfileContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, convexUserId, updateUser, blockUser } = useAuth();

  const isSelf = !!convexUserId && convexUserId === id;

  const validId = !!id && /^[A-Za-z0-9]{8,}$/.test(id) ? id : null;

  const [requestModal, setRequestModal] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [isMessaging, setIsMessaging] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [interestsOpen, setInterestsOpen] = useState(false);
  const [draftPublic, setDraftPublic] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<PublicTab>('posts');

  const coverRef = useRef<CoverBannerHandle>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
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
  const ratingsData = useQuery(
    api.rallies.listRatingsForUser,
    validId && activeTab === 'about' ? { userId: validId as any } : 'skip'
  );
  const directStatus = useQuery(
    api.chatRequests.getDirectStatus,
    convexUserId && validId ? { viewerId: convexUserId as any, targetId: validId as any } : 'skip'
  );

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const followMut = useMutation(api.follows.follow);
  const unfollowMut = useMutation(api.follows.unfollow);
  const openDirectMut = useMutation(api.messages.getOrOpenDirect);
  const sendDirectMut = useMutation(api.chatRequests.sendDirect);
  const updateUserMutation = useMutation(api.users.update);
  const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isFollowBusy, setIsFollowBusy] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const isOrgBiz =
    !!target && (target.accountType === 'organization' || target.accountType === 'business');
  const isPrivate = target?.privacySettings?.profileVisibility === 'private';
  const isLocked = !!target && isPrivate && !isSelf && !isFollowing;

  const displayName = target?.organizationName || target?.name || 'Loading…';
  const coverUrl =
    target?.coverImage && /^(https?:|blob:|data:)/.test(target.coverImage)
      ? target.coverImage
      : null;

  const publicInterests = isLocked ? [] : getPublicInterests(target);
  const interestPool = useMemo<string[]>(() => {
    const pool: any[] = (target as any)?.interests || me.interests || [];
    return [...new Set(pool.filter(Boolean))] as string[];
  }, [target, me.interests]);

  const rating = ratingsData?.averageScore ?? null;
  const reviewsCountVal = ratingsData?.totalCount ?? (stats?.rated ?? null);

  const showToast = (title: string, subtitle: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, subtitle } }));

  // ---------------------------------------------------------------------------
  // Content tabbing
  // ---------------------------------------------------------------------------
  const tabbed = useMemo(() => {
    if (!content) return { posts: [] as any[], rallies: [] as any[], media: [] as any[] };
    const out = { posts: [] as any[], rallies: [] as any[], media: [] as any[] };
    for (const c of content) {
      if (c.type === 'POST') out.posts.push(c);
      else out.rallies.push(c);
      if (c.mediaUrl || (c.mediaUrls && c.mediaUrls.length > 0)) out.media.push(c);
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
          isBlueVerified: target.isBlueVerified,
          isVerified: target.isVerified,
          verificationStatus: target.verificationStatus,
          isNINVerified: target.isNINVerified,
          isPhoneVerified: false,
          badges: target.badges,
          accountType: target.accountType || 'personal',
          organizationName: target.organizationName,
          isPro: target.isPro,
        }
      : {
          id: id || '',
          name: 'User',
          username: '',
          avatar: '',
          isBlueVerified: false,
          isVerified: false,
          verificationStatus: 'unverified',
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
    mediaUrl: r.mediaUrl,
    mediaUrls: r.mediaUrls && r.mediaUrls.length > 0 ? r.mediaUrls : (r.mediaUrl ? [r.mediaUrl] : []),
    mediaType: r.mediaType,
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

  const activeList =
    activeTab === 'posts'
      ? tabbed.posts
      : activeTab === 'media'
        ? tabbed.media
        : [];

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
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
      await updateUserMutation({ userId: convexUserId as any, coverImage: storageId });
      updateUser({ coverImage: blobUrl });
      showToast('Cover photo updated', '');
    } catch {
      showToast('Error', 'Could not save cover photo.');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !convexUserId || !isSelf) return;
    setCropFile(file);
    setIsCropModalOpen(true);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
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

  const messageLabel =
    !directStatus
      ? 'Message'
      : (directStatus as any).status === 'pending_from_me'
        ? 'Pending'
        : 'Message';

  // ---------------------------------------------------------------------------
  // Tab navigation config — conditional on account type
  // ---------------------------------------------------------------------------
  const profileTabs: { key: PublicTab; label: string; icon: React.ReactNode }[] = [
    { key: 'posts', label: 'Posts', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'media', label: 'Media', icon: <Image className="w-3.5 h-3.5" /> },
    { key: 'likes', label: 'Likes', icon: <Heart className="w-3.5 h-3.5" /> },
    ...(isOrgBiz ? [{ key: 'about' as PublicTab, label: 'About', icon: <Info className="w-3.5 h-3.5" /> }] : []),
  ];

  // ---------------------------------------------------------------------------
  // Invalid profile URL guard
  // ---------------------------------------------------------------------------
  if (id && !validId) {
    return (
      <PageShell title="Profile">
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-5">
              <UserIcon className="w-8 h-8 text-zinc-400" strokeWidth={1.75} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">Profile not found</h3>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
              We couldn't find that account. It may have been removed or the link is incorrect.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={profile?.name || target?.name ? `${profile?.name || target?.name}'s profile` : 'Profile'}>
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">

              {/* ---- Cover ---- */}
              <CoverBanner
                ref={coverRef}
                coverImage={coverUrl}
                canEdit={isSelf}
                onCoverUploaded={handleCoverUploaded}
                onError={(msg) => showToast('Error', msg)}
              />

              {/* ---- Identity ---- */}
              <div className="px-4 sm:px-6 pb-2">
                <div className="relative -mt-10 sm:-mt-14 z-10 w-fit">
                  <div className="relative">
                    <Avatar
                      src={avatarPreview || profile?.avatar || target?.avatar}
                      name={profile?.name || target?.name || 'User'}
                      size="xl"
                      className="border-4 border-white shadow-lg"
                    />
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  {isSelf && convexUserId && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setCropFile(null); setIsCropModalOpen(true); }}
                        className="absolute bottom-0 right-0 p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full transition-all shadow-md active:scale-95 cursor-pointer z-20"
                        title="Change Profile Photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input
                        id="user-profile-avatar-input"
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        tabIndex={-1}
                        disabled={avatarUploading}
                        onChange={handleAvatarChange}
                      />
                    </>
                  )}
                </div>

                {/* Name + badge + account type */}
                <div className="flex items-center gap-1.5 mt-3 mb-0.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                    {profile?.name || target?.name || 'Loading…'}
                  </h1>
                  <ProfileVerificationCheck user={profile || target} size="lg" />
                  {isOrgBiz && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 shrink-0">
                      {profile?.accountType === 'business' || target?.accountType === 'business' ? 'Business' : 'Organization'}
                    </span>
                  )}
                  {isOrgBiz && (profile?.category || target?.category) && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 shrink-0">
                      {profile?.category || target?.category}
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-zinc-400 mb-1">
                  {(profile?.username || target?.username)
                    ? `@${(profile?.username || target?.username || '').replace(/^@+/, '')}`
                    : ''}
                </p>

                {/* Bio */}
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

                {/* Location & interests (non-locked) */}
                {!isLocked && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 font-medium">
                      {(profile?.location || target?.location) ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          {profile?.location || target?.location}
                        </span>
                      ) : null}
                    </div>

                    {publicInterests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
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

                    {/* ── Social Stats Row (Following | Followers | Likes) ── */}
                    <div className="flex items-center gap-5 pt-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-zinc-900">
                          {formatCount(profile ? profile.followingCount : (followingCount ?? null))}
                        </span>
                        <span className="text-sm text-zinc-500 font-medium">Following</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-zinc-900">
                          {formatCount(profile ? profile.followersCount : (followerCount ?? null))}
                        </span>
                        <span className="text-sm text-zinc-500 font-medium">Followers</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-zinc-900">—</span>
                        <span className="text-sm text-zinc-500 font-medium">Likes</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ---- Action Buttons ---- */}
              <div className="px-4 sm:px-6 mt-3 mb-4">
                {isSelf && convexUserId ? (
                  /* MY PROFILE ACTIONS */
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
                              onClick={() => { setMoreOpen(false); setStatsModalOpen(true); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                            >
                              <BarChart2 className="w-4 h-4 text-indigo-500" /> Profile Stats
                            </button>
                            {isOrgBiz && (
                              <button
                                onClick={() => { setMoreOpen(false); setActiveTab('about'); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                              >
                                <Info className="w-4 h-4 text-zinc-500" /> About &amp; Reviews
                              </button>
                            )}
                            <button
                              onClick={() => { setMoreOpen(false); shareProfile(); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                            >
                              <Share2 className="w-4 h-4 text-zinc-500" /> Share Profile
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
                  /* PUBLIC PROFILE ACTIONS — never shows Edit Profile */
                  convexUserId && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Follow / Following */}
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

                      {/* Message */}
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

                      {/* More menu — public view */}
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
                                onClick={() => { setMoreOpen(false); setStatsModalOpen(true); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                              >
                                <BarChart2 className="w-4 h-4 text-indigo-500" /> Profile Stats
                              </button>
                              {isOrgBiz && (
                                <button
                                  onClick={() => { setMoreOpen(false); setActiveTab('about'); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                                >
                                  <Info className="w-4 h-4 text-zinc-500" /> About &amp; Reviews
                                </button>
                              )}
                              <button
                                onClick={() => { setMoreOpen(false); shareProfile(); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                              >
                                <Share2 className="w-4 h-4 text-zinc-500" /> Share Profile
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

              {/* ================================================================ */}
              {/* TAB NAVIGATION                                                   */}
              {/* ================================================================ */}
              {!isLocked && (
                <div className="border-t border-zinc-200/80 overflow-x-auto no-scrollbar">
                  <div className="flex items-stretch min-w-full sm:min-w-0">
                    {profileTabs.map((tab) => {
                      const isSelected = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveTab(tab.key)}
                          className={cn(
                            'flex-1 min-w-[72px] py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all relative select-none group',
                            isSelected ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
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
              )}

              {/* ================================================================ */}
              {/* TAB CONTENT                                                      */}
              {/* ================================================================ */}
              {!isLocked && (
                <div className="min-h-[200px]">

                  {/* POSTS */}
                  {activeTab === 'posts' && (
                    <div className="divide-y divide-zinc-100">
                      {content === undefined ? null : tabbed.posts.length > 0 ? (
                        tabbed.posts.map((r: any) => <PostCard key={r._id} post={mapRally(r) as any} />)
                      ) : (
                        <div className="p-10 text-center text-zinc-500">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                          <p className="font-bold text-zinc-900 text-sm mb-1">No posts yet</p>
                          <p className="text-xs text-zinc-400">Nothing to show here.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MEDIA */}
                  {activeTab === 'media' && (
                    <div>
                      {content === undefined ? null : tabbed.media.length > 0 ? (
                        <div className="grid grid-cols-3 gap-0.5 p-0.5">
                          {tabbed.media.map((r: any) => {
                            const thumb = (r.mediaUrls && r.mediaUrls.length > 0) ? r.mediaUrls[0] : r.mediaUrl;
                            return (
                              <Link
                                key={r._id}
                                to={`/rally/${r._id}`}
                                className="relative aspect-square bg-zinc-100 overflow-hidden group"
                              >
                                {r.mediaType === 'video' ? (
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
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-10 text-center text-zinc-500">
                          <Image className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                          <p className="font-bold text-zinc-900 text-sm mb-1">No media yet</p>
                          <p className="text-xs text-zinc-400">Posts with photos or videos will appear here.</p>
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
                        Posts this person likes will appear here soon.
                      </p>
                    </div>
                  )}

                  {/* ABOUT — Only for Business/Organization */}
                  {activeTab === 'about' && isOrgBiz && (() => {
                    const targetData = target || profile;
                    const joined = joinedDate(targetData?._creationTime);
                    const isVerified = targetData?.isBlueVerified || targetData?.isVerified || targetData?.verificationStatus === 'verified';
                    const websiteUrl = targetData?.website && /^(https?:|blob:|data:)/.test(targetData.website)
                      ? targetData.website
                      : targetData?.website ? `https://${targetData.website}` : null;
                    return (
                      <div className="p-4 sm:p-6 space-y-6">
                        {/* Business/Org identity info */}
                        <div className="space-y-3">
                          {(targetData?.accountType === 'business' || targetData?.accountType === 'organization') && (
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ring-1 ring-inset',
                                targetData.accountType === 'business'
                                  ? 'bg-violet-50 text-violet-700 ring-violet-200'
                                  : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                              )}>
                                {targetData.accountType === 'business' ? 'Business' : 'Organization'}
                              </span>
                              {targetData?.category && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200">
                                  {targetData.category}
                                </span>
                              )}
                            </div>
                          )}
                          {targetData?.bio && (
                            <p className="text-sm text-zinc-700 font-medium leading-relaxed">{targetData.bio}</p>
                          )}
                          {(targetData?.description && targetData.description !== targetData?.bio) && (
                            <p className="text-sm text-zinc-600 font-medium leading-relaxed">{targetData.description}</p>
                          )}
                          {targetData?.location && (
                            <div className="flex items-center gap-2 text-sm text-zinc-600 font-medium">
                              <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                              <span>{targetData.location}</span>
                            </div>
                          )}
                          {joined && (
                            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                              <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                              <span>Joined {joined}</span>
                            </div>
                          )}
                          {websiteUrl && (
                            <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:underline">
                              <Globe className="w-4 h-4 shrink-0" />
                              <span className="break-all">{targetData?.website}</span>
                            </a>
                          )}
                          {isVerified && (
                            <div className="flex items-center gap-2 text-sm text-emerald-700 font-bold">
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>Verified Account</span>
                            </div>
                          )}
                          {(targetData?.socialLinks && targetData.socialLinks.length > 0) && (
                            <OrgSocialLinks links={targetData.socialLinks} />
                          )}
                        </div>

                        <div className="border-t border-zinc-100" />

                        {/* Reviews section */}
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4">Reviews</h3>
                          {ratingsData === undefined ? (
                            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
                          ) : ratingsData.ratings.length > 0 ? (
                            <div>
                              <div className="mb-4 p-4 bg-gradient-to-r from-amber-50/70 to-orange-50/50 rounded-2xl border border-amber-100 flex items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-zinc-900">{ratingsData.averageScore}</span>
                                    <div className="flex items-center text-amber-400">
                                      {[1,2,3,4,5].map((star) => (
                                        <Star key={star} className={cn('w-4 h-4', Math.round(ratingsData.averageScore) >= star ? 'fill-amber-400 text-amber-400' : 'text-zinc-300')} />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-xs text-zinc-600 font-medium mt-0.5">Based on {ratingsData.totalCount} review{ratingsData.totalCount === 1 ? '' : 's'}</p>
                                </div>
                              </div>
                              <div className="divide-y divide-zinc-100">
                                {ratingsData.ratings.map((r: any) => (
                                  <div key={r._id} className="py-4 hover:bg-zinc-50/50 transition-colors rounded-xl px-1">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar src={r.rater?.avatar} name={r.rater?.name} size="md" className="ring-1 ring-zinc-200" />
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1">
                                            <span className="font-bold text-zinc-900 text-sm truncate">{r.rater?.name || 'Anonymous Neighbor'}</span>
                                            <ProfileVerificationCheck user={r.rater} size="sm" />
                                          </div>
                                          <p className="text-xs text-zinc-400 font-medium truncate">{r.rater?.username ? `@${r.rater.username.replace(/^@+/, '')}` : ''}</p>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="flex items-center gap-0.5 text-amber-400">
                                          {[1,2,3,4,5].map((star) => (
                                            <Star key={star} className={cn('w-3.5 h-3.5', r.score >= star ? 'fill-amber-400 text-amber-400' : 'text-zinc-200')} />
                                          ))}
                                        </div>
                                        <span className="text-[11px] text-zinc-400 font-medium mt-0.5 block">{new Date(r.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    {r.review && <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed mt-2 pl-11">"{r.review}"</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 px-4">
                              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3"><Star className="w-7 h-7" /></div>
                              <h3 className="text-lg font-black text-zinc-900 tracking-tight">No reviews yet</h3>
                              <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto">No neighbour reviews to show.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* ---- Locked account empty state ---- */}
              {isLocked && (
                <div className="p-10 text-center text-zinc-400">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                    <UserIcon className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="font-bold text-zinc-900 text-sm mb-1">This account is private</p>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Follow this account to see their posts and activity.
                  </p>
                </div>
              )}
            </div>
      </div>

      {/* Profile Stats Modal */}
      {statsModalOpen && !isLocked && (
        <PublicStatsModal
          rating={rating}
          reviewsCount={reviewsCountVal}
          postsCount={profile ? profile.postsCount : (stats?.posted ?? null)}
          followersCount={profile ? profile.followersCount : (followerCount ?? null)}
          followingCount={profile ? profile.followingCount : (followingCount ?? null)}
          onClose={() => setStatsModalOpen(false)}
          onRatingClick={() => setActiveTab('about')}
        />
      )}

      {/* ---- Edit Interests modal (self only) ---- */}
      {interestsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-black text-zinc-900">Public interests</h3>
              <button onClick={() => setInterestsOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-zinc-100 transition-colors">
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 font-medium mb-4 leading-relaxed">
              Pick up to 3 interests to show on your public profile. The rest stay private and are only used for recommendations.
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
                        <span className="text-[10px] font-black text-zinc-400">#{addedOrder + 1}</span>
                      )}
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

      {/* ---- Message request modal ---- */}
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
              You don't follow each other yet, so this will be sent as a{' '}
              <span className="font-bold text-zinc-700">message request</span>. They can accept it to start chatting.
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

      {isSelf && (
        <UserAvatarCropModal
          isOpen={isCropModalOpen}
          onClose={() => setIsCropModalOpen(false)}
          initialFile={cropFile}
          currentImageUrl={avatarPreview || profile?.avatar || target?.avatar}
          userName={profile?.name || target?.name}
          onSuccess={(_storageId, blobUrl) => {
            setAvatarPreview(blobUrl);
          }}
        />
      )}
    </PageShell>
  );
}

export default function UserProfile() {
  return (
    <QueryErrorBoundary message="We couldn't load this profile right now. Please try again.">
      <UserProfileContent />
    </QueryErrorBoundary>
  );
}