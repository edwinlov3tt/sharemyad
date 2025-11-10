/**
 * Fix RLS Policies: Add WITH CHECK Clauses for INSERT/UPDATE
 *
 * Issue: RLS policies with FOR ALL but only USING clause block INSERTs
 * Solution: Add WITH CHECK clauses matching USING clauses
 */

-- Drop and recreate creative_sets policy with WITH CHECK
DROP POLICY IF EXISTS "Users can access creative sets from their sessions" ON creative_sets;

CREATE POLICY "Users can access creative sets from their sessions"
ON creative_sets
FOR ALL
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
)
WITH CHECK (
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

-- Drop and recreate creative_assets policy with WITH CHECK
DROP POLICY IF EXISTS "Users can access creative assets from their sessions" ON creative_assets;

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
)
WITH CHECK (
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

-- Drop and recreate thumbnails policy with WITH CHECK
DROP POLICY IF EXISTS "Users can access thumbnails from their sessions" ON thumbnails;

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
)
WITH CHECK (
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

-- Drop and recreate processing_jobs policy with WITH CHECK
DROP POLICY IF EXISTS "Users can access processing jobs from their sessions" ON processing_jobs;

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
)
WITH CHECK (
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

-- Drop and recreate folder_structure policy with WITH CHECK
DROP POLICY IF EXISTS "Users can access folder structure from their sessions" ON folder_structure;

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
)
WITH CHECK (
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

COMMENT ON POLICY "Users can access creative sets from their sessions" ON creative_sets IS 'Allows anonymous and authenticated users to access creative sets from their upload sessions (with WITH CHECK for INSERTs)';
COMMENT ON POLICY "Users can access creative assets from their sessions" ON creative_assets IS 'Allows anonymous and authenticated users to access creative assets from their upload sessions (with WITH CHECK for INSERTs)';
