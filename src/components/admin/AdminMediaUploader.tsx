import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface UploadedMediaItem {
  storageId: string;
  publicUrl: string;
  name: string;
}

interface AdminMediaUploaderProps {
  mediaType: 'image' | 'video' | 'font' | 'all';
  value?: string | null;
  onChange?: (storageId: string, publicUrl: string) => void;
  onRemove?: () => void;
  multiple?: boolean;
  onMultipleUpload?: (items: UploadedMediaItem[]) => void;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  className?: string;
  previewHeightClass?: string;
}

export function AdminMediaUploader({
  mediaType,
  value,
  onChange,
  onRemove,
  multiple = false,
  onMultipleUpload,
  maxSizeMB = 20,
  label,
  description,
  className,
  previewHeightClass = 'h-48 sm:h-56',
}: AdminMediaUploaderProps) {
  const genUploadUrl = useMutation(api.media.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const [isVideo, setIsVideo] = useState<boolean>(mediaType === 'video');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sync preview if external value changes (and no active local upload)
  useEffect(() => {
    if (value && !isUploading) {
      setPreviewUrl(value);
      if (
        value.endsWith('.mp4') ||
        value.endsWith('.webm') ||
        value.endsWith('.mov') ||
        mediaType === 'video'
      ) {
        setIsVideo(true);
      }
    } else if (!value && !isUploading) {
      setPreviewUrl('');
    }
  }, [value, isUploading, mediaType]);

  // Determine accept attribute
  const getAccept = () => {
    switch (mediaType) {
      case 'image':
        return 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';
      case 'video':
        return 'video/mp4,video/webm,video/quicktime';
      case 'font':
        return '.woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf';
      default:
        return 'image/*,video/*';
    }
  };

  const uploadSingleFile = async (file: File): Promise<{ storageId: string; publicUrl: string }> => {
    const uploadUrl = await genUploadUrl();
    const upRes = await fetch(uploadUrl, {
      method: 'POST',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });

    if (!upRes.ok) {
      throw new Error(`Upload failed with status ${upRes.status}`);
    }

    const data = await upRes.json();
    const storageId = data.storageId || data;
    if (!storageId || typeof storageId !== 'string') {
      throw new Error('Convex storage failed to return a valid storage ID');
    }

    // Resolve public URL via Convex site URL
    const convexSite = import.meta.env.VITE_CONVEX_SITE_URL || '';
    const publicUrl = convexSite ? `${convexSite}/api/storage/${storageId}` : storageId;

    return { storageId, publicUrl };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    // Multiple file upload mode (e.g. for Emoji packs)
    if (multiple) {
      setIsUploading(true);
      const results: UploadedMediaItem[] = [];
      const total = files.length;

      try {
        for (let i = 0; i < total; i++) {
          const file = files[i];
          setUploadProgress(`Uploading ${i + 1} of ${total}...`);
          const { storageId, publicUrl } = await uploadSingleFile(file);
          results.push({
            storageId,
            publicUrl,
            name: file.name.replace(/\.[^/.]+$/, ''),
          });
        }

        if (onMultipleUpload) {
          onMultipleUpload(results);
        }
      } catch (err: any) {
        setError(err.message || 'Multiple file upload failed');
      } finally {
        setIsUploading(false);
        setUploadProgress('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      return;
    }

    // Single file upload mode
    const file = files[0];

    // File size check
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const isVid = file.type.startsWith('video/') || mediaType === 'video';
    setIsVideo(isVid);

    // Instant local preview
    const localBlob = URL.createObjectURL(file);
    setPreviewUrl(localBlob);
    setIsUploading(true);
    setUploadProgress('Uploading to permanent storage...');

    try {
      const { storageId, publicUrl } = await uploadSingleFile(file);
      setPreviewUrl(publicUrl);
      if (onChange) {
        onChange(storageId, publicUrl);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'File upload failed. Please try again.');
      setPreviewUrl('');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      URL.revokeObjectURL(localBlob);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onRemove) onRemove();
    if (onChange) onChange('', '');
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-xs font-bold text-zinc-900 tracking-tight">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={getAccept()}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* When a file is selected and not in multiple-mode */}
      {!multiple && previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-900 shadow-xs group">
          <div className={cn('w-full flex items-center justify-center', previewHeightClass)}>
            {isVideo ? (
              <video
                src={previewUrl}
                controls
                className="max-h-full max-w-full object-contain"
              />
            ) : mediaType === 'font' ? (
              <div className="p-6 text-center text-white">
                <FileText className="w-10 h-10 mx-auto mb-2 text-indigo-400" />
                <p className="text-xs font-mono truncate max-w-xs">{previewUrl}</p>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs font-bold">{uploadProgress}</span>
            </div>
          )}

          {/* Action overlay */}
          {!isUploading && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-zinc-800 text-xs font-bold shadow-md backdrop-blur-xs transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Upload trigger dropzone */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed border-zinc-200 hover:border-indigo-500 rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer bg-zinc-50/60 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-2 group',
            isUploading && 'opacity-60 pointer-events-none'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 group-hover:text-indigo-600 group-hover:border-indigo-200 group-hover:scale-105 transition-all shadow-xs">
            {isUploading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
            ) : mediaType === 'video' ? (
              <Video className="w-5 h-5" />
            ) : mediaType === 'font' ? (
              <FileText className="w-5 h-5" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div>
            <p className="text-xs sm:text-sm font-bold text-zinc-800">
              {isUploading
                ? uploadProgress || 'Uploading...'
                : multiple
                ? 'Click to select multiple files'
                : `Click to upload ${mediaType}`}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {description ||
                (mediaType === 'video'
                  ? `MP4, WebM, MOV up to ${maxSizeMB}MB`
                  : mediaType === 'font'
                  ? 'WOFF2, WOFF, TTF, OTF'
                  : `PNG, JPG, WebP, SVG up to ${maxSizeMB}MB`)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
