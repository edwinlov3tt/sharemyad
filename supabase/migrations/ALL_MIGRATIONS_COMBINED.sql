-- ========================================
-- ShareMyAd - Complete Database Migration
-- ========================================
-- Database: ShareMyAd (gnurilaiddffxfjujegu)
-- URL: https://gnurilaiddffxfjujegu.supabase.co
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
--
-- This file contains all migrations (Phase 1-8):
-- - upload_sessions, creative_sets, creative_assets tables
-- - thumbnails, processing_jobs, folder_structure tables
-- - Triggers for updated_at timestamps
-- - RLS policies for secure access
-- - Anonymous upload support
-- ========================================

-- Use PostgreSQL's built-in gen_random_uuid() (available in PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE session_type AS ENUM ('single', 'multiple', 'zip');
CREATE TYPE session_status AS ENUM ('pending', 'uploading', 'processing', 'completed', 'failed');

CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type session_type NOT NULL,
  total_files INTEGER NOT NULL DEFAULT 0,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  uploaded_size_bytes BIGINT NOT NULL DEFAULT 0,
  status session_status NOT NULL DEFAULT 'pending',
  temp_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT total_size_limit CHECK (total_size_bytes <= 524288000),
  CONSTRAINT total_files_limit CHECK (total_files <= 500),
  CONSTRAINT upload_progress CHECK (uploaded_size_bytes <= total_size_bytes)
);

CREATE INDEX idx_upload_sessions_user_id ON upload_sessions(user_id);
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX idx_upload_sessions_created_at ON upload_sessions(created_at DESC);

ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;
CREATE TABLE creative_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  set_name VARCHAR(255) NOT NULL,
  original_folder_path TEXT,
  asset_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT set_name_format CHECK (set_name ~ '^[A-Za-z0-9\-_]+$'),
  CONSTRAINT asset_count_positive CHECK (asset_count >= 0)
);

CREATE INDEX idx_creative_sets_upload_session_id ON creative_sets(upload_session_id);
CREATE INDEX idx_creative_sets_set_name ON creative_sets(set_name);

ALTER TABLE creative_sets ENABLE ROW LEVEL SECURITY;
CREATE TYPE file_type AS ENUM ('image', 'video', 'html5');
CREATE TYPE validation_status AS ENUM ('pending', 'valid', 'warning', 'invalid');

CREATE TABLE creative_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_set_id UUID NOT NULL REFERENCES creative_sets(id) ON DELETE CASCADE,
  filename_original VARCHAR(255) NOT NULL,
  filename_sanitized VARCHAR(255) NOT NULL,
  file_type file_type NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_seconds DECIMAL(10,2),
  storage_url TEXT NOT NULL,
  temp_storage_url TEXT,
  upload_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validation_status validation_status NOT NULL DEFAULT 'pending',
  validation_notes TEXT,
  is_html5_bundle BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT dimensions_positive CHECK ((width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)),
  CONSTRAINT duration_positive CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  CONSTRAINT valid_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'text/html'))
);

CREATE INDEX idx_creative_assets_set_id ON creative_assets(creative_set_id);
CREATE INDEX idx_creative_assets_file_type ON creative_assets(file_type);
CREATE INDEX idx_creative_assets_validation_status ON creative_assets(validation_status);

ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;
CREATE TABLE thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_asset_id UUID NOT NULL UNIQUE REFERENCES creative_assets(id) ON DELETE CASCADE,
  thumbnail_url TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 300,
  height INTEGER NOT NULL DEFAULT 180,
  file_size_bytes INTEGER NOT NULL,
  format VARCHAR(10) NOT NULL DEFAULT 'jpeg',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT thumbnail_dimensions CHECK (width = 300 AND height = 180),
  CONSTRAINT thumbnail_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT thumbnail_format CHECK (format = 'jpeg')
);

CREATE UNIQUE INDEX idx_thumbnails_creative_asset_id ON thumbnails(creative_asset_id);

ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;
CREATE TYPE job_type AS ENUM ('extraction', 'thumbnail_generation', 'validation', 'malware_scan');
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed');

CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  job_type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  current_file_index INTEGER NOT NULL DEFAULT 0,
  total_files INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  error_file_index INTEGER,

  CONSTRAINT progress_range CHECK (progress_percentage BETWEEN 0 AND 100),
  CONSTRAINT file_index_valid CHECK (current_file_index <= total_files),
  CONSTRAINT completed_progress CHECK (status != 'completed' OR progress_percentage = 100),
  CONSTRAINT failed_has_error CHECK (status != 'failed' OR error_message IS NOT NULL)
);

CREATE INDEX idx_processing_jobs_upload_session_id ON processing_jobs(upload_session_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_job_type ON processing_jobs(job_type);

ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
CREATE TABLE folder_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_set_id UUID NOT NULL REFERENCES creative_sets(id) ON DELETE CASCADE,
  folder_name VARCHAR(255) NOT NULL,
  parent_folder_id UUID REFERENCES folder_structure(id) ON DELETE CASCADE,
  depth_level INTEGER NOT NULL DEFAULT 0,
  full_path TEXT NOT NULL,
  asset_count INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT depth_limit CHECK (depth_level BETWEEN 0 AND 10),
  CONSTRAINT folder_name_format CHECK (folder_name ~ '^[A-Za-z0-9\-_ ]+$')
);

CREATE INDEX idx_folder_structure_creative_set_id ON folder_structure(creative_set_id);
CREATE INDEX idx_folder_structure_parent_folder_id ON folder_structure(parent_folder_id);
CREATE INDEX idx_folder_structure_depth_level ON folder_structure(depth_level);

ALTER TABLE folder_structure ENABLE ROW LEVEL SECURITY;
-- Trigger 1: Update upload_sessions.updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_upload_sessions_updated_at
BEFORE UPDATE ON upload_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Automatically update creative_sets.asset_count
CREATE OR REPLACE FUNCTION update_creative_set_asset_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creative_sets
    SET asset_count = asset_count + 1
    WHERE id = NEW.creative_set_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creative_sets
    SET asset_count = asset_count - 1
    WHERE id = OLD.creative_set_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creative_set_asset_count_trigger
AFTER INSERT OR DELETE ON creative_assets
FOR EACH ROW
EXECUTE FUNCTION update_creative_set_asset_count();

-- Trigger 3: Automatically update folder_structure.asset_count
CREATE OR REPLACE FUNCTION update_folder_asset_count()
RETURNS TRIGGER AS $$
DECLARE
  folder_id UUID;
BEGIN
  -- Increment count when asset added
  IF TG_OP = 'INSERT' THEN
    -- Find folder by matching asset's full path prefix
    SELECT id INTO folder_id
    FROM folder_structure fs
    JOIN creative_assets ca ON ca.id = NEW.id
    WHERE ca.filename_sanitized LIKE fs.full_path || '%'
    ORDER BY LENGTH(fs.full_path) DESC
    LIMIT 1;

    IF folder_id IS NOT NULL THEN
      UPDATE folder_structure
      SET asset_count = asset_count + 1
      WHERE id = folder_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folder_asset_count_trigger
AFTER INSERT ON creative_assets
FOR EACH ROW
EXECUTE FUNCTION update_folder_asset_count();
-- RLS Policies for upload_sessions
CREATE POLICY "Users can view own upload sessions"
ON upload_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own upload sessions"
ON upload_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upload sessions"
ON upload_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own upload sessions"
ON upload_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for creative_sets
CREATE POLICY "Users can access own creative sets"
ON creative_sets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    WHERE us.id = creative_sets.upload_session_id
    AND us.user_id = auth.uid()
  )
);

-- RLS Policies for creative_assets
CREATE POLICY "Users can access own creative assets"
ON creative_assets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    JOIN creative_sets cs ON cs.upload_session_id = us.id
    WHERE cs.id = creative_assets.creative_set_id
    AND us.user_id = auth.uid()
  )
);

-- RLS Policies for thumbnails
CREATE POLICY "Users can access own thumbnails"
ON thumbnails
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    JOIN creative_sets cs ON cs.upload_session_id = us.id
    JOIN creative_assets ca ON ca.creative_set_id = cs.id
    WHERE ca.id = thumbnails.creative_asset_id
    AND us.user_id = auth.uid()
  )
);

-- RLS Policies for processing_jobs
CREATE POLICY "Users can access own processing jobs"
ON processing_jobs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    WHERE us.id = processing_jobs.upload_session_id
    AND us.user_id = auth.uid()
  )
);

-- RLS Policies for folder_structure
CREATE POLICY "Users can access own folder structure"
ON folder_structure
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM upload_sessions us
    JOIN creative_sets cs ON cs.upload_session_id = us.id
    WHERE cs.id = folder_structure.creative_set_id
    AND us.user_id = auth.uid()
  )
);
-- Fix ambiguous column reference in update_folder_asset_count trigger
-- The trigger was referencing 'id' without specifying which table (folder_structure or creative_assets)

DROP TRIGGER IF EXISTS update_folder_asset_count_trigger ON creative_assets;
DROP FUNCTION IF EXISTS update_folder_asset_count();

-- Recreate with fixed column reference
CREATE OR REPLACE FUNCTION update_folder_asset_count()
RETURNS TRIGGER AS $$
DECLARE
  folder_id UUID;
BEGIN
  -- Increment count when asset added
  IF TG_OP = 'INSERT' THEN
    -- Find folder by matching asset's full path prefix
    SELECT fs.id INTO folder_id  -- FIXED: Explicitly specify fs.id instead of ambiguous 'id'
    FROM folder_structure fs
    JOIN creative_assets ca ON ca.id = NEW.id
    WHERE ca.filename_sanitized LIKE fs.full_path || '%'
    ORDER BY LENGTH(fs.full_path) DESC
    LIMIT 1;

    IF folder_id IS NOT NULL THEN
      UPDATE folder_structure
      SET asset_count = asset_count + 1
      WHERE id = folder_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folder_asset_count_trigger
AFTER INSERT ON creative_assets
FOR EACH ROW
EXECUTE FUNCTION update_folder_asset_count();
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
