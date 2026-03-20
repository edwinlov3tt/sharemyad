# Data Model: R2 Storage Migration

**Feature**: 002-r2-storage-migration
**Date**: 2025-11-26

## Entity Overview

This feature modifies existing tables and adds one new table. No new entities are created - we extend the current data model to support dual storage backends.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXISTING (unchanged)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  upload_sessions (1) ───────< creative_sets (many)                      │
│                                      │                                  │
│                                      └───────< creative_assets (many)   │
│                                                       │                 │
│                                                       └──< thumbnails   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          NEW/MODIFIED                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  creative_assets.storage_provider  → 'supabase' | 'r2'                  │
│  creative_assets.r2_key            → R2 object key (nullable)           │
│  creative_assets.r2_etag           → R2 ETag for integrity              │
│                                                                         │
│  migration_jobs (NEW) → Tracks migration progress                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Modified Tables

### creative_assets (Modified)

**New Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| storage_provider | ENUM('supabase', 'r2') | NO | 'supabase' | Current storage backend |
| r2_key | VARCHAR(500) | YES | NULL | R2 object key (null for Supabase) |
| r2_etag | VARCHAR(64) | YES | NULL | ETag from R2 for integrity verification |
| migrated_at | TIMESTAMPTZ | YES | NULL | Timestamp when migrated to R2 |

**Migration SQL**:

```sql
-- Add storage provider enum
CREATE TYPE storage_provider AS ENUM ('supabase', 'r2');

-- Add new columns to creative_assets
ALTER TABLE creative_assets
  ADD COLUMN storage_provider storage_provider NOT NULL DEFAULT 'supabase',
  ADD COLUMN r2_key VARCHAR(500),
  ADD COLUMN r2_etag VARCHAR(64),
  ADD COLUMN migrated_at TIMESTAMPTZ;

-- Index for queries by storage provider
CREATE INDEX idx_creative_assets_storage_provider ON creative_assets(storage_provider);

-- Constraint: r2_key required when storage_provider is 'r2'
ALTER TABLE creative_assets
  ADD CONSTRAINT r2_key_required
  CHECK (storage_provider = 'supabase' OR r2_key IS NOT NULL);
```

**Updated Entity Definition**:

```typescript
interface CreativeAsset {
  // Existing fields
  id: string;
  creativeSetId: string;
  filenameOriginal: string;
  filenameSanitized: string;
  fileType: 'image' | 'video' | 'html5';
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  storageUrl: string;           // Now dynamically generated based on provider
  tempStorageUrl: string | null;
  uploadTimestamp: Date;
  validationStatus: 'pending' | 'valid' | 'warning' | 'invalid';
  validationNotes: string | null;
  isHtml5Bundle: boolean;

  // NEW fields for R2 migration
  storageProvider: 'supabase' | 'r2';
  r2Key: string | null;         // e.g., "assets/session-123/file.jpg"
  r2Etag: string | null;        // e.g., "d41d8cd98f00b204e9800998ecf8427e"
  migratedAt: Date | null;
}
```

### upload_sessions (Modified)

**New Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| target_storage | ENUM('supabase', 'r2') | NO | 'r2' | Target storage for new uploads |

**Migration SQL**:

```sql
-- Add target storage column
ALTER TABLE upload_sessions
  ADD COLUMN target_storage storage_provider NOT NULL DEFAULT 'r2';
```

**Rationale**: New uploads go directly to R2. Existing sessions remain as 'supabase' until migrated.

## New Tables

### migration_jobs

Tracks progress of asset migration from Supabase to R2.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| status | ENUM | NO | 'pending' | Job status |
| total_assets | INTEGER | NO | 0 | Total assets to migrate |
| migrated_assets | INTEGER | NO | 0 | Assets successfully migrated |
| failed_assets | INTEGER | NO | 0 | Assets that failed migration |
| started_at | TIMESTAMPTZ | YES | NULL | When job started |
| completed_at | TIMESTAMPTZ | YES | NULL | When job completed |
| last_processed_id | UUID | YES | NULL | Last asset ID processed (for resume) |
| error_log | JSONB | NO | '[]' | Array of error details |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | NO | NOW() | Record update time |

**Status Enum**: `pending`, `running`, `paused`, `completed`, `failed`

**Migration SQL**:

```sql
CREATE TYPE migration_status AS ENUM ('pending', 'running', 'paused', 'completed', 'failed');

CREATE TABLE migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status migration_status NOT NULL DEFAULT 'pending',
  total_assets INTEGER NOT NULL DEFAULT 0,
  migrated_assets INTEGER NOT NULL DEFAULT 0,
  failed_assets INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_processed_id UUID,
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT progress_valid CHECK (migrated_assets + failed_assets <= total_assets)
);

-- Index for finding active jobs
CREATE INDEX idx_migration_jobs_status ON migration_jobs(status);
```

**TypeScript Definition**:

```typescript
interface MigrationJob {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  totalAssets: number;
  migratedAssets: number;
  failedAssets: number;
  startedAt: Date | null;
  completedAt: Date | null;
  lastProcessedId: string | null;
  errorLog: MigrationError[];
  createdAt: Date;
  updatedAt: Date;
}

interface MigrationError {
  assetId: string;
  error: string;
  timestamp: string;
}
```

## New Types

### R2 Upload Types

```typescript
// Presigned URL response from Worker
interface PresignedUploadUrl {
  url: string;           // Presigned PUT URL for R2
  key: string;           // R2 object key
  expiresAt: Date;       // URL expiration timestamp
  maxSizeBytes: number;  // Maximum allowed upload size
}

// Upload confirmation request
interface UploadConfirmation {
  sessionId: string;
  key: string;           // R2 object key
  etag: string;          // ETag from R2 response
  contentLength: number; // Actual uploaded size
}

// Presigned download URL response
interface PresignedDownloadUrl {
  url: string;           // Presigned GET URL
  expiresAt: Date;       // URL expiration timestamp
}
```

## State Transitions

### Storage Provider Flow

```
NEW UPLOAD (post-migration):
  ┌──────────────────────────────────────────────────────────────────┐
  │  1. Create upload_session (target_storage: 'r2')                 │
  │  2. Request presigned URL from Worker                            │
  │  3. Upload directly to R2                                        │
  │  4. Confirm upload → create creative_asset (storage_provider: 'r2', r2_key: '...') │
  │  5. Asset accessible via presigned GET URL                       │
  └──────────────────────────────────────────────────────────────────┘

EXISTING ASSET (pre-migration):
  ┌──────────────────────────────────────────────────────────────────┐
  │  creative_asset.storage_provider = 'supabase'                    │
  │  creative_asset.storage_url = 'https://{project}.supabase.co/...'│
  │  creative_asset.r2_key = NULL                                    │
  │                                                                  │
  │  Asset served from Supabase Storage (existing behavior)          │
  └──────────────────────────────────────────────────────────────────┘

MIGRATED ASSET:
  ┌──────────────────────────────────────────────────────────────────┐
  │  1. Migration Worker reads from Supabase                         │
  │  2. Uploads to R2                                                │
  │  3. Verifies checksum (etag)                                     │
  │  4. Updates creative_asset:                                      │
  │     - storage_provider → 'r2'                                    │
  │     - r2_key → 'assets/...'                                      │
  │     - r2_etag → '...'                                            │
  │     - migrated_at → NOW()                                        │
  │  5. Asset now served from R2 via presigned URL                   │
  └──────────────────────────────────────────────────────────────────┘
```

### Migration Job States

```
     ┌─────────┐
     │ pending │──────────────────────────────────┐
     └────┬────┘                                  │
          │ start()                               │
          ▼                                       │
     ┌─────────┐                                  │
     │ running │◀──────────────┐                  │
     └────┬────┘               │                  │
          │                    │ resume()         │
          ├──────────────────► │                  │
          │ pause()      ┌─────┴────┐             │
          │              │  paused  │             │
          │              └──────────┘             │
          │                                       │
          ├──────────────────────────────────────►│
          │ all assets processed                  │
          ▼                                       │
     ┌───────────┐                                │
     │ completed │                                │
     └───────────┘                                │
                                                  │
          │ unrecoverable error                   │
          ▼                                       │
     ┌────────┐                                   │
     │ failed │◀──────────────────────────────────┘
     └────────┘
```

## Query Patterns

### Get Asset URL (Hot Path)

```sql
-- Determine URL generation strategy based on storage provider
SELECT
  id,
  storage_provider,
  r2_key,
  storage_url  -- Fallback for supabase provider
FROM creative_assets
WHERE id = $1;
```

**Application Logic**:
```typescript
function getAssetUrl(asset: CreativeAsset): Promise<string> {
  if (asset.storageProvider === 'r2' && asset.r2Key) {
    return generatePresignedGetUrl(asset.r2Key);
  }
  return Promise.resolve(asset.storageUrl);
}
```

### Find Assets Pending Migration

```sql
SELECT id, storage_url, file_size_bytes
FROM creative_assets
WHERE storage_provider = 'supabase'
  AND id > $last_processed_id
ORDER BY id ASC
LIMIT 100;
```

### Update Migration Progress

```sql
UPDATE migration_jobs
SET
  migrated_assets = migrated_assets + 1,
  last_processed_id = $asset_id,
  updated_at = NOW()
WHERE id = $job_id;
```

## Indexes

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| creative_assets | storage_provider | B-tree | Filter by storage backend |
| creative_assets | (storage_provider, id) | B-tree | Efficient migration cursor |
| migration_jobs | status | B-tree | Find active jobs |

## Data Integrity

### Constraints

1. **r2_key_required**: When `storage_provider = 'r2'`, `r2_key` must not be null
2. **progress_valid**: `migrated_assets + failed_assets <= total_assets`
3. **storage_url_format**: Validate URL format (existing constraint)

### Validation Rules

1. New uploads: Always target R2 (`target_storage = 'r2'`)
2. Migration: Verify checksum before marking as migrated
3. Deletion: Delete from both backends if migrated

## Backward Compatibility

### Existing API Responses

The `storageUrl` field remains in API responses but is now dynamically generated:

- **Supabase assets**: Return existing `storage_url` from database
- **R2 assets**: Generate presigned GET URL on-demand

Clients continue to use `storageUrl` field - no client changes required for asset retrieval.

### Share Links

Existing share links work unchanged:
1. Request comes to share page
2. Page requests asset URLs via API
3. API generates appropriate URL based on `storage_provider`
4. Asset loads from correct backend

## Migration Path

### Database Migration Order

1. `20251126_001_add_storage_provider_type.sql` - Create enum
2. `20251126_002_add_r2_columns.sql` - Add columns to creative_assets
3. `20251126_003_create_migration_jobs.sql` - Create migration tracking table
4. `20251126_004_add_upload_sessions_target.sql` - Add target_storage column

### Rollback Strategy

If migration fails:
1. Keep `storage_provider = 'supabase'` for un-migrated assets
2. New uploads switch back to Supabase (change default target_storage)
3. R2-uploaded assets remain accessible (no data loss)
