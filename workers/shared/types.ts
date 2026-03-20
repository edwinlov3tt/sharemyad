// Shared types for R2 Storage Migration Workers

// =============================================================================
// Environment bindings
// =============================================================================

export interface Env {
  R2_BUCKET: R2Bucket;
  DB: D1Database;
  RATE_LIMIT?: KVNamespace;
  URL_CACHE?: KVNamespace;
  ENVIRONMENT: string;
  MAX_FILE_SIZE?: string;
  ALLOWED_ORIGINS?: string;
  THUMBNAIL_URL_EXPIRY?: string;
  FULL_URL_EXPIRY?: string;
  DOWNLOAD_URL_EXPIRY?: string;
  BATCH_SIZE?: string;
  R2_BUCKET_NAME?: string;
  // R2 credentials for presigned URLs (stored as secrets)
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_ACCOUNT_ID?: string;
}

// =============================================================================
// Presigned URL types (POST /api/presign/upload)
// =============================================================================

export interface PresignedUrlRequest {
  sessionId: string;
  filename: string;
  contentType: string;
  contentLength: number;
}

export interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresAt: string;
  maxSizeBytes: number;
}

// =============================================================================
// Upload Confirmation types (POST /api/upload/confirm)
// =============================================================================

export interface UploadConfirmRequest {
  sessionId: string;
  key: string;
  etag: string;
  contentLength: number;
  filename: string;
  contentType: string;
}

export interface UploadConfirmResponse {
  asset: {
    id: string;
    creativeSetId: string;
    filenameOriginal: string;
    filenameSanitized: string;
    fileType: 'image' | 'video' | 'html5';
    mimeType: string;
    fileSizeBytes: number;
    storageProvider: 'r2';
    r2Key: string;
    uploadTimestamp: string;
    validationStatus: 'pending' | 'valid' | 'warning' | 'invalid';
  };
  session: {
    id: string;
    status: 'uploading' | 'processing' | 'completed' | 'partial';
    uploadedFiles: number;
    totalFiles: number;
  };
}

// =============================================================================
// Asset URL types (GET /api/assets/:assetId/url)
// =============================================================================

export type AssetUrlType = 'full' | 'thumbnail' | 'download';

export interface AssetUrlRequest {
  assetId: string;
  type: AssetUrlType;
  shareSlug?: string;
}

export interface AssetUrlResponse {
  url: string;
  expiresAt: string | null;
  storageProvider: 'r2' | 'supabase';
  cached: boolean;
}

// =============================================================================
// Migration types
// =============================================================================

export type MigrationStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface MigrationJob {
  id: string;
  status: MigrationStatus;
  totalAssets: number;
  migratedAssets: number;
  failedAssets: number;
  startedAt: string | null;
  completedAt: string | null;
  lastProcessedId: string | null;
  errorLog: MigrationError[];
  createdAt: string;
  updatedAt: string;
}

export interface MigrationError {
  assetId: string;
  error: string;
  timestamp: string;
}

export interface MigrationStartResponse {
  jobId: string;
  totalAssets: number;
  status: MigrationStatus;
}

export interface MigrationStatusResponse {
  job: MigrationJob;
  progress: number; // 0-100
  estimatedTimeRemaining: number | null; // seconds
}

// =============================================================================
// Database types (for Supabase queries)
// =============================================================================

export type StorageProvider = 'supabase' | 'r2';

export interface CreativeAssetRecord {
  id: string;
  creative_set_id: string;
  filename_original: string;
  filename_sanitized: string;
  file_type: 'image' | 'video' | 'html5';
  mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  storage_url: string;
  temp_storage_url: string | null;
  upload_timestamp: string;
  validation_status: 'pending' | 'valid' | 'warning' | 'invalid';
  validation_notes: string | null;
  is_html5_bundle: boolean;
  storage_provider: StorageProvider;
  r2_key: string | null;
  r2_etag: string | null;
  migrated_at: string | null;
}

export interface UploadSessionRecord {
  id: string;
  user_id: string | null;
  session_type: 'single' | 'multiple' | 'zip';
  total_files: number;
  total_size_bytes: number;
  uploaded_size_bytes: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'partial';
  temp_storage_path: string | null;
  is_anonymous: boolean;
  expires_at: string | null;
  target_storage: StorageProvider;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// =============================================================================
// Error types
// =============================================================================

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_SESSION'
  | 'FILE_TOO_LARGE'
  | 'INVALID_CONTENT_TYPE'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'OBJECT_NOT_FOUND'
  | 'ETAG_MISMATCH'
  | 'SIZE_MISMATCH'
  | 'INVALID_KEY'
  | 'INVALID_ASSET_ID'
  | 'INVALID_TYPE'
  | 'ACCESS_DENIED'
  | 'ASSET_NOT_FOUND';

// =============================================================================
// Constants
// =============================================================================

export const MAX_FILE_SIZE = 524288000; // 500MB in bytes
export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/zip',
] as const;

export type AllowedContentType = typeof ALLOWED_CONTENT_TYPES[number];

// Presigned URL expiry times (in seconds)
export const PRESIGNED_URL_EXPIRY = 3600; // 1 hour for upload
export const THUMBNAIL_URL_EXPIRY_DEFAULT = 86400; // 24 hours for thumbnails
export const FULL_URL_EXPIRY_DEFAULT = 3600; // 1 hour for full assets
export const DOWNLOAD_URL_EXPIRY_DEFAULT = 900; // 15 minutes for downloads
