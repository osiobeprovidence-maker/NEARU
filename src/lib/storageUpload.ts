/**
 * Uploads a file (image or video) directly to a Convex storage URL using XMLHttpRequest.
 * Using XHR instead of fetch avoids HTTP/2 stream reset errors (net::ERR_HTTP2_PROTOCOL_ERROR)
 * when streaming large binary files, and provides granular upload progress.
 */
export async function uploadToConvexStorage(
  uploadUrl: string,
  file: File,
  onProgress?: (fraction: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded / e.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const storageId = data.storageId || data;
          if (!storageId || typeof storageId !== 'string') {
            reject(new Error('No storage ID returned by storage server'));
          } else {
            onProgress?.(1);
            resolve(storageId);
          }
        } catch {
          reject(new Error('Invalid response from storage server'));
        }
      } else {
        reject(new Error(`Storage upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Storage upload failed: network error'));
    xhr.onabort = () => reject(new Error('Storage upload was aborted'));
    xhr.send(file);
  });
}
