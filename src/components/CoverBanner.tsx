import React, {
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Camera, Check, Loader2, RefreshCw } from 'lucide-react';
import {
  processAndCompressImage,
  uploadToConvexStorage,
  logUploadStage,
} from '../utils/imageUpload';

export interface CoverBannerHandle {
  /** Programmatically open the cover photo file picker (used by "Edit Cover"). */
  openPicker: () => void;
}

interface CoverBannerProps {
  /** Resolved display URL (http/blob/data) of the current cover, if any. */
  coverImage?: string | null;
  /** Whether the current viewer may edit this cover. */
  canEdit?: boolean;
  /** Called with the Convex storage id + local blob URL after a successful upload. */
  onCoverUploaded?: (storageId: string, blobUrl: string) => void | Promise<void>;
  onError?: (msg: string) => void;
}

/**
 * Reusable cover photo banner with mobile-resilient file picking,
 * automatic camera downsampling, and inline edit controls.
 */
const CoverBanner = forwardRef<CoverBannerHandle, CoverBannerProps>(
  function CoverBanner({ coverImage, canEdit, onCoverUploaded, onError }, ref) {
    const generateCoverUploadUrl = useMutation(
      api.users.generateCoverUploadUrl
    );
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [lastFailedFile, setLastFailedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      openPicker: () => {
        if (canEdit && inputRef.current) {
          inputRef.current.click();
        }
      },
    }));

    const shown = preview ?? coverImage ?? null;

    const performUpload = async (file: File) => {
      setUploading(true);
      setUploadError(null);
      setLastFailedFile(null);
      setUploadSuccess(false);

      logUploadStage('SELECT', 'Cover image selected', {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      try {
        // Step 1: Compress high-res phone camera captures to max 1920px JPEG
        const compressedBlob = await processAndCompressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
        });

        // Step 2: Create local preview immediately for smooth UX
        const blobUrl = URL.createObjectURL(compressedBlob);
        setPreview(blobUrl);

        // Step 3: Upload to Convex signed storage URL
        const storageId = await uploadToConvexStorage(
          compressedBlob,
          generateCoverUploadUrl
        );

        // Step 4: Notify parent to sync user record in Convex
        logUploadStage('SYNC', 'Syncing cover image to user profile', { storageId });
        await onCoverUploaded?.(storageId, blobUrl);

        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2500);
      } catch (err: any) {
        logUploadStage('UPLOAD', 'Cover upload failed', { error: err?.message || String(err) });
        const userMsg = err?.message || 'Could not upload cover photo. Please try again.';
        setUploadError(userMsg);
        setLastFailedFile(file);
        onError?.(userMsg);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      performUpload(file);
    };

    const handleRetry = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (lastFailedFile) {
        performUpload(lastFailedFile);
      } else {
        inputRef.current?.click();
      }
    };

    return (
      <div className="relative h-32 sm:h-44 overflow-hidden bg-zinc-100 select-none">
        {shown ? (
          <img
            src={shown}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <label
            htmlFor={canEdit ? inputId : undefined}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-zinc-400 ${
              canEdit ? 'cursor-pointer hover:bg-zinc-200/50 transition-colors' : ''
            }`}
          >
            <Camera className="w-6 h-6" strokeWidth={1.5} />
            {canEdit && (
              <span className="text-[11px] font-bold text-zinc-400">
                Add Cover Photo
              </span>
            )}
          </label>
        )}

        {/* Uploading progress overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-20">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
            <span className="text-xs font-bold text-white tracking-wide">
              Optimizing & uploading...
            </span>
          </div>
        )}

        {/* Success confirmation overlay */}
        {uploadSuccess && (
          <div className="absolute top-2 left-2 z-20 px-2.5 py-1 bg-emerald-600/90 backdrop-blur-sm text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-md animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5" />
            Cover updated
          </div>
        )}

        {/* Error notification with retry option */}
        {uploadError && !uploading && (
          <div className="absolute top-2 left-2 right-2 sm:right-auto z-20 px-3 py-1.5 bg-rose-600/95 backdrop-blur-sm text-white text-xs font-medium rounded-xl flex items-center justify-between gap-2 shadow-lg animate-in fade-in duration-200">
            <span className="truncate">{uploadError}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-md font-bold text-[11px] shrink-0 inline-flex items-center gap-1 transition-colors active:scale-95"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Mobile & Desktop Safe Edit Button Trigger */}
        {canEdit && (
          <label
            htmlFor={inputId}
            className="absolute bottom-2.5 right-2.5 px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 text-white text-[11px] font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow z-10"
            title="Edit Cover Photo"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            Edit Cover
          </label>
        )}

        {/* Native mobile-friendly file input (visually hidden, not display:none) */}
        <input
          id={inputId}
          type="file"
          ref={inputRef}
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          disabled={uploading}
          onChange={handleFileChange}
        />
      </div>
    );
  }
);

export default CoverBanner;