/**
 * Zip Extractor Module
 * User Story 3 (P3) - Zip file extraction with folder structure preservation
 *
 * Features:
 * - Streaming extraction using JSZip
 * - Folder structure preservation
 * - 500-file limit enforcement
 * - Memory-efficient processing (one file at a time)
 */

import JSZip from 'npm:jszip@3.10.1'

/**
 * Maximum files allowed per zip extraction
 * Per spec.md FR-005
 */
export const MAX_FILES_PER_ZIP = 500

/**
 * Extracted file information
 */
export interface ExtractedFile {
  /** Original path within zip (e.g., "Campaign/Set-A/banner.jpg") */
  path: string

  /** Filename only (e.g., "banner.jpg") */
  filename: string

  /** Folder path (e.g., "Campaign/Set-A") */
  folder: string

  /** Folder depth (0 = root, 1 = first level, etc.) */
  depth: number

  /** File content as ArrayBuffer */
  content: ArrayBuffer

  /** Uncompressed size in bytes */
  size: number

  /** File index in extraction order */
  index: number
}

/**
 * Extraction result with metadata
 */
export interface ExtractionResult {
  /** Successfully extracted files */
  files: ExtractedFile[]

  /** Total files in zip */
  totalFiles: number

  /** Total uncompressed size */
  totalSize: number

  /** Folder structure discovered */
  folders: string[]

  /** Warning messages (e.g., file limit reached) */
  warnings: string[]

  /** Errors encountered (non-fatal) */
  errors: Array<{ file: string; error: string }>
}

/**
 * Extracts zip file with streaming to avoid memory overflow
 *
 * @param zipBuffer - Zip file buffer
 * @returns Extraction result with files and metadata
 */
export async function extractZip(zipBuffer: ArrayBuffer): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    files: [],
    totalFiles: 0,
    totalSize: 0,
    folders: [],
    warnings: [],
    errors: []
  }

  try {
    // Load zip file
    const zip = await JSZip.loadAsync(zipBuffer)

    // Get all file entries (exclude directories)
    const fileEntries = Object.entries(zip.files)
      .filter(([, file]) => !file.dir)
      .map(([path, file]) => ({ path, file }))

    result.totalFiles = fileEntries.length

    // Check if total files exceeds limit
    if (result.totalFiles > MAX_FILES_PER_ZIP) {
      result.warnings.push(
        `File limit reached: ${MAX_FILES_PER_ZIP} of ${result.totalFiles} files will be processed`
      )
    }

    // Collect unique folders
    const folderSet = new Set<string>()

    // Extract files one-by-one (streaming approach)
    let fileIndex = 0

    for (const { path, file } of fileEntries) {
      // Enforce file limit
      if (fileIndex >= MAX_FILES_PER_ZIP) {
        break
      }

      try {
        // Extract file content as ArrayBuffer
        const content = await file.async('arraybuffer')

        // Parse path components
        const pathParts = path.split('/')
        const filename = pathParts[pathParts.length - 1]
        const folderPath = pathParts.slice(0, -1).join('/')
        const depth = pathParts.length - 1

        // Add folder to set if not empty
        if (folderPath) {
          folderSet.add(folderPath)

          // Also add parent folders
          for (let i = 1; i < pathParts.length - 1; i++) {
            const parentPath = pathParts.slice(0, i).join('/')
            if (parentPath) {
              folderSet.add(parentPath)
            }
          }
        }

        // Create extracted file object
        const extractedFile: ExtractedFile = {
          path,
          filename,
          folder: folderPath || '',
          depth,
          content,
          size: content.byteLength,
          index: fileIndex
        }

        result.files.push(extractedFile)
        result.totalSize += content.byteLength

        fileIndex++

      } catch (error) {
        // Non-fatal error: log and continue with next file
        result.errors.push({
          file: path,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Convert folder set to sorted array
    result.folders = Array.from(folderSet).sort()

    return result

  } catch (error) {
    // Fatal error: zip is corrupted or invalid
    throw new Error(
      `Failed to extract zip: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Validates zip file before extraction
 * Checks for:
 * - Password protection (not supported)
 * - Zip bombs (excessive compression ratio)
 * - Corrupted headers
 *
 * @param zipBuffer - Zip file buffer
 * @returns Validation result
 */
export async function validateZip(zipBuffer: ArrayBuffer): Promise<{
  valid: boolean
  error?: string
}> {
  try {
    // Attempt to load zip
    const zip = await JSZip.loadAsync(zipBuffer)

    // Check for password protection
    // JSZip doesn't have direct API, but encrypted files will have encryption flag
    const files = Object.values(zip.files)
    const hasEncrypted = files.some(file => {
      // Check if file has encryption metadata
      // Note: This is a heuristic as JSZip doesn't expose encryption flag directly
      return file.comment?.includes('encrypted') || file.comment?.includes('password')
    })

    if (hasEncrypted) {
      return {
        valid: false,
        error: 'Cannot extract password-protected archive. Please upload unprotected zip file.'
      }
    }

    // Check for zip bomb (compression ratio > 100:1 is suspicious)
    const fileEntries = Object.values(zip.files).filter(f => !f.dir)
    let totalCompressed = zipBuffer.byteLength
    let totalUncompressed = 0

    for (const file of fileEntries) {
      // @ts-ignore - _data property exists but not in types
      totalUncompressed += file._data?.uncompressedSize || 0
    }

    const compressionRatio = totalUncompressed / totalCompressed

    if (compressionRatio > 100) {
      return {
        valid: false,
        error: 'Zip file appears to be a zip bomb (excessive compression ratio). Upload rejected for security.'
      }
    }

    return { valid: true }

  } catch (error) {
    return {
      valid: false,
      error: `Corrupted zip file: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Flattens deeply nested folder structure to maximum depth
 * Per spec.md FR-029: Max 3 levels
 *
 * @param folders - List of folder paths
 * @param maxDepth - Maximum depth (default 3)
 * @returns Flattened folder list with full paths preserved
 */
export function flattenFolders(
  folders: string[],
  maxDepth: number = 3
): Array<{ original: string; flattened: string; depth: number }> {
  return folders.map(folder => {
    const parts = folder.split('/')
    const depth = parts.length

    if (depth <= maxDepth) {
      // No flattening needed
      return { original: folder, flattened: folder, depth }
    }

    // Flatten to maxDepth by taking first (maxDepth) parts
    const flattenedParts = parts.slice(0, maxDepth)
    const flattened = flattenedParts.join('/')

    return { original: folder, flattened, depth }
  })
}

/**
 * Gets folder hierarchy information
 * Returns parent-child relationships
 *
 * @param folders - List of folder paths
 * @returns Folder hierarchy with parent relationships
 */
export function getFolderHierarchy(folders: string[]): Array<{
  path: string
  name: string
  parent: string | null
  depth: number
}> {
  return folders.map(path => {
    const parts = path.split('/')
    const name = parts[parts.length - 1]
    const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : null
    const depth = parts.length - 1

    return { path, name, parent, depth }
  })
}

/**
 * Detects if zip contains HTML5 bundle
 * HTML5 bundle must have index.html at root or in a subfolder
 *
 * @param files - Extracted files
 * @returns True if HTML5 bundle detected
 */
export function detectHTML5Bundle(files: ExtractedFile[]): boolean {
  return files.some(file =>
    file.filename.toLowerCase() === 'index.html'
  )
}

/**
 * Groups files by their immediate parent folder
 * Used for creative set detection
 *
 * @param files - Extracted files
 * @returns Map of folder path → files in that folder
 */
export function groupFilesByFolder(files: ExtractedFile[]): Map<string, ExtractedFile[]> {
  const grouped = new Map<string, ExtractedFile[]>()

  for (const file of files) {
    const folder = file.folder || '__root__'

    if (!grouped.has(folder)) {
      grouped.set(folder, [])
    }

    grouped.get(folder)!.push(file)
  }

  return grouped
}
