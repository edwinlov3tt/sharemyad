-- Complete MVP Setup Script
-- Run this ONCE in Supabase SQL Editor to fix all issues

-- ============================================
-- STEP 1: Remove auth constraints
-- ============================================
ALTER TABLE upload_sessions
DROP CONSTRAINT IF EXISTS upload_sessions_user_id_fkey;

-- ============================================
-- STEP 2: Disable RLS on all tables
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
  false,
  524288000,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/zip', 'text/html']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/zip', 'text/html'];

-- ============================================
-- STEP 4: Drop all existing storage policies
-- ============================================
DROP POLICY IF EXISTS "Allow anonymous uploads to temp-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from temp-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous deletes from temp-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- ============================================
-- STEP 5: Disable RLS on storage.objects
-- ============================================
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Verification
-- ============================================
SELECT '✅ Setup Complete!' as status;

-- Verify tables
SELECT
  '✅ Tables' as check_type,
  tablename as name,
  CASE WHEN rowsecurity THEN '❌ RLS ON' ELSE '✅ RLS OFF' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('upload_sessions', 'creative_sets', 'creative_assets', 'thumbnails', 'processing_jobs', 'folder_structure')
ORDER BY tablename;

-- Verify storage bucket
SELECT
  '✅ Storage' as check_type,
  name,
  CASE WHEN public THEN 'PUBLIC' ELSE 'PRIVATE' END as visibility,
  file_size_limit / 1024 / 1024 || ' MB' as max_size
FROM storage.buckets
WHERE id = 'temp-uploads';

-- Verify storage RLS
SELECT
  '✅ Storage RLS' as check_type,
  'storage.objects' as name,
  CASE WHEN rowsecurity THEN '❌ RLS ON' ELSE '✅ RLS OFF' END as status
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';
