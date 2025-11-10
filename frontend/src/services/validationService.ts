// Client-side validation service for creative assets
import validationStandards from '../config/validation-standards.json'
import type { ValidationResult, ValidationStatus, FileType } from '../types/asset.types'

// Allowed MIME types per Constitution security requirements
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif'],
  video: ['video/mp4', 'video/webm'],
  html5: ['text/html', 'application/zip'],
} as const

// Magic bytes for file signature validation (first few bytes of file)
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'video/mp4': [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp at offset 4
    [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70],
  ],
  'video/webm': [[0x1a, 0x45, 0xdf, 0xa3]],
  'application/zip': [[0x50, 0x4b, 0x03, 0x04]], // PK (also used by HTML5 bundles)
}

// Constitution Principle III: 500MB upload limit
const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024 // 500MB

interface ValidationStandard {
  width: number
  height: number
  name: string
  maxSizeKB: number
  category: string
  aspectRatio?: string
  maxDurationSeconds?: number
}

/**
 * Validate MIME type against whitelist
 * Constitution Principle III: Security & Privacy First
 */
export function validateMimeType(file: File): ValidationResult {
  const mimeType = file.type.toLowerCase()

  // Check if MIME type is in allowed list
  const isAllowed = Object.values(ALLOWED_MIME_TYPES)
    .flat()
    .includes(mimeType as never)

  if (!isAllowed) {
    return {
      status: 'invalid',
      message: `File type "${file.type}" is not supported. Allowed: JPG, PNG, GIF, MP4, WEBM, HTML`,
      standard: 'MIME Type Validation',
    }
  }

  return {
    status: 'valid',
    message: `Valid file type: ${file.type}`,
    standard: 'MIME Type Validation',
  }
}

/**
 * Validate file size against 500MB limit
 * Constitution Principle III: Security & Privacy First
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    return {
      status: 'invalid',
      message: `File size ${sizeMB}MB exceeds maximum of 500MB`,
      standard: 'Upload Size Limit',
    }
  }

  const sizeKB = file.size / 1024
  return {
    status: 'valid',
    message: `File size: ${sizeKB.toFixed(2)}KB`,
    standard: 'Upload Size Limit',
  }
}

/**
 * Validate file signature (magic bytes) to prevent MIME type spoofing
 * Constitution Principle III: Security & Privacy First
 */
export async function validateFileSignature(file: File): Promise<ValidationResult> {
  const mimeType = file.type.toLowerCase()

  // Skip signature check for HTML files (text-based)
  if (mimeType === 'text/html') {
    return {
      status: 'valid',
      message: 'HTML file signature check skipped',
      standard: 'File Signature Validation',
    }
  }

  // Read first 32 bytes of file
  const blob = file.slice(0, 32)
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  const signatures = FILE_SIGNATURES[mimeType]
  if (!signatures) {
    return {
      status: 'warning',
      message: `No signature validation available for ${mimeType}`,
      standard: 'File Signature Validation',
    }
  }

  // Check if file starts with any of the valid signatures
  const isValid = signatures.some((signature) =>
    signature.every((byte, index) => bytes[index] === byte)
  )

  if (!isValid) {
    return {
      status: 'invalid',
      message: `File signature does not match ${mimeType}. Possible file extension spoofing.`,
      standard: 'File Signature Validation',
    }
  }

  return {
    status: 'valid',
    message: `Valid ${mimeType} file signature`,
    standard: 'File Signature Validation',
  }
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image dimensions'))
    }

    img.src = url
  })
}

/**
 * Get video dimensions and duration from file
 */
export async function getVideoDimensions(
  file: File
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      })
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video metadata'))
    }

    video.src = url
    video.load()
  })
}

/**
 * Validate dimensions against industry standards
 * Constitution Principle VI: Data-Driven Validation
 */
export function validateDimensions(
  width: number,
  height: number,
  fileSizeKB: number,
  fileType: FileType
): ValidationResult {
  // Collect all standards into a flat array
  const allStandards: ValidationStandard[] = []

  Object.values(validationStandards.standards).forEach((category) => {
    Object.values(category).forEach((platformStandards) => {
      allStandards.push(...(platformStandards as ValidationStandard[]))
    })
  })

  // Find exact dimension match
  const exactMatch = allStandards.find(
    (std) => std.width === width && std.height === height
  )

  if (exactMatch) {
    // Check if file size exceeds standard's max size
    if (fileSizeKB > exactMatch.maxSizeKB) {
      return {
        status: 'warning',
        message: `${width}x${height} matches "${exactMatch.name}" but file size ${fileSizeKB.toFixed(0)}KB exceeds recommended ${exactMatch.maxSizeKB}KB`,
        standard: exactMatch.name,
      }
    }

    return {
      status: 'valid',
      message: `${width}x${height} - Standard ${exactMatch.category.toUpperCase()}: ${exactMatch.name}`,
      standard: exactMatch.name,
    }
  }

  // No exact match - check if within fallback limits
  const fallback = validationStandards.fallback
  if (fallback.allowNonStandard && fileSizeKB <= fallback.maxFileSizeKB) {
    return {
      status: 'warning',
      message: `${width}x${height} - Non-standard dimensions (no exact match found)`,
      standard: 'Custom Dimensions',
    }
  }

  return {
    status: 'invalid',
    message: `${width}x${height} - Non-standard dimensions and file size exceeds limits`,
    standard: 'Invalid Dimensions',
  }
}

/**
 * Comprehensive validation for uploaded file
 * Runs all validation checks and returns aggregated result
 */
export async function validateFile(file: File): Promise<{
  isValid: boolean
  status: ValidationStatus
  results: ValidationResult[]
  dimensions?: { width: number; height: number; duration?: number }
}> {
  const results: ValidationResult[] = []

  // 1. MIME type validation
  const mimeResult = validateMimeType(file)
  results.push(mimeResult)
  if (mimeResult.status === 'invalid') {
    return {
      isValid: false,
      status: 'invalid',
      results,
    }
  }

  // 2. File size validation
  const sizeResult = validateFileSize(file)
  results.push(sizeResult)
  if (sizeResult.status === 'invalid') {
    return {
      isValid: false,
      status: 'invalid',
      results,
    }
  }

  // 3. File signature validation (magic bytes)
  try {
    const signatureResult = await validateFileSignature(file)
    results.push(signatureResult)
    if (signatureResult.status === 'invalid') {
      return {
        isValid: false,
        status: 'invalid',
        results,
      }
    }
  } catch (error) {
    results.push({
      status: 'warning',
      message: 'Could not validate file signature',
      standard: 'File Signature Validation',
    })
  }

  // 4. Dimension validation (for images and videos)
  const mimeType = file.type.toLowerCase()
  const fileSizeKB = file.size / 1024

  try {
    if (mimeType.startsWith('image/')) {
      const dimensions = await getImageDimensions(file)
      const dimensionResult = validateDimensions(
        dimensions.width,
        dimensions.height,
        fileSizeKB,
        'image'
      )
      results.push(dimensionResult)

      const finalStatus =
        dimensionResult.status === 'invalid'
          ? 'invalid'
          : dimensionResult.status === 'warning'
            ? 'warning'
            : 'valid'

      return {
        isValid: finalStatus !== 'invalid',
        status: finalStatus,
        results,
        dimensions,
      }
    }

    if (mimeType.startsWith('video/')) {
      const dimensions = await getVideoDimensions(file)
      const dimensionResult = validateDimensions(
        dimensions.width,
        dimensions.height,
        fileSizeKB,
        'video'
      )
      results.push(dimensionResult)

      const finalStatus =
        dimensionResult.status === 'invalid'
          ? 'invalid'
          : dimensionResult.status === 'warning'
            ? 'warning'
            : 'valid'

      return {
        isValid: finalStatus !== 'invalid',
        status: finalStatus,
        results,
        dimensions,
      }
    }
  } catch (error) {
    results.push({
      status: 'warning',
      message: `Could not extract dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      standard: 'Dimension Extraction',
    })
  }

  // For HTML5 files or if dimension extraction failed
  const hasInvalidResult = results.some((r) => r.status === 'invalid')
  const hasWarningResult = results.some((r) => r.status === 'warning')

  return {
    isValid: !hasInvalidResult,
    status: hasInvalidResult ? 'invalid' : hasWarningResult ? 'warning' : 'valid',
    results,
  }
}

/**
 * Get file type from MIME type
 */
export function getFileTypeFromMime(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'text/html' || mimeType === 'application/zip') return 'html5'
  return 'image' // fallback
}
