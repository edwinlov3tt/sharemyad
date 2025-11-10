CREATE TABLE thumbnails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creative_asset_id UUID NOT NULL UNIQUE REFERENCES creative_assets(id) ON DELETE CASCADE,
  thumbnail_url TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 300,
  height INTEGER NOT NULL DEFAULT 180,
  file_size_bytes INTEGER NOT NULL,
  format VARCHAR(10) NOT NULL DEFAULT 'jpeg',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT thumbnail_dimensions CHECK (width = 300 AND height = 180),
  CONSTRAINT thumbnail_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT thumbnail_format CHECK (format = 'jpeg')
);

CREATE UNIQUE INDEX idx_thumbnails_creative_asset_id ON thumbnails(creative_asset_id);

ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;
