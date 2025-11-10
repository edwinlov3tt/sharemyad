CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE session_type AS ENUM ('single', 'multiple', 'zip');
CREATE TYPE session_status AS ENUM ('pending', 'uploading', 'processing', 'completed', 'failed');

CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type session_type NOT NULL,
  total_files INTEGER NOT NULL DEFAULT 0,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  uploaded_size_bytes BIGINT NOT NULL DEFAULT 0,
  status session_status NOT NULL DEFAULT 'pending',
  temp_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT total_size_limit CHECK (total_size_bytes <= 524288000),
  CONSTRAINT total_files_limit CHECK (total_files <= 500),
  CONSTRAINT upload_progress CHECK (uploaded_size_bytes <= total_size_bytes)
);

CREATE INDEX idx_upload_sessions_user_id ON upload_sessions(user_id);
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX idx_upload_sessions_created_at ON upload_sessions(created_at DESC);

ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;
