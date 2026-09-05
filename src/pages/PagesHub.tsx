import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Avatar from '../components/Avatar';
import CreatePageModal from '../components/CreatePageModal';
import CreateRallyModal from '../components/CreateRallyModal';
import QueryErrorBoundary from '../components/QueryErrorBoundary';
import {
  Flag,
  Plus,
  ChevronRight,
  Users,
  FileText,
  BadgeCheck,
  Building2,
  Compass,
  ArrowUpRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function PagesHub() {
  const { user, convexUserId, isProfileLoading, isLoggedIn } = useAuth();
  const [searchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(
    searchParams.get('create') === 'true'
  );
  const [activePostPageId, setActivePostPageId] = useState<string | null>(null);

  const managedPages = useQuery(
    api.pages.listUserManagedPages,
    isLoggedIn ? {} : 'skip'
  );

  const allPages = useQuery(api.pages.listAll, { limit: 30 });

  const isLoadingManaged = isLoggedIn ? managedPages === undefined : isProfileLoading;
  const userPages = isLoggedIn && Array.isArray(managedPages) ? managedPages : [];

  return (
    <PageShell title="Pages" backTo="/">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-16">
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-zinc-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-lg space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-bold ring-1 ring-white/20">
              <Flag className="w-3.5 h-3.5" />
              <span>Independent Page Identities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Manage & Explore Pages
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Create a distinct public identity for your football club, brand, organization or community. Post and build an audience separately from your personal profile.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-900 font-black text-sm hover:bg-indigo-50 shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Page</span>
              </button>
            </div>
          </div>
          {/* Decorative background shape */}
          <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        </div>

        {/* ── SECTION 1: PAGES YOU MANAGE ────────────────────────────────── */}
        <QueryErrorBoundary message="Could not load your managed pages right now.">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-zinc-900 leading-tight">
                  Pages You Manage
                </h2>
                <p className="text-xs text-zinc-500">
                  You can post, manage content, and view analytics as these Pages
                </p>
              </div>
              {userPages.length > 0 && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Page</span>
                </button>
              )}
            </div>

            {isLoadingManaged ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : userPages.length === 0 ? (
              <div className="p-8 rounded-3xl border-2 border-dashed border-zinc-200 text-center bg-zinc-50/50">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <Flag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mb-1">
                  You don't manage any Pages yet
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4 leading-relaxed">
                  Create a Page to start publishing content under a dedicated brand name without creating posts on your personal profile.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create a Page</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userPages.map((page: any) => (
                  <div
                    key={page._id}
                    className="p-5 rounded-3xl border border-zinc-200/80 bg-white hover:border-zinc-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <Avatar
                        src={page.avatar}
                        name={page.name}
                        size="lg"
                        className="rounded-2xl shadow-sm ring-1 ring-zinc-200"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base text-zinc-900 truncate">
                            {page.name}
                          </h3>
                        </div>
                        <p className="text-xs font-medium text-zinc-500 truncate">
                          @{page.slug} · {page.category}
                        </p>
                        <div className="mt-2">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200">
                            {page.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions for this Page */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                      <button
                        onClick={() => setActivePostPageId(page._id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Post as Page</span>
                      </button>
                      <Link
                        to={`/pages/${page.slug}`}
                        className="py-2 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </QueryErrorBoundary>

        {/* ── SECTION 2: DISCOVER PAGES ──────────────────────────────────── */}
        <div className="space-y-4 pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-black text-zinc-900 leading-tight">
                Discover Community & Brand Pages
              </h2>
              <p className="text-xs text-zinc-500">
                Explore popular football clubs, entertainment pages, and local brands
              </p>
            </div>
          </div>

          {allPages === undefined ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : allPages.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">No public pages yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-3xl bg-white overflow-hidden shadow-xs">
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
                      <div className="flex items-center gap-1.5">
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
          onClose={() => setIsCreateModalOpen(false)}
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
    </PageShell>
  );
}
