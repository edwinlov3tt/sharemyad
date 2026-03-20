// Session management using D1
// Replaces Supabase for all database operations

import type { Env } from '../../shared/types';

export interface UploadSession {
  id: string;
  session_type: 'single' | 'multiple' | 'zip';
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'partial' | 'failed';
  total_files: number;
  total_size_bytes: number;
  target_storage: 'r2';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new upload session
 */
export async function createSession(
  db: D1Database,
  sessionType: 'single' | 'multiple' | 'zip',
  totalFiles: number,
  totalSizeBytes: number
): Promise<UploadSession> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const result = await db
    .prepare(
      `INSERT INTO upload_sessions (session_type, total_files, total_size_bytes, expires_at)
       VALUES (?, ?, ?, ?)
       RETURNING *`
    )
    .bind(sessionType, totalFiles, totalSizeBytes, expiresAt)
    .first<UploadSession>();

  if (!result) {
    throw new Error('Failed to create upload session');
  }

  return result;
}

/**
 * Get session by ID
 */
export async function getSession(
  db: D1Database,
  sessionId: string
): Promise<UploadSession | null> {
  return db
    .prepare('SELECT * FROM upload_sessions WHERE id = ?')
    .bind(sessionId)
    .first<UploadSession>();
}

/**
 * Validate upload session exists and is in valid state for uploads
 */
export async function validateSession(
  db: D1Database,
  sessionId: string
): Promise<UploadSession> {
  const session = await getSession(db, sessionId);

  if (!session) {
    throw new SessionValidationError('SESSION_NOT_FOUND', 'Upload session not found');
  }

  if (session.status === 'completed') {
    throw new SessionValidationError('SESSION_COMPLETED', 'Upload session has already completed');
  }

  if (session.status === 'failed') {
    throw new SessionValidationError('SESSION_FAILED', 'Upload session has failed');
  }

  if (session.expires_at) {
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      throw new SessionValidationError('SESSION_EXPIRED', 'Upload session has expired');
    }
  }

  return session;
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  db: D1Database,
  sessionId: string,
  status: string
): Promise<void> {
  await db
    .prepare("UPDATE upload_sessions SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(status, sessionId)
    .run();
}

/**
 * Mark session as uploading if currently pending
 */
export async function markSessionUploading(
  db: D1Database,
  sessionId: string
): Promise<void> {
  await db
    .prepare("UPDATE upload_sessions SET status = 'uploading', updated_at = datetime('now') WHERE id = ? AND status = 'pending'")
    .bind(sessionId)
    .run();
}

export class SessionValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'SessionValidationError';
    this.code = code;
  }
}
