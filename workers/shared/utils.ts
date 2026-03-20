// Shared utility functions for R2 Storage Migration Workers

import { ALLOWED_CONTENT_TYPES, AllowedContentType, MAX_FILE_SIZE } from './types';

// =============================================================================
// Filename Sanitization
// =============================================================================

/**
 * Sanitize filename for safe storage
 * - Removes special characters
 * - Converts to lowercase
 * - Limits length to 255 characters
 * - Preserves extension
 */
export function sanitizeFilename(filename: string): string {
  // Split filename and extension
  const lastDotIndex = filename.lastIndexOf('.');
  let name: string;
  let extension: string;

  if (lastDotIndex === -1 || lastDotIndex === 0) {
    name = filename;
    extension = '';
  } else {
    name = filename.slice(0, lastDotIndex);
    extension = filename.slice(lastDotIndex + 1).toLowerCase();
  }

  // Sanitize name: keep alphanumeric, hyphens, underscores
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100); // Limit name part to 100 chars

  // Return with extension
  if (extension) {
    return `${sanitized || 'file'}.${extension}`;
  }
  return sanitized || 'file';
}

// =============================================================================
// Content Type Validation
// =============================================================================

/**
 * Validate content type against allowed list
 */
export function validateContentType(contentType: string): {
  isValid: boolean;
  error?: string;
} {
  if (!contentType) {
    return { isValid: false, error: 'Content type is required' };
  }

  if (!isAllowedContentType(contentType)) {
    return {
      isValid: false,
      error: `Content type '${contentType}' is not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Type guard for allowed content types
 */
export function isAllowedContentType(type: string): type is AllowedContentType {
  return ALLOWED_CONTENT_TYPES.includes(type as AllowedContentType);
}

// =============================================================================
// Content Length Validation
// =============================================================================

/**
 * Validate content length against 500MB limit
 */
export function validateContentLength(contentLength: number): {
  isValid: boolean;
  error?: string;
  details?: { provided: number; maximum: number };
} {
  if (typeof contentLength !== 'number' || isNaN(contentLength)) {
    return { isValid: false, error: 'Content length must be a valid number' };
  }

  if (contentLength <= 0) {
    return { isValid: false, error: 'Content length must be greater than 0' };
  }

  if (contentLength > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${formatBytes(MAX_FILE_SIZE)} limit`,
      details: { provided: contentLength, maximum: MAX_FILE_SIZE },
    };
  }

  return { isValid: true };
}

// =============================================================================
// Session ID Validation
// =============================================================================

/**
 * Validate UUID format for session IDs
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function validateSessionId(sessionId: string): {
  isValid: boolean;
  error?: string;
} {
  if (!sessionId) {
    return { isValid: false, error: 'Session ID is required' };
  }

  if (!isValidUUID(sessionId)) {
    return { isValid: false, error: 'Session ID must be a valid UUID' };
  }

  return { isValid: true };
}

// =============================================================================
// Request Body Validation
// =============================================================================

/**
 * Validate presigned URL request body
 */
export function validatePresignedUrlRequest(body: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body is required'] };
  }

  const data = body as Record<string, unknown>;

  // Validate sessionId
  if (!data.sessionId) {
    errors.push('sessionId is required');
  } else if (!isValidUUID(data.sessionId as string)) {
    errors.push('sessionId must be a valid UUID');
  }

  // Validate filename
  if (!data.filename) {
    errors.push('filename is required');
  } else if (typeof data.filename !== 'string' || data.filename.length > 255) {
    errors.push('filename must be a string with max 255 characters');
  }

  // Validate contentType
  if (!data.contentType) {
    errors.push('contentType is required');
  } else if (!isAllowedContentType(data.contentType as string)) {
    errors.push(`contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`);
  }

  // Validate contentLength
  if (typeof data.contentLength !== 'number') {
    errors.push('contentLength is required and must be a number');
  } else if (data.contentLength <= 0) {
    errors.push('contentLength must be greater than 0');
  } else if (data.contentLength > MAX_FILE_SIZE) {
    errors.push(`contentLength exceeds ${formatBytes(MAX_FILE_SIZE)} limit`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// R2 Key Generation
// =============================================================================

/**
 * Generate R2 object key for temporary uploads
 */
export function generateTempUploadKey(sessionId: string, filename: string): string {
  const sanitized = sanitizeFilename(filename);
  return `temp-uploads/${sessionId}/${sanitized}`;
}

/**
 * Generate R2 object key for permanent asset storage
 */
export function generateAssetKey(sessionId: string, filename: string): string {
  const sanitized = sanitizeFilename(filename);
  return `assets/${sessionId}/${sanitized}`;
}

/**
 * Convert temp key to asset key
 */
export function tempKeyToAssetKey(tempKey: string): string {
  return tempKey.replace('temp-uploads/', 'assets/');
}

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate expiry date from seconds
 */
export function getExpiryDate(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

/**
 * Format expiry as ISO string
 */
export function getExpiryISOString(seconds: number): string {
  return getExpiryDate(seconds).toISOString();
}
