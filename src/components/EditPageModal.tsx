import React, { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import PageImageCropModal from './PageImageCropModal';
import {
  X,
  Camera,
  Loader2,
  Building2,
  MapPin,
  Globe,
  FileText,
  Tag,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const PAGE_CATEGORIES = [
  'Community & Social',
  'Sports & Fitness',
  'Music & Entertainment',
  'Food & Dining',
  'Gaming & Esports',
  'Tech & Innovation',
  'Education',
  'Fashion & Lifestyle',
  'Events & Hospitality',
  'Arts & Culture',
  'Business & Brand',
  'Football Club',
  'Other',
];

export interface EditPageData {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  location?: string;
  website?: string;
  avatar?: string;
  coverImage?: string;
}

interface EditPageModalProps {
  page: EditPageData | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditPageModal({
  page,
  isOpen,
  onClose,
  onSaved,
}: EditPageModalProps) {
  const { convexUserId } = useAuth();
  const updatePageMut = useMutation(api.pages.update);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Community & Social');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(undefined);
  const [currentCover, setCurrentCover] = useState<string | undefined>(undefined);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropModalMode, setCropModalMode] = useState<'avatar' | 'cover'>('avatar');

  useEffect(() => {
    if (page && isOpen) {
      setName(page.name || '');
      setCategory(page.category || 'Community & Social');
      setDescription(page.description || '');
      setLocation(page.location || '');
      setWebsite(page.website || '');
      setCurrentAvatar(page.avatar);
      setCurrentCover(page.coverImage);
      setError('');
    }
  }, [page, isOpen]);

  if (!isOpen || !page) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Page name is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await updatePageMut({
        pageId: page._id as Id<'pages'>,
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
      });

      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Page updated',
            subtitle: 'Your page information was successfully updated.',
          },
        })
      );

      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save page changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="text-lg font-black text-zinc-900 leading-tight">
                Manage Page
              </h2>
              <p className="text-xs text-zinc-500">
                Edit public information and media for @{page.slug}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Picture Management */}
            <div className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Profile Image
              </span>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <Avatar
                    src={currentAvatar}
                    name={name || page.name}
                    size="lg"
                    className="rounded-2xl ring-2 ring-zinc-200 shadow-sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      {currentAvatar ? 'Custom Avatar' : 'Default Page Avatar'}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Square 1:1 ratio previewed in feeds
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCropModalMode('avatar');
                    setCropModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{currentAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>
            </div>

            {/* Cover Banner Management */}
            <div className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                  Cover Photo Banner
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCropModalMode('cover');
                    setCropModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{currentCover ? 'Change Cover' : 'Upload Cover'}</span>
                </button>
              </div>

              <div className="relative h-24 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-200">
                {currentCover ? (
                  <img
                    src={currentCover}
                    alt="Page cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1 text-xs">
                    <Building2 className="w-6 h-6 text-zinc-600" />
                    <span>No cover banner set</span>
                  </div>
                )}
              </div>
            </div>

            {/* Page Name */}
            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
                Page Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lalao Gaming Club"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
              >
                {PAGE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* About / Description */}
            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
                About / Bio
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your Page, what you post, or what community members should expect..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
                Location (Optional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
                Website (Optional)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://lalao.app"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-4 border-t border-zinc-100 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 font-bold text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Page Image Crop Modal for Avatar or Cover */}
      {cropModalOpen && (
        <PageImageCropModal
          pageId={page._id as Id<'pages'>}
          userId={(convexUserId as any) || undefined}
          pageName={page.name}
          mode={cropModalMode}
          currentImageUrl={cropModalMode === 'avatar' ? currentAvatar : currentCover}
          isOpen={cropModalOpen}
          onClose={() => setCropModalOpen(false)}
          onSuccess={(newUrl) => {
            if (cropModalMode === 'avatar') {
              setCurrentAvatar(newUrl);
            } else {
              setCurrentCover(newUrl);
            }
            setCropModalOpen(false);
            onSaved?.();
          }}
          onRemove={() => {
            if (cropModalMode === 'avatar') {
              setCurrentAvatar(undefined);
            } else {
              setCurrentCover(undefined);
            }
            setCropModalOpen(false);
            onSaved?.();
          }}
        />
      )}
    </>
  );
}
