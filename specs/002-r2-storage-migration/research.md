# Research: R2 Storage Migration

**Feature**: 002-r2-storage-migration
**Date**: 2025-11-26
**Status**: Complete

## Research Questions

### RQ-1: How to handle 500MB uploads with Cloudflare Workers' 100MB limit?

**Context**: Cloudflare Workers have a 100MB request body limit, but we need to support 500MB file uploads.

**Research Findings**:
- Cloudflare Workers: 100MB max request body (paid plan)
- Cloudflare R2: Supports S3-compatible presigned URLs
- Presigned URLs allow direct browser-to-R2 uploads, bypassing Workers entirely

**Decision**: Use presigned URLs for uploads

**Implementation**:
1. Browser requests presigned URL from Worker (tiny request)
2. Worker generates presigned PUT URL using R2 credentials
3. Browser uploads directly to R2 using presigned URL (no size limit)
4. Browser confirms upload completion to Worker
5. Worker records metadata in database

**Source**: [Cloudflare R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

### RQ-2: What SDK to use for presigned URL generation?

**Context**: Need to generate S3-compatible presigned URLs in Cloudflare Workers.

**Options Evaluated**:
1. **@aws-sdk/s3-request-presigner** - Official AWS SDK, works with S3-compatible APIs
2. **Custom implementation** - Manual HMAC-SHA256 signing
3. **Cloudflare's native R2 bindings** - Direct R2 API without presigned URLs

**Decision**: Use `@aws-sdk/s3-request-presigner`

**Rationale**:
- Well-documented, battle-tested library
- Works with R2's S3-compatible API
- Handles signature generation complexity
- Bundle size ~50KB (acceptable for Workers)

**Implementation**:
```typescript
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const url = await getSignedUrl(client, new PutObjectCommand({
  Bucket: 'sharemyad-assets',
  Key: `uploads/${sessionId}/${filename}`,
  ContentType: mimeType,
}), { expiresIn: 3600 });
```

**Source**: [AWS SDK Presigner](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_s3_request_presigner.html)

### RQ-3: How to track upload progress with presigned URLs?

**Context**: Current implementation uses XHR progress events. Need to verify this works with presigned URL uploads.

**Research Findings**:
- XHR `upload.progress` events work with any HTTP PUT request
- Presigned URLs are standard HTTP endpoints
- No change needed to progress tracking code

**Decision**: Keep existing XHR progress tracking

**Implementation**: No changes required to `uploadFileToStorage()` function. Works with presigned URLs exactly as with Supabase signed URLs.

### RQ-4: How to handle CORS for direct R2 uploads?

**Context**: Browser needs to upload directly to R2 from different origin.

**Research Findings**:
- R2 supports CORS configuration
- Must allow PUT method from app origin
- Must expose necessary headers for progress tracking

**Decision**: Configure R2 CORS rules

**Implementation**:
```json
{
  "AllowedOrigins": ["https://sharemyad.com", "http://localhost:5173"],
  "AllowedMethods": ["PUT", "GET", "HEAD"],
  "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-*"],
  "ExposeHeaders": ["ETag", "Content-Length"],
  "MaxAgeSeconds": 3600
}
```

**Source**: [R2 CORS Configuration](https://developers.cloudflare.com/r2/buckets/cors/)

### RQ-5: How to migrate existing Supabase Storage assets?

**Context**: Existing assets in Supabase Storage must be migrated without breaking share links.

**Research Findings**:
- Supabase provides public URLs: `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`
- R2 can serve via custom domain or presigned GET URLs
- Migration can be incremental (per-asset) to avoid downtime

**Decision**: Incremental migration with dual-read support

**Implementation**:
1. Add `storage_provider` column to `creative_assets` table (default: 'supabase')
2. Migration Worker reads from Supabase, writes to R2
3. Update `storage_provider` to 'r2' after successful copy
4. Asset retrieval checks provider and generates appropriate URL
5. Old Supabase URLs redirect to new R2 URLs (maintain backward compatibility)

**Migration Strategy**:
- Run during off-peak hours
- Process in batches (100 assets per batch)
- Track progress in migration_jobs table
- Resumable if interrupted

### RQ-6: Should we implement resumable uploads?

**Context**: Large 500MB uploads may fail due to network issues. Should we support resuming?

**Options Evaluated**:
1. **Multipart uploads** - S3/R2 native, complex implementation
2. **Chunked uploads** - Custom implementation, requires backend state
3. **No resume** - User retries entire upload, simple implementation

**Decision**: No resume capability (per user clarification)

**Rationale**:
- Adds significant complexity
- User indicated willingness to retry manually
- Can add later based on user feedback
- 500MB on 50Mbps = ~80 seconds (acceptable retry time)

**Trade-off Acknowledged**: Users with unreliable connections may experience frustration. Monitor feedback post-launch.

### RQ-7: How to clean up incomplete uploads?

**Context**: If upload fails, presigned URL may leave partial data in R2.

**Research Findings**:
- R2 supports lifecycle rules for automatic cleanup
- Can set expiration based on object age
- Alternative: Scheduled Worker to clean orphaned objects

**Decision**: Use R2 lifecycle rules + database tracking

**Implementation**:
1. Create upload_session before generating presigned URL
2. Set session expiration (24 hours)
3. R2 lifecycle rule: Delete objects in `temp-uploads/` prefix older than 24 hours
4. Confirmed uploads move to `assets/` prefix (no lifecycle rule)
5. Scheduled Worker cleans expired sessions from database

**R2 Lifecycle Rule**:
```json
{
  "Rules": [{
    "ID": "cleanup-incomplete-uploads",
    "Status": "Enabled",
    "Filter": { "Prefix": "temp-uploads/" },
    "Expiration": { "Days": 1 }
  }]
}
```

### RQ-8: How to generate download/thumbnail URLs?

**Context**: Assets need to be accessible for viewing and downloading via signed URLs.

**Research Findings**:
- R2 can serve via presigned GET URLs (time-limited)
- R2 can serve via public bucket (no authentication)
- R2 can serve via custom domain with Cloudflare CDN

**Decision**: Presigned GET URLs via Worker

**Rationale**:
- Maintains security (no public bucket)
- Enables per-asset access control in future
- Leverages Cloudflare CDN automatically
- 1-hour expiry for download URLs, 24-hour for thumbnails

**Implementation**:
```typescript
// Worker: GET /api/asset-url/:assetId
const url = await getSignedUrl(client, new GetObjectCommand({
  Bucket: 'sharemyad-assets',
  Key: asset.storage_key,
}), { expiresIn: type === 'thumbnail' ? 86400 : 3600 });
```

## Summary of Decisions

| Question | Decision | Confidence |
|----------|----------|------------|
| RQ-1: 500MB upload method | Presigned URLs | High |
| RQ-2: SDK for presigning | @aws-sdk/s3-request-presigner | High |
| RQ-3: Progress tracking | Keep existing XHR (no change) | High |
| RQ-4: CORS configuration | R2 CORS rules for allowed origins | High |
| RQ-5: Migration strategy | Incremental with dual-read | High |
| RQ-6: Resumable uploads | Not included (user decision) | High |
| RQ-7: Incomplete cleanup | R2 lifecycle + scheduled Worker | High |
| RQ-8: Download URLs | Presigned GET via Worker | High |

## Open Questions

None - all research questions resolved.

## Dependencies Identified

### External Dependencies
- Cloudflare R2 account with API credentials
- Custom domain for asset serving (optional, improves UX)
- @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner packages

### Internal Dependencies
- Supabase Auth (keep for user authentication)
- Supabase Realtime (keep for progress notifications)
- Existing upload_sessions table (extend, don't replace)
- Existing creative_assets table (add storage_provider column)

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| R2 API changes | Medium | Low | Pin SDK versions, monitor changelog |
| Migration data loss | High | Low | Verify checksum before deleting source |
| CORS misconfiguration | Medium | Medium | Test in staging environment first |
| Presigned URL expiry during slow upload | Medium | Medium | Set 1-hour expiry (generous for 500MB) |
