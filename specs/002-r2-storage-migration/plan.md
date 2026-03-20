# Implementation Plan: R2 Storage Migration

**Branch**: `002-r2-storage-migration` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-r2-storage-migration/spec.md`

## Summary

Migrate file storage from Supabase Storage to Cloudflare R2 to enable 500MB uploads with zero egress costs. The implementation uses presigned URLs for direct browser-to-R2 uploads (bypassing Worker 100MB limit), maintains backward compatibility with existing assets, and preserves the current upload UX with real-time progress feedback.

## Technical Context

**Language/Version**: TypeScript 5.3+ (frontend + Workers), Node.js 20+ (build tooling)
**Primary Dependencies**:
- Frontend: React 18, Vite, TanStack Query, @aws-sdk/s3-request-presigner
- Backend: Cloudflare Workers, R2 API (S3-compatible), Supabase Auth/Realtime
**Storage**: Cloudflare R2 (primary), Supabase PostgreSQL (metadata)
**Testing**: Vitest, React Testing Library, Playwright E2E
**Target Platform**: Modern browsers (Chrome 88+, Firefox 78+, Safari 14+, Edge 88+)
**Project Type**: Web application (frontend + Workers)
**Performance Goals**:
- 500MB uploads complete in < 2 minutes on 50Mbps connection
- Progress updates every 2 seconds
- Gallery thumbnails load in < 2 seconds
- 100 concurrent uploads without degradation
**Constraints**:
- Workers have 100MB request body limit (requires presigned URLs)
- 25ms CPU time per Worker request (use R2 for heavy lifting)
- Zero egress costs requirement
**Scale/Scope**: 500-2000 DAU, 100GB existing assets to migrate

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity Through Progressive Disclosure | ✅ PASS | Upload UX unchanged; R2 details hidden from user |
| II. Performance & Responsiveness | ✅ PASS | 500MB < 2min target defined; progress every 2s |
| III. Security & Privacy First | ✅ PASS | Presigned URLs (1hr expiry), CORS restricted, no creds in client |
| IV. Test-First Development | ✅ PASS | Tests defined before implementation per workflow |
| V. Accessibility as Default | ✅ PASS | No UI changes; existing a11y preserved |
| VI. Data-Driven Validation | ✅ PASS | Magic byte validation, externalized standards remain |

**Gate Status**: PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-r2-storage-migration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── POST_presigned-url.md
│   ├── POST_confirm-upload.md
│   └── GET_asset-url.md
├── checklists/
│   └── requirements.md  # Spec validation (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── services/
│   │   ├── uploadService.ts    # MODIFY: Add R2 presigned URL support
│   │   ├── r2Service.ts        # NEW: R2-specific operations
│   │   └── apiClient.ts        # Keep Supabase client for metadata
│   ├── hooks/
│   │   └── useFileUpload.ts    # MODIFY: Support R2 upload flow
│   ├── types/
│   │   └── upload.types.ts     # MODIFY: Add R2 URL types
│   └── config/
│       └── storage.ts          # NEW: Storage configuration
└── tests/
    ├── unit/
    │   └── r2Service.test.ts
    ├── integration/
    │   └── r2Upload.test.ts
    └── e2e/
        └── upload-500mb.spec.ts

workers/
├── presign/                    # NEW: Presigned URL generator
│   ├── src/
│   │   └── index.ts
│   └── wrangler.toml
├── asset-proxy/                # NEW: Thumbnail/download URL generator
│   ├── src/
│   │   └── index.ts
│   └── wrangler.toml
└── migration/                  # NEW: Supabase → R2 migration
    ├── src/
    │   └── index.ts
    └── wrangler.toml

supabase/
└── migrations/
    └── 20251126_001_add_r2_storage_columns.sql  # NEW: R2 metadata columns
```

**Structure Decision**: Web application with Cloudflare Workers for storage operations. Frontend unchanged except upload service. Workers handle presigned URL generation, asset proxy, and migration.

## Feature Scope & Boundaries

### ✅ Included in This Feature

- Presigned URL generation for 500MB direct uploads to R2
- Real-time upload progress tracking (existing UX preserved)
- File validation (magic bytes, size limits, type checking)
- Asset retrieval via signed URLs through R2
- Migration path for existing Supabase Storage assets
- Backward compatibility for existing share links
- Cleanup of incomplete uploads (24-hour expiry)

### ❌ Deferred to Future Features

- Resumable uploads (removed per clarification - manual retry only)
- Automatic retry on failure (user must manually retry)
- Offline upload queuing
- Client-side compression
- Virus/malware scanning (existing magic byte validation only)

### 🔗 Integration Points for Future Features

- `r2Service.ts` exports `generatePresignedUrl()` for reuse
- `storage_provider` column enables multi-backend support
- Migration Worker can be extended for future storage backends
- Upload session tracking compatible with future resume capability

## Complexity Tracking

> No violations detected. Implementation follows existing patterns.

| Component | Why Needed | Why Simpler Alternative Rejected |
|-----------|------------|----------------------------------|
| Presigned URLs | Bypass 100MB Worker limit | Direct Worker upload can't handle 500MB |
| Migration Worker | Incremental asset migration | Batch script would cause downtime |

## Post-Design Re-Evaluation

*Completed after Phase 1 design artifacts generated.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity Through Progressive Disclosure | ✅ PASS | No UI changes; storage backend transparent to users |
| II. Performance & Responsiveness | ✅ PASS | Benchmarks in quickstart.md; presigned URLs < 100ms |
| III. Security & Privacy First | ✅ PASS | 1hr URL expiry, CORS, no client-side credentials, audit logging |
| IV. Test-First Development | ✅ PASS | Test scenarios defined in quickstart.md before implementation |
| V. Accessibility as Default | ✅ PASS | No UI changes; existing accessibility maintained |
| VI. Data-Driven Validation | ✅ PASS | Magic byte validation per spec; standards externalized |

**Gate Status**: PASSED - Ready for `/speckit.tasks`

## Design Artifacts Summary

| Artifact | Status | Description |
|----------|--------|-------------|
| research.md | ✅ Complete | 8 research questions resolved |
| data-model.md | ✅ Complete | Schema changes documented, migration SQL included |
| contracts/POST_presigned-url.md | ✅ Complete | Presigned URL generation endpoint |
| contracts/POST_confirm-upload.md | ✅ Complete | Upload confirmation endpoint |
| contracts/GET_asset-url.md | ✅ Complete | Asset URL retrieval with caching |
| quickstart.md | ✅ Complete | 5 test scenarios, benchmarks, a11y tests |
