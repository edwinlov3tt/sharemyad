-- ===================================================================
-- RLS FIX - Copy this ENTIRE file and paste into Supabase SQL Editor
-- https://supabase.com/dashboard/project/gnurilaiddffxfjujegu/sql/new
-- Then click "RUN" (or press Cmd+Enter)
-- ===================================================================

DROP POLICY IF EXISTS "Anyone can create upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can view own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can update own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can delete own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Users can access creative sets from their sessions" ON creative_sets;
DROP POLICY IF EXISTS "Users can access creative assets from their sessions" ON creative_assets;
DROP POLICY IF EXISTS "Users can access thumbnails from their sessions" ON thumbnails;
DROP POLICY IF EXISTS "Users can access processing jobs from their sessions" ON processing_jobs;
DROP POLICY IF EXISTS "Users can access folder structure from their sessions" ON folder_structure;

CREATE POLICY "upload_sessions_all" ON upload_sessions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "creative_sets_all" ON creative_sets FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "creative_assets_all" ON creative_assets FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "thumbnails_all" ON thumbnails FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "processing_jobs_all" ON processing_jobs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "folder_structure_all" ON folder_structure FOR ALL TO public USING (true) WITH CHECK (true);

-- ===================================================================
-- After running, you should see: "Success. No rows returned"
-- Then test by running: deno run --allow-net test-direct-insert.ts
-- Expected: "✅ ASSET CREATED SUCCESSFULLY!"
-- ===================================================================
