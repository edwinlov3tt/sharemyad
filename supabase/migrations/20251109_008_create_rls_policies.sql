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
