// Confirm upload handler using D1
// Replaces Supabase for all database operations

import type { Env } from '../../shared/types';
import { ErrorResponses } from '../../shared/errors';
import { isValidUUID, isAllowedContentType, sanitizeFilename } from '../../shared/utils';
import { validateSession, SessionValidationError } from './session';
import { verifyUpload, validateKeyBelongsToSession } from './verify-upload';
import { moveAssetToPermanent } from './move-asset';

export interface ConfirmUploadRequest {
  sessionId: string;
  key: string;
  etag: string;
  contentLength: number;
  filename: string;
  contentType: string;
}

/**
 * Validate confirm upload request body
 */
export function validateConfirmRequest(body: unknown): {
  isValid: boolean;
  errors: string[];
  data?: ConfirmUploadRequest;
} {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  const data = body as Record<string, unknown>;

  if (!data.sessionId || typeof data.sessionId !== 'string') {
    errors.push('sessionId is required and must be a string');
  } else if (!isValidUUID(data.sessionId)) {
    errors.push('sessionId must be a valid UUID');
  }

  if (!data.key || typeof data.key !== 'string') {
    errors.push('key is required and must be a string');
  } else if (!data.key.startsWith('temp-uploads/')) {
    errors.push('key must be in temp-uploads/ prefix');
  }

  if (typeof data.etag !== 'string') {
    errors.push('etag must be a string');
  }

  if (typeof data.contentLength !== 'number' || data.contentLength <= 0) {
    errors.push('contentLength must be a positive number');
  }

  if (!data.filename || typeof data.filename !== 'string') {
    errors.push('filename is required and must be a string');
  }

  if (!data.contentType || typeof data.contentType !== 'string') {
    errors.push('contentType is required and must be a string');
  } else if (!isAllowedContentType(data.contentType)) {
    errors.push('contentType is not in allowed list');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: data as ConfirmUploadRequest,
  };
}

function getFileType(mimeType: string): 'image' | 'video' | 'html5' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/zip') return 'html5';
  return 'image';
}

/**
 * Handle confirm upload request
 */
export async function handleConfirmUpload(
  request: Request,
  env: Env
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ErrorResponses.invalidRequest('Invalid JSON in request body');
  }

  const validation = validateConfirmRequest(body);
  if (!validation.isValid) {
    return ErrorResponses.invalidRequest(validation.errors.join('; '));
  }

  const data = validation.data!;

  if (!validateKeyBelongsToSession(data.key, data.sessionId)) {
    return ErrorResponses.invalidKey('Key does not belong to this session');
  }

  // Validate session via D1
  try {
    await validateSession(env.DB, data.sessionId);
  } catch (error) {
    if (error instanceof SessionValidationError) {
      return ErrorResponses.invalidSession(error.message);
    }
    throw error;
  }

  // Verify upload in R2
  const verifyResult = await verifyUpload(env, data.key, data.etag, data.contentLength);

  if (!verifyResult.valid) {
    const error = verifyResult.error!;
    switch (error.code) {
      case 'OBJECT_NOT_FOUND':
        return ErrorResponses.objectNotFound(data.key);
      case 'ETAG_MISMATCH':
        return ErrorResponses.etagMismatch(
          (error.details?.expected as string) || '',
          (error.details?.received as string) || ''
        );
      case 'SIZE_MISMATCH':
        return ErrorResponses.sizeMismatch(
          (error.details?.expected as number) || 0,
          (error.details?.received as number) || 0
        );
    }
  }

  // Move to permanent location
  const moveResult = await moveAssetToPermanent(env, data.key);
  if (!moveResult.success) {
    return ErrorResponses.internalError(moveResult.error || 'Failed to move asset');
  }

  // Get or create creative set via D1
  const creativeSet = await getOrCreateCreativeSet(env.DB, data.sessionId);

  // Create asset record via D1
  const sanitizedName = sanitizeFilename(data.filename);
  const asset = await createAssetRecord(env.DB, {
    creativeSetId: creativeSet.id,
    filenameOriginal: data.filename,
    filenameSanitized: sanitizedName,
    fileType: getFileType(data.contentType),
    mimeType: data.contentType,
    fileSizeBytes: data.contentLength,
    r2Key: moveResult.newKey,
    r2Etag: data.etag,
    storageUrl: moveResult.newKey,
  });

  // Update session progress via D1
  const updatedSession = await updateSessionProgress(env.DB, data.sessionId);

  return Response.json({
    asset: {
      id: asset.id,
      creativeSetId: asset.creative_set_id,
      filenameOriginal: asset.filename_original,
      filenameSanitized: asset.filename_sanitized,
      fileType: asset.file_type,
      mimeType: asset.mime_type,
      fileSizeBytes: asset.file_size_bytes,
      storageProvider: 'r2',
      r2Key: asset.r2_key,
      uploadTimestamp: asset.upload_timestamp,
      validationStatus: asset.validation_status,
    },
    session: {
      id: updatedSession.id,
      status: updatedSession.status,
      uploadedFiles: updatedSession.uploaded_files,
      totalFiles: updatedSession.total_files,
    },
  });
}

async function getOrCreateCreativeSet(
  db: D1Database,
  sessionId: string
): Promise<{ id: string }> {
  const existing = await db
    .prepare('SELECT id FROM creative_sets WHERE upload_session_id = ? LIMIT 1')
    .bind(sessionId)
    .first<{ id: string }>();

  if (existing) {
    return existing;
  }

  const created = await db
    .prepare(
      `INSERT INTO creative_sets (upload_session_id, set_name)
       VALUES (?, 'default')
       RETURNING id`
    )
    .bind(sessionId)
    .first<{ id: string }>();

  if (!created) {
    throw new Error('Failed to create creative set');
  }

  return created;
}

async function createAssetRecord(
  db: D1Database,
  asset: {
    creativeSetId: string;
    filenameOriginal: string;
    filenameSanitized: string;
    fileType: 'image' | 'video' | 'html5';
    mimeType: string;
    fileSizeBytes: number;
    r2Key: string;
    r2Etag: string;
    storageUrl: string;
  }
): Promise<{
  id: string;
  creative_set_id: string;
  filename_original: string;
  filename_sanitized: string;
  file_type: string;
  mime_type: string;
  file_size_bytes: number;
  r2_key: string;
  upload_timestamp: string;
  validation_status: string;
}> {
  const result = await db
    .prepare(
      `INSERT INTO creative_assets (creative_set_id, filename_original, filename_sanitized, file_type, mime_type, file_size_bytes, storage_url, r2_key, r2_etag, validation_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid')
       RETURNING *`
    )
    .bind(
      asset.creativeSetId,
      asset.filenameOriginal,
      asset.filenameSanitized,
      asset.fileType,
      asset.mimeType,
      asset.fileSizeBytes,
      asset.storageUrl,
      asset.r2Key,
      asset.r2Etag
    )
    .first();

  if (!result) {
    throw new Error('Failed to create asset record');
  }

  return result as any;
}

async function updateSessionProgress(
  db: D1Database,
  sessionId: string
): Promise<{
  id: string;
  status: string;
  uploaded_files: number;
  total_files: number;
}> {
  // Count uploaded assets for this session
  const countResult = await db
    .prepare(
      `SELECT COUNT(*) as count FROM creative_assets ca
       JOIN creative_sets cs ON ca.creative_set_id = cs.id
       WHERE cs.upload_session_id = ?`
    )
    .bind(sessionId)
    .first<{ count: number }>();

  const session = await db
    .prepare('SELECT id, status, total_files FROM upload_sessions WHERE id = ?')
    .bind(sessionId)
    .first<{ id: string; status: string; total_files: number }>();

  if (!session) {
    throw new Error('Session not found');
  }

  const uploadedFiles = countResult?.count || 0;
  let newStatus = session.status;

  if (uploadedFiles >= session.total_files && session.total_files > 0) {
    newStatus = 'completed';
  }

  if (newStatus !== session.status) {
    await db
      .prepare("UPDATE upload_sessions SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(newStatus, sessionId)
      .run();
  }

  return {
    id: session.id,
    status: newStatus,
    uploaded_files: uploadedFiles,
    total_files: session.total_files,
  };
}
