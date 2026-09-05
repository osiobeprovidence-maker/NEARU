import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Loader2,
  Upload,
  Globe,
  MapPin,
  Mail,
  Phone,
  Flag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import Avatar from './Avatar';
import { processAndCompressImage, uploadToConvexStorage } from '../utils/imageUpload';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (slug: string) => void;
}

const PAGE_CATEGORIES = [
  'Football & Sports',
  'News & Media',
  'Entertainment & Comedy',
  'Music & Concerts',
  'Gaming & Esports',
  'Tech & Startups',
  'Food & Restaurants',
  'Education & Learning',
  'Community & Non-Profit',
  'Fashion & Lifestyle',
  'Business & Brand',
  'Other',
];

export default function CreatePageModal({
  isOpen,
  onClose,
  onCreated,
}: CreatePageModalProps) {
  const navigate = useNavigate();
  const createPageMut = useMutation(api.pages.create);
  const generateUploadUrl = useMutation(api.rallies.generateUploadUrl);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(PAGE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Media
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === cleanAutoSlug(name)) {
      setSlug(cleanAutoSlug(val));
    }
  };

  const cleanAutoSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setError('');
    try {
      const compressed = await processAndCompressImage(file);
      const postUrl = await generateUploadUrl();
      const storageId = await uploadToConvexStorage(postUrl, compressed);
      setAvatarUrl(storageId);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload profile image.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    setError('');
    try {
      const compressed = await processAndCompressImage(file);
      const postUrl = await generateUploadUrl();
      const storageId = await uploadToConvexStorage(postUrl, compressed);
      setCoverUrl(storageId);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload cover photo.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a Page name.');
      return;
    }
    const cleanSlug = slug.trim().toLowerCase().replace(/^@+/, '');
    if (!cleanSlug || cleanSlug.length < 2) {
      setError('Please enter a valid handle (at least 2 characters).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await createPageMut({
        name: name.trim(),
        slug: cleanSlug,
        category,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatar: avatarUrl || undefined,
        coverImage: coverUrl || undefined,
      });

      onClose();
      onCreated?.(res.slug);
      navigate(`/pages/${res.slug}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create Page. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl z-[80] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900 leading-tight">
                    Create a Page
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Separate identity for your brand, club or community
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scroll Area */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Cover & Avatar Header */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Branding Photos
                </label>
                <div className="relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 h-28 flex items-center justify-center">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-400 font-medium">Cover Photo</span>
                  )}
                  <label className="absolute right-3 bottom-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-xs font-bold text-zinc-700 hover:bg-white cursor-pointer shadow-sm flex items-center gap-1.5">
                    {isUploadingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{coverUrl ? 'Change Cover' : 'Add Cover'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                      disabled={isUploadingCover}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-4 px-2">
                  <div className="relative shrink-0">
                    <Avatar
                      src={avatarUrl}
                      name={name || 'Page'}
                      size="lg"
                      className="ring-4 ring-white shadow-md"
                    />
                    <label className="absolute -bottom-1 -right-1 p-1.5 bg-zinc-900 text-white rounded-full cursor-pointer hover:bg-zinc-800 transition-colors shadow">
                      {isUploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                      />
                    </label>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">Page Profile Picture</div>
                    <div className="text-xs text-zinc-500">Logo or badge shown as the author of posts</div>
                  </div>
                </div>
              </div>

              {/* Page Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Page Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Football Hub, Manchester United Fan Club"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                />
              </div>

              {/* Username / Handle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Page Handle / Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="footballhub"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  This will be your page URL: lalao.app/pages/{slug || 'handle'}
                </p>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                >
                  {PAGE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bio / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  About the Page
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell people what your Page is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Optional Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos, Nigeria"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Website</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-3 border-t border-zinc-100 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !slug.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating…</span>
                    </>
                  ) : (
                    <span>Create Page</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
