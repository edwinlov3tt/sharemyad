-- MVP Setup Script (without storage RLS changes)
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Remove auth constraints
-- ============================================
ALTER TABLE upload_sessions DROP CONSTRAINT IF EXISTS upload_sessions_user_id_fkey;

-- ============================================
-- STEP 2: Disable RLS on all app tables
-- ============================================
ALTER TABLE upload_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE creative_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE creative_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnails DISABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE folder_structure DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create storage bucket (if not exists)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads',
  'temp-uploads',
  true, -- Make bucket public for MVP
  524288000,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/zip', 'text/html']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/zip', 'text/html'];

-- ============================================
-- STEP 4: Create storage policies (public access)
-- ============================================
-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on temp-uploads" ON storage.objects;

-- Create new permissive policy
CREATE POLICY "Allow all operations on temp-uploads"
ON storage.objects
FOR ALL
USING (bucket_id = 'temp-uploads')
WITH CHECK (bucket_id = 'temp-uploads');

-- ============================================
-- STEP 5: Verification
-- ============================================
SELECT '✅ MVP Setup Complete!' as status;

-- Verify app tables
SELECT
  tablename as table_name,
  CASE WHEN rowsecurity THEN '❌ RLS ENABLED' ELSE '✅ RLS DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('upload_sessions', 'creative_sets', 'creative_assets')
ORDER BY tablename;

-- Verify storage bucket
SELECT
  name as bucket_name,
  CASE WHEN public THEN '✅ PUBLIC' ELSE '❌ PRIVATE' END as visibility,
  file_size_limit / 1024 / 1024 || ' MB' as max_size
FROM storage.buckets
WHERE id = 'temp-uploads';

-- Verify storage policies
SELECT
  policyname as policy_name,
  'storage.objects' as table_name,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%temp-uploads%';
