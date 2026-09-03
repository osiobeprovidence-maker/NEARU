import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Megaphone, Plus, ToggleLeft, ToggleRight, Trash2, Pencil, Eye, ExternalLink } from 'lucide-react';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminMediaUploader } from '../../components/admin/AdminMediaUploader';
import { cn } from '../../lib/utils';

interface AdForm {
  title: string;
  description: string;
  imageUrl: string;
  mediaType: 'image' | 'video';
  linkUrl: string;
  ctaText: string;
  brandName: string;
  brandLogoUrl: string;
  isActive: boolean;
  displayOrder: number;
}

const emptyForm: AdForm = {
  title: '',
  description: '',
  imageUrl: '',
  mediaType: 'image',
  linkUrl: '',
  ctaText: 'Learn More',
  brandName: '',
  brandLogoUrl: '',
  isActive: true,
  displayOrder: 0,
};

export default function AdminAds() {
  const ads = useQuery(api.ads.listAll);
  const createAd = useMutation(api.ads.create);
  const updateAd = useMutation(api.ads.update);
  const removeAd = useMutation(api.ads.remove);
  const toggleActive = useMutation(api.ads.toggleActive);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdForm>(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ imageUrl: string; brandLogoUrl: string }>({ imageUrl: '', brandLogoUrl: '' });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPreviews({ imageUrl: '', brandLogoUrl: '' });
    setShowForm(true);
  };

  const handleOpenEdit = (ad: any) => {
    setEditingId(ad._id);
    const isVid = ad.mediaType === 'video' || (ad.imageUrl && (ad.imageUrl.endsWith('.mp4') || ad.imageUrl.endsWith('.webm') || ad.imageUrl.endsWith('.mov')));
    setForm({
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl || '',
      mediaType: isVid ? 'video' : 'image',
      linkUrl: ad.linkUrl || '',
      ctaText: ad.ctaText || 'Learn More',
      brandName: ad.brandName || '',
      brandLogoUrl: ad.brandLogoUrl || '',
      isActive: ad.isActive,
      displayOrder: ad.displayOrder || 0,
    });
    setPreviews({ imageUrl: ad.imageUrl || '', brandLogoUrl: ad.brandLogoUrl || '' });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) return;

    let cleanImageUrl = form.imageUrl.trim() || undefined;
    if (cleanImageUrl && cleanImageUrl.includes('/api/storage/')) {
      const match = cleanImageUrl.match(/\/api\/storage\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) cleanImageUrl = match[1];
    }

    let cleanBrandLogoUrl = form.brandLogoUrl.trim() || undefined;
    if (cleanBrandLogoUrl && cleanBrandLogoUrl.includes('/api/storage/')) {
      const match = cleanBrandLogoUrl.match(/\/api\/storage\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) cleanBrandLogoUrl = match[1];
    }

    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: cleanImageUrl,
      mediaType: form.mediaType,
      linkUrl: form.linkUrl.trim() || undefined,
      ctaText: form.ctaText.trim() || undefined,
      brandName: form.brandName.trim() || undefined,
      brandLogoUrl: cleanBrandLogoUrl,
      isActive: form.isActive,
      displayOrder: form.displayOrder,
    };

    if (editingId) {
      await updateAd({ id: editingId as any, ...data });
    } else {
      await createAd(data);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPreviews({ imageUrl: '', brandLogoUrl: '' });
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await removeAd({ id: deletingId as any });
    setDeletingId(null);
  };

  const handleToggle = async (id: string) => {
    await toggleActive({ id: id as any });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Ad Management</h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">Create and control which ads appear between feed posts.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Ad</span>
        </button>
      </div>

      {/* Ad List */}
      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-xs overflow-hidden">
        {ads === undefined ? (
          <div className="p-12 text-center text-zinc-400 text-sm font-medium">Loading ads...</div>
        ) : ads.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-900 mb-1">No ads yet</p>
            <p className="text-xs text-zinc-500">Create your first ad to display between feed posts.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {ads.map((ad) => (
              <div key={ad._id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-zinc-50/50 transition-colors">
                {/* Preview */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                  ) : (
                    <Megaphone className="w-6 h-6 text-zinc-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-black text-zinc-900 truncate">{ad.title}</h4>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full shrink-0",
                      ad.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                    )}>
                      {ad.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium line-clamp-1">{ad.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400 font-semibold">
                    {ad.brandName && <span>Brand: {ad.brandName}</span>}
                    {ad.linkUrl && <span className="flex items-center gap-0.5"><ExternalLink className="w-3 h-3" /> Has link</span>}
                    <span>Order: {ad.displayOrder ?? 0}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggle(ad._id)}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      ad.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100"
                    )}
                    title={ad.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {ad.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(ad)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(ad._id)}
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); }}
        title={editingId ? 'Edit Ad' : 'Create New Ad'}
        subtitle={editingId ? 'Update ad details and visibility.' : 'Design an ad to display between feed posts.'}
        maxWidth="lg"
      >
        <div className="space-y-4 p-1">
          <div>
            <label className="text-xs font-bold text-zinc-700 mb-1 block">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Groceries, delivered in minutes."
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 mb-1 block">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the ad..."
              rows={3}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1 block">Brand Name</label>
              <input
                type="text"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="e.g. QuickMart"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1 block">CTA Button Text</label>
              <input
                type="text"
                value={form.ctaText}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                placeholder="e.g. Shop Now"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 mb-1 block">
              Ad Creative (Image or Video)
            </label>
            <AdminMediaUploader
              mediaType="all"
              value={previews.imageUrl}
              previewHeightClass="h-48"
              description="Upload ad image (JPG, PNG, WebP) or video (MP4, WebM)"
              onChange={(storageId, publicUrl, detectedType) => {
                const isVid =
                  detectedType === 'video' ||
                  publicUrl.endsWith('.mp4') ||
                  publicUrl.endsWith('.webm') ||
                  publicUrl.endsWith('.mov');
                setForm((prev) => ({
                  ...prev,
                  imageUrl: storageId,
                  mediaType: isVid ? 'video' : 'image',
                }));
                setPreviews((prev) => ({ ...prev, imageUrl: publicUrl }));
              }}
              onRemove={() => {
                setForm((prev) => ({ ...prev, imageUrl: '', mediaType: 'image' }));
                setPreviews((prev) => ({ ...prev, imageUrl: '' }));
              }}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 mb-1 block">Link URL</label>
            <input
              type="url"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 mb-1 block">Brand Logo</label>
            <AdminMediaUploader
              mediaType="image"
              value={previews.brandLogoUrl}
              previewHeightClass="h-28"
              description="Upload brand emblem or company logo"
              onChange={(storageId, publicUrl) => {
                setForm((prev) => ({ ...prev, brandLogoUrl: storageId }));
                setPreviews((prev) => ({ ...prev, brandLogoUrl: publicUrl }));
              }}
              onRemove={() => {
                setForm((prev) => ({ ...prev, brandLogoUrl: '' }));
                setPreviews((prev) => ({ ...prev, brandLogoUrl: '' }));
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1 block">Display Order</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1 block">Status</label>
              <button
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={cn(
                  "w-full px-4 py-2.5 border rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  form.isActive
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-zinc-50 border-zinc-200 text-zinc-500"
                )}
              >
                {form.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {form.isActive ? 'Active' : 'Paused'}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim() || !form.description.trim()}
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingId ? 'Save Changes' : 'Create Ad'}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Ad"
        subtitle="This action cannot be undone."
        maxWidth="sm"
        variant="danger"
      >
        <div className="p-1">
          <p className="text-sm text-zinc-600 font-medium mb-4">
            Are you sure you want to permanently delete this ad? It will immediately stop showing in feeds.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingId(null)}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Delete Ad
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
