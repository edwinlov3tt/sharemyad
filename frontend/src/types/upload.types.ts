// Upload Session Types
export type SessionType = 'single' | 'multiple' | 'zip'
export type SessionStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'

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
  url: string // The signed URL for upload
  path: string // Storage path
  token: string // Upload token
}
