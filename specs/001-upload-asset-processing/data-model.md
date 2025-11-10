# Data Model: Upload & Asset Processing

**Date**: 2025-11-09
**Feature**: Upload & Asset Processing
**Branch**: 001-upload-asset-processing

## Overview

This document defines the PostgreSQL database schema for storing upload sessions, creative assets, creative sets, thumbnails, and processing jobs. The model supports resumable uploads, background processing, and folder structure preservation.

## Entity Relationship Diagram

```
┌─────────────────┐
│ upload_sessions │
└────────┬────────┘
         │ 1
         │
         │ *
┌────────┴─────────┐
│ processing_jobs  │
└──────────────────┘

┌─────────────────┐
│ upload_sessions │
└────────┬────────┘
         │ 1
         │
         │ *
┌────────┴─────────┐       ┌─────────────────┐
│ creative_sets    ├───────┤ folder_structure│
└────────┬─────────┘   *   └─────────────────┘
         │ 1
         │
         │ *
┌────────┴─────────┐       ┌─────────────────┐
│ creative_assets  ├───────┤ thumbnails      │
└──────────────────┘  1:1  └─────────────────┘
```

## Entities

### 1. upload_sessions

Represents a single upload operation (single file, multiple files, or zip archive).

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique session identifier |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) | User who initiated upload |
| `session_type` | ENUM | NOT NULL, CHECK (session_type IN ('single', 'multiple', 'zip')) | Upload type |
| `total_files` | INTEGER | NOT NULL, DEFAULT 0 | Total number of files |
| `total_size_bytes` | BIGINT | NOT NULL, DEFAULT 0 | Total size in bytes |
| `uploaded_size_bytes` | BIGINT | NOT NULL, DEFAULT 0 | Bytes uploaded so far (resumable) |
| `status` | ENUM | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'uploading', 'processing', 'completed', 'failed')) | Current status |
| `temp_storage_path` | TEXT | NULL | Path in Supabase Storage (temporary) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Session creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `completed_at` | TIMESTAMPTZ | NULL | Completion timestamp |

**Indexes**:
- `idx_upload_sessions_user_id` ON `user_id`
- `idx_upload_sessions_status` ON `status`
- `idx_upload_sessions_created_at` ON `created_at DESC`

**Validation Rules**:
- `total_size_bytes` ≤ 524,288,000 (500 MB in bytes)
- `total_files` ≤ 500
- `uploaded_size_bytes` ≤ `total_size_bytes`

---

### 2. creative_sets

Grouping of related creative assets detected from folder structure.

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique set identifier |
| `upload_session_id` | UUID | NOT NULL, FOREIGN KEY → upload_sessions(id) ON DELETE CASCADE | Parent upload session |
| `set_name` | VARCHAR(255) | NOT NULL | Set identifier (e.g., "Set-A", "Version-1") |
| `original_folder_path` | TEXT | NULL | Original path from zip extraction |
| `asset_count` | INTEGER | NOT NULL, DEFAULT 0 | Number of assets in set |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Set creation timestamp |

**Indexes**:
- `idx_creative_sets_upload_session_id` ON `upload_session_id`
- `idx_creative_sets_set_name` ON `set_name`

**Validation Rules**:
- `set_name` must match pattern: `/^[A-Za-z0-9\-_]+$/`
- `asset_count` ≥ 0

---

### 3. creative_assets

Individual file uploaded or extracted from archive.

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique asset identifier |
| `creative_set_id` | UUID | NOT NULL, FOREIGN KEY → creative_sets(id) ON DELETE CASCADE | Parent creative set |
| `filename_original` | VARCHAR(255) | NOT NULL | Original filename from upload |
| `filename_sanitized` | VARCHAR(255) | NOT NULL | Sanitized filename for storage |
| `file_type` | ENUM | NOT NULL, CHECK (file_type IN ('image', 'video', 'html5')) | Asset type category |
| `mime_type` | VARCHAR(100) | NOT NULL | MIME type (e.g., "image/jpeg") |
| `file_size_bytes` | BIGINT | NOT NULL | File size in bytes |
| `width` | INTEGER | NULL | Width in pixels (images/videos) |
| `height` | INTEGER | NULL | Height in pixels (images/videos) |
| `duration_seconds` | DECIMAL(10,2) | NULL | Duration in seconds (videos only) |
| `storage_url` | TEXT | NOT NULL | R2 storage URL (long-term) |
| `temp_storage_url` | TEXT | NULL | Supabase Storage URL (temporary) |
| `upload_timestamp` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Upload completion timestamp |
| `validation_status` | ENUM | NOT NULL, DEFAULT 'pending', CHECK (validation_status IN ('pending', 'valid', 'warning', 'invalid')) | Validation result |
| `validation_notes` | TEXT | NULL | Validation messages (e.g., "Non-standard dimensions") |
| `is_html5_bundle` | BOOLEAN | NOT NULL, DEFAULT false | True if HTML5 bundle (has index.html) |

**Indexes**:
- `idx_creative_assets_set_id` ON `creative_set_id`
- `idx_creative_assets_file_type` ON `file_type`
- `idx_creative_assets_validation_status` ON `validation_status`

**Validation Rules**:
- `file_size_bytes` > 0
- `width` > 0 AND `height` > 0 (if not NULL)
- `duration_seconds` > 0 (if not NULL)
- `mime_type` IN ('image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'text/html')

---

### 4. thumbnails

Generated preview images for visual assets.

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique thumbnail identifier |
| `creative_asset_id` | UUID | NOT NULL, UNIQUE, FOREIGN KEY → creative_assets(id) ON DELETE CASCADE | Source asset (1:1 relationship) |
| `thumbnail_url` | TEXT | NOT NULL | R2 storage URL for thumbnail |
| `width` | INTEGER | NOT NULL, DEFAULT 300 | Thumbnail width (standardized) |
| `height` | INTEGER | NOT NULL, DEFAULT 180 | Thumbnail height (standardized) |
| `file_size_bytes` | INTEGER | NOT NULL | Thumbnail file size |
| `format` | VARCHAR(10) | NOT NULL, DEFAULT 'jpeg' | Thumbnail format (always JPEG) |
| `generated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Generation timestamp |

**Indexes**:
- `idx_thumbnails_creative_asset_id` ON `creative_asset_id` (UNIQUE)

**Validation Rules**:
- `width` = 300 AND `height` = 180 (standardized dimensions)
- `file_size_bytes` > 0
- `format` = 'jpeg'

---

### 5. processing_jobs

Background tasks for long-running operations (zip extraction, thumbnail generation).

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique job identifier |
| `upload_session_id` | UUID | NOT NULL, FOREIGN KEY → upload_sessions(id) ON DELETE CASCADE | Associated upload session |
| `job_type` | ENUM | NOT NULL, CHECK (job_type IN ('extraction', 'thumbnail_generation', 'validation', 'malware_scan')) | Job type |
| `status` | ENUM | NOT NULL, DEFAULT 'queued', CHECK (status IN ('queued', 'processing', 'completed', 'failed')) | Current status |
| `progress_percentage` | INTEGER | NOT NULL, DEFAULT 0, CHECK (progress_percentage BETWEEN 0 AND 100) | Progress (0-100) |
| `current_file_index` | INTEGER | NOT NULL, DEFAULT 0 | Current file being processed |
| `total_files` | INTEGER | NOT NULL, DEFAULT 0 | Total files to process |
| `started_at` | TIMESTAMPTZ | NULL | Job start timestamp |
| `completed_at` | TIMESTAMPTZ | NULL | Job completion timestamp |
| `error_message` | TEXT | NULL | Error details if failed |
| `error_file_index` | INTEGER | NULL | File index where error occurred |

**Indexes**:
- `idx_processing_jobs_upload_session_id` ON `upload_session_id`
- `idx_processing_jobs_status` ON `status`
- `idx_processing_jobs_job_type` ON `job_type`

**Validation Rules**:
- `progress_percentage` BETWEEN 0 AND 100
- `current_file_index` ≤ `total_files`
- IF `status` = 'completed' THEN `progress_percentage` = 100
- IF `status` = 'failed' THEN `error_message` IS NOT NULL

---

### 6. folder_structure

Represents folder hierarchy from extracted zip archives (for reconstruction).

**Fields**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique folder node identifier |
| `creative_set_id` | UUID | NOT NULL, FOREIGN KEY → creative_sets(id) ON DELETE CASCADE | Associated creative set |
| `folder_name` | VARCHAR(255) | NOT NULL | Folder name |
| `parent_folder_id` | UUID | NULL, FOREIGN KEY → folder_structure(id) ON DELETE CASCADE | Parent folder (NULL = root) |
| `depth_level` | INTEGER | NOT NULL, DEFAULT 0, CHECK (depth_level BETWEEN 0 AND 10) | Depth from root (0 = root) |
| `full_path` | TEXT | NOT NULL | Full path from root (e.g., "Campaign/Set-A/Display") |
| `asset_count` | INTEGER | NOT NULL, DEFAULT 0 | Number of assets in this folder |

**Indexes**:
- `idx_folder_structure_creative_set_id` ON `creative_set_id`
- `idx_folder_structure_parent_folder_id` ON `parent_folder_id`
- `idx_folder_structure_depth_level` ON `depth_level`

**Validation Rules**:
- `depth_level` ≤ 10 (prevent excessive nesting)
- `folder_name` must match pattern: `/^[A-Za-z0-9\-_ ]+$/`
- `full_path` constructed as `parent.full_path + '/' + folder_name`

---

## Database Triggers

### 1. update_upload_session_timestamp

Updates `updated_at` timestamp whenever `upload_sessions` row is modified.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_upload_sessions_updated_at
BEFORE UPDATE ON upload_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. update_creative_set_asset_count

Automatically updates `asset_count` in `creative_sets` when assets are added/removed.

```sql
CREATE OR REPLACE FUNCTION update_creative_set_asset_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creative_sets
    SET asset_count = asset_count + 1
    WHERE id = NEW.creative_set_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creative_sets
    SET asset_count = asset_count - 1
    WHERE id = OLD.creative_set_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creative_set_asset_count_trigger
AFTER INSERT OR DELETE ON creative_assets
FOR EACH ROW
EXECUTE FUNCTION update_creative_set_asset_count();
```

---

### 3. update_folder_structure_asset_count

Automatically updates `asset_count` in `folder_structure` when assets are moved/deleted.

```sql
CREATE OR REPLACE FUNCTION update_folder_asset_count()
RETURNS TRIGGER AS $$
DECLARE
  folder_id UUID;
BEGIN
  -- Increment count when asset added
  IF TG_OP = 'INSERT' THEN
    -- Find folder by matching asset's full path prefix
    SELECT id INTO folder_id
    FROM folder_structure fs
    JOIN creative_assets ca ON ca.id = NEW.id
    WHERE ca.filename_sanitized LIKE fs.full_path || '%'
    ORDER BY LENGTH(fs.full_path) DESC
    LIMIT 1;

    IF folder_id IS NOT NULL THEN
      UPDATE folder_structure
      SET asset_count = asset_count + 1
      WHERE id = folder_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## Row Level Security (RLS) Policies

All tables use Supabase RLS to enforce user-scoped access.

### upload_sessions

```sql
-- Users can only see their own upload sessions
CREATE POLICY "Users can view own upload sessions"
ON upload_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only create upload sessions for themselves
CREATE POLICY "Users can create own upload sessions"
ON upload_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own upload sessions
CREATE POLICY "Users can update own upload sessions"
ON upload_sessions
FOR UPDATE
USING (auth.uid() = user_id);
```

### creative_sets, creative_assets, thumbnails, processing_jobs, folder_structure

```sql
-- All child tables inherit permissions from upload_sessions via foreign key
CREATE POLICY "Users can access own creative data"
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

-- Similar policies for creative_sets, thumbnails, processing_jobs, folder_structure
```

---

## Migration Files

### 20251109_001_create_upload_sessions.sql

```sql
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
```

### 20251109_002_create_creative_sets.sql

```sql
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
```

### 20251109_003_create_creative_assets.sql

```sql
CREATE TYPE file_type AS ENUM ('image', 'video', 'html5');
CREATE TYPE validation_status AS ENUM ('pending', 'valid', 'warning', 'invalid');

CREATE TABLE creative_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
```

### 20251109_004_create_thumbnails.sql

```sql
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
```

### 20251109_005_create_processing_jobs.sql

```sql
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
```

### 20251109_006_create_folder_structure.sql

```sql
CREATE TABLE folder_structure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
```

---

## Example Queries

### 1. Get upload session with all assets and thumbnails

```sql
SELECT
  us.id AS session_id,
  us.status AS session_status,
  us.total_files,
  us.total_size_bytes,
  cs.set_name,
  ca.filename_sanitized,
  ca.mime_type,
  ca.width,
  ca.height,
  ca.validation_status,
  t.thumbnail_url
FROM upload_sessions us
JOIN creative_sets cs ON cs.upload_session_id = us.id
JOIN creative_assets ca ON ca.creative_set_id = cs.id
LEFT JOIN thumbnails t ON t.creative_asset_id = ca.id
WHERE us.id = $1
AND us.user_id = auth.uid()
ORDER BY cs.set_name, ca.filename_sanitized;
```

### 2. Get processing job progress

```sql
SELECT
  pj.job_type,
  pj.status,
  pj.progress_percentage,
  pj.current_file_index,
  pj.total_files,
  pj.error_message
FROM processing_jobs pj
JOIN upload_sessions us ON us.id = pj.upload_session_id
WHERE pj.id = $1
AND us.user_id = auth.uid();
```

### 3. Get creative sets with asset counts

```sql
SELECT
  cs.set_name,
  cs.asset_count,
  COUNT(ca.id) AS actual_asset_count
FROM creative_sets cs
LEFT JOIN creative_assets ca ON ca.creative_set_id = cs.id
WHERE cs.upload_session_id = $1
GROUP BY cs.id, cs.set_name, cs.asset_count;
```

---

## Data Integrity

All foreign keys use `ON DELETE CASCADE` to ensure:
- Deleting `upload_sessions` removes all associated data
- Deleting `creative_sets` removes all assets and folder structure
- Deleting `creative_assets` removes associated thumbnails

Triggers maintain denormalized counts (`asset_count`) for performance optimization.

RLS policies ensure users can only access their own data via `user_id` on `upload_sessions`.
