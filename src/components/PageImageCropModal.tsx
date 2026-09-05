import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Loader2,
  Trash2,
  AlertCircle,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { processAndCompressImage, uploadToConvexStorage } from '../utils/imageUpload';

export interface PageImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: Id<'pages'>;
  mode: 'avatar' | 'cover';
  currentImageUrl?: string | null;
  pageName?: string;
  onSuccess?: (newUrl?: string) => void;
  onRemove?: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export default function PageImageCropModal({
  isOpen,
  onClose,
  pageId,
  mode,
  currentImageUrl,
  pageName = 'Page',
  onSuccess,
  onRemove,
}: PageImageCropModalProps) {
  const generateUploadUrl = useMutation(api.pages.generatePageImageUploadUrl);
  const updateProfileImageMut = useMutation(api.pages.updateProfileImage);
  const updateCoverImageMut = useMutation(api.pages.updateCoverImage);
  const removeProfileImageMut = useMutation(api.pages.removeProfileImage);
  const removeCoverImageMut = useMutation(api.pages.removeCoverImage);

  // File & image state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Upload & UI status
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStep, setSaveStep] = useState<string>('');
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsSaving(false);
      setIsRemoving(false);
    } else {
      setImageSrc(null);
      setImageElement(null);
      setFileName('');
      setError(null);
    }
  }, [isOpen]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  // Handle incoming file
  const handleFile = useCallback((file: File) => {
    setError(null);

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a valid JPG, PNG, or WebP image file.');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image file is too large. Please select an image under 15MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      setImageSrc(objectUrl);
      setFileName(file.name);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Failed to load image. Please select another file.');
    };
    img.src = objectUrl;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Pan controls (Pointer events for unified mouse + touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!imageSrc) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setIsDragging(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Render crop to canvas & upload
  const handleSave = async () => {
    if (!imageElement || !containerRef.current) return;

    setIsSaving(true);
    setError(null);
    setSaveStep('Cropping image...');

    try {
      // 1. Calculate Crop Canvas Dimensions
      const isAvatar = mode === 'avatar';
      // Target output resolution
      const outputWidth = isAvatar ? 800 : 1600;
      const outputHeight = isAvatar ? 800 : 600; // 8:3 ratio for cover (~2.67:1)

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas rendering context is not available.');

      // Clear & fill background with white (for transparent PNGs converted to JPEG)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      // Get container's visible crop box dimensions
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Base display dimensions of the image that would "cover" the viewport at zoom = 1
      const imgAspect = imageElement.naturalWidth / imageElement.naturalHeight;
      const boxAspect = containerWidth / containerHeight;

      let baseW: number;
      let baseH: number;
      if (imgAspect > boxAspect) {
        baseH = containerHeight;
        baseW = containerHeight * imgAspect;
      } else {
        baseW = containerWidth;
        baseH = containerWidth / imgAspect;
      }

      // Scaled dimensions on the UI viewport
      const displayedW = baseW * zoom;
      const displayedH = baseH * zoom;

      // Center offset + user pan
      const offsetX = (containerWidth - displayedW) / 2 + pan.x;
      const offsetY = (containerHeight - displayedH) / 2 + pan.y;

      // Map UI viewport coordinates to output canvas
      const scaleToCanvas = outputWidth / containerWidth;
      const drawX = offsetX * scaleToCanvas;
      const drawY = offsetY * scaleToCanvas;
      const drawW = displayedW * scaleToCanvas;
      const drawH = displayedH * scaleToCanvas;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imageElement, drawX, drawY, drawW, drawH);

      // Convert canvas to blob
      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to generate cropped image.'));
          },
          'image/jpeg',
          0.92
        );
      });

      // 2. Compress image using standard utility
      setSaveStep('Compressing & optimizing...');
      const compressedBlob = await processAndCompressImage(croppedBlob, {
        maxWidth: isAvatar ? 800 : 1920,
        maxHeight: isAvatar ? 800 : 800,
        quality: 0.88,
      });

      // 3. Upload to Convex Storage using backend permission-gated upload URL
      setSaveStep('Uploading to storage...');
      const storageId = await uploadToConvexStorage(
        compressedBlob,
        async () => await generateUploadUrl({ pageId })
      );

      // 4. Save to Page document in DB
      setSaveStep('Saving to Page profile...');
      let finalUrl: string | undefined;

      if (isAvatar) {
        const res = await updateProfileImageMut({
          pageId,
          storageId,
        });
        finalUrl = res.avatar;
      } else {
        const res = await updateCoverImageMut({
          pageId,
          storageId,
        });
        finalUrl = res.coverImage;
      }

      // 5. Toast notification & callback
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: isAvatar ? 'Profile Photo Updated' : 'Cover Photo Updated',
            subtitle: `Successfully updated ${pageName}'s ${isAvatar ? 'avatar' : 'cover photo'}.`,
          },
        })
      );

      onSuccess?.(finalUrl);
      onClose();
    } catch (err: any) {
      console.error('[PageImageCropModal] Save failed:', err);
      setError(err?.message || 'Failed to save image. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
      setSaveStep('');
    }
  };

  // Remove current image
  const handleRemove = async () => {
    if (!currentImageUrl) return;
    const isAvatar = mode === 'avatar';
    const confirmMsg = isAvatar
      ? 'Are you sure you want to remove the Page profile image? The default initial badge will be shown.'
      : 'Are you sure you want to remove the Page cover photo?';

    if (!window.confirm(confirmMsg)) return;

    setIsRemoving(true);
    setError(null);
    try {
      if (isAvatar) {
        await removeProfileImageMut({ pageId });
      } else {
        await removeCoverImageMut({ pageId });
      }

      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: isAvatar ? 'Profile Photo Removed' : 'Cover Photo Removed',
            subtitle: 'Reverted to default Page branding.',
          },
        })
      );

      onRemove?.();
      onClose();
    } catch (err: any) {
      console.error('[PageImageCropModal] Remove failed:', err);
      setError(err?.message || 'Failed to remove image.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  const isAvatar = mode === 'avatar';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', bounce: 0.1, duration: 0.25 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                {isAvatar ? <Camera className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 leading-tight">
                  {isAvatar ? 'Page Profile Picture' : 'Page Cover Photo'}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  {isAvatar
                    ? 'Square 1:1 format · Appears as author of posts & in search'
                    : 'Wide banner ratio · Displayed at the top of your Page'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isRemoving}
              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {!imageSrc ? (
              /* File Picker / Drop Zone */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDraggingOver
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/70 bg-zinc-50/30'
                }`}
              >
                {/* Current Image Preview if available */}
                {currentImageUrl && (
                  <div className="mb-4">
                    {isAvatar ? (
                      <img
                        src={currentImageUrl}
                        alt="Current Profile"
                        className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md mx-auto"
                      />
                    ) : (
                      <div className="w-48 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-md mx-auto">
                        <img
                          src={currentImageUrl}
                          alt="Current Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-zinc-400 block mt-1.5">
                      Current {isAvatar ? 'profile image' : 'cover photo'}
                    </span>
                  </div>
                )}

                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-zinc-900 mb-1">
                  Click to choose or drag & drop image
                </h4>
                <p className="text-xs text-zinc-500 max-w-xs mb-3 font-medium">
                  {isAvatar
                    ? 'Supports JPG, PNG, or WebP. Optimal crop is 1:1 square.'
                    : 'Supports JPG, PNG, or WebP. Use a wide landscape photo.'}
                </p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold shadow-sm hover:bg-zinc-800 transition-all active:scale-95"
                >
                  Select File from Device
                </button>
              </div>
            ) : (
              /* Interactive Crop Viewport */
              <div className="space-y-4">
                <div className="text-xs font-bold text-zinc-500 flex items-center justify-between px-1">
                  <span className="truncate max-w-[200px] text-zinc-700">{fileName}</span>
                  <span className="text-zinc-400">Drag to reposition · Scroll to zoom</span>
                </div>

                {/* Viewport Box */}
                <div className="relative w-full bg-zinc-950 rounded-2xl overflow-hidden select-none touch-none shadow-inner">
                  <div
                    ref={containerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onWheel={handleWheel}
                    className={`relative w-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing ${
                      isAvatar ? 'aspect-square max-h-[320px]' : 'aspect-[16/6] max-h-[260px]'
                    }`}
                  >
                    {/* The Pan-and-Zoom Image */}
                    <img
                      src={imageSrc}
                      alt="Crop target"
                      draggable={false}
                      className="absolute pointer-events-none transition-transform duration-75 will-change-transform max-w-none max-h-none object-contain"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                      }}
                    />

                    {/* Mask Overlay: Guides boundary */}
                    <div className="absolute inset-0 pointer-events-none border border-white/30 rounded-2xl" />

                    {/* Circular Guide for Avatar */}
                    {isAvatar && (
                      <div className="absolute inset-4 rounded-full border-2 border-dashed border-white/60 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                    )}

                    {/* Cover Guide: Avatar Silhouette Overlay in Bottom-Left */}
                    {!isAvatar && (
                      <>
                        <div className="absolute inset-0 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
                        {/* Silhouette indicator to warn about avatar placement */}
                        <div className="absolute bottom-2 left-4 w-14 h-14 rounded-2xl border-2 border-dashed border-amber-400/80 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none p-1 text-center">
                          <Camera className="w-3.5 h-3.5 text-amber-300" />
                          <span className="text-[7px] font-black uppercase text-amber-200 tracking-tight leading-none mt-0.5">
                            Avatar Area
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Zoom Control Bar */}
                <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3">
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.15).toFixed(2)))}
                    className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-600 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1.5 bg-zinc-200 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.15).toFixed(2)))}
                    className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-600 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-600 transition-colors text-xs font-bold flex items-center gap-1"
                    title="Reset Position & Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </div>

                {/* Choose different image trigger */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                  >
                    Choose a different photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden Native File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Footer Actions */}
          <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-3">
            <div>
              {currentImageUrl && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isSaving || isRemoving}
                  className="px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isRemoving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Remove {isAvatar ? 'Avatar' : 'Cover'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isRemoving}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              {imageSrc && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isRemoving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{saveStep || 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save {isAvatar ? 'Profile Image' : 'Cover Image'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
