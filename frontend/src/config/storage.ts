// Storage configuration - Cloudflare R2 only

export interface StorageConfig {
  presignWorkerUrl: string
  maxFileSizeBytes: number
  maxFileSizeMB: number
  uploadUrlExpiry: number
  thumbnailUrlExpiry: number
  fullUrlExpiry: number
  downloadUrlExpiry: number
}

const devConfig: StorageConfig = {
  presignWorkerUrl: 'https://sharemyad-presign.edwin-6f1.workers.dev',
  maxFileSizeBytes: 524288000, // 500MB
  maxFileSizeMB: 500,
  uploadUrlExpiry: 3600,
  thumbnailUrlExpiry: 86400,
  fullUrlExpiry: 3600,
  downloadUrlExpiry: 900,
}

const prodConfig: StorageConfig = {
  presignWorkerUrl: 'https://sharemyad-presign.edwin-6f1.workers.dev',
  maxFileSizeBytes: 524288000,
  maxFileSizeMB: 500,
  uploadUrlExpiry: 3600,
  thumbnailUrlExpiry: 86400,
  fullUrlExpiry: 3600,
  downloadUrlExpiry: 900,
}

const isProduction = import.meta.env.PROD
export const storageConfig: StorageConfig = isProduction ? prodConfig : devConfig

export function getMaxFileSizeForDisplay(): string {
  return `${storageConfig.maxFileSizeMB}MB`
}

export function isFileSizeAllowed(sizeBytes: number): boolean {
  return sizeBytes <= storageConfig.maxFileSizeBytes
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/zip',
] as const

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number]

export function isAllowedContentType(type: string): type is AllowedContentType {
  return ALLOWED_CONTENT_TYPES.includes(type as AllowedContentType)
}
