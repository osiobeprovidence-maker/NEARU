import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Palette,
  Image as ImageIcon,
  Smile,
  Type,
  Video,
  Plus,
  Trash2,
  Check,
  Save,
  RefreshCw,
  Sparkles,
  Layers,
  Eye,
  Megaphone,
  ToggleLeft,
  ToggleRight,
  UploadCloud,
  FileText,
  X
} from 'lucide-react';
import { AdminMediaUploader, UploadedMediaItem } from '../../components/admin/AdminMediaUploader';
import { AdminModal } from '../../components/admin/AdminModal';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Clean & Versatile)' },
  { value: 'Outfit', label: 'Outfit (Modern Geometric)' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Contemporary)' },
  { value: 'Roboto', label: 'Roboto (Google Standard)' },
  { value: 'system-ui', label: 'System Default' },
];

const HEADING_WEIGHTS = [
  { value: '600', label: 'Semibold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extrabold (800)' },
  { value: '900', label: 'Black (900)' },
];

const BODY_WEIGHTS = [
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
];

export default function AdminMediaManagement() {
  const [activeTab, setActiveTab] = useState<'branding' | 'emojis' | 'fonts' | 'ads'>('branding');

  // Queries
  const branding = useQuery(api.media.getBranding);
  const emojiPacks = useQuery(api.media.listEmojiPacks);
  const customFonts = useQuery(api.media.listCustomFonts);
  const ads = useQuery(api.ads.listAll);

  // Mutations
  const updateBrandingMutation = useMutation(api.media.updateBranding);
  const createEmojiPackMutation = useMutation(api.media.createEmojiPack);
  const toggleEmojiPackActive = useMutation(api.media.toggleEmojiPackActive);
  const removeEmojiPack = useMutation(api.media.removeEmojiPack);
  const uploadCustomFontMutation = useMutation(api.media.uploadCustomFont);
  const toggleCustomFontActive = useMutation(api.media.toggleCustomFontActive);

  // 1. Branding Form State
  const [brandingForm, setBrandingForm] = useState({
    appIconUrl: '',
    splashScreenUrl: '',
    splashBgColor: '#4f46e5',
    brandLogoUrl: '',
    faviconUrl: '',
    primaryColor: '#4f46e5',
  });
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingFeedback, setBrandingFeedback] = useState<string | null>(null);

  // 2. Typography Form State
  const [typographyForm, setTypographyForm] = useState({
    fontFamily: 'Inter',
    headingWeight: '700',
    bodyWeight: '400',
    customFontUrl: '',
  });
  const [isSavingTypography, setIsSavingTypography] = useState(false);
  const [typographyFeedback, setTypographyFeedback] = useState<string | null>(null);

  // 3. Emoji Pack Creation Modal State
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [packName, setPackName] = useState('');
  const [packDescription, setPackDescription] = useState('');
  const [packCategory, setPackCategory] = useState('Reactions');
  const [packIconStorageId, setPackIconStorageId] = useState('');
  const [packIconPreview, setPackIconPreview] = useState('');
  const [emojiItems, setEmojiItems] = useState<UploadedMediaItem[]>([]);
  const [isSavingPack, setIsSavingPack] = useState(false);

  // Populate branding form when query loads
  useEffect(() => {
    if (branding) {
      setBrandingForm({
        appIconUrl: branding.appIconUrl || '',
        splashScreenUrl: branding.splashScreenUrl || '',
        splashBgColor: (branding as any).splashBgColor || branding.primaryColor || '#4f46e5',
        brandLogoUrl: branding.brandLogoUrl || '',
        faviconUrl: branding.faviconUrl || '',
        primaryColor: branding.primaryColor || '#4f46e5',
      });
      if (branding.typography) {
        setTypographyForm({
          fontFamily: branding.typography.fontFamily || 'Inter',
          headingWeight: branding.typography.headingWeight || '700',
          bodyWeight: branding.typography.bodyWeight || '400',
          customFontUrl: branding.typography.customFontUrl || '',
        });
      }
    }
  }, [branding]);

  // Handle Save Branding
  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    setBrandingFeedback(null);
    try {
      await updateBrandingMutation({
        appIconUrl: brandingForm.appIconUrl || undefined,
        splashScreenUrl: brandingForm.splashScreenUrl ?? '',
        splashBgColor: brandingForm.splashBgColor || undefined,
        brandLogoUrl: brandingForm.brandLogoUrl || undefined,
        faviconUrl: brandingForm.faviconUrl || undefined,
        primaryColor: brandingForm.primaryColor || undefined,
      });
      setBrandingFeedback('App branding saved successfully!');
      setTimeout(() => setBrandingFeedback(null), 4000);
    } catch (err: any) {
      setBrandingFeedback(`Failed: ${err.message}`);
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Handle Save Typography
  const handleSaveTypography = async () => {
    setIsSavingTypography(true);
    setTypographyFeedback(null);
    try {
      await updateBrandingMutation({
        typography: {
          fontFamily: typographyForm.fontFamily,
          headingWeight: typographyForm.headingWeight,
          bodyWeight: typographyForm.bodyWeight,
          customFontUrl: typographyForm.customFontUrl || undefined,
        },
      });
      setTypographyFeedback('Typography settings saved successfully!');
      setTimeout(() => setTypographyFeedback(null), 4000);
    } catch (err: any) {
      setTypographyFeedback(`Failed: ${err.message}`);
    } finally {
      setIsSavingTypography(false);
    }
  };

  // Handle Save Emoji Pack
  const handleSaveEmojiPack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName.trim() || !packIconStorageId || emojiItems.length === 0) {
      alert('Please provide a pack name, cover icon, and at least one emoji asset.');
      return;
    }

    setIsSavingPack(true);
    try {
      await createEmojiPackMutation({
        name: packName.trim(),
        description: packDescription.trim() || undefined,
        iconUrl: packIconStorageId,
        category: packCategory,
        isActive: true,
        displayOrder: 0,
        items: emojiItems.map((item, idx) => ({
          name: item.name || `emoji_${idx + 1}`,
          mediaUrl: item.storageId,
          mediaType: 'image',
          displayOrder: idx,
        })),
      });

      setShowEmojiModal(false);
      setPackName('');
      setPackDescription('');
      setPackIconStorageId('');
      setPackIconPreview('');
      setEmojiItems([]);
    } catch (err: any) {
      alert(`Failed to create emoji pack: ${err.message}`);
    } finally {
      setIsSavingPack(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Palette className="w-7 h-7 text-indigo-600" />
            Media & Branding
          </h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
            Manage permanent visual assets, application branding, messaging emojis, and typography.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 overflow-x-auto no-scrollbar pb-px">
        <button
          onClick={() => setActiveTab('branding')}
          className={cn(
            'px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer',
            activeTab === 'branding'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
          )}
        >
          <ImageIcon className="w-4 h-4" />
          App Branding (Icon & Splash)
        </button>
        <button
          onClick={() => setActiveTab('emojis')}
          className={cn(
            'px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer',
            activeTab === 'emojis'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
          )}
        >
          <Smile className="w-4 h-4" />
          Messaging Emoji Packs
        </button>
        <button
          onClick={() => setActiveTab('fonts')}
          className={cn(
            'px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer',
            activeTab === 'fonts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
          )}
        >
          <Type className="w-4 h-4" />
          Fonts & Typography
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={cn(
            'px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer',
            activeTab === 'ads'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
          )}
        >
          <Megaphone className="w-4 h-4" />
          Advertisements Media
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: APP BRANDING (App Icon & Splash Screen) */}
      {/* =================================================================== */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* App Icon */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-zinc-900">App Icon</h3>
                  <p className="text-xs text-zinc-500">
                    Application PWA / mobile launcher icon (PNG or WebP recommended).
                  </p>
                </div>
              </div>

              <AdminMediaUploader
                mediaType="image"
                value={brandingForm.appIconUrl}
                previewHeightClass="h-44"
                onChange={(storageId) =>
                  setBrandingForm((prev) => ({ ...prev, appIconUrl: storageId }))
                }
                onRemove={() =>
                  setBrandingForm((prev) => ({ ...prev, appIconUrl: '' }))
                }
              />
            </div>

            {/* App Splash Screen */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-zinc-900">App Splash Screen</h3>
                  <p className="text-xs text-zinc-500">
                    Upload any custom branding image to display prominently on the full-screen app loading screen.
                  </p>
                </div>
                {brandingForm.splashScreenUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Custom Image Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0 self-start sm:self-auto">
                    Default Fallback Active
                  </span>
                )}
              </div>

              {/* 1. Dedicated Image Uploader */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">
                  Splash Screen Image
                </label>
                <p className="text-[11px] text-zinc-400">
                  Upload any aspect ratio (PNG, JPG, WebP, SVG). The uploaded image is displayed prominently on the app startup screen.
                </p>
                <AdminMediaUploader
                  mediaType="image"
                  value={brandingForm.splashScreenUrl}
                  previewHeightClass="h-56 sm:h-64"
                  maxSizeMB={20}
                  onChange={(storageId) =>
                    setBrandingForm((prev) => ({ ...prev, splashScreenUrl: storageId }))
                  }
                  onRemove={() =>
                    setBrandingForm((prev) => ({ ...prev, splashScreenUrl: '' }))
                  }
                />
              </div>

              {/* 2. Solid Background Colour */}
              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block">
                    Splash Background Colour
                  </label>
                  <p className="text-[11px] text-zinc-400">
                    Solid background filling the viewport behind the splash image.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={brandingForm.splashBgColor || '#4f46e5'}
                    onChange={(e) =>
                      setBrandingForm((prev) => ({ ...prev, splashBgColor: e.target.value }))
                    }
                    className="w-10 h-10 rounded-xl cursor-pointer border border-zinc-300 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={brandingForm.splashBgColor || '#4f46e5'}
                    onChange={(e) =>
                      setBrandingForm((prev) => ({ ...prev, splashBgColor: e.target.value }))
                    }
                    placeholder="#4f46e5"
                    className="w-32 px-3 py-2 text-xs font-mono font-bold rounded-xl border border-zinc-300 focus:outline-none focus:border-indigo-600 uppercase"
                  />
                  {/* Preset quick colors */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { name: 'LALOA Purple', hex: '#4f46e5' },
                      { name: 'Deep Violet', hex: '#4338ca' },
                      { name: 'Midnight', hex: '#0f172a' },
                      { name: 'Zinc Dark', hex: '#18181b' },
                      { name: 'Ocean Blue', hex: '#0284c7' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        title={c.name}
                        onClick={() =>
                          setBrandingForm((prev) => ({ ...prev, splashBgColor: c.hex }))
                        }
                        className={`w-7 h-7 rounded-lg border-2 transition-all cursor-pointer ${
                          brandingForm.splashBgColor?.toLowerCase() === c.hex.toLowerCase()
                            ? 'border-indigo-600 scale-110 shadow-sm'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Live Viewport Preview */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Live Loading Screen Viewport Preview
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Full-viewport centered with object-contain
                  </span>
                </div>
                <div
                  className="w-full h-52 sm:h-60 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-200/50 shadow-inner relative p-4"
                  style={{ backgroundColor: brandingForm.splashBgColor || '#4f46e5' }}
                >
                  {brandingForm.splashScreenUrl ? (
                    <img
                      src={brandingForm.splashScreenUrl}
                      alt="Active Splash Preview"
                      className="max-w-[85%] max-h-[80%] w-auto h-auto object-contain pointer-events-none select-none drop-shadow-sm"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <img
                      src={
                        brandingForm.brandLogoUrl ||
                        brandingForm.appIconUrl ||
                        '/icon.svg'
                      }
                      alt="Fallback Splash Preview"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain aspect-square pointer-events-none select-none opacity-90"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Main Brand Logo */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-zinc-900">Brand Logo</h3>
                <p className="text-xs text-zinc-500">
                  Primary header and navbar brand emblem.
                </p>
              </div>
              <AdminMediaUploader
                mediaType="image"
                value={brandingForm.brandLogoUrl}
                previewHeightClass="h-40"
                onChange={(storageId) =>
                  setBrandingForm((prev) => ({ ...prev, brandLogoUrl: storageId }))
                }
                onRemove={() =>
                  setBrandingForm((prev) => ({ ...prev, brandLogoUrl: '' }))
                }
              />
            </div>

            {/* Favicon */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-zinc-900">Favicon</h3>
                <p className="text-xs text-zinc-500">
                  Browser tab bookmark and notification favicon.
                </p>
              </div>
              <AdminMediaUploader
                mediaType="image"
                value={brandingForm.faviconUrl}
                previewHeightClass="h-40"
                onChange={(storageId) =>
                  setBrandingForm((prev) => ({ ...prev, faviconUrl: storageId }))
                }
                onRemove={() =>
                  setBrandingForm((prev) => ({ ...prev, faviconUrl: '' }))
                }
              />
            </div>
          </div>

          {/* Save Action Banner */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 flex items-center justify-between gap-4">
            <div>
              {brandingFeedback && (
                <p className="text-xs font-bold text-indigo-600 animate-fade-in">
                  {brandingFeedback}
                </p>
              )}
            </div>
            <button
              onClick={handleSaveBranding}
              disabled={isSavingBranding}
              className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingBranding ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Branding Changes
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: MESSAGING (Emoji & Sticker Packs) */}
      {/* =================================================================== */}
      {activeTab === 'emojis' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-zinc-900">Emoji & Sticker Packs</h3>
              <p className="text-xs text-zinc-500">
                Packs created and activated here appear dynamically in the Messaging chat emoji picker.
              </p>
            </div>
            <button
              onClick={() => setShowEmojiModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Emoji Pack
            </button>
          </div>

          {/* Emoji Packs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {emojiPacks === undefined ? (
              <div className="h-40 bg-zinc-100 rounded-3xl animate-pulse" />
            ) : emojiPacks.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-10 border border-zinc-200 text-center">
                <Smile className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-zinc-800">No Emoji Packs Yet</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                  Create your first emoji or sticker pack to give users expressive reactions in chats.
                </p>
                <button
                  onClick={() => setShowEmojiModal(true)}
                  className="px-4 py-2 bg-zinc-900 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Create Pack
                </button>
              </div>
            ) : (
              emojiPacks.map((pack: any) => (
                <div
                  key={pack._id}
                  className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                      {pack.iconUrl ? (
                        <img
                          src={pack.iconUrl}
                          alt={pack.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Smile className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-zinc-900 text-sm truncate">
                          {pack.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-600">
                          {pack.category || 'General'}
                        </span>
                      </div>
                      {pack.description && (
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {pack.description}
                        </p>
                      )}
                      <p className="text-[11px] font-bold text-indigo-600 mt-1">
                        {pack.itemCount} emojis / stickers
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <button
                      onClick={() => toggleEmojiPackActive({ id: pack._id })}
                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 cursor-pointer"
                    >
                      {pack.isActive ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                          <span className="text-emerald-700">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-zinc-400" />
                          <span className="text-zinc-500">Disabled</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete pack "${pack.name}"?`)) {
                          removeEmojiPack({ id: pack._id });
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete pack"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: FONTS & TYPOGRAPHY */}
      {/* =================================================================== */}
      {activeTab === 'fonts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Font Config Form */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-black text-zinc-900">Typography Settings</h3>
                <p className="text-xs text-zinc-500">
                  Configure primary typography styles applied across the application.
                </p>
              </div>

              {/* Font Family Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Primary Font Family
                </label>
                <select
                  value={typographyForm.fontFamily}
                  onChange={(e) =>
                    setTypographyForm((prev) => ({ ...prev, fontFamily: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm font-semibold text-zinc-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                  {customFonts?.map((cf: any) => (
                    <option key={cf._id} value={cf.fontFamily}>
                      Custom: {cf.fontFamily}
                    </option>
                  ))}
                </select>
              </div>

              {/* Heading Weight */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Heading Weight
                </label>
                <select
                  value={typographyForm.headingWeight}
                  onChange={(e) =>
                    setTypographyForm((prev) => ({ ...prev, headingWeight: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm font-semibold text-zinc-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {HEADING_WEIGHTS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Body Weight */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Body Text Weight
                </label>
                <select
                  value={typographyForm.bodyWeight}
                  onChange={(e) =>
                    setTypographyForm((prev) => ({ ...prev, bodyWeight: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm font-semibold text-zinc-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {BODY_WEIGHTS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Web Font Uploader */}
              <div className="pt-4 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-900 mb-1">
                  Upload Custom Font File
                </h4>
                <p className="text-[11px] text-zinc-400 mb-3">
                  Upload a .woff2, .woff, .ttf, or .otf font file to store in permanent storage.
                </p>
                <AdminMediaUploader
                  mediaType="font"
                  previewHeightClass="h-28"
                  onChange={async (storageId, publicUrl) => {
                    const familyName = prompt('Enter font family name:', 'CustomFont');
                    if (familyName) {
                      await uploadCustomFontMutation({
                        fontFamily: familyName.trim(),
                        fileUrl: storageId,
                        format: 'woff2',
                        isActive: true,
                      });
                      setTypographyForm((prev) => ({
                        ...prev,
                        fontFamily: familyName.trim(),
                        customFontUrl: storageId,
                      }));
                    }
                  }}
                />
              </div>

              <button
                onClick={handleSaveTypography}
                disabled={isSavingTypography}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingTypography ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Typography Settings
              </button>
              {typographyFeedback && (
                <p className="text-xs font-bold text-center text-indigo-600">
                  {typographyFeedback}
                </p>
              )}
            </div>

            {/* Live Typography Preview Card */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-zinc-900">Live Typography Preview</h3>
                <p className="text-xs text-zinc-500">
                  Instant preview of the selected font family and weights.
                </p>
              </div>

              <div
                className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-4"
                style={{ fontFamily: typographyForm.fontFamily }}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Heading 1
                  </span>
                  <h1
                    className="text-2xl sm:text-3xl text-zinc-900 tracking-tight"
                    style={{ fontWeight: Number(typographyForm.headingWeight) }}
                  >
                    Welcome to Lalao Community
                  </h1>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Heading 2
                  </span>
                  <h2
                    className="text-lg sm:text-xl text-zinc-800"
                    style={{ fontWeight: Number(typographyForm.headingWeight) }}
                  >
                    Connect with neighbors and discover rallies near you
                  </h2>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Body Paragraph
                  </span>
                  <p
                    className="text-xs sm:text-sm text-zinc-600 leading-relaxed"
                    style={{ fontWeight: Number(typographyForm.bodyWeight) }}
                  >
                    Lalao is where your neighborhood shares, asks, and hangs out. Post something or turn it into a RALLY so people nearby can participate in real life.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: ADVERTISEMENTS MEDIA */}
      {/* =================================================================== */}
      {activeTab === 'ads' && (
        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-900">Advertisement Media</h3>
              <p className="text-xs text-zinc-500">
                Manage visual advertisement creatives with images and videos.
              </p>
            </div>
            <Link
              to="/admin/ads"
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              Open Full Ad Management →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
            {ads?.map((ad: any) => (
              <div key={ad._id} className="rounded-2xl border border-zinc-200 overflow-hidden bg-zinc-50">
                <div className="h-36 bg-zinc-900 flex items-center justify-center overflow-hidden">
                  {ad.mediaType === 'video' ? (
                    <video src={ad.imageUrl} controls className="max-h-full max-w-full" />
                  ) : ad.imageUrl ? (
                    <img src={ad.imageUrl} alt={ad.title} className="max-h-full max-w-full object-cover" />
                  ) : (
                    <Megaphone className="w-8 h-8 text-zinc-500" />
                  )}
                </div>
                <div className="p-3.5">
                  <h4 className="font-bold text-zinc-900 text-xs truncate">{ad.title}</h4>
                  <p className="text-[11px] text-zinc-500 truncate">{ad.brandName || 'Brand'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE EMOJI PACK */}
      {/* =================================================================== */}
      {showEmojiModal && (
        <AdminModal
          isOpen={showEmojiModal}
          onClose={() => setShowEmojiModal(false)}
          title="Create Emoji / Sticker Pack"
          subtitle="Upload pack cover and multi-select emoji assets"
        >
          <form onSubmit={handleSaveEmojiPack} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Pack Name *
              </label>
              <input
                type="text"
                required
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="e.g. Lalao Vibes, Funny Faces"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs sm:text-sm font-semibold text-zinc-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={packCategory}
                  onChange={(e) => setPackCategory(e.target.value)}
                  placeholder="e.g. Reactions, Stickers"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={packDescription}
                  onChange={(e) => setPackDescription(e.target.value)}
                  placeholder="Optional pack description"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800"
                />
              </div>
            </div>

            {/* Pack Cover Icon */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Pack Icon *
              </label>
              <AdminMediaUploader
                mediaType="image"
                value={packIconPreview}
                previewHeightClass="h-28"
                onChange={(storageId, url) => {
                  setPackIconStorageId(storageId);
                  setPackIconPreview(url);
                }}
              />
            </div>

            {/* Multi-file Emoji Upload */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Emoji Assets (Select multiple images) *
              </label>
              <AdminMediaUploader
                multiple
                mediaType="image"
                description="Select multiple PNG / WebP images for this pack"
                onMultipleUpload={(newItems) => {
                  setEmojiItems((prev) => [...prev, ...newItems]);
                }}
              />

              {/* Preview Grid */}
              {emojiItems.length > 0 && (
                <div className="mt-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-zinc-700 mb-2">
                    {emojiItems.length} emojis uploaded:
                  </p>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {emojiItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative group w-10 h-10 rounded-xl bg-white border border-zinc-200 p-1 flex items-center justify-center"
                      >
                        <img
                          src={item.publicUrl}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEmojiItems((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPack || emojiItems.length === 0 || !packIconStorageId}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingPack ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save Pack
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
