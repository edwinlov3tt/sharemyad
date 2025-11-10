// Creative Asset Types
export type FileType = 'image' | 'video' | 'html5'
export type ValidationStatus = 'pending' | 'valid' | 'warning' | 'invalid'

export interface CreativeAsset {
  id: string
  creativeSetId: string
  filenameOriginal: string
  filenameSanitized: string
  fileType: FileType
  mimeType: string
  fileSizeBytes: number
  width: number | null
  height: number | null
  durationSeconds: number | null
  storageUrl: string
  tempStorageUrl: string | null
  uploadTimestamp: string
  validationStatus: ValidationStatus
  validationNotes: string | null
  isHtml5Bundle: boolean
}

export interface CreativeSet {
  id: string
  uploadSessionId: string
  setName: string
  originalFolderPath: string | null
  assetCount: number
  createdAt: string
}

export interface Thumbnail {
  id: string
  creativeAssetId: string
  thumbnailUrl: string
  width: number
  height: number
  fileSizeBytes: number
  format: string
  generatedAt: string
}

export interface FolderStructureNode {
  id: string
  creativeSetId: string
  folderName: string
  parentFolderId: string | null
  depthLevel: number
  fullPath: string
  assetCount: number
}

export interface ValidationResult {
  status: ValidationStatus
  message: string
  standard?: string
}
