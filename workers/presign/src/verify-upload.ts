// Upload verification via R2 HEAD request
// Feature: 002-r2-storage-migration
// Task: T027 - Implement R2 HEAD request verification

import type { Env } from '../../shared/types';

export interface UploadVerification {
  exists: boolean;
  etag: string | null;
  size: number | null;
  contentType: string | null;
}

export interface VerificationResult {
  valid: boolean;
  error?: {
    code: 'OBJECT_NOT_FOUND' | 'ETAG_MISMATCH' | 'SIZE_MISMATCH';
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Verify uploaded object exists in R2 with expected metadata
 *
 * Uses R2 HEAD request to check:
 * - Object exists at key
 * - ETag matches (integrity)
 * - Size matches (completeness)
 *
 * @param env - Worker environment with R2 binding
 * @param key - R2 object key to verify
 * @param expectedEtag - Expected ETag from upload response
 * @param expectedSize - Expected file size in bytes
 * @returns Verification result
 */
export async function verifyUpload(
  env: Env,
  key: string,
  expectedEtag: string,
  expectedSize: number
): Promise<VerificationResult> {
  // Get object metadata from R2
  const object = await env.R2_BUCKET.head(key);

  // Check if object exists
  if (!object) {
    return {
      valid: false,
      error: {
        code: 'OBJECT_NOT_FOUND',
        message: `Object not found at key: ${key}`,
      },
    };
  }

  // Normalize ETag (R2 may or may not include quotes)
  // Skip ETag check if client couldn't read it (CORS blocks ETag header)
  if (expectedEtag && expectedEtag !== 'upload-ok') {
    const actualEtag = normalizeEtag(object.etag);
    const normalizedExpected = normalizeEtag(expectedEtag);

    if (actualEtag !== normalizedExpected) {
      return {
        valid: false,
        error: {
          code: 'ETAG_MISMATCH',
          message: 'File integrity check failed',
          details: {
            expected: expectedEtag,
            received: object.etag,
          },
        },
      };
    }
  }

  // Check size matches
  if (object.size !== expectedSize) {
    return {
      valid: false,
      error: {
        code: 'SIZE_MISMATCH',
        message: 'File size does not match',
        details: {
          expected: expectedSize,
          received: object.size,
        },
      },
    };
  }

  return { valid: true };
}

/**
 * Get object metadata from R2
 */
export async function getObjectMetadata(
  env: Env,
  key: string
): Promise<UploadVerification> {
  const object = await env.R2_BUCKET.head(key);

  if (!object) {
    return {
      exists: false,
      etag: null,
      size: null,
      contentType: null,
    };
  }

  return {
    exists: true,
    etag: object.etag,
    size: object.size,
    contentType: object.httpMetadata?.contentType || null,
  };
}

/**
 * Normalize ETag by removing surrounding quotes
 */
function normalizeEtag(etag: string): string {
  return etag.replace(/^"(.*)"$/, '$1');
}

/**
 * Validate key belongs to session (prevent path traversal)
 */
export function validateKeyBelongsToSession(
  key: string,
  sessionId: string
): boolean {
  const expectedPrefix = `temp-uploads/${sessionId}/`;
  return key.startsWith(expectedPrefix) && !key.includes('..');
}
