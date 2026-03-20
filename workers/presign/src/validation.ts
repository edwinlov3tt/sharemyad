// Request validation for presigned URL generation
// Feature: 002-r2-storage-migration
// Task: T024 - Implement request validation

import type { PresignedUrlRequest, AllowedContentType } from '../../shared/types';
import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE } from '../../shared/types';
import {
  isValidUUID,
  isAllowedContentType,
  sanitizeFilename,
} from '../../shared/utils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: {
    sessionId: string;
    filename: string;
    sanitizedFilename: string;
    contentType: AllowedContentType;
    contentLength: number;
  };
}

/**
 * Validate presigned URL request body
 *
 * Checks:
 * - sessionId is a valid UUID
 * - filename is provided and reasonable length
 * - contentType is in allowed list
 * - contentLength is within limits (> 0, <= 500MB)
 *
 * @param body - Raw request body
 * @returns Validation result with sanitized data if valid
 */
export function validatePresignedUrlRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  // Check body exists and is object
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Request body must be a JSON object'],
    };
  }

  const data = body as Record<string, unknown>;

  // Validate sessionId
  if (!data.sessionId) {
    errors.push('sessionId is required');
  } else if (typeof data.sessionId !== 'string') {
    errors.push('sessionId must be a string');
  } else if (!isValidUUID(data.sessionId)) {
    errors.push('sessionId must be a valid UUID');
  }

  // Validate filename
  if (!data.filename) {
    errors.push('filename is required');
  } else if (typeof data.filename !== 'string') {
    errors.push('filename must be a string');
  } else if (data.filename.length > 255) {
    errors.push('filename must be 255 characters or less');
  } else if (data.filename.length === 0) {
    errors.push('filename cannot be empty');
  }

  // Validate contentType
  if (!data.contentType) {
    errors.push('contentType is required');
  } else if (typeof data.contentType !== 'string') {
    errors.push('contentType must be a string');
  } else if (!isAllowedContentType(data.contentType)) {
    errors.push(
      `contentType '${data.contentType}' is not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`
    );
  }

  // Validate contentLength
  if (data.contentLength === undefined || data.contentLength === null) {
    errors.push('contentLength is required');
  } else if (typeof data.contentLength !== 'number') {
    errors.push('contentLength must be a number');
  } else if (!Number.isInteger(data.contentLength)) {
    errors.push('contentLength must be an integer');
  } else if (data.contentLength <= 0) {
    errors.push('contentLength must be greater than 0');
  } else if (data.contentLength > MAX_FILE_SIZE) {
    errors.push(
      `contentLength exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (500MB)`
    );
  }

  // Return validation result
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(data.filename as string);

  return {
    isValid: true,
    errors: [],
    sanitizedData: {
      sessionId: data.sessionId as string,
      filename: data.filename as string,
      sanitizedFilename,
      contentType: data.contentType as AllowedContentType,
      contentLength: data.contentLength as number,
    },
  };
}

/**
 * Parse and validate JSON body from request
 *
 * @param request - Incoming request
 * @returns Parsed body or null if invalid JSON
 */
export async function parseRequestBody(
  request: Request
): Promise<{ body: unknown; error?: string }> {
  // Check content type
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return {
      body: null,
      error: 'Content-Type must be application/json',
    };
  }

  try {
    const body = await request.json();
    return { body };
  } catch {
    return {
      body: null,
      error: 'Invalid JSON in request body',
    };
  }
}
