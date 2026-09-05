import React, { useMemo, useRef, useState } from 'react';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import {
  BadgeCheck,
  Edit3,
  MapPin,
  MoreHorizontal,
  Share2,
  Camera,
  Star,
  Users,
  UserCheck,
  UserPlus,
  CheckCircle2,
  FileText,
  Loader2,
  Calendar,
  Compass,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import CoverBanner, { CoverBannerHandle } from '../components/CoverBanner';
import QueryErrorBoundary from '../components/QueryErrorBoundary';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import PostCard from '../components/PostCard';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { cn, getPublicInterests } from '../lib/utils';
import { Rally } from '../types';
import {
  processAndCompressImage,
  uploadToConvexStorage,
  logUploadStage,
} from '../utils/imageUpload';

type ProfileTab = 'posts' | 'followers' | 'following' | 'rated' | 'done';

const VALID_TABS: ProfileTab[] = ['posts', 'followers', 'following', 'rated', 'done'];

export default function Profile() {
  const { user, convexUserId, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const coverRef = useRef<CoverBannerHandle>(null);
  const [moreOpen, setMoreOpen] = useState(false);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !convexUserId) return;
    setAvatarUploading(true);
    logUploadStage('SELECT', 'Avatar photo selected from mobile/desktop picker', {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    try {
      const compressedBlob = await processAndCompressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
      });
      const blobUrl = URL.createObjectURL(compressedBlob);
      updateUser({ avatar: blobUrl });

      const storageId = await uploadToConvexStorage(
        compressedBlob,
        generateAvatarUploadUrl
      );
      logUploadStage('SYNC', 'Updating user avatar in Convex', { storageId });
      await updateUserMutation({
        userId: convexUserId as any,
        avatar: storageId,
      });
      showToast('Profile photo updated', 'Your new photo is now live.');
    } catch (err: any) {
      logUploadStage('UPLOAD', 'Avatar upload failed', { error: err?.message || String(err) });
      showToast('Error', err?.message || 'Could not save profile photo. Please try again.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // 1. Live Stats Queries
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
  const ratedCount = stats?.rated ?? (stats === undefined ? null : 0);
  const doneCount = stats?.completed ?? (stats === undefined ? null : 0);

  // ---------------------------------------------------------------------------
  // 2. Tab Content Queries
  // ---------------------------------------------------------------------------
  // Posts
  const rawPosts = useQuery(
    api.rallies.listByCreator,
    convexUserId && activeTab === 'posts'
      ? { creatorId: convexUserId as any, userId: convexUserId as any }
      : 'skip'
  );

  // Followers
  const followersList = useQuery(
    api.follows.listFollowersWithProfiles,
    convexUserId && activeTab === 'followers'
      ? { userId: convexUserId as any, viewerId: convexUserId as any }
      : 'skip'
  );

  // Following
  const followingList = useQuery(
    api.follows.listFollowingWithProfiles,
    convexUserId && activeTab === 'following'
      ? { userId: convexUserId as any, viewerId: convexUserId as any }
      : 'skip'
  );

  // Rated
  const ratingsData = useQuery(
    api.rallies.listRatingsForUser,
    convexUserId && activeTab === 'rated'
      ? { userId: convexUserId as any }
      : 'skip'
  );

  // Done
  const rawDone = useQuery(
    api.rallies.listCompletedByUser,
    convexUserId && activeTab === 'done'
      ? { userId: convexUserId as any }
      : 'skip'
  );

  // Map raw Convex rallies/posts to Rally shape
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

  const postsList: Rally[] = useMemo(() => {
    if (!rawPosts) return [];
    return rawPosts.map(mapRally).filter((p) => !deletedIds.has(p.id));
  }, [rawPosts, deletedIds]);

  const doneList: Rally[] = useMemo(() => {
    if (!rawDone) return [];
    return rawDone.map(mapRally).filter((d) => !deletedIds.has(d.id));
  }, [rawDone, deletedIds]);

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

  const coverUrl =
    user.coverImage && /^(https?:|blob:|data:)/.test(user.coverImage)
      ? user.coverImage
      : null;

  const publicInterests = user.showInterests !== false ? getPublicInterests(user) : [];

  const statTabs: { key: ProfileTab; label: string; value: number | null }[] = [
    { key: 'posts', label: 'Posts', value: postedCount },
    { key: 'followers', label: 'Followers', value: followersTotal },
    { key: 'following', label: 'Following', value: followingTotal },
    { key: 'rated', label: 'Rated', value: ratedCount },
    { key: 'done', label: 'Done', value: doneCount },
  ];

  return (
    <QueryErrorBoundary message="Your profile couldn't be loaded right now. Please try again.">
      <PageShell title="Profile">
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          
          {/* =============================================================== */}
          {/* 1. PROFILE HEADER                                               */}
          {/* =============================================================== */}
          <div>
            {/* Cover Banner */}
            <CoverBanner
              ref={coverRef}
              coverImage={coverUrl}
              canEdit
              onCoverUploaded={handleCoverUploaded}
              onError={(msg) => showToast('Error', msg)}
            />

            {/* Profile Info Details */}
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

                {/* Direct Mobile/Desktop Avatar Picker Trigger */}
                <label
                  htmlFor="profile-avatar-input"
                  className="absolute bottom-0 right-0 p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full transition-all shadow-md active:scale-95 cursor-pointer z-20"
                  title="Edit Profile Photo"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </label>

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

              {/* Name & Badges */}
              <div className="flex items-center gap-1.5 mt-3 mb-0.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                  {user.name}
                </h2>
                {user.isNINVerified && (
                  <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
              </div>
              <p className="text-sm font-semibold text-zinc-400 mb-1.5">
                {user.username ? `@${user.username.replace(/^@+/, '')}` : ''}
              </p>

              {/* Bio */}
              <p className="text-sm text-zinc-700 font-medium leading-relaxed mb-2 max-w-xl">
                {user.bio || 'Always looking for something fun to do.'}
              </p>

              {/* Metadata (Location, Gender) */}
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
            </div>

            {/* Action Buttons Row */}
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
                      <div className="absolute right-0 top-full mt-1.5 z-40 w-48 bg-white rounded-2xl shadow-lg border border-zinc-100 overflow-hidden py-1 text-left animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => { setMoreOpen(false); shareProfile(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                        >
                          <Share2 className="w-4 h-4 text-indigo-500" /> Share Profile
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 2. PROFILE STATS (SINGLE HORIZONTAL ROW & TAB NAVIGATION)       */}
          {/* =============================================================== */}
          <div className="border-t border-b border-zinc-200/80 bg-zinc-50/60 overflow-x-auto no-scrollbar">
            <div className="flex items-stretch divide-x divide-zinc-200/70 min-w-full sm:min-w-0 max-w-2xl mx-auto">
              {statTabs.map((tab) => {
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTab(tab.key)}
                    className={cn(
                      'flex-1 min-w-[70px] sm:min-w-0 py-3 sm:py-3.5 px-2 flex flex-col items-center justify-center transition-all relative select-none group',
                      isSelected
                        ? 'bg-white shadow-xs text-zinc-900'
                        : 'hover:bg-zinc-100/70 text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    <span className={cn(
                      'text-lg sm:text-2xl font-black leading-tight transition-transform group-hover:scale-105',
                      isSelected ? 'text-zinc-900' : 'text-zinc-700'
                    )}>
                      {tab.value === null ? (
                        <span className="text-zinc-300 font-normal">…</span>
                      ) : (
                        tab.value
                      )}
                    </span>
                    <span className={cn(
                      'text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-0.5 transition-colors',
                      isSelected ? 'text-zinc-900 font-black' : 'text-zinc-400'
                    )}>
                      {tab.label}
                    </span>

                    {/* Active tab bottom highlight bar */}
                    {isSelected && (
                      <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-zinc-900 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =============================================================== */}
          {/* 3. TAB CONTENT                                                  */}
          {/* =============================================================== */}
          <div className="min-h-[260px]">

            {/* ------------------------------------------------------------- */}
            {/* TAB: POSTS                                                    */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'posts' && (
              <div className="divide-y divide-zinc-100">
                {rawPosts === undefined ? (
                  <>
                    <RallyCardSkeleton />
                    <RallyCardSkeleton />
                  </>
                ) : postsList.length > 0 ? (
                  postsList.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onDeleted={handleDeleted}
                    />
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

            {/* ------------------------------------------------------------- */}
            {/* TAB: FOLLOWERS                                                */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'followers' && (
              <div className="divide-y divide-zinc-100">
                {followersList === undefined ? (
                  <UserListSkeleton />
                ) : followersList.length > 0 ? (
                  followersList.map((f: any) => (
                    <UserRow
                      key={f._id}
                      targetUser={f}
                      currentViewerId={convexUserId}
                    />
                  ))
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">No followers yet</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto">
                      When other neighbors follow your profile, they will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: FOLLOWING                                                */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'following' && (
              <div className="divide-y divide-zinc-100">
                {followingList === undefined ? (
                  <UserListSkeleton />
                ) : followingList.length > 0 ? (
                  followingList.map((f: any) => (
                    <UserRow
                      key={f._id}
                      targetUser={f}
                      currentViewerId={convexUserId}
                    />
                  ))
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                      <UserCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">Not following anyone yet</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto">
                      Explore neighbors and activities to follow people in your community.
                    </p>
                    <Link
                      to="/explore"
                      className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
                    >
                      Explore Neighbors
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: RATED                                                    */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'rated' && (
              <div>
                {ratingsData === undefined ? (
                  <RatingsSkeleton />
                ) : ratingsData.ratings.length > 0 ? (
                  <div>
                    {/* Overall Rating Banner */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/70 to-orange-50/50 border-b border-amber-100 flex items-center justify-between gap-4">
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
                          Based on {ratingsData.totalCount} neighbor review{ratingsData.totalCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {/* Individual Reviews List */}
                    <div className="divide-y divide-zinc-100">
                      {ratingsData.ratings.map((r: any) => (
                        <div key={r._id} className="p-4 sm:p-5 hover:bg-zinc-50/50 transition-colors">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar
                                src={r.rater?.avatar}
                                name={r.rater?.name}
                                size="md"
                                className="ring-1 ring-zinc-200"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-zinc-900 text-sm truncate">
                                    {r.rater?.name || 'Anonymous Neighbor'}
                                  </span>
                                  {r.rater?.isNINVerified && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  )}
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
                                      r.score >= star
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-zinc-200'
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
                  <div className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                      <Star className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">No ratings yet</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto">
                      When neighbors rate and review their experiences with you, they will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: DONE                                                     */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'done' && (
              <div className="divide-y divide-zinc-100">
                {rawDone === undefined ? (
                  <>
                    <RallyCardSkeleton />
                    <RallyCardSkeleton />
                  </>
                ) : doneList.length > 0 ? (
                  doneList.map((rally) => (
                    <RallyCard
                      key={rally.id}
                      rally={rally}
                      onDeleted={handleDeleted}
                    />
                  ))
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">No completed rallies yet</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1 max-w-xs mx-auto">
                      Rallies and events you complete will appear here.
                    </p>
                    <Link
                      to="/explore"
                      className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
                    >
                      Find a RALLY
                    </Link>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </PageShell>
    </QueryErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// User Row component for Followers & Following tabs
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
      <Link
        to={`/user/${targetUser._id}`}
        className="flex items-center gap-3 min-w-0 flex-1 group"
      >
        <Avatar
          src={targetUser.avatar}
          name={targetUser.name}
          size="md"
          className="ring-1 ring-zinc-200"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-zinc-900 text-sm group-hover:text-indigo-600 transition-colors truncate">
              {targetUser.name}
            </h4>
            {targetUser.isNINVerified && (
              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
          </div>
          <p className="text-xs text-zinc-400 font-medium truncate">
            {targetUser.username ? `@${targetUser.username.replace(/^@+/, '')}` : ''}
          </p>
          {targetUser.bio && (
            <p className="text-xs text-zinc-600 font-medium line-clamp-1 mt-0.5">
              {targetUser.bio}
            </p>
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
              <UserPlus className="w-3.5 h-3.5" />
              <span>Follow</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------
function UserListSkeleton() {
  return (
    <div className="divide-y divide-zinc-100 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="w-28 h-3.5 bg-zinc-200 rounded" />
            <div className="w-20 h-3 bg-zinc-100 rounded" />
          </div>
          <div className="w-16 h-7 bg-zinc-200 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function RatingsSkeleton() {
  return (
    <div className="divide-y divide-zinc-100 animate-pulse">
      <div className="p-5 bg-amber-50/30">
        <div className="w-32 h-6 bg-zinc-200 rounded mb-2" />
        <div className="w-48 h-3 bg-zinc-100 rounded" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-200" />
              <div className="w-24 h-3.5 bg-zinc-200 rounded" />
            </div>
            <div className="w-16 h-3 bg-zinc-100 rounded" />
          </div>
          <div className="w-3/4 h-3 bg-zinc-100 rounded ml-10" />
        </div>
      ))}
    </div>
  );
}
