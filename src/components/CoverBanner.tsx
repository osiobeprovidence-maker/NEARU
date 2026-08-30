import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Camera, Loader2 } from 'lucide-react';

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
 * Reusable cover photo banner with a clean (gradient-free) placeholder and an
 * inline "Edit Cover" control. Used on the public profile, own profile and the
 * organization/business page.
 */
const CoverBanner = forwardRef<CoverBannerHandle, CoverBannerProps>(
  function CoverBanner({ coverImage, canEdit, onCoverUploaded, onError }, ref) {
    const generateCoverUploadUrl = useMutation(
      api.users.generateCoverUploadUrl
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      openPicker: () => {
        if (canEdit) inputRef.current?.click();
      },
    }));

    const shown = preview ?? coverImage ?? null;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        onError?.('Image must be under 5MB');
        return;
      }
      setUploading(true);
      try {
        const uploadUrl = await generateCoverUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        const { storageId } = await result.json();
        const blobUrl = URL.createObjectURL(file);
        setPreview(blobUrl);
        await onCoverUploaded?.(storageId, blobUrl);
      } catch {
        onError?.('Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    };

    return (
      <div className="relative h-32 sm:h-44 overflow-hidden bg-zinc-100">
        {shown ? (
          <img
            src={shown}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-zinc-400">
            <Camera className="w-6 h-6" strokeWidth={1.5} />
            {canEdit && (
              <p className="text-[11px] font-bold text-zinc-400">Add Cover Photo</p>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2.5 right-2.5 px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 text-white text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50 shadow"
            title="Edit Cover Photo"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            Edit Cover
          </button>
        )}

        <input
          type="file"
          ref={inputRef}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    );
  }
);

export default CoverBanner;