/**
 * Utility for robust mobile and desktop image processing and uploading.
 * Handles:
 * - High-resolution smartphone camera photos (5MB - 20MB+)
 * - Client-side downsampling and compression to lightweight JPEG/WebP
 * - Aspect ratio and EXIF orientation preservation
 * - Safe MIME type fallback for mobile pickers
 * - Structured phase-based error logging (validation, processing, network upload)
 */

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export interface UploadResult {
  storageId: string;
  blobUrl: string;
}

/**
 * Diagnostic logger that categorizes upload stages without exposing
 * sensitive credentials or personal data.
 */
export const logUploadStage = (
  phase: 'SELECT' | 'VALIDATE' | 'PROCESS' | 'UPLOAD' | 'SYNC',
  message: string,
  details?: Record<string, unknown>
) => {
  if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
    // eslint-disable-next-line no-console
    console.log(`[ImageUpload][${phase}] ${message}`, details || '');
  }
};

/**
 * Client-side image processor that resizes and compresses high-resolution mobile photos
 * down to bandwidth-friendly JPEGs before uploading.
 */
export async function processAndCompressImage(
  file: File | Blob,
  options: ProcessImageOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
  } = options;

  logUploadStage('PROCESS', 'Starting image processing', {
    originalSize: file.size,
    type: file.type,
  });

  return new Promise<Blob>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      if (!targetWidth || !targetHeight) {
        logUploadStage('PROCESS', 'Could not read image dimensions, fallback to original');
        resolve(file);
        return;
      }

      // Calculate constrained dimensions while maintaining aspect ratio
      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          logUploadStage('PROCESS', '2D canvas context unavailable, fallback to original');
          resolve(file);
          return;
        }

        // Fill background with white for transparent images converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export as JPEG (widely supported, optimal compression for photos)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              logUploadStage('PROCESS', 'toBlob returned null, fallback to original');
              resolve(file);
              return;
            }
            logUploadStage('PROCESS', 'Image compressed successfully', {
              originalSize: file.size,
              compressedSize: blob.size,
              dimensions: `${targetWidth}x${targetHeight}`,
            });
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        logUploadStage('PROCESS', 'Canvas processing error, falling back to original', { error: String(err) });
        resolve(file);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      logUploadStage('PROCESS', 'Image failed to load in browser decoder', { error: String(err) });
      if (file.type.includes('heic') || file.type.includes('heif')) {
        reject(new Error('HEIC photo format is not supported by your browser. Please select a JPG or PNG.'));
      } else {
        resolve(file);
      }
    };

    img.src = objectUrl;
  });
}

/**
 * Uploads a processed image blob or file to Convex storage using a generated signed upload URL.
 */
export async function uploadToConvexStorage(
  fileOrBlob: Blob | File,
  generateUploadUrl: () => Promise<string>,
  options?: {
    contentType?: string;
  }
): Promise<string> {
  logUploadStage('UPLOAD', 'Requesting signed upload URL from Convex');
  
  let uploadUrl: string;
  try {
    uploadUrl = await generateUploadUrl();
  } catch (err: any) {
    logUploadStage('UPLOAD', 'Failed to generate upload URL', { error: String(err) });
    throw new Error(err?.message || 'Could not initialize image upload. Please check your connection.');
  }

  const contentType = options?.contentType || fileOrBlob.type || 'image/jpeg';
  logUploadStage('UPLOAD', 'Uploading blob to storage', {
    size: fileOrBlob.size,
    contentType,
  });

  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      body: fileOrBlob,
    });
  } catch (err) {
    logUploadStage('UPLOAD', 'Network fetch error during storage upload', { error: String(err) });
    throw new Error('Network error while uploading image. Please try again.');
  }

  if (!response.ok) {
    logUploadStage('UPLOAD', 'Storage HTTP error', { status: response.status });
    throw new Error(`Upload failed with server status ${response.status}`);
  }

  const data = await response.json();
  if (!data?.storageId) {
    logUploadStage('UPLOAD', 'Storage response missing storageId', { data });
    throw new Error('Invalid response from storage service.');
  }

  logUploadStage('UPLOAD', 'Storage upload completed successfully', { storageId: data.storageId });
  return data.storageId;
}
