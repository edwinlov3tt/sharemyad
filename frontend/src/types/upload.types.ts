// Upload Session Types
export type SessionType = 'single' | 'multiple' | 'zip'
export type SessionStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'partial' | 'failed'
export type StorageProvider = 'r2'

export interface UploadSession {
  id: string
  userId: string
  sessionType: SessionType
  totalFiles: number
  totalSizeBytes: number
  uploadedSizeBytes?: number
  status: SessionStatus
  tempStoragePath?: string | null
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  targetStorage?: StorageProvider  // T035: Target storage for new uploads
}

export interface UploadProgress {
  sessionId: string
  uploadedBytes: number
  totalBytes: number
  percentComplete: number
  currentFile?: string
  filesCompleted: number
  totalFiles: number
}

export interface SignedUploadUrl {
  url: string   // The signed URL for upload
  path: string  // Storage path or R2 key
  token: string // Upload token (empty for R2)
  isR2?: boolean // T032: Flag to indicate R2 presigned URL
}

// =============================================================================
// R2 Storage Types (Feature 002-r2-storage-migration)
// =============================================================================

// Presigned URL response from R2 Worker (POST /api/presign/upload)
export interface PresignedUploadUrl {
  url: string           // Presigned PUT URL for direct R2 upload
  key: string           // R2 object key (e.g., "temp-uploads/session-123/file.jpg")
  expiresAt: string     // ISO 8601 expiration timestamp
  maxSizeBytes: number  // Maximum allowed upload size (500MB)
}

// Request body for presigned URL generation
export interface PresignedUrlRequest {
  sessionId: string
  filename: string
  contentType: string
  contentLength: number
}

// Upload confirmation request (POST /api/upload/confirm)
export interface UploadConfirmation {
  sessionId: string
  key: string           // R2 object key from presigned URL response
  etag: string          // ETag returned by R2 after successful upload
  contentLength: number // Actual uploaded file size
  filename: string      // Original filename
  contentType: string   // MIME type
}

// Upload confirmation response
export interface UploadConfirmResponse {
  asset: {
    id: string
    creativeSetId: string
    filenameOriginal: string
    filenameSanitized: string
    fileType: 'image' | 'video' | 'html5'
    mimeType: string
    fileSizeBytes: number
    storageProvider: 'r2'
    r2Key: string
    uploadTimestamp: string
    validationStatus: 'pending' | 'valid' | 'warning' | 'invalid'
  }
  session: {
    id: string
    status: SessionStatus
    uploadedFiles: number
    totalFiles: number
  }
}

// Asset URL request types
export type AssetUrlType = 'full' | 'thumbnail' | 'download'

export interface AssetUrlResponse {
  url: string
  expiresAt: string | null
  storageProvider: StorageProvider
  cached: boolean
}
