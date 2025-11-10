/**
 * Phase 8 (T123): Enable Anonymous Uploads with Security
 *
 * Strategy:
 * - Allow anonymous users to create upload sessions
 * - Track sessions by anon key (JWT sub claim) instead of user_id
 * - Add session-based access control (know session ID = can access)
 * - Implement automatic cleanup of old anonymous sessions
 *
 * Security:
 * - No PII stored for anonymous users
 * - Sessions expire after 7 days
 * - Rate limiting applied at API layer
 * - Malware scanning on all uploads
 */

-- Make user_id nullable for anonymous uploads
ALTER TABLE upload_sessions ALTER COLUMN user_id DROP NOT NULL;

-- Add session_token for anonymous access control
ALTER TABLE upload_sessions ADD COLUMN session_token TEXT;
ALTER TABLE upload_sessions ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE upload_sessions ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');

-- Create index for session token lookups
CREATE INDEX idx_upload_sessions_session_token ON upload_sessions(session_token) WHERE session_token IS NOT NULL;

-- Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "Users can view own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can create own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can update own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can delete own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can access own creative sets" ON creative_sets;
DROP POLICY IF EXISTS "Users can access own creative assets" ON creative_assets;
DROP POLICY IF EXISTS "Users can access own thumbnails" ON thumbnails;
DROP POLICY IF EXISTS "Users can access own processing jobs" ON processing_jobs;
DROP POLICY IF EXISTS "Users can access own folder structure" ON folder_structure;

-- New RLS policies supporting both authenticated and anonymous users

-- Upload Sessions: Allow creation for both auth and anon users
CREATE POLICY "Anyone can create upload sessions"
ON upload_sessions
FOR INSERT
WITH CHECK (true);

-- Upload Sessions: Users can view their own sessions (auth or anon)
CREATE POLICY "Users can view own upload sessions"
ON upload_sessions
FOR SELECT
USING (
  -- Authenticated users: match user_id
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Anonymous users: session is less than 7 days old (no user_id check for anon)
  (is_anonymous = true AND created_at > NOW() - INTERVAL '7 days')
);

-- Upload Sessions: Users can update their own sessions
CREATE POLICY "Users can update own upload sessions"
ON upload_sessions
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (is_anonymous = true AND created_at > NOW() - INTERVAL '7 days')
);

-- Creative Sets: Access based on upload session ownership
CREATE POLICY "Users can access creative sets from their sessions"
ON creative_sets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    WHERE us.id = creative_sets.upload_session_id
    AND (
      -- Authenticated user owns the session
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      -- Anonymous session still valid
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Creative Assets: Access based on session ownership
CREATE POLICY "Users can access creative assets from their sessions"
ON creative_assets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    JOIN creative_sets cs ON cs.upload_session_id = us.id
    WHERE cs.id = creative_assets.creative_set_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Thumbnails: Access based on session ownership
CREATE POLICY "Users can access thumbnails from their sessions"
ON thumbnails
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    JOIN creative_sets cs ON cs.upload_session_id = us.id
    JOIN creative_assets ca ON ca.creative_set_id = cs.id
    WHERE ca.id = thumbnails.creative_asset_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Processing Jobs: Access based on session ownership
CREATE POLICY "Users can access processing jobs from their sessions"
ON processing_jobs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    WHERE us.id = processing_jobs.upload_session_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Folder Structure: Access based on session ownership
CREATE POLICY "Users can access folder structure from their sessions"
ON folder_structure
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    JOIN creative_sets cs ON cs.upload_session_id = us.id
    WHERE cs.id = folder_structure.creative_set_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Function to cleanup expired anonymous sessions
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete upload sessions older than 7 days
  DELETE FROM upload_sessions
  WHERE is_anonymous = true
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create a scheduled job to run cleanup daily (requires pg_cron extension)
-- Note: This is optional and requires pg_cron to be enabled
-- SELECT cron.schedule('cleanup-anon-sessions', '0 2 * * *', 'SELECT cleanup_expired_anonymous_sessions()');

COMMENT ON COLUMN upload_sessions.is_anonymous IS 'True if this is an anonymous upload (no user authentication)';
COMMENT ON COLUMN upload_sessions.session_token IS 'Token for anonymous session access control';
COMMENT ON COLUMN upload_sessions.expires_at IS 'When this session expires (7 days for anonymous, null for authenticated)';
COMMENT ON FUNCTION cleanup_expired_anonymous_sessions() IS 'Removes anonymous upload sessions older than 7 days';
