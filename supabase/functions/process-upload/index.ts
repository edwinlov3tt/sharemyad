// Process uploaded file: validate, extract metadata, move to R2
// User Story 3: Extended for zip extraction with creative sets
// Phase 8: Added malware scanning and security headers
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { moveToR2 } from '../shared/storage.ts'
import { getSupabaseClient, handleDatabaseError } from '../shared/database.ts'
import { extractZip, validateZip, detectHTML5Bundle, groupFilesByFolder } from './zipExtractor.ts'
import { detectCreativeSets } from './creativeSetDetector.ts'
import { buildFolderHierarchy, flattenHierarchy, storeFolderStructure } from './folderStructureManager.ts'
import { scanFile, scanZipArchive, logSecurityEvent } from './malwareScanner.ts'

interface ProcessUploadRequest {
  sessionId: string
  storagePath: string
  filename: string
  fileSize: number
  mimeType: string
}

/**
 * Process zip file: extract, detect sets, store folder structure
 * User Story 3 (T080): Zip handling with HTML5 bundle detection
 */
async function processZipFile(
  supabase: any,
  sessionId: string,
  storagePath: string,
  zipBuffer: ArrayBuffer
) {
  // Validate zip file
  const validation = await validateZip(zipBuffer)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid zip file')
  }

  // Extract zip contents
  const extraction = await extractZip(zipBuffer)

  // Detect creative sets from folder structure
  const creativeSets = detectCreativeSets(extraction.folders)

  // Detect HTML5 bundles
  const hasHTML5Bundle = detectHTML5Bundle(extraction.files)

  // Create creative set records in database
  const creativeSetMap = new Map<string, string>() // folder name → set ID

  if (creativeSets.length === 0) {
    // No sets detected: create single default set
    const { data: defaultSet, error } = await supabase
      .from('creative_sets')
      .insert({
        upload_session_id: sessionId,
        set_name: 'Default Set',
        original_folder_path: null,
        asset_count: 0
      })
      .select()
      .single()

    if (error) throw error
    creativeSetMap.set('__default__', defaultSet.id)
  } else {
    // Create sets from detection
    for (const set of creativeSets) {
      const { data: createdSet, error } = await supabase
        .from('creative_sets')
        .insert({
          upload_session_id: sessionId,
          set_name: set.name,
          original_folder_path: set.folders[0], // Use first folder as original path
          asset_count: 0
        })
        .select()
        .single()

      if (error) throw error

      // Map all folders in this set to the set ID
      for (const folder of set.folders) {
        creativeSetMap.set(folder, createdSet.id)
      }
    }
  }

  // Build and store folder structure
  const assetCountMap = new Map<string, number>()
  const filesByFolder = groupFilesByFolder(extraction.files)

  for (const [folder, files] of filesByFolder.entries()) {
    assetCountMap.set(folder, files.length)
  }

  const folderNodes = buildFolderHierarchy(extraction.folders, assetCountMap)
  const flattenedNodes = flattenHierarchy(folderNodes)

  // Store folder structure for each creative set
  for (const [setFolder, setId] of creativeSetMap.entries()) {
    if (setFolder !== '__default__') {
      const setFolders = folderNodes.filter(node =>
        node.fullPath === setFolder || node.fullPath.startsWith(setFolder + '/')
      )
      if (setFolders.length > 0) {
        await storeFolderStructure(supabase, setId, setFolders)
      }
    }
  }

  // Process each extracted file
  const processedAssets = []
  for (const file of extraction.files) {
    // Determine which set this file belongs to
    let creativeSetId = creativeSetMap.get('__default__') || ''

    for (const [folder, setId] of creativeSetMap.entries()) {
      if (folder !== '__default__' && file.folder.startsWith(folder)) {
        creativeSetId = setId
        break
      }
    }

    // Determine file type from MIME
    const mimeType = getMimeTypeFromFilename(file.filename)
    const fileType = mimeType.startsWith('image/')
      ? 'image'
      : mimeType.startsWith('video/')
      ? 'video'
      : 'html5'

    // Check if this file is index.html (HTML5 bundle marker)
    const isHTML5BundleMarker = file.filename.toLowerCase() === 'index.html'

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.filename)

    // Generate R2 key
    const r2Key = `assets/${sessionId}/${creativeSetId}/${file.path}`

    // Upload to R2 (simplified - actual implementation would use moveToR2)
    const r2Url = `https://r2.cloudflare.com/${r2Key}` // Placeholder

    // Create asset record
    const { data: asset, error: assetError } = await supabase
      .from('creative_assets')
      .insert({
        creative_set_id: creativeSetId,
        filename_original: file.filename,
        filename_sanitized: sanitizedFilename,
        file_type: fileType,
        mime_type: mimeType,
        file_size_bytes: file.size,
        width: null, // Would extract from metadata
        height: null,
        duration_seconds: null,
        storage_url: r2Url,
        temp_storage_url: null,
        validation_status: 'pending',
        validation_notes: null,
        is_html5_bundle: isHTML5BundleMarker || (fileType === 'html5' && hasHTML5Bundle)
      })
      .select()
      .single()

    if (assetError) {
      extraction.errors.push({ file: file.path, error: assetError.message })
      continue
    }

    processedAssets.push(asset)
  }

  return {
    assets: processedAssets,
    creativeSets: Array.from(creativeSetMap.keys()).filter(k => k !== '__default__'),
    warnings: extraction.warnings,
    errors: extraction.errors,
    totalFiles: extraction.totalFiles,
    processedFiles: processedAssets.length,
    hasHTML5Bundle
  }
}

/**
 * Get MIME type from filename extension
 */
function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'html': 'text/html',
    'htm': 'text/html'
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Security headers for all responses
 * Phase 8 (T122): HTTPS, HSTS, XSS protection
 */
const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none';",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: SECURITY_HEADERS,
    })
  }

  try {
    // Get authenticated Supabase client
    const supabase = getSupabaseClient(req)

    // Parse request body
    const body: ProcessUploadRequest = await req.json()
    const { sessionId, storagePath, filename, fileSize, mimeType } = body

    // Validate request
    if (!sessionId || !storagePath || !filename) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          code: 'INVALID_REQUEST',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get upload session
    const { data: session, error: sessionError } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return handleDatabaseError(sessionError || new Error('Session not found'))
    }

    // Create or get creative set (for User Story 1, there's only one set per session)
    let creativeSetId: string

    const { data: existingSets, error: setsError } = await supabase
      .from('creative_sets')
      .select('id')
      .eq('upload_session_id', sessionId)
      .limit(1)

    if (setsError) {
      return handleDatabaseError(setsError)
    }

    if (existingSets && existingSets.length > 0) {
      creativeSetId = existingSets[0].id
    } else {
      // Create new creative set
      const { data: newSet, error: newSetError } = await supabase
        .from('creative_sets')
        .insert({
          upload_session_id: sessionId,
          set_name: 'Default Set',
          asset_count: 0,
        })
        .select()
        .single()

      if (newSetError || !newSet) {
        return handleDatabaseError(newSetError || new Error('Failed to create creative set'))
      }

      creativeSetId = newSet.id
    }

    // Determine file type
    const fileType = mimeType.startsWith('image/')
      ? 'image'
      : mimeType.startsWith('video/')
        ? 'video'
        : 'html5'

    // Extract metadata (dimensions, duration) from file if image or video
    let width: number | null = null
    let height: number | null = null
    let durationSeconds: number | null = null

    // For User Story 1 MVP, we'll get dimensions from client-side validation
    // Server-side dimension extraction would require image processing libraries
    // This will be enhanced in future iterations

    // Phase 8 (T119-T120): Malware scanning before processing
    // Download file from Supabase Storage for scanning
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('temp-uploads')
      .download(storagePath)

    if (downloadError || !fileData) {
      logSecurityEvent('scan_error', {
        filename,
        uploadSessionId: sessionId,
        threat: 'Failed to download file for scanning',
      })
      return new Response(
        JSON.stringify({
          error: 'Failed to retrieve file for processing',
          code: 'DOWNLOAD_ERROR',
        }),
        {
          status: 500,
          headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json' },
        }
      )
    }

    const fileBuffer = await fileData.arrayBuffer()

    // Scan for malware (T119-T120)
    let scanResult
    if (mimeType === 'application/zip') {
      // Scan zip archives for password protection and malware (T121)
      scanResult = await scanZipArchive(fileBuffer, filename)
    } else {
      // Scan regular files
      scanResult = await scanFile(fileBuffer, filename, mimeType)
    }

    if (!scanResult.safe) {
      // Log security event
      logSecurityEvent('scan_blocked', {
        filename,
        uploadSessionId: sessionId,
        threat: scanResult.threat,
        severity: scanResult.severity,
      })

      // Delete the malicious file from storage
      await supabase.storage.from('temp-uploads').remove([storagePath])

      // Return error response with security headers
      return new Response(
        JSON.stringify({
          error: 'File blocked by security scan',
          code: 'MALWARE_DETECTED',
          threat: scanResult.threat,
          details: scanResult.details,
        }),
        {
          status: 403,
          headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json' },
        }
      )
    }

    // Log successful scan
    logSecurityEvent('scan_passed', {
      filename,
      uploadSessionId: sessionId,
    })

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(filename)

    // Generate R2 key
    const r2Key = `assets/${sessionId}/${creativeSetId}/${sanitizedFilename}`

    // Move file from Supabase Storage to R2
    const r2Url = await moveToR2(
      supabase,
      'temp-uploads',
      storagePath,
      r2Key,
      mimeType
    )

    // Validate dimensions against standards (basic check)
    let validationStatus: 'valid' | 'warning' | 'invalid' = 'pending'
    let validationNotes: string | null = null

    // For MVP, we'll mark as valid if file uploaded successfully
    // More comprehensive validation will be added in future iterations
    validationStatus = 'valid'
    validationNotes = 'File uploaded successfully'

    // Create creative asset record
    const { data: asset, error: assetError } = await supabase
      .from('creative_assets')
      .insert({
        creative_set_id: creativeSetId,
        filename_original: filename,
        filename_sanitized: sanitizedFilename,
        file_type: fileType,
        mime_type: mimeType,
        file_size_bytes: fileSize,
        width,
        height,
        duration_seconds: durationSeconds,
        storage_url: r2Url,
        temp_storage_url: null,
        validation_status: validationStatus,
        validation_notes: validationNotes,
        is_html5_bundle: mimeType === 'application/zip' || mimeType === 'text/html',
      })
      .select()
      .single()

    if (assetError || !asset) {
      return handleDatabaseError(assetError || new Error('Failed to create asset record'))
    }

    // Return success response with security headers
    return new Response(
      JSON.stringify({
        asset: {
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
        },
      }),
      {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Process upload error:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Processing failed',
        code: 'PROCESSING_ERROR',
      }),
      {
        status: 500,
        headers: {
          ...SECURITY_HEADERS,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})

/**
 * Sanitize filename for safe storage
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
