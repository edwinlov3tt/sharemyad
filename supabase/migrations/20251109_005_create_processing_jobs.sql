CREATE TYPE job_type AS ENUM ('extraction', 'thumbnail_generation', 'validation', 'malware_scan');
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed');

CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  job_type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  current_file_index INTEGER NOT NULL DEFAULT 0,
  total_files INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  error_file_index INTEGER,

  CONSTRAINT progress_range CHECK (progress_percentage BETWEEN 0 AND 100),
  CONSTRAINT file_index_valid CHECK (current_file_index <= total_files),
  CONSTRAINT completed_progress CHECK (status != 'completed' OR progress_percentage = 100),
  CONSTRAINT failed_has_error CHECK (status != 'failed' OR error_message IS NOT NULL)
);

CREATE INDEX idx_processing_jobs_upload_session_id ON processing_jobs(upload_session_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_job_type ON processing_jobs(job_type);

ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
