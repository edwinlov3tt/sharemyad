CREATE TABLE folder_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_set_id UUID NOT NULL REFERENCES creative_sets(id) ON DELETE CASCADE,
  folder_name VARCHAR(255) NOT NULL,
  parent_folder_id UUID REFERENCES folder_structure(id) ON DELETE CASCADE,
  depth_level INTEGER NOT NULL DEFAULT 0,
  full_path TEXT NOT NULL,
  asset_count INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT depth_limit CHECK (depth_level BETWEEN 0 AND 10),
  CONSTRAINT folder_name_format CHECK (folder_name ~ '^[A-Za-z0-9\-_ ]+$')
);

CREATE INDEX idx_folder_structure_creative_set_id ON folder_structure(creative_set_id);
CREATE INDEX idx_folder_structure_parent_folder_id ON folder_structure(parent_folder_id);
CREATE INDEX idx_folder_structure_depth_level ON folder_structure(depth_level);

ALTER TABLE folder_structure ENABLE ROW LEVEL SECURITY;
