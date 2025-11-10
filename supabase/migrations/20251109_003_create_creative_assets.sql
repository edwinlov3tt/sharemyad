CREATE TYPE file_type AS ENUM ('image', 'video', 'html5');
CREATE TYPE validation_status AS ENUM ('pending', 'valid', 'warning', 'invalid');

CREATE TABLE creative_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_set_id UUID NOT NULL REFERENCES creative_sets(id) ON DELETE CASCADE,
  filename_original VARCHAR(255) NOT NULL,
  filename_sanitized VARCHAR(255) NOT NULL,
  file_type file_type NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_seconds DECIMAL(10,2),
  storage_url TEXT NOT NULL,
  temp_storage_url TEXT,
  upload_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validation_status validation_status NOT NULL DEFAULT 'pending',
  validation_notes TEXT,
  is_html5_bundle BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT dimensions_positive CHECK ((width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)),
  CONSTRAINT duration_positive CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  CONSTRAINT valid_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'text/html'))
);

CREATE INDEX idx_creative_assets_set_id ON creative_assets(creative_set_id);
CREATE INDEX idx_creative_assets_file_type ON creative_assets(file_type);
CREATE INDEX idx_creative_assets_validation_status ON creative_assets(validation_status);

ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;
