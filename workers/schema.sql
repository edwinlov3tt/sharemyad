-- ShareMyAd D1 Schema
-- Replaces Supabase PostgreSQL

-- Upload Sessions
CREATE TABLE IF NOT EXISTS upload_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  session_type TEXT NOT NULL CHECK (session_type IN ('single', 'multiple', 'zip')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'completed', 'partial', 'failed')),
  total_files INTEGER NOT NULL DEFAULT 0,
  total_size_bytes INTEGER NOT NULL DEFAULT 0,
  target_storage TEXT NOT NULL DEFAULT 'r2' CHECK (target_storage IN ('r2')),
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Creative Sets (A/B/C variant groupings)
CREATE TABLE IF NOT EXISTS creative_sets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  upload_session_id TEXT NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  set_name TEXT NOT NULL DEFAULT 'default',
  asset_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_creative_sets_session ON creative_sets(upload_session_id);

-- Creative Assets
CREATE TABLE IF NOT EXISTS creative_assets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  creative_set_id TEXT NOT NULL REFERENCES creative_sets(id) ON DELETE CASCADE,
  filename_original TEXT NOT NULL,
  filename_sanitized TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'html5')),
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_seconds REAL,
  storage_url TEXT NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'warning', 'invalid')),
  validation_notes TEXT,
  is_html5_bundle INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT,
  r2_etag TEXT,
  upload_timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_creative_assets_set ON creative_assets(creative_set_id);
