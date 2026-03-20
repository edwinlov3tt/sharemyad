// Upload service - Workers API + Cloudflare R2
import { fetchApi } from './apiClient'
import type { UploadSession, SignedUploadUrl } from '../types/upload.types'
import type { CreativeAsset } from '../types/asset.types'
import { storageConfig } from '../config/storage'
import { requestPresignedUrl, uploadToR2, confirmUpload, R2ServiceError } from './r2Service'

export class UploadError extends Error {
  readonly code: string
  readonly statusCode: number

  constructor(code: string, message: string, statusCode: number = 500) {
    super(message)
    this.name = 'UploadError'
    this.code = code
    this.statusCode = statusCode
  }

  getUserMessage(): string {
    switch (this.code) {
      case 'FILE_TOO_LARGE':
        return `File exceeds the ${storageConfig.maxFileSizeMB}MB size limit`
      case 'PRESIGN_FAILED':
        return 'Failed to prepare upload. Please try again.'
      case 'UPLOAD_FAILED':
        return 'Upload failed. Please check your connection and try again.'
      case 'CONFIRM_FAILED':
        return 'Failed to confirm upload. Please try again.'
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection.'
      case 'UPLOAD_ABORTED':
        return 'Upload was cancelled.'
      case 'INVALID_SESSION':
        return 'Upload session expired. Please start a new upload.'
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.'
      default:
        return this.message
    }
  }
}

export interface UploadFileParams {
  file: File
  onProgress?: (progress: number) => void
}

export interface UploadMultipleFilesParams {
  files: File[]
  onProgress?: (progress: number) => void
  onFileComplete?: (filename: string, asset: CreativeAsset) => void
  onFileError?: (filename: string, error: Error) => void
  onFileStart?: (filename: string) => void
  maxConcurrent?: number
  continueOnError?: boolean
}

export interface UploadMultipleFilesResult {
  session: UploadSession
  assets: CreativeAsset[]
  errors: Array<{ filename: string; error: Error }>
}

export interface FileWithPath {
  name: string
  originalName: string
  isDuplicate: boolean
}

interface R2UploadMetadata {
  key: string
  etag: string
  isR2: true
}

/**
 * Create upload session via Workers API (D1)
 */
export async function createUploadSession(
  sessionType: 'single' | 'multiple' | 'zip',
  totalFiles: number,
  totalSizeBytes: number
): Promise<UploadSession> {
  const data = await fetchApi<any>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ sessionType, totalFiles, totalSizeBytes }),
  })

  return {
    id: data.id,
    userId: '',
    sessionType: data.session_type,
    totalFiles: data.total_files,
    totalSizeBytes: data.total_size_bytes,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    targetStorage: 'r2',
  }
}

/**
 * Update session status via Workers API
 */
async function updateSessionStatus(sessionId: string, status: string): Promise<void> {
  await fetchApi(`/api/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

/**
 * Get signed upload URL from R2 presign worker
 */
export async function getSignedUploadUrl(
  sessionId: string,
  filename: string,
  file: File
): Promise<SignedUploadUrl> {
  const sanitizedFilename = sanitizeFilename(filename)

  try {
    const presigned = await requestPresignedUrl(
      sessionId,
      sanitizedFilename,
      file.type,
      file.size
    )

    return {
      url: presigned.url,
      path: presigned.key,
      token: '',
      isR2: true,
    }
  } catch (error) {
    if (error instanceof R2ServiceError) {
      throw new UploadError(error.code, `R2 presign failed: ${error.message}`, error.statusCode)
    }
    throw error
  }
}

/**
 * Upload file to R2 using presigned URL
 */
export async function uploadFileToStorage(
  file: File,
  signedUrl: string,
  onProgress?: (progress: number) => void,
): Promise<{ etag?: string; success: boolean }> {
  try {
    const result = await uploadToR2(signedUrl, file, onProgress)
    return { etag: result.etag, success: true }
  } catch (error) {
    if (error instanceof R2ServiceError) {
      throw new UploadError(error.code, `R2 upload failed: ${error.message}`, error.statusCode)
    }
    throw error
  }
}

/**
 * Trigger processing - confirm upload with R2 worker
 */
export async function triggerProcessing(
  sessionId: string,
  _storagePath: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  r2Metadata: R2UploadMetadata
): Promise<CreativeAsset> {
  try {
    const confirmResponse = await confirmUpload({
      sessionId,
      key: r2Metadata.key,
      etag: r2Metadata.etag,
      contentLength: fileSize,
      filename,
      contentType: mimeType,
    })

    return {
      id: confirmResponse.asset.id,
      creativeSetId: confirmResponse.asset.creativeSetId,
      filenameOriginal: confirmResponse.asset.filenameOriginal,
      filenameSanitized: confirmResponse.asset.filenameSanitized,
      fileType: confirmResponse.asset.fileType,
      mimeType: confirmResponse.asset.mimeType,
      fileSizeBytes: confirmResponse.asset.fileSizeBytes,
      width: null,
      height: null,
      durationSeconds: null,
      storageUrl: confirmResponse.asset.r2Key,
      tempStorageUrl: null,
      uploadTimestamp: confirmResponse.asset.uploadTimestamp,
      validationStatus: confirmResponse.asset.validationStatus,
      validationNotes: 'Uploaded to R2 successfully',
      isHtml5Bundle: mimeType === 'application/zip',
      storageProvider: 'r2',
      r2Key: confirmResponse.asset.r2Key,
      r2Etag: r2Metadata.etag,
      migratedAt: null,
    }
  } catch (error) {
    if (error instanceof R2ServiceError) {
      throw new UploadError(error.code, `R2 confirmation failed: ${error.message}`, error.statusCode)
    }
    throw error
  }
}

/**
 * Single file upload flow
 */
export async function uploadSingleFile({
  file,
  onProgress,
}: UploadFileParams): Promise<{
  session: UploadSession
  asset: CreativeAsset
}> {
  if (file.size > storageConfig.maxFileSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    throw new UploadError(
      'FILE_TOO_LARGE',
      `File size ${sizeMB}MB exceeds maximum of ${storageConfig.maxFileSizeMB}MB`,
      413
    )
  }

  const session = await createUploadSession('single', 1, file.size)

  try {
    await updateSessionStatus(session.id, 'uploading')

    const { url: signedUrl, path } = await getSignedUploadUrl(session.id, file.name, file)
    const uploadResult = await uploadFileToStorage(file, signedUrl, onProgress)

    await updateSessionStatus(session.id, 'processing')

    const r2Metadata: R2UploadMetadata = {
      key: path,
      etag: uploadResult.etag || '',
      isR2: true,
    }

    const asset = await triggerProcessing(
      session.id,
      path,
      file.name,
      file.size,
      file.type,
      r2Metadata
    )

    return {
      session: { ...session, status: 'completed' },
      asset,
    }
  } catch (error) {
    await updateSessionStatus(session.id, 'failed').catch(() => {})
    throw error
  }
}

/**
 * Get upload session by ID
 */
export async function getUploadSession(sessionId: string): Promise<UploadSession> {
  const data = await fetchApi<any>(`/api/sessions/${sessionId}`)

  return {
    id: data.id,
    userId: '',
    sessionType: data.session_type,
    totalFiles: data.total_files,
    totalSizeBytes: data.total_size_bytes,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Get creative assets for a session
 */
export async function getSessionAssets(sessionId: string): Promise<CreativeAsset[]> {
  const data = await fetchApi<any[]>(`/api/sessions/${sessionId}/assets`)

  return data.map((asset) => ({
    id: asset.id,
    creativeSetId: asset.creative_set_id,
    filenameOriginal: asset.filename_original,
    filenameSanitized: asset.filename_sanitized,
    fileType: asset.file_type,
    mimeType: asset.mime_type,
    fileSizeBytes: asset.file_size_bytes,
    width: asset.width,
    height: asset.height,
    durationSeconds: asset.duration_seconds,
    storageUrl: asset.storage_url,
    tempStorageUrl: null,
    uploadTimestamp: asset.upload_timestamp,
    validationStatus: asset.validation_status,
    validationNotes: asset.validation_notes,
    isHtml5Bundle: !!asset.is_html5_bundle,
    storageProvider: 'r2' as const,
    r2Key: asset.r2_key || null,
    r2Etag: asset.r2_etag || null,
    migratedAt: null,
  }))
}

function sanitizeFilename(filename: string): string {
  const extension = filename.split('.').pop() || ''
  const nameWithoutExt = filename.slice(0, -(extension.length + 1))

  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)

  return `${sanitized}.${extension.toLowerCase()}`
}

/**
 * Multiple file upload with concurrent uploads
 */
export async function uploadMultipleFiles({
  files,
  onProgress,
  onFileComplete,
  onFileError,
  onFileStart,
  maxConcurrent = 10,
  continueOnError = true,
}: UploadMultipleFilesParams): Promise<UploadMultipleFilesResult> {
  if (files.length === 0) {
    throw new Error('At least one file is required')
  }
  if (files.length > 50) {
    throw new Error('Maximum 50 files allowed per upload')
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > 500 * 1024 * 1024) {
    throw new Error('Total upload size exceeds 500MB limit')
  }

  const renamedFiles = handleDuplicateFilenames(
    files.map((f) => ({ name: f.name, originalName: f.name, isDuplicate: false }))
  )

  const session = await createUploadSession('multiple', files.length, totalSize)

  try {
    await updateSessionStatus(session.id, 'uploading')

    const completedFiles: CreativeAsset[] = []
    const errors: Array<{ filename: string; error: Error }> = []
    const fileProgress = new Map<number, number>()
    files.forEach((_, i) => fileProgress.set(i, 0))

    const updateAggregateProgress = () => {
      const totalProgress =
        Array.from(fileProgress.values()).reduce((sum, p) => sum + p, 0) / files.length
      onProgress?.(Math.round(totalProgress))
    }

    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent)

      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex
        const renamedName = renamedFiles[fileIndex].name
        const originalName = renamedFiles[fileIndex].originalName

        try {
          onFileStart?.(originalName)

          if (file.size > storageConfig.maxFileSizeBytes) {
            throw new UploadError('FILE_TOO_LARGE', `File too large`, 413)
          }

          const { validateFile } = await import('./validationService')
          const validation = await validateFile(file)
          if (!validation.isValid) {
            throw new Error(
              validation.results.find((r) => r.status === 'invalid')?.message || 'Validation failed'
            )
          }

          const { url: signedUrl, path } = await getSignedUploadUrl(session.id, renamedName, file)
          const uploadResult = await uploadFileToStorage(file, signedUrl, (progress) => {
            fileProgress.set(fileIndex, progress)
            updateAggregateProgress()
          })

          const r2Metadata: R2UploadMetadata = {
            key: path,
            etag: uploadResult.etag || '',
            isR2: true,
          }

          const asset = await triggerProcessing(
            session.id, path, renamedName, file.size, file.type, r2Metadata
          )

          fileProgress.set(fileIndex, 100)
          updateAggregateProgress()
          onFileComplete?.(originalName, asset)
          return asset
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          fileProgress.set(fileIndex, 0)
          onFileError?.(originalName, err)
          errors.push({ filename: originalName, error: err })
          if (!continueOnError) throw err
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach((asset) => { if (asset) completedFiles.push(asset) })
    }

    const finalStatus = errors.length === 0 ? 'completed' : 'partial'
    await updateSessionStatus(session.id, finalStatus)

    return {
      session: { ...session, status: finalStatus as any },
      assets: completedFiles,
      errors,
    }
  } catch (error) {
    await updateSessionStatus(session.id, 'failed').catch(() => {})
    throw error
  }
}

export function handleDuplicateFilenames(files: FileWithPath[]): FileWithPath[] {
  if (files.length === 0) return []

  const seen = new Map<string, number>()
  const result: FileWithPath[] = []

  files.forEach((file) => {
    const normalizedName = file.name.toLowerCase()
    const count = seen.get(normalizedName) || 0

    if (count === 0) {
      result.push({ name: file.name.toLowerCase(), originalName: file.originalName, isDuplicate: false })
      seen.set(normalizedName, 1)
    } else {
      const uniqueName = generateUniqueFilename(
        file.name.toLowerCase(),
        new Set(result.map((f) => f.name))
      )
      result.push({ name: uniqueName, originalName: file.originalName, isDuplicate: true })
      seen.set(normalizedName, count + 1)
    }
  })

  return result
}

export function generateUniqueFilename(originalName: string, existingNames: Set<string>): string {
  if (!existingNames.has(originalName)) return originalName

  const lastDotIndex = originalName.lastIndexOf('.')
  const nameWithoutExt = lastDotIndex === -1 ? originalName : originalName.slice(0, lastDotIndex)
  const extension = lastDotIndex === -1 ? '' : originalName.slice(lastDotIndex)

  let suffix = 1
  let uniqueName: string

  do {
    uniqueName = `${nameWithoutExt}-${suffix}${extension}`
    suffix++
    if (suffix > 1000) {
      uniqueName = `${nameWithoutExt}-${Date.now()}${extension}`
      break
    }
  } while (existingNames.has(uniqueName))

  if (uniqueName.length > 255) {
    const maxNameLength = 255 - extension.length - suffix.toString().length - 1
    uniqueName = `${nameWithoutExt.slice(0, maxNameLength)}-${suffix - 1}${extension}`
  }

  return uniqueName
}
