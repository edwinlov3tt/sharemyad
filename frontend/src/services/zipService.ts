// Client-side zip extraction using fflate
import { unzipSync } from 'fflate'

export interface ExtractedFile {
  /** Original path inside the zip (e.g., "Banners/A/file.gif") */
  path: string
  /** Just the filename (e.g., "file.gif") */
  name: string
  /** The folder this file belongs to (e.g., "A") — used for creative set detection */
  folder: string | null
  /** File data as a Blob/File */
  file: File
}

export interface ZipExtractionResult {
  files: ExtractedFile[]
  /** Detected creative set folders (e.g., ["A", "B"]) */
  creativeSets: string[]
  /** Total size of all extracted files */
  totalSize: number
}

/** File extensions we extract from zips */
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'html', 'htm',
])

/** MIME type mapping */
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  html: 'text/html',
  htm: 'text/html',
}

/**
 * Extract files from a zip archive in the browser
 * Filters out macOS metadata (__MACOSX), .DS_Store, and non-asset files
 * Detects creative set folders (A/B/C variants)
 */
export async function extractZip(zipFile: File): Promise<ZipExtractionResult> {
  const arrayBuffer = await zipFile.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)

  const unzipped = unzipSync(uint8)
  const files: ExtractedFile[] = []
  const folderSet = new Set<string>()
  let totalSize = 0

  for (const [path, data] of Object.entries(unzipped)) {
    // Skip directories
    if (path.endsWith('/')) continue

    // Skip macOS metadata
    if (path.includes('__MACOSX')) continue

    // Skip .DS_Store and hidden files
    const filename = path.split('/').pop() || ''
    if (filename.startsWith('.') || filename === '') continue

    // Check extension
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.has(ext)) continue

    // Detect folder structure for creative sets
    // Expected structure: ZipName/SetFolder/file.ext or SetFolder/file.ext
    const parts = path.split('/').filter(Boolean)
    let folder: string | null = null

    if (parts.length >= 3) {
      // e.g., Banners/A/file.gif → folder is "A"
      folder = parts[parts.length - 2]
    } else if (parts.length === 2) {
      // e.g., A/file.gif → folder is "A"
      folder = parts[0]
    }

    if (folder) {
      folderSet.add(folder)
    }

    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
    const blob = new Blob([data.buffer as ArrayBuffer])
    const file = new File([blob], filename, { type: mimeType })

    files.push({ path, name: filename, folder, file })
    totalSize += file.size
  }

  // Sort: group by folder, then by name
  files.sort((a, b) => {
    if (a.folder !== b.folder) return (a.folder || '').localeCompare(b.folder || '')
    return a.name.localeCompare(b.name)
  })

  return {
    files,
    creativeSets: Array.from(folderSet).sort(),
    totalSize,
  }
}

/**
 * Check if a file is a zip archive
 */
export function isZipFile(file: File): boolean {
  return (
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    file.name.toLowerCase().endsWith('.zip')
  )
}
