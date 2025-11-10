-- Enable anonymous uploads for MVP testing
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gnurilaiddffxfjujegu/sql

-- Step 1: Remove foreign key constraint on user_id
ALTER TABLE upload_sessions
DROP CONSTRAINT IF EXISTS upload_sessions_user_id_fkey;

-- Step 2: Disable RLS on all tables (allow anonymous access)
ALTER TABLE upload_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE creative_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE creative_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnails DISABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE folder_structure DISABLE ROW LEVEL SECURITY;

-- Verification
SELECT '✅ Anonymous uploads enabled!' as status;

SELECT
  table_name,
  CASE WHEN rowsecurity THEN '❌ RLS ENABLED' ELSE '✅ RLS DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND table_name IN ('upload_sessions', 'creative_sets', 'creative_assets', 'thumbnails', 'processing_jobs', 'folder_structure')
ORDER BY table_name;
