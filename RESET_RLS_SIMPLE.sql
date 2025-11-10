-- ========================================
-- RESET RLS TO SIMPLE WORKING POLICIES
-- ========================================
-- This removes all complex policies and creates simple ones that work
-- Run this in Supabase Dashboard to fix the 400 errors
-- ========================================

-- STEP 1: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can create upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can view own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can update own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can delete own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can access creative sets from their sessions" ON creative_sets;
DROP POLICY IF EXISTS "Users can access creative assets from their sessions" ON creative_assets;
DROP POLICY IF EXISTS "Users can access thumbnails from their sessions" ON thumbnails;
DROP POLICY IF EXISTS "Users can access processing jobs from their sessions" ON processing_jobs;
DROP POLICY IF EXISTS "Users can access folder structure from their sessions" ON folder_structure;

-- STEP 2: Create SIMPLE, PERMISSIVE policies

-- Upload Sessions: Allow everything for authenticated and anonymous
CREATE POLICY "upload_sessions_all" ON upload_sessions
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Creative Sets: Allow everything for authenticated and anonymous
CREATE POLICY "creative_sets_all" ON creative_sets
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Creative Assets: Allow everything for authenticated and anonymous
CREATE POLICY "creative_assets_all" ON creative_assets
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Thumbnails: Allow everything for authenticated and anonymous
CREATE POLICY "thumbnails_all" ON thumbnails
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Processing Jobs: Allow everything for authenticated and anonymous
CREATE POLICY "processing_jobs_all" ON processing_jobs
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Folder Structure: Allow everything for authenticated and anonymous
CREATE POLICY "folder_structure_all" ON folder_structure
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- Note: These are FULLY OPEN policies for MVP
-- They allow any anonymous user to create/read/update/delete any data
-- This is acceptable for MVP testing but should be tightened for production
-- Once uploads work, we can add proper session-based restrictions
