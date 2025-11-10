CREATE TABLE creative_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
