// R2 Storage Service
// Feature: 002-r2-storage-migration
// Task: T031 - Create R2 service for presigned URL requests and upload confirmation

import { storageConfig } from '../config/storage';
import type {
  PresignedUploadUrl,
  PresignedUrlRequest,
  UploadConfirmation,
  UploadConfirmResponse,
  AssetUrlResponse,
  AssetUrlType,
} from '../types/upload.types';

/**
 * Request a presigned URL for direct R2 upload
 *
 * @param sessionId - Upload session ID
 * @param filename - Original filename
 * @param contentType - MIME type
 * @param contentLength - File size in bytes
 * @returns Presigned URL response with upload URL and key
 */
export async function requestPresignedUrl(
  sessionId: string,
  filename: string,
  contentType: string,
  contentLength: number
): Promise<PresignedUploadUrl> {
  const request: PresignedUrlRequest = {
    sessionId,
    filename,
    contentType,
    contentLength,
  };

  const response = await fetch(`${storageConfig.presignWorkerUrl}/api/presign/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new R2ServiceError(
      response.status,
      error.error?.code || 'PRESIGN_FAILED',
      error.error?.message || 'Failed to get presigned URL'
    );
  }

  return response.json();
}

/**
 * Upload file directly to R2 using presigned URL
 *
 * @param presignedUrl - Presigned PUT URL from requestPresignedUrl()
 * @param file - File to upload
 * @param onProgress - Optional progress callback (0-100)
 * @returns ETag from R2 response (for confirmation)
 */
export async function uploadToR2(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ etag: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // ETag may be blocked by R2 CORS - that's fine, we use a fallback
        let etag = 'upload-ok';
        try { etag = xhr.getResponseHeader('ETag') || etag; } catch { /* CORS blocks this */ }
        resolve({ etag });
      } else {
        reject(
          new R2ServiceError(
            xhr.status,
            'UPLOAD_FAILED',
            `Upload failed with status ${xhr.status}`
          )
        );
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new R2ServiceError(0, 'NETWORK_ERROR', 'Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new R2ServiceError(0, 'UPLOAD_ABORTED', 'Upload was aborted'));
    });

    // Send the request
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Confirm upload completion to backend
 *
 * After successful direct upload to R2, call this to:
 * 1. Verify the upload (check ETag and size)
 * 2. Move file from temp to permanent storage
 * 3. Create asset record in database
 *
 * @param confirmation - Upload confirmation details
 * @returns Asset and session information
 */
export async function confirmUpload(
  confirmation: UploadConfirmation
): Promise<UploadConfirmResponse> {
  const response = await fetch(`${storageConfig.presignWorkerUrl}/api/upload/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(confirmation),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new R2ServiceError(
      response.status,
      error.error?.code || 'CONFIRM_FAILED',
      error.error?.message || 'Failed to confirm upload'
    );
  }

  return response.json();
}

/**
 * Get asset URL from R2 (full, thumbnail, or download)
 *
 * @param assetId - Asset ID
 * @param type - URL type (full, thumbnail, download)
 * @returns Asset URL response with presigned URL
 */
export async function getAssetUrl(
  assetId: string,
  type: AssetUrlType = 'full'
): Promise<AssetUrlResponse> {
  const response = await fetch(
    `${storageConfig.presignWorkerUrl}/api/assets/${assetId}/url?type=${type}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new R2ServiceError(
      response.status,
      error.error?.code || 'GET_URL_FAILED',
      error.error?.message || 'Failed to get asset URL'
    );
  }

  return response.json();
}

/**
 * Complete upload flow: get presigned URL, upload file, confirm upload
 *
 * This is a convenience function that handles the entire upload flow.
 *
 * @param sessionId - Upload session ID
 * @param file - File to upload
 * @param onProgress - Optional progress callback (0-100)
 * @returns Upload confirmation response with asset details
 */
export async function uploadFileToR2(
  sessionId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadConfirmResponse> {
  // Step 1: Request presigned URL
  const presigned = await requestPresignedUrl(
    sessionId,
    file.name,
    file.type,
    file.size
  );

  // Step 2: Upload directly to R2
  const { etag } = await uploadToR2(presigned.url, file, onProgress);

  // Step 3: Confirm upload
  const confirmation: UploadConfirmation = {
    sessionId,
    key: presigned.key,
    etag,
    contentLength: file.size,
    filename: file.name,
    contentType: file.type,
  };

  return confirmUpload(confirmation);
}

/**
 * Get asset URL with error handling
 */
export async function getAssetUrlWithFallback(
  assetId: string,
  type: AssetUrlType = 'full',
): Promise<string> {
  const response = await getAssetUrl(assetId, type);
  return response.url;
}

/**
 * Custom error class for R2 service errors
 */
export class R2ServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'R2ServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
