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
  AlertCircle,
  Camera,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import { uploadToConvexStorage } from '../utils/imageUpload';

export interface UserAvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl?: string | null;
  userName?: string;
  initialFile?: File | null;
  onSuccess?: (storageId: string, blobUrl: string) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export default function UserAvatarCropModal({
  isOpen,
  onClose,
  currentImageUrl,
  userName = 'User',
  initialFile,
  onSuccess,
}: UserAvatarCropModalProps) {
  const { convexUserId, updateUser } = useAuth();
  const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const updateUserMutation = useMutation(api.users.update);

  // File & image state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fitMode, setFitMode] = useState<'safe' | 'fill'>('safe');
  const [sampledBg, setSampledBg] = useState<string>('#FFFFFF');
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 320,
    height: 320,
  });

  // Upload & UI status
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStep, setSaveStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update container dimensions
  const updateContainerDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    }
  }, []);

  useEffect(() => {
    updateContainerDimensions();
    window.addEventListener('resize', updateContainerDimensions);
    return () => window.removeEventListener('resize', updateContainerDimensions);
  }, [updateContainerDimensions, imageSrc]);

  // Clean up object URLs
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

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a valid JPG, PNG, or WebP image file.');
      return;
    }

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

      // Auto-sample edge background color
      try {
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 16;
        sampleCanvas.height = 16;
        const sCtx = sampleCanvas.getContext('2d');
        if (sCtx) {
          sCtx.drawImage(img, 0, 0, 16, 16);
          const p = sCtx.getImageData(0, 0, 1, 1).data;
          if (p[3] > 100) {
            setSampledBg(`rgb(${p[0]}, ${p[1]}, ${p[2]})`);
          } else {
            setSampledBg('#FFFFFF');
          }
        }
      } catch {
        setSampledBg('#FFFFFF');
      }

      const aspect = img.naturalWidth / img.naturalHeight;
      if (aspect >= 0.92 && aspect <= 1.08) {
        setFitMode('fill');
      } else {
        setFitMode('safe');
      }

      setTimeout(updateContainerDimensions, 50);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Failed to load image. Please select another file.');
    };
    img.src = objectUrl;
  }, [updateContainerDimensions]);

  // Reset or load initial file on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setFitMode('safe');
      setIsSaving(false);
      if (initialFile) {
        handleFile(initialFile);
      }
    } else {
      setImageSrc(null);
      setImageElement(null);
      setFileName('');
      setError(null);
    }
  }, [isOpen, initialFile, handleFile]);

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

  // Pointer controls
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
    setZoom((prev) => Math.min(Math.max(0.5, prev + delta), 3.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFitMode = (target: 'safe' | 'fill') => {
    setFitMode(target);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Compute base dimensions
  const containerW = containerDimensions.width || 320;
  const containerH = containerDimensions.height || 320;

  let baseW = containerW;
  let baseH = containerH;

  if (imageElement) {
    const imgAspect = imageElement.naturalWidth / imageElement.naturalHeight;
    if (fitMode === 'safe') {
      const safeSize = containerW * 0.80;
      if (imgAspect >= 1) {
        baseW = safeSize;
        baseH = safeSize / imgAspect;
      } else {
        baseH = safeSize;
        baseW = safeSize * imgAspect;
      }
    } else {
      if (imgAspect >= 1) {
        baseH = containerH;
        baseW = containerH * imgAspect;
      } else {
        baseW = containerW;
        baseH = containerW / imgAspect;
      }
    }
  }

  // Render crop to 1080x1080 canvas & upload
  const handleSave = async () => {
    if (!imageElement || !containerRef.current) return;

    setIsSaving(true);
    setError(null);
    setSaveStep('Cropping photo to 1080 × 1080 px...');

    try {
      const outputSize = 1080;
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas rendering context is not available.');

      ctx.fillStyle = sampledBg || '#FFFFFF';
      ctx.fillRect(0, 0, outputSize, outputSize);

      const scaleToCanvas = outputSize / containerW;
      const canvasW = baseW * zoom * scaleToCanvas;
      const canvasH = baseH * zoom * scaleToCanvas;
      const canvasCenterX = (outputSize / 2) + (pan.x * scaleToCanvas);
      const canvasCenterY = (outputSize / 2) + (pan.y * scaleToCanvas);
      const drawX = canvasCenterX - (canvasW / 2);
      const drawY = canvasCenterY - (canvasH / 2);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imageElement, drawX, drawY, canvasW, canvasH);

      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to crop image.'));
          },
          'image/jpeg',
          0.92
        );
      });

      setSaveStep('Uploading profile photo...');
      const storageId = await uploadToConvexStorage(croppedBlob, generateAvatarUploadUrl);
      const blobUrl = URL.createObjectURL(croppedBlob);

      if (convexUserId) {
        setSaveStep('Updating profile...');
        await updateUserMutation({
          userId: convexUserId as any,
          avatar: storageId,
        });
        updateUser({ avatar: blobUrl });
      }

      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            title: 'Profile Photo Updated',
            subtitle: 'Your new WhatsApp-style profile picture is now live.',
          },
        })
      );

      onSuccess?.(storageId, blobUrl);
      onClose();
    } catch (err: any) {
      console.error('[UserAvatarCropModal] Save failed:', err);
      setError(err?.message || 'Failed to save profile photo.');
    } finally {
      setIsSaving(false);
      setSaveStep('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', bounce: 0.1, duration: 0.25 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 leading-tight">
                  Profile Photo
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  WhatsApp-style 1:1 format (1080 × 1080 px) · Safe for circular display
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50 cursor-pointer"
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
              /* File Picker */
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
                {currentImageUrl && (
                  <div className="mb-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-md mx-auto bg-zinc-100 flex items-center justify-center">
                      <img
                        src={currentImageUrl}
                        alt="Current Profile"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-400 block mt-1.5">
                      Current profile photo
                    </span>
                  </div>
                )}

                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-zinc-900 mb-1">
                  Choose a profile photo
                </h4>
                <p className="text-xs text-zinc-500 max-w-xs mb-3 font-medium leading-relaxed">
                  Supports JPG, PNG, or WebP. Optimal crop is 1080 × 1080 px square.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold shadow-sm hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                >
                  Select File from Device
                </button>
              </div>
            ) : (
              /* Interactive Viewport */
              <div className="space-y-4">
                <div className="text-xs font-bold text-zinc-500 flex items-center justify-between px-1">
                  <span className="truncate max-w-[200px] text-zinc-700">{fileName}</span>
                  <span className="text-zinc-400">Drag to pan · Scroll to zoom</span>
                </div>

                <div className="relative w-full bg-zinc-950 rounded-3xl overflow-hidden select-none touch-none shadow-inner flex items-center justify-center p-2 sm:p-4">
                  <div
                    ref={containerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onWheel={handleWheel}
                    className="relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing rounded-2xl w-full max-w-[320px] aspect-square"
                    style={{
                      backgroundColor: sampledBg || '#09090b',
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt="Crop target"
                      draggable={false}
                      className="absolute pointer-events-none select-none transition-transform duration-75 will-change-transform max-w-none max-h-none"
                      style={{
                        width: `${baseW}px`,
                        height: `${baseH}px`,
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                        transformOrigin: 'center center',
                      }}
                    />

                    {/* WhatsApp-Style Circular Mask Overlay */}
                    <div className="absolute inset-0 pointer-events-none rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ring-2 ring-white/90" />

                    {/* 80% Safe Zone Ring */}
                    <div className="absolute inset-[10%] rounded-full border border-dashed border-emerald-400/90 pointer-events-none flex items-start justify-center pt-2 shadow-[inset_0_0_12px_rgba(16,185,129,0.15)]">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-200 bg-black/70 px-2 py-0.5 rounded-full backdrop-blur-xs">
                        80% Safe Area
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Fit Mode Toggle */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFitMode('safe')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      fitMode === 'safe'
                        ? 'bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Fit to Safe Area (Full Image)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFitMode('fill')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      fitMode === 'fill'
                        ? 'bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Fill Circle</span>
                  </button>
                </div>

                {/* Zoom Control Bar */}
                <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3">
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(0.5, +(prev - 0.15).toFixed(2)))}
                    className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1.5 bg-zinc-200 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.15).toFixed(2)))}
                    className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-600 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Reset Position & Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">
                    Standard resolution: 1080 × 1080 px
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 cursor-pointer"
                  >
                    Choose a different photo
                  </button>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Footer Actions */}
          <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            {imageSrc && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{saveStep || 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Profile Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
