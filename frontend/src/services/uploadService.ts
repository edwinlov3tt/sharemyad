// Upload service for handling file uploads with signed URLs
import { supabase } from './apiClient'
import type { UploadSession, SignedUploadUrl } from '../types/upload.types'
import type { CreativeAsset } from '../types/asset.types'

export interface UploadFileParams {
  file: File
  onProgress?: (progress: number) => void
}

export interface UploadResponse {
  session: UploadSession
  tempPath: string
}

// User Story 2: Multiple file upload types
export interface FileWithPath {
  name: string
  originalName: string
  isDuplicate: boolean
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

/**
 * Create upload session in database
 * Phase 8 (T123): Support for both authenticated and anonymous uploads
 */
export async function createUploadSession(
  sessionType: 'single' | 'multiple' | 'zip',
  totalFiles: number,
  totalSizeBytes: number
): Promise<UploadSession> {
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Build session data with anonymous support
  const sessionData: any = {
    session_type: sessionType,
    total_files: totalFiles,
    total_size_bytes: totalSizeBytes,
    status: 'pending',
    is_anonymous: !user,
  }

  // Only add user_id if user is authenticated
  if (user) {
    sessionData.user_id = user.id
  } else {
    // Anonymous session: set expiration to 7 days from now
    sessionData.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  const { data, error } = await supabase
    .from('upload_sessions')
    .insert(sessionData)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create upload session: ${error.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    sessionType: data.session_type,
    totalFiles: data.total_files,
    totalSizeBytes: data.total_size_bytes,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Get signed upload URL from Supabase Storage
 * Files are temporarily staged in Supabase Storage before moving to R2
 */
export async function getSignedUploadUrl(
  sessionId: string,
  filename: string
): Promise<SignedUploadUrl> {
  const sanitizedFilename = sanitizeFilename(filename)
  const path = `uploads/${sessionId}/${sanitizedFilename}`

  const { data, error } = await supabase.storage
    .from('temp-uploads')
    .createSignedUploadUrl(path)

  if (error) {
    throw new Error(`Failed to create signed upload URL: ${error.message}`)
  }

  return {
    url: data.signedUrl,
    path: data.path,
    token: data.token,
  }
}

/**
 * Upload file to Supabase Storage using signed URL
 * Supports progress tracking for user feedback
 */
export async function uploadFileToStorage(
  file: File,
  signedUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'))
    })

    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

/**
 * Trigger processing for uploaded file
 * MVP: Create asset record directly (no edge function)
 */
export async function triggerProcessing(
  sessionId: string,
  storagePath: string,
  filename: string,
  fileSize: number,
  mimeType: string
): Promise<CreativeAsset> {
  // Get or create creative set for this session
  const { data: existingSets } = await supabase
    .from('creative_sets')
    .select('id')
    .eq('upload_session_id', sessionId)
    .limit(1)

  let creativeSetId: string

  if (existingSets && existingSets.length > 0) {
    creativeSetId = existingSets[0].id
  } else {
    const { data: newSet, error: setError } = await supabase
      .from('creative_sets')
      .insert({
        upload_session_id: sessionId,
        set_name: 'default', // Must match constraint: ^[A-Za-z0-9\-_]+$
        asset_count: 0,
      })
      .select('*')
      .single()

    if (setError || !newSet) {
      throw new Error(`Failed to create creative set: ${setError?.message}`)
    }

    creativeSetId = newSet.id
  }

  // Determine file type
  const fileType = mimeType.startsWith('image/')
    ? 'image'
    : mimeType.startsWith('video/')
      ? 'video'
      : 'html5'

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(filename)

  // Get public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from('temp-uploads')
    .getPublicUrl(storagePath)

  const storageUrl = urlData.publicUrl

  // Create asset record
  const { data: asset, error: assetError } = await supabase
    .from('creative_assets')
    .insert({
      creative_set_id: creativeSetId,
      filename_original: filename,
      filename_sanitized: sanitizedFilename,
      file_type: fileType,
      mime_type: mimeType,
      file_size_bytes: fileSize,
      width: null,
      height: null,
      duration_seconds: null,
      storage_url: storageUrl,
      temp_storage_url: storageUrl,
      validation_status: 'valid',
      validation_notes: 'Uploaded successfully',
      is_html5_bundle: mimeType === 'application/zip',
    })
    .select('*')
    .single()

  if (assetError || !asset) {
    console.error('Asset creation failed:', {
      error: assetError,
      data: {
        creative_set_id: creativeSetId,
        filename_original: filename,
        filename_sanitized: sanitizedFilename,
        file_type: fileType,
        mime_type: mimeType,
        file_size_bytes: fileSize,
      },
    })
    throw new Error(`Failed to create asset: ${assetError?.message}`)
  }

  return {
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
    tempStorageUrl: asset.temp_storage_url,
    uploadTimestamp: asset.upload_timestamp,
    validationStatus: asset.validation_status,
    validationNotes: asset.validation_notes,
    isHtml5Bundle: asset.is_html5_bundle,
  }
}

/**
 * Complete single file upload flow
 * 1. Create session
 * 2. Get signed URL
 * 3. Upload to storage
 * 4. Trigger processing
 */
export async function uploadSingleFile({
  file,
  onProgress,
}: UploadFileParams): Promise<{
  session: UploadSession
  asset: CreativeAsset
}> {
  // Create upload session
  const session = await createUploadSession('single', 1, file.size)

  try {
    // Update session status to uploading
    await supabase
      .from('upload_sessions')
      .update({ status: 'uploading' })
      .eq('id', session.id)

    // Get signed URL
    const { url: signedUrl, path } = await getSignedUploadUrl(session.id, file.name)

    // Upload file with progress tracking
    await uploadFileToStorage(file, signedUrl, onProgress)

    // Update session status to processing
    await supabase
      .from('upload_sessions')
      .update({ status: 'processing' })
      .eq('id', session.id)

    // Trigger processing
    const asset = await triggerProcessing(
      session.id,
      path,
      file.name,
      file.size,
      file.type
    )

    // Update session status to completed
    await supabase
      .from('upload_sessions')
      .update({ status: 'completed' })
      .eq('id', session.id)

    return {
      session: { ...session, status: 'completed' },
      asset,
    }
  } catch (error) {
    // Update session status to failed
    await supabase
      .from('upload_sessions')
      .update({ status: 'failed' })
      .eq('id', session.id)

    throw error
  }
}

/**
 * Get upload session by ID
 */
export async function getUploadSession(sessionId: string): Promise<UploadSession> {
  const { data, error } = await supabase
    .from('upload_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    throw new Error(`Failed to get upload session: ${error.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
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
  const { data, error } = await supabase
    .from('creative_assets')
    .select(
      `
      *,
      creative_sets!inner (
        upload_session_id
      )
    `
    )
    .eq('creative_sets.upload_session_id', sessionId)

  if (error) {
    throw new Error(`Failed to get session assets: ${error.message}`)
  }

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
    tempStorageUrl: asset.temp_storage_url,
    uploadTimestamp: asset.upload_timestamp,
    validationStatus: asset.validation_status,
    validationNotes: asset.validation_notes,
    isHtml5Bundle: asset.is_html5_bundle,
  }))
}

/**
 * Sanitize filename for safe storage
 * Remove special characters, spaces, and limit length
 */
function sanitizeFilename(filename: string): string {
  const extension = filename.split('.').pop() || ''
  const nameWithoutExt = filename.slice(0, -(extension.length + 1))

  // Remove special characters, keep alphanumeric, hyphens, and underscores
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) // Limit length

  return `${sanitized}.${extension.toLowerCase()}`
}

/**
 * User Story 2 (T059): Upload multiple files concurrently
 * Supports up to 10 parallel uploads with aggregate progress tracking
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
  // Validation: Check file count
  if (files.length === 0) {
    throw new Error('At least one file is required')
  }

  if (files.length > 50) {
    throw new Error('Maximum 50 files allowed per upload')
  }

  // Validation: Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const maxSize = 500 * 1024 * 1024 // 500MB

  if (totalSize > maxSize) {
    throw new Error('Total upload size exceeds 500MB limit')
  }

  // Handle duplicate filenames
  const filesWithMetadata = files.map((file) => ({
    file,
    name: file.name,
    originalName: file.name,
    isDuplicate: false,
  }))

  const renamedFiles = handleDuplicateFilenames(
    filesWithMetadata.map((f) => ({
      name: f.name,
      originalName: f.originalName,
      isDuplicate: f.isDuplicate,
    }))
  )

  // Merge renamed metadata back
  const filesWithRenamedMetadata = filesWithMetadata.map((fileData, index) => ({
    ...fileData,
    ...renamedFiles[index],
  }))

  // Create upload session
  const session = await createUploadSession('multiple', files.length, totalSize)

  try {
    // Update session status to uploading
    await supabase
      .from('upload_sessions')
      .update({ status: 'uploading' })
      .eq('id', session.id)

    // Track upload progress
    const completedFiles: CreativeAsset[] = []
    const errors: Array<{ filename: string; error: Error }> = []
    const fileProgress = new Map<number, number>() // Track individual file progress

    // Initialize progress tracking
    files.forEach((_, index) => {
      fileProgress.set(index, 0)
    })

    // Helper to calculate aggregate progress
    const updateAggregateProgress = () => {
      const totalProgress =
        Array.from(fileProgress.values()).reduce((sum, progress) => sum + progress, 0) /
        files.length
      if (onProgress) {
        onProgress(Math.round(totalProgress))
      }
    }

    // Upload files in batches (max concurrent)
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = filesWithRenamedMetadata.slice(i, i + maxConcurrent)

      const batchPromises = batch.map(async (fileData, batchIndex) => {
        const fileIndex = i + batchIndex
        const { file, name, originalName } = fileData

        try {
          // Notify start
          if (onFileStart) {
            onFileStart(originalName)
          }

          // Validate file
          const { validateFile } = await import('./validationService')
          const validation = await validateFile(file)

          if (!validation.isValid) {
            const error = new Error(
              validation.results.find((r) => r.status === 'invalid')?.message ||
                'File validation failed'
            )
            throw error
          }

          // Get signed URL (use renamed filename)
          const { url: signedUrl, path } = await getSignedUploadUrl(session.id, name)

          // Upload file with progress tracking
          await uploadFileToStorage(file, signedUrl, (progress) => {
            fileProgress.set(fileIndex, progress)
            updateAggregateProgress()
          })

          // Trigger processing
          const asset = await triggerProcessing(
            session.id,
            path,
            name,
            file.size,
            file.type
          )

          // Mark file as 100% complete
          fileProgress.set(fileIndex, 100)
          updateAggregateProgress()

          // Notify completion
          if (onFileComplete) {
            onFileComplete(originalName, asset)
          }

          return asset
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))

          // Mark file as failed (0% progress)
          fileProgress.set(fileIndex, 0)

          // Notify error
          if (onFileError) {
            onFileError(originalName, err)
          }

          errors.push({ filename: originalName, error: err })

          if (!continueOnError) {
            throw err
          }

          return null
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)

      // Collect successful uploads
      batchResults.forEach((asset) => {
        if (asset) {
          completedFiles.push(asset)
        }
      })
    }

    // Update session status
    const finalStatus = errors.length === 0 ? 'completed' : 'partial'
    await supabase
      .from('upload_sessions')
      .update({ status: finalStatus })
      .eq('id', session.id)

    return {
      session: { ...session, status: finalStatus },
      assets: completedFiles,
      errors,
    }
  } catch (error) {
    // Update session status to failed
    await supabase
      .from('upload_sessions')
      .update({ status: 'failed' })
      .eq('id', session.id)

    throw error
  }
}

/**
 * User Story 2 (T057): Handle duplicate filenames
 * Detects duplicates and renames with numeric suffixes
 */
export function handleDuplicateFilenames(files: FileWithPath[]): FileWithPath[] {
  if (files.length === 0) {
    return []
  }

  const seen = new Map<string, number>() // Track occurrences (case-insensitive)
  const result: FileWithPath[] = []

  files.forEach((file) => {
    // Normalize filename to lowercase for duplicate detection
    const normalizedName = file.name.toLowerCase()

    // Check if we've seen this filename
    const count = seen.get(normalizedName) || 0

    if (count === 0) {
      // First occurrence - keep original name (but normalized)
      result.push({
        name: file.name.toLowerCase(),
        originalName: file.originalName,
        isDuplicate: false,
      })
      seen.set(normalizedName, 1)
    } else {
      // Duplicate - add numeric suffix
      const uniqueName = generateUniqueFilename(
        file.name.toLowerCase(),
        new Set(result.map((f) => f.name))
      )

      result.push({
        name: uniqueName,
        originalName: file.originalName,
        isDuplicate: true,
      })

      seen.set(normalizedName, count + 1)
    }
  })

  return result
}

/**
 * User Story 2 (T057): Generate unique filename with numeric suffix
 * Returns filename with -1, -2, -3, etc. until unique
 */
export function generateUniqueFilename(
  originalName: string,
  existingNames: Set<string>
): string {
  // If no conflict, return original
  if (!existingNames.has(originalName)) {
    return originalName
  }

  // Split filename and extension
  const lastDotIndex = originalName.lastIndexOf('.')
  let nameWithoutExt: string
  let extension: string

  if (lastDotIndex === -1) {
    // No extension
    nameWithoutExt = originalName
    extension = ''
  } else {
    nameWithoutExt = originalName.slice(0, lastDotIndex)
    extension = originalName.slice(lastDotIndex) // Includes the dot
  }

  // Find next available suffix
  let suffix = 1
  let uniqueName: string

  do {
    uniqueName = `${nameWithoutExt}-${suffix}${extension}`
    suffix++

    // Safety check: prevent infinite loop
    if (suffix > 1000) {
      // Add timestamp to ensure uniqueness
      uniqueName = `${nameWithoutExt}-${Date.now()}${extension}`
      break
    }
  } while (existingNames.has(uniqueName))

  // Truncate if filename exceeds filesystem limits (255 chars)
  if (uniqueName.length > 255) {
    const maxNameLength = 255 - extension.length - suffix.toString().length - 1 // -1 for hyphen
    const truncatedName = nameWithoutExt.slice(0, maxNameLength)
    uniqueName = `${truncatedName}-${suffix - 1}${extension}`
  }

  return uniqueName
}
