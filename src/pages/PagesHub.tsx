import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import Avatar from '../components/Avatar';
import CreatePageModal from '../components/CreatePageModal';
import CreateRallyModal from '../components/CreateRallyModal';
import EditPageModal, { EditPageData } from '../components/EditPageModal';
import PageImageCropModal from '../components/PageImageCropModal';
import QueryErrorBoundary from '../components/QueryErrorBoundary';
import {
  Flag,
  Plus,
  ChevronRight,
  BadgeCheck,
  Building2,
  Compass,
  Loader2,
  Eye,
  Settings,
  MoreVertical,
  Camera,
  Copy,
  Share2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function PagesHub() {
  const { convexUserId, isProfileLoading, isLoggedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(
    searchParams.get('create') === 'true'
  );
  const [activePostPageId, setActivePostPageId] = useState<string | null>(null);
  const [managingPage, setManagingPage] = useState<EditPageData | null>(null);

  // Secondary more menu state
  const [activeMenuPageId, setActiveMenuPageId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Quick crop modal state from More menu
  const [cropModalState, setCropModalState] = useState<{
    isOpen: boolean;
    pageId: Id<'pages'>;
    pageName: string;
    mode: 'avatar' | 'cover';
    currentUrl?: string;
  } | null>(null);

  const managedPages = useQuery(
    api.pages.listUserManagedPages,
    isLoggedIn ? {} : 'skip'
  );

  const allPages = useQuery(api.pages.listAll, { limit: 30 });

  const isLoadingManaged = isLoggedIn ? managedPages === undefined : isProfileLoading;
  const userPages = isLoggedIn && Array.isArray(managedPages) ? managedPages : [];

  // Sync create search param
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Outside click listener for more menu
  useEffect(() => {
    if (!activeMenuPageId) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuPageId(null);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [activeMenuPageId]);

  const showToast = (title: string, subtitle: string) => {
    window.dispatchEvent(
      new CustomEvent('show-toast', { detail: { title, subtitle } })
    );
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/pages/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied', `@${slug} page link copied to clipboard.`);
      });
    }
    setActiveMenuPageId(null);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    if (searchParams.get('create')) {
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <PageShell title="Pages" subtitle="Manage and explore your Pages" backTo="/">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-8 pb-16">
        
        {/* ── SECTION 1: PAGES YOU MANAGE ────────────────────────────────── */}
        <QueryErrorBoundary message="Could not load your managed pages right now.">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-black text-zinc-900 leading-tight">
                  Pages You Manage
                </h2>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Publish posts, edit details, and manage branding as your Pages
                </p>
              </div>

              {/* Prominent Create New Page Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                title="Create New Page"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Page</span>
              </button>
            </div>

            {isLoadingManaged ? (
              <div className="flex justify-center p-12 bg-white rounded-3xl border border-zinc-200/80">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                  <span className="text-xs text-zinc-400 font-semibold">Loading managed pages...</span>
                </div>
              </div>
            ) : userPages.length === 0 ? (
              /* EMPTY STATE: Only shown when user has 0 pages */
              <div className="p-8 sm:p-10 rounded-3xl border-2 border-dashed border-zinc-200 text-center bg-zinc-50/70">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600">
                  <Flag className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-zinc-900 mb-1">
                  You don't manage any Pages yet
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto mb-5 leading-relaxed font-medium">
                  Create a Page to start publishing content under a dedicated brand name, sports club, business, or community identity.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Page</span>
                </button>
              </div>
            ) : (
              /* MANAGED PAGES CARDS: Clean horizontal desktop layout & responsive mobile stack */
              <div className="space-y-4">
                {userPages.map((page: any) => {
                  const isMenuOpen = activeMenuPageId === page._id;
                  const isOwner = page.role === 'owner';

                  return (
                    <div
                      key={page._id}
                      className="p-5 sm:p-6 rounded-3xl border border-zinc-200/80 bg-white hover:border-zinc-300 shadow-xs hover:shadow-md transition-all relative overflow-visible"
                    >
                      {/* Top / Main Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Page Identity Block */}
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <Link
                            to={`/pages/${page.slug}`}
                            className="shrink-0 group relative block"
                            title="View Page"
                          >
                            <Avatar
                              src={page.avatar}
                              name={page.name}
                              size="lg"
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-sm ring-2 ring-zinc-100 group-hover:ring-indigo-300 transition-all object-cover"
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            {/* Name & Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                to={`/pages/${page.slug}`}
                                className="font-black text-base sm:text-lg text-zinc-900 hover:text-indigo-600 truncate transition-colors"
                              >
                                {page.name}
                              </Link>

                              {page.isVerified && (
                                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}

                              {/* Role Badge */}
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider',
                                  isOwner
                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200'
                                    : 'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200'
                                )}
                              >
                                {page.role || 'owner'}
                              </span>
                            </div>

                            {/* Handle & Category */}
                            <p className="text-xs font-semibold text-zinc-500 mt-0.5 truncate">
                              <span className="text-indigo-600 font-bold">@{page.slug}</span>
                              <span className="mx-1.5 text-zinc-300">·</span>
                              <span>{page.category}</span>
                              {page.location && (
                                <>
                                  <span className="mx-1.5 text-zinc-300">·</span>
                                  <span>{page.location}</span>
                                </>
                              )}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium mt-2">
                              <span>
                                <strong className="text-zinc-700 font-bold">
                                  {page.postsCount ?? 0}
                                </strong>{' '}
                                posts
                              </span>
                              <span>•</span>
                              <span>
                                <strong className="text-zinc-700 font-bold">
                                  {page.followersCount ?? 0}
                                </strong>{' '}
                                followers
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top-Right Secondary Menu Button for Mobile & Desktop */}
                        <div className="relative self-end sm:self-start shrink-0" ref={isMenuOpen ? menuRef : undefined}>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuPageId(isMenuOpen ? null : page._id)
                            }
                            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                            aria-label="More options"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Secondary Dropdown Menu */}
                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveMenuPageId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1.5 z-40 w-52 bg-white rounded-2xl shadow-xl border border-zinc-200/90 py-1.5 text-left animate-in fade-in zoom-in-95 duration-150 overflow-hidden divide-y divide-zinc-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuPageId(null);
                                    setManagingPage(page);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                                >
                                  <Settings className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>Edit Page Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuPageId(null);
                                    setCropModalState({
                                      isOpen: true,
                                      pageId: page._id,
                                      pageName: page.name,
                                      mode: 'avatar',
                                      currentUrl: page.avatar,
                                    });
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                                >
                                  <Camera className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Change Profile Photo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuPageId(null);
                                    setCropModalState({
                                      isOpen: true,
                                      pageId: page._id,
                                      pageName: page.name,
                                      mode: 'cover',
                                      currentUrl: page.coverImage,
                                    });
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                                >
                                  <Camera className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Change Cover Photo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(page.slug)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>Copy Page Link</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Three Primary Actions Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-4 mt-4 border-t border-zinc-100">
                        {/* 1. View Page */}
                        <Link
                          to={`/pages/${page.slug}`}
                          className="min-h-[42px] py-2 px-3.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 text-zinc-700 text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>View Page</span>
                        </Link>

                        {/* 2. Manage */}
                        <button
                          type="button"
                          onClick={() => setManagingPage(page)}
                          className="min-h-[42px] py-2 px-3.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 text-zinc-700 text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>Manage</span>
                        </button>

                        {/* 3. Create Post */}
                        <button
                          type="button"
                          onClick={() => setActivePostPageId(page._id)}
                          className="min-h-[42px] py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span>Create Post</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </QueryErrorBoundary>

        {/* ── SECTION 2: DISCOVER PAGES ──────────────────────────────────── */}
        <div className="space-y-4 pt-6 border-t border-zinc-200/80">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-black text-zinc-900 leading-tight">
                Discover Community & Brand Pages
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Explore sports clubs, entertainment hubs, and verified creators
              </p>
            </div>
          </div>

          {allPages === undefined ? (
            <div className="flex justify-center p-8 bg-white rounded-3xl border border-zinc-100">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : allPages.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">No public pages yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-3xl bg-white overflow-hidden shadow-xs">
              {allPages.map((page: any) => (
                <Link
                  key={page._id}
                  to={`/pages/${page.slug}`}
                  className="flex items-center justify-between p-4 hover:bg-zinc-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar
                      src={page.avatar}
                      name={page.name}
                      size="md"
                      className="rounded-2xl shadow-sm ring-1 ring-zinc-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900 truncate">
                          {page.name}
                        </span>
                        {page.isVerified && (
                          <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600">
                          {page.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate">
                        @{page.slug} · {page.followersCount ?? 0} followers · {page.postsCount ?? 0} posts
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create New Page Modal */}
      {isCreateModalOpen && (
        <CreatePageModal
          isOpen={isCreateModalOpen}
          onClose={handleCreateModalClose}
        />
      )}

      {/* Page Management / Edit Modal */}
      {managingPage && (
        <EditPageModal
          page={managingPage}
          isOpen={Boolean(managingPage)}
          onClose={() => setManagingPage(null)}
        />
      )}

      {/* Quick Post as specific managed page */}
      {activePostPageId && (
        <CreateRallyModal
          isOpen={Boolean(activePostPageId)}
          onClose={() => setActivePostPageId(null)}
          onCreated={() => setActivePostPageId(null)}
          initialType="POST"
          defaultPageId={activePostPageId}
        />
      )}

      {/* Direct Image Cropper from More Menu */}
      {cropModalState?.isOpen && (
        <PageImageCropModal
          pageId={cropModalState.pageId}
          pageName={cropModalState.pageName}
          mode={cropModalState.mode}
          currentImageUrl={cropModalState.currentUrl}
          isOpen={cropModalState.isOpen}
          onClose={() => setCropModalState(null)}
          onSuccess={() => {
            setCropModalState(null);
            showToast('Photo updated', 'Your page image has been saved.');
          }}
          onRemove={() => {
            setCropModalState(null);
            showToast('Photo removed', 'Default placeholder restored.');
          }}
        />
      )}
    </PageShell>
  );
}
