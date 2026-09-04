import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Avatar from '../components/Avatar';
import CoverBanner, { CoverBannerHandle } from '../components/CoverBanner';
import RallyCard from '../components/RallyCard';
import RallyCardSkeleton from '../components/RallyCardSkeleton';
import OrgSocialLinks, {
  SOCIAL_PLATFORMS,
  normalizeSocialUrl,
} from '../components/OrgSocialLinks';
import {
  BadgeCheck,
  MapPin,
  Globe,
  Crown,
  Calendar,
  Building2,
  Image,
  HelpingHand,
  ChevronRight,
  ExternalLink,
  Pencil,
  X,
  Plus,
  Camera,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Rally } from '../types';
import {
  processAndCompressImage,
  uploadToConvexStorage,
  logUploadStage,
} from '../utils/imageUpload';

const ORG_CATEGORIES = [
  'Sports & Fitness',
  'Music & Entertainment',
  'Food & Dining',
  'Tech & Innovation',
  'Education',
  'Fashion & Lifestyle',
  'Events & Hospitality',
  'Community & Social',
  'Arts & Culture',
  'Travel & Tourism',
  'Business & Services',
  'Other',
];

export default function ManagePage() {
  const { user, convexUserId, isPro, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'rallies' | 'events' | 'media'>('posts');
  const [editOpen, setEditOpen] = useState(false);
  const coverRef = useRef<CoverBannerHandle>(null);
  const updateUserMutation = useMutation(api.users.update);

  const isOrgBiz =
    user.accountType === 'organization' || user.accountType === 'business';

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
  const content = useQuery(
    api.rallies.listByCreator,
    convexUserId
      ? { creatorId: convexUserId as any, userId: convexUserId as any }
      : 'skip'
  );

  const mapped: Rally[] = useMemo(() => {
    if (!content) return [];
    return content.map((r) => ({
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
      creator: {
        id: convexUserId || 'me',
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        isNINVerified: user.isNINVerified,
        isPhoneVerified: false,
        badges: user.badges,
        accountType: user.accountType || 'personal',
        organizationName: user.organizationName,
        isPro: user.isPro,
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
      mediaType: r.mediaType as Rally['mediaType'],
      capacity: r.capacity,
      likesCount: r.likesCount,
      commentsCount: r.commentsCount,
      rsvpsCount: r.rsvpsCount,
      isLiked: r.isLiked,
      isRsvpd: r.isRsvpd,
    }));
  }, [content, convexUserId, user]);

  const posts = mapped.filter((r) => r.type === 'POST');
  const events = mapped.filter((r) => r.type === 'EVENT');
  const rallyItems = mapped.filter((r) => r.type !== 'POST' && r.type !== 'EVENT');
  const mediaItems = mapped.filter((r) => !!r.mediaUrl);
  const isLoading = content === undefined;

  const displayName = user.organizationName || user.name;
  const isBusiness = user.accountType === 'business';
  const coverUrl =
    user.coverImage && /^(https?:|blob:|data:)/.test(user.coverImage)
      ? user.coverImage
      : null;
  const websiteUrl =
    user.website && /^(https?:|blob:|data:)/.test(user.website)
      ? user.website
      : user.website
        ? `https://${user.website}`
        : null;

  const tabs: { key: 'posts' | 'rallies' | 'events' | 'media'; label: string }[] = [
    { key: 'posts', label: `Posts (${isLoading ? '…' : posts.length})` },
    { key: 'rallies', label: `RALLYs (${isLoading ? '…' : rallyItems.length})` },
    { key: 'events', label: `Events (${isLoading ? '…' : events.length})` },
    { key: 'media', label: `Media (${isLoading ? '…' : mediaItems.length})` },
  ];

  const activeList =
    activeTab === 'posts' ? posts : activeTab === 'rallies' ? rallyItems : activeTab === 'events' ? events : mediaItems;

  const dispatchCreate = (type?: 'POST' | 'EVENT') => {
    window.dispatchEvent(
      new CustomEvent('open-create-rally', {
        detail: type ? { type } : {},
      })
    );
  };

  const showToast = (t: string, s: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title: t, subtitle: s } }));

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

  // Not an org/business account — show a helpful gate instead of the page.
  if (!isOrgBiz) {
    return (
      <PageShell title="My Page">
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden">
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight">
              This Page is for Organizations & Businesses
            </h3>
            <p className="text-sm text-zinc-500 font-medium max-w-sm mx-auto mt-2 mb-7 leading-relaxed">
              Switch your account to an Organization or Business to get a dedicated
              page for managing events and content. Both require lalao Pro.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/profile"
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-sm font-bold transition-all active:scale-95"
              >
                Change account type
              </Link>
              {!isPro && (
                <Link
                  to="/plus"
                  className="px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-full text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                  Upgrade to lalao Pro
                </Link>
              )}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="My Page"
      subtitle="Manage your organization and its presence on lalao."
    >
      <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 divide-y divide-zinc-100 overflow-hidden">
        {/* Cover + Identity */}
        <div>
          {/* Cover */}
          <CoverBanner
            ref={coverRef}
            coverImage={coverUrl}
            canEdit
            onCoverUploaded={handleCoverUploaded}
            onError={(msg) => showToast('Error', msg)}
          />

          <div className="px-6 pb-6 sm:pb-7 text-center">
            <Avatar
              src={user.avatar}
              name={displayName}
              size="xl"
              className="mx-auto -mt-10 sm:-mt-12 shadow-md ring-4 ring-white"
            />

            <div className="flex items-center justify-center gap-1.5 mt-2.5 mb-0.5 flex-wrap px-2">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                {displayName}
              </h2>
              {user.isNINVerified && (
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 shrink-0">
                {isBusiness ? 'Business' : 'Organization'}
              </span>
              {user.category && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 shrink-0">
                  {user.category}
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-zinc-400 mb-2.5">
              {user.username ? `@${user.username.replace(/^@+/, '')}` : ''}
            </p>

            {(user.description || user.bio) && (
              <p className="text-sm text-zinc-700 font-medium max-w-md mx-auto leading-relaxed mb-3">
                {user.description || user.bio}
              </p>
            )}

            <div className="text-xs text-zinc-500 font-medium space-y-1 mb-3 flex flex-col items-center">
              {user.location && (
                <div className="flex items-center gap-1 text-zinc-600">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{user.location}</span>
                </div>
              )}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-600 hover:underline font-semibold"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="break-all">{user.website}</span>
                </a>
              )}
            </div>

            <OrgSocialLinks links={user.socialLinks || []} className="mb-5" />

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setEditOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Pencil className="w-4 h-4" />
                Edit Page
              </button>
              <button
                onClick={() => dispatchCreate('EVENT')}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95"
                title="Create a new Event"
              >
                <Calendar className="w-4 h-4" />
                Create Event
              </button>
              <Link
                to={`/user/${convexUserId}`}
                className="px-5 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View public page
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="py-4 sm:py-5 px-4 bg-zinc-50/50">
          <div className="grid grid-cols-3 divide-x divide-zinc-200/70 text-center max-w-md mx-auto">
            <StatCell label="Posts" value={stats?.posted ?? (stats === undefined ? null : 0)} />
            <StatCell label="Followers" value={followerCount ?? (followerCount === undefined ? null : 0)} />
            <StatCell label="Following" value={followingCount ?? (followingCount === undefined ? null : 0)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 py-3 text-xs font-bold transition-colors',
                activeTab === tab.key
                  ? 'text-zinc-900 border-b-2 border-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-zinc-100">
          {isLoading ? (
            <>
              <RallyCardSkeleton />
              <RallyCardSkeleton />
            </>
          ) : activeList.length > 0 ? (
            activeList.map((rally) => <RallyCard key={rally.id} rally={rally} />)
          ) : activeTab === 'events' ? (
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              title="No events yet"
              body="Host a local event for your organization or business."
              actionLabel="Create an Event"
              onAction={() => dispatchCreate('EVENT')}
            />
          ) : activeTab === 'posts' ? (
            <EmptyState
              icon={<Building2 className="w-8 h-8" />}
              title="No posts yet"
              body="Share updates with your community."
              actionLabel="Create a Post"
              onAction={() => dispatchCreate('POST')}
            />
          ) : activeTab === 'rallies' ? (
            <EmptyState
              icon={<HelpingHand className="w-8 h-8" />}
              title="No RALLYs yet"
              body="Create a RALLY to bring people together near you."
              actionLabel="Create a RALLY"
              onAction={() => dispatchCreate()}
            />
          ) : (
            <EmptyState
              icon={<Image className="w-8 h-8" />}
              title="No media yet"
              body="Photos and videos from your posts and events will appear here."
            />
          )}
        </div>

        {/* Manage events shortcut */}
        <Link
          to="/my-rallys"
          className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors font-bold text-zinc-900 text-sm group border-t border-zinc-100"
        >
          <span>Manage RALLYs</span>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      <EditPageSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(toast, subtitle) =>
          window.dispatchEvent(
            new CustomEvent('show-toast', { detail: { title: toast, subtitle } })
          )
        }
      />
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
function StatCell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="px-2">
      <div className="text-xl sm:text-2xl font-black text-zinc-900">
        {value === null ? <span className="text-zinc-300 text-lg">…</span> : value}
      </div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="py-14 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="font-bold text-zinc-900 text-sm mb-1">{title}</p>
      <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto mb-6">{body}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Page sheet: organization profile fields + media (avatar & cover).
// ---------------------------------------------------------------------------
function EditPageSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (title: string, subtitle: string) => void;
}) {
  const { user, convexUserId, updateUser } = useAuth();
  const updateUserMutation = useMutation(api.users.update);
  const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const generateCoverUploadUrl = useMutation(api.users.generateCoverUploadUrl);

  const [orgName, setOrgName] = useState(user.organizationName || user.name || '');
  const [username, setUsername] = useState((user.username || '').replace(/^@+/, ''));
  const [category, setCategory] = useState(user.category || '');
  const [bio, setBio] = useState(user.bio || '');
  const [description, setDescription] = useState(user.description || '');
  const [location, setLocation] = useState(user.location || '');
  const [website, setWebsite] = useState(user.website || '');
  const [socialLinks, setSocialLinks] = useState(
    (user.socialLinks || []).map((l) => ({ platform: l.platform, url: l.url }))
  );

  const [avatar, setAvatar] = useState(user.avatar || '');
  const [avatarStorageId, setAvatarStorageId] = useState<string | null>(null);
  const [cover, setCover] = useState(user.coverImage || '');
  const [coverStorageId, setCoverStorageId] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setSaveError(null);
    logUploadStage('SELECT', 'Avatar selected in ManagePage', { name: file.name, size: file.size });
    try {
      const compressedBlob = await processAndCompressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
      });
      const storageId = await uploadToConvexStorage(compressedBlob, generateAvatarUploadUrl);
      setAvatarStorageId(storageId);
      setAvatar(URL.createObjectURL(compressedBlob));
    } catch (err: any) {
      logUploadStage('UPLOAD', 'Avatar upload failed in ManagePage', { error: err?.message || String(err) });
      setSaveError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setSaveError(null);
    logUploadStage('SELECT', 'Cover selected in ManagePage', { name: file.name, size: file.size });
    try {
      const compressedBlob = await processAndCompressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
      });
      const storageId = await uploadToConvexStorage(compressedBlob, generateCoverUploadUrl);
      setCoverStorageId(storageId);
      setCover(URL.createObjectURL(compressedBlob));
    } catch (err: any) {
      logUploadStage('UPLOAD', 'Cover upload failed in ManagePage', { error: err?.message || String(err) });
      setSaveError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!convexUserId) {
      setSaveError('Not connected. Please refresh and try again.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const cleanUsername = username.trim().replace(/^@+/, '');
      const trimmedWebsite = website.trim();
      const websiteValue = trimmedWebsite
        ? trimmedWebsite.includes('://')
          ? trimmedWebsite
          : `https://${trimmedWebsite}`
        : undefined;
      const links = socialLinks
        .filter((l) => l.url.trim())
        .map((l) => ({
          platform: l.platform,
          url: normalizeSocialUrl(l.platform, l.url),
        }));

      await updateUserMutation({
        userId: convexUserId as any,
        username: cleanUsername || undefined,
        organizationName: orgName.trim() || undefined,
        category: category || undefined,
        bio: bio.trim() || undefined,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        website: websiteValue,
        socialLinks: links.length > 0 ? links : undefined,
        avatar: avatarStorageId || undefined,
        coverImage: coverStorageId || undefined,
      });

      updateUser({
        username: username.trim(),
        organizationName: orgName.trim() || undefined,
        category: category || undefined,
        bio: bio.trim() || undefined,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        website: websiteValue,
        socialLinks: links.length > 0 ? links : undefined,
        avatar: avatar || undefined,
        coverImage: cover || undefined,
      });

      onClose();
      onSaved(
        'Page updated',
        'Your organization page has been saved.'
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const addSocial = () => {
    setSocialLinks((prev) => [...prev, { platform: 'instagram', url: '' }]);
  };

  const updateSocial = (i: number, patch: Partial<{ platform: string; url: string }>) => {
    setSocialLinks((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    );
  };

  const removeSocial = (i: number) => {
    setSocialLinks((prev) => prev.filter((_, idx) => idx !== i));
  };

  const coverUrl = /^(https?:|blob:|data:)/.test(cover) ? cover : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full md:max-w-lg bg-white md:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight">Edit Page</h3>
            <p className="text-xs text-zinc-500 font-medium">
              Update your organization profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-600" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 space-y-5">
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-800">{saveError}</p>
                <button
                  type="button"
                  onClick={() => setSaveError(null)}
                  className="text-[11px] text-red-600 font-semibold mt-0.5 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Cover */}
          <div>
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
              Cover photo
            </label>
            <div className="relative h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 border border-zinc-200">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {coverUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <label
                htmlFor="manage-cover-input"
                className="absolute bottom-2 right-2 p-2 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-full transition-colors active:scale-95 cursor-pointer shadow z-10"
                title="Change Cover Photo"
              >
                <Camera className="w-4 h-4" />
              </label>
            </div>
            <input
              id="manage-cover-input"
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              disabled={coverUploading}
              ref={coverInputRef}
              onChange={handleCoverUpload}
            />
          </div>

          {/* Avatar */}
          <div className="text-center -mt-2">
            <div className="relative inline-block">
              <Avatar
                src={avatar || undefined}
                name={orgName || user.name}
                size="xl"
                className="border-2 border-white shadow-md ring-1 ring-zinc-200"
              />
              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              <label
                htmlFor="manage-avatar-input"
                className="absolute bottom-0 right-0 p-1.5 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95 cursor-pointer z-10"
                title="Change Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
            </div>
            <input
              id="manage-avatar-input"
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              disabled={avatarUploading}
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Fields */}
          <Field label="Organization name">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Ryders Community Club"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
            />
          </Field>

          <Field label="Username">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold">
                @
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full rounded-xl border border-zinc-200 bg-white pl-8 pr-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
              />
            </div>
          </Field>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
            >
              <option value="">Select a category</option>
              {ORG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tagline (short bio)">
            <input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="One line about your organization"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
            />
          </Field>

          <Field label="About / Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell people what your organization does"
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
            />
          </Field>

          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
            />
          </Field>

          <Field label="Website">
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              inputMode="url"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
            />
          </Field>

          {/* Social links */}
          <div>
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
              Social links
            </label>
            <div className="space-y-2">
              {socialLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={link.platform}
                    onChange={(e) => updateSocial(i, { platform: e.target.value })}
                    className="rounded-xl border border-zinc-200 bg-white px-2.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none shrink-0"
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={link.url}
                    onChange={(e) => updateSocial(i, { url: e.target.value })}
                    placeholder={
                      link.platform === 'website'
                        ? 'https://example.com'
                        : link.platform === 'whatsapp'
                          ? '+234 801 234 5678'
                          : 'username / @handle'
                    }
                    className="flex-1 min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocial(i)}
                    className="p-2 rounded-full hover:bg-rose-50 text-rose-500 transition-colors shrink-0"
                    title="Remove link"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSocial}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add social link
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving || avatarUploading || coverUploading}
            className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Save changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}