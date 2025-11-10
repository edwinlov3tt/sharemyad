-- Anonymous Uploads Migration (Phase 8 T123)
-- INSTRUCTIONS: Run this SQL in Supabase Dashboard > SQL Editor
-- This is idempotent and safe to run multiple times

-- Add columns if they don't exist
DO $$
BEGIN
    ALTER TABLE upload_sessions ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'user_id already nullable';
END $$;

DO $$
BEGIN
    ALTER TABLE upload_sessions ADD COLUMN session_token TEXT;
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'session_token already exists';
END $$;

DO $$
BEGIN
    ALTER TABLE upload_sessions ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'is_anonymous already exists';
END $$;

DO $$
BEGIN
    ALTER TABLE upload_sessions ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'expires_at already exists';
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_upload_sessions_session_token
ON upload_sessions(session_token) WHERE session_token IS NOT NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can create own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can update own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can delete own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can access own creative sets" ON creative_sets;
DROP POLICY IF EXISTS "Users can access own creative assets" ON creative_assets;
DROP POLICY IF EXISTS "Users can access own thumbnails" ON thumbnails;
DROP POLICY IF EXISTS "Users can access own processing jobs" ON processing_jobs;
DROP POLICY IF EXISTS "Users can access own folder structure" ON folder_structure;

-- New RLS policies supporting anonymous uploads

CREATE POLICY "Anyone can create upload sessions"
ON upload_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own upload sessions"
ON upload_sessions FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (is_anonymous = true AND created_at > NOW() - INTERVAL '7 days')
);

CREATE POLICY "Users can update own upload sessions"
ON upload_sessions FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (is_anonymous = true AND created_at > NOW() - INTERVAL '7 days')
);

CREATE POLICY "Users can access creative sets from their sessions"
ON creative_sets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    WHERE us.id = creative_sets.upload_session_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

CREATE POLICY "Users can access creative assets from their sessions"
ON creative_assets FOR ALL
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

CREATE POLICY "Users can access thumbnails from their sessions"
ON thumbnails FOR ALL
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

CREATE POLICY "Users can access processing jobs from their sessions"
ON processing_jobs FOR ALL
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

CREATE POLICY "Users can access folder structure from their sessions"
ON folder_structure FOR ALL
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

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_sessions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM upload_sessions
  WHERE is_anonymous = true AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Comments
COMMENT ON COLUMN upload_sessions.is_anonymous IS 'True if this is an anonymous upload (no user authentication)';
COMMENT ON COLUMN upload_sessions.session_token IS 'Token for anonymous session access control';
COMMENT ON COLUMN upload_sessions.expires_at IS 'When this session expires (7 days for anonymous, null for authenticated)';
COMMENT ON FUNCTION cleanup_expired_anonymous_sessions() IS 'Removes anonymous upload sessions older than 7 days';
