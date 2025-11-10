-- Disable RLS for MVP testing (anonymous uploads)
-- Run this in Supabase SQL Editor to allow anonymous access

-- Disable RLS on all tables temporarily for MVP
ALTER TABLE upload_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE creative_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE creative_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnails DISABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE folder_structure DISABLE ROW LEVEL SECURITY;

-- Create anonymous user (if needed)
-- This allows the upload service to use a consistent anonymous user ID
-- INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000000', 'anonymous@sharemyad.local')
-- ON CONFLICT (id) DO NOTHING;

SELECT 'RLS disabled for MVP testing - all tables now allow anonymous access' as status;
