-- ========================================
-- FIX RLS POLICIES: Resolve Ambiguous Column References
-- ========================================
-- Error: column reference "id" is ambiguous (PostgreSQL 42702)
-- Cause: Multiple tables in JOIN have 'id' columns
-- Solution: Fully qualify ALL column references with table aliases
-- ========================================

-- Creative Assets - Fixed with explicit table aliases
DROP POLICY IF EXISTS "Users can access creative assets from their sessions" ON creative_assets;
CREATE POLICY "Users can access creative assets from their sessions"
ON creative_assets FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM upload_sessions us
    JOIN creative_sets cs ON cs.upload_session_id = us.id
    WHERE cs.id = creative_assets.creative_set_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM upload_sessions us
    JOIN creative_sets cs ON cs.upload_session_id = us.id
    WHERE cs.id = (SELECT creative_set_id FROM (VALUES (creative_set_id)) AS new_row(creative_set_id))
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Actually, let me simplify this. The issue is that we need to reference the NEW row's creative_set_id
-- In PostgreSQL RLS WITH CHECK, we can reference columns directly from the row being inserted

DROP POLICY IF EXISTS "Users can access creative assets from their sessions" ON creative_assets;
CREATE POLICY "Users can access creative assets from their sessions"
ON creative_assets FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM creative_sets cs
    JOIN upload_sessions us ON us.id = cs.upload_session_id
    WHERE cs.id = creative_assets.creative_set_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM creative_sets cs
    JOIN upload_sessions us ON us.id = cs.upload_session_id
    WHERE cs.id = creative_set_id  -- Reference the NEW row's creative_set_id directly
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Creative Sets - Fully qualified
DROP POLICY IF EXISTS "Users can access creative sets from their sessions" ON creative_sets;
CREATE POLICY "Users can access creative sets from their sessions"
ON creative_sets FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM upload_sessions us
    WHERE us.id = creative_sets.upload_session_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM upload_sessions us
    WHERE us.id = upload_session_id  -- Reference NEW row's upload_session_id directly
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Thumbnails - Fully qualified
DROP POLICY IF EXISTS "Users can access thumbnails from their sessions" ON thumbnails;
CREATE POLICY "Users can access thumbnails from their sessions"
ON thumbnails FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM creative_assets ca
    JOIN creative_sets cs ON cs.id = ca.creative_set_id
    JOIN upload_sessions us ON us.id = cs.upload_session_id
    WHERE ca.id = thumbnails.creative_asset_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM creative_assets ca
    JOIN creative_sets cs ON cs.id = ca.creative_set_id
    JOIN upload_sessions us ON us.id = cs.upload_session_id
    WHERE ca.id = creative_asset_id  -- Reference NEW row's creative_asset_id directly
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Processing Jobs - Fully qualified
DROP POLICY IF EXISTS "Users can access processing jobs from their sessions" ON processing_jobs;
CREATE POLICY "Users can access processing jobs from their sessions"
ON processing_jobs FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM upload_sessions us
    WHERE us.id = processing_jobs.upload_session_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM upload_sessions us
    WHERE us.id = upload_session_id  -- Reference NEW row's upload_session_id directly
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);

-- Folder Structure - Fully qualified
DROP POLICY IF EXISTS "Users can access folder structure from their sessions" ON folder_structure;
CREATE POLICY "Users can access folder structure from their sessions"
ON folder_structure FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM creative_sets cs
    JOIN upload_sessions us ON us.id = cs.upload_session_id
    WHERE cs.id = folder_structure.creative_set_id
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM creative_sets cs
    JOIN upload_sessions us ON us.id = cs.upload_session_id
    WHERE cs.id = creative_set_id  -- Reference NEW row's creative_set_id directly
    AND (
      (us.user_id IS NOT NULL AND us.user_id = auth.uid())
      OR
      (us.is_anonymous = true AND us.created_at > NOW() - INTERVAL '7 days')
    )
  )
);
