import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import CreateRallyModal from '../components/CreateRallyModal';
import {
  BadgeCheck,
  MapPin,
  Globe,
  Mail,
  Phone,
  Plus,
  Pencil,
  Share2,
  Users,
  FileText,
  Flag,
  Calendar,
  Loader2,
  Check,
  AlertCircle,
  X,
  Upload,
  Camera,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Rally } from '../types';
import { processAndCompressImage, uploadToConvexStorage } from '../utils/imageUpload';
import PageImageCropModal from '../components/PageImageCropModal';

export default function PageView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, convexUserId } = useAuth();

  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropModalMode, setCropModalMode] = useState<'avatar' | 'cover'>('avatar');

  const page = useQuery(
    api.pages.getBySlug,
    slug ? { slug, viewerId: (convexUserId as any) || undefined } : 'skip'
  );

  const pagePosts = useQuery(
    api.rallies.listByPage,
    page ? { pageId: page._id, userId: (convexUserId as any) || undefined } : 'skip'
  );

  const toggleFollowMut = useMutation(api.pages.toggleFollow);
  const updatePageMut = useMutation(api.pages.update);
  const generateUploadUrl = useMutation(api.rallies.generateUploadUrl);

  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCover, setEditCover] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = () => {
    if (!page) return;
    setEditName(page.name);
    setEditCategory(page.category);
    setEditDescription(page.description || '');
    setEditLocation(page.location || '');
    setEditWebsite(page.website || '');
    setEditAvatar(page.avatar || '');
    setEditCover(page.coverImage || '');
    setIsEditOpen(true);
  };

  const handleFollowToggle = async () => {
    if (!page || !convexUserId) {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Please log in',
            subtitle: 'You need an account to follow Pages.',
          },
        })
      );
      return;
    }

    setIsFollowLoading(true);
    try {
      await toggleFollowMut({
        pageId: page._id,
        userId: convexUserId as any,
      });
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Action failed',
            subtitle: err?.message || 'Could not update follow status.',
          },
        })
      );
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = async () => {
    if (!page) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: page.name,
          text: `Check out ${page.name} on lalao:`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Copied link',
            subtitle: 'Page URL copied to clipboard.',
          },
        })
      );
    } catch {}
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;
    setIsSavingEdit(true);
    try {
      await updatePageMut({
        pageId: page._id,
        name: editName,
        category: editCategory,
        description: editDescription,
        location: editLocation,
        website: editWebsite,
        avatar: editAvatar,
        coverImage: editCover,
      });
      setIsEditOpen(false);
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Page updated',
            subtitle: 'Your page changes have been saved.',
          },
        })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Update failed',
            subtitle: err?.message || 'Could not save changes.',
          },
        })
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const isManager = Boolean(page?.viewerRole);

  const mappedPosts: Rally[] = useMemo(() => {
    if (!pagePosts) return [];
    return pagePosts.map((r: any) => ({
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
      authorType: 'page',
      pageId: r.pageId,
      created_by_user_id: r.created_by_user_id,
      pageAuthor: r.pageAuthor || page,
      creator: r.creator,
      status: r.status,
      createdAt: new Date(r.createdAt).toISOString(),
      city: r.city,
      locationLabel: r.locationLabel,
      rallyLatitude: r.rallyLatitude,
      rallyLongitude: r.rallyLongitude,
      category: r.category as Rally['category'],
      hashtags: r.hashtags,
      eventDate: r.eventDate,
      endTime: r.endTime,
      mediaUrl: r.mediaUrl,
      mediaType: r.mediaType,
      capacity: r.capacity,
      likesCount: r.likesCount,
      commentsCount: r.commentsCount,
      rsvpsCount: rsvpsCountSafe(r),
      isLiked: r.isLiked,
      isRsvpd: r.isRsvpd,
    }));
  }, [pagePosts, page]);

  function rsvpsCountSafe(r: any) {
    return r.rsvpsCount ?? 0;
  }

  if (page === undefined) {
    return (
      <PageShell title="Page" backTo="/pages">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (page === null) {
    return (
      <PageShell title="Page Not Found" backTo="/pages">
        <div className="p-8 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <Flag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-zinc-900 mb-2">Page Not Found</h2>
          <p className="text-sm text-zinc-500 mb-6">
            The page @{slug} does not exist or may have been removed.
          </p>
          <Link
            to="/pages"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-sm"
          >
            Explore Pages
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={page.name} backTo="/pages">
      <div className="max-w-3xl mx-auto pb-16">
        {/* Cover Photo Banner */}
        <div
          className={cn(
            "relative h-44 sm:h-56 bg-gradient-to-r from-zinc-800 to-zinc-950 overflow-hidden group",
            isManager && !page.coverImage && "cursor-pointer"
          )}
          onClick={
            isManager && !page.coverImage
              ? () => {
                  setCropModalMode('cover');
                  setCropModalOpen(true);
                }
              : undefined
          }
        >
          {page.coverImage ? (
            <img
              src={page.coverImage}
              alt={page.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/40">
              <Flag className="w-12 h-12" />
              {isManager && (
                <span className="text-xs font-bold text-white/70 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm group-hover:bg-black/50 transition-colors">
                  Click to add cover photo
                </span>
              )}
            </div>
          )}

          {/* Share Button on Cover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-colors z-10"
            aria-label="Share page"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Manager Cover Edit Button */}
          {isManager && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCropModalMode('cover');
                setCropModalOpen(true);
              }}
              className="absolute bottom-3 right-3 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg transition-all active:scale-95 z-10 cursor-pointer"
              title="Edit Cover Photo"
            >
              <Camera className="w-4 h-4" />
              <span>{page.coverImage ? 'Edit Cover' : 'Add Cover'}</span>
            </button>
          )}
        </div>

        {/* Header Profile Section */}
        <div className="px-4 sm:px-6 relative pb-6 border-b border-zinc-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-14 mb-4">
            <div className="flex items-end gap-3.5">
              <div className="relative group shrink-0">
                <Avatar
                  src={page.avatar}
                  name={page.name}
                  size="xl"
                  className="ring-4 ring-white shadow-lg rounded-3xl"
                />
                {isManager && (
                  <button
                    type="button"
                    onClick={() => {
                      setCropModalMode('avatar');
                      setCropModalOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-zinc-900 hover:bg-indigo-600 text-white shadow-md transition-all active:scale-90 z-10 border-2 border-white cursor-pointer"
                    title="Change Profile Picture"
                    aria-label="Change Profile Picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="pt-2 sm:pt-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 leading-tight">
                    {page.name}
                  </h1>
                  {page.isVerified && (
                    <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium mt-0.5">
                  <span>@{page.slug}</span>
                  <span>·</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200">
                    {page.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Manager / Visitor Actions */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {isManager ? (
                <>
                  <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Post</span>
                  </button>
                  <button
                    onClick={openEditModal}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-sm transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95',
                    page.isFollowing
                      ? 'bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 text-zinc-800'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  )}
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : page.isFollowing ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Following</span>
                    </>
                  ) : (
                    <span>Follow</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {page.description && (
            <p className="text-sm text-zinc-700 leading-relaxed mb-4 whitespace-pre-line">
              {page.description}
            </p>
          )}

          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-zinc-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                <strong className="text-zinc-900">{page.followersCount ?? 0}</strong>{' '}
                followers
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                <strong className="text-zinc-900">{page.postsCount ?? 0}</strong>{' '}
                posts
              </span>
            </div>
            {page.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>{page.location}</span>
              </div>
            )}
            {page.website && (
              <a
                href={page.website.startsWith('http') ? page.website : `https://${page.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-indigo-600 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{page.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            {isManager && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                Managed by You ({page.viewerRole})
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-100 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={cn(
              'py-3.5 px-4 font-bold text-sm border-b-2 transition-colors',
              activeTab === 'posts'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            )}
          >
            Posts ({page.postsCount ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={cn(
              'py-3.5 px-4 font-bold text-sm border-b-2 transition-colors',
              activeTab === 'about'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            )}
          >
            About
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div className="divide-y divide-zinc-100">
            {mappedPosts.length > 0 ? (
              mappedPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-zinc-900 mb-1">
                  No Posts Yet
                </h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-4">
                  {isManager
                    ? 'Publish your first post on behalf of this Page! It will display with this Page as the public author.'
                    : `@${page.slug} hasn't posted anything yet.`}
                </p>
                {isManager && (
                  <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                About {page.name}
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                {page.description || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-zinc-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Details & Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <span className="text-xs text-zinc-400 font-bold block mb-1">Category</span>
                  <span className="font-semibold text-zinc-900">{page.category}</span>
                </div>
                {page.location && (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className="text-xs text-zinc-400 font-bold block mb-1">Location</span>
                    <span className="font-semibold text-zinc-900">{page.location}</span>
                  </div>
                )}
                {page.website && (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <span className="text-xs text-zinc-400 font-bold block mb-1">Website</span>
                    <a
                      href={page.website.startsWith('http') ? page.website : `https://${page.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-indigo-600 hover:underline"
                    >
                      {page.website}
                    </a>
                  </div>
                )}
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <span className="text-xs text-zinc-400 font-bold block mb-1">Created</span>
                  <span className="font-semibold text-zinc-900">
                    {page.createdAt ? new Date(page.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Creation Modal pre-configured to post as this Page */}
      {isCreatePostOpen && (
        <CreateRallyModal
          isOpen={isCreatePostOpen}
          onClose={() => setIsCreatePostOpen(false)}
          onCreated={() => setIsCreatePostOpen(false)}
          initialType="POST"
          defaultPageId={page._id}
        />
      )}

      {/* Edit Page Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-black text-zinc-900">Edit Page</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Profile Image Management */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
                <label className="text-xs font-bold text-zinc-500 uppercase block">
                  Profile Image
                </label>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={page.avatar}
                      name={page.name}
                      size="lg"
                      className="rounded-2xl ring-2 ring-zinc-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-zinc-900">
                        {page.avatar ? 'Custom Photo' : 'Default Initials'}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        1:1 Square recommended
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCropModalMode('avatar');
                      setCropModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {page.avatar ? 'Change' : 'Add Photo'}
                  </button>
                </div>
              </div>

              {/* Cover Image Management */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
                <label className="text-xs font-bold text-zinc-500 uppercase block">
                  Cover Image
                </label>
                <div className="space-y-2">
                  <div className="relative h-20 w-full rounded-xl overflow-hidden bg-zinc-900">
                    {page.coverImage ? (
                      <img
                        src={page.coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-medium">
                        No cover banner set
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Wide landscape banner
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCropModalMode('cover');
                        setCropModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      {page.coverImage ? 'Change Cover' : 'Add Cover'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Page Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  About
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 font-bold text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Image Cropper & Manager Modal */}
      {isManager && (
        <PageImageCropModal
          isOpen={cropModalOpen}
          onClose={() => setCropModalOpen(false)}
          pageId={page._id}
          mode={cropModalMode}
          currentImageUrl={cropModalMode === 'avatar' ? page.avatar : page.coverImage}
          pageName={page.name}
          onSuccess={(newUrl) => {
            if (cropModalMode === 'avatar') {
              setEditAvatar(newUrl || '');
            } else {
              setEditCover(newUrl || '');
            }
          }}
          onRemove={() => {
            if (cropModalMode === 'avatar') {
              setEditAvatar('');
            } else {
              setEditCover('');
            }
          }}
        />
      )}
    </PageShell>
  );
}
