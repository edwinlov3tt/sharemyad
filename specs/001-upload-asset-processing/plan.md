# Implementation Plan: Upload & Asset Processing

**Branch**: `001-upload-asset-processing` | **Date**: 2025-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-upload-asset-processing/spec.md`

## Summary

**Phase 1: Upload & Asset Processing** - Build a multi-format file upload system with automatic zip extraction, thumbnail generation, and asset organization. Users can upload individual files (JPG, PNG, GIF, MP4, WEBM, HTML5) or zip archives up to 500MB. System automatically extracts zip contents, maintains folder structure, detects creative set variants (A/B/C), generates thumbnails, and provides real-time progress updates during background processing.

**Scope**: This feature delivers the upload and processing pipeline only. Project creation, share link generation, and analytics tracking will be handled in future features (002-project-sharing, 003-analytics).

**Technical Approach**: Frontend (Vite + React + TypeScript) handles drag-and-drop upload interface with real-time progress tracking. Supabase Storage receives direct uploads via signed URLs. Edge functions (Deno) process zip extraction and thumbnail generation asynchronously. Cloudflare R2 provides long-term asset storage with CDN delivery. PostgreSQL stores metadata and processing state for resumable operations.

## Technical Context

**Language/Version**: TypeScript 5.3+ (frontend + edge functions), Node.js 20+ (build tooling)
**Primary Dependencies**:
- Frontend: React 18, Vite 5, TanStack Query, Zod, react-dropzone
- Backend: Supabase JS Client 2.x, Deno 1.38+ (edge functions)
- Processing: JSZip (extraction), Sharp (image thumbnails), FFmpeg (video thumbnails)
- Storage: Supabase Storage + Cloudflare R2 SDK

**Storage**:
- PostgreSQL 15 (Supabase hosted) for metadata
- Supabase Storage (temporary upload staging)
- Cloudflare R2 (long-term asset storage with CDN)

**Testing**:
- Frontend: Vitest + React Testing Library
- Edge Functions: Deno Test
- E2E: Playwright
- Performance: Lighthouse CI

**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Project Type**: Web application (frontend + backend edge functions)

**Performance Goals**:
- File upload initiation: < 500ms
- Single file preview: < 3 seconds (< 10MB files)
- Zip extraction start: < 10 seconds (500MB archive)
- Thumbnail generation: < 30 seconds (100 images)
- Preview grid scroll: 60 FPS with 500+ assets
- API response: < 200ms p95 latency

**Constraints**:
- Maximum upload: 500MB per file/archive
- Maximum files: 500 per project
- Browser File API required (no legacy browser support)
- Real-time updates: WebSocket or Server-Sent Events for progress
- Resumable uploads for files > 50MB

**Scale/Scope**:
- MVP: 100 concurrent users
- Storage: 10GB per user quota
- File processing: 10 concurrent jobs per user
- Thumbnail cache: 7-day TTL

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Simplicity Through Progressive Disclosure
- **Compliance**: Default upload interface shows only drag-drop zone + file picker. Advanced features (creative set tabs, folder structure view) revealed only when zip contains multiple sets.
- **Verification**: P1 (single file) has minimal UI. P3+ features (set organization) progressively disclosed.

### ✅ II. Performance & Responsiveness
- **Compliance**: Performance targets documented (< 3s preview, < 10s zip start, < 30s thumbnails). Lazy-loading for thumbnails. Background processing for large files.
- **Verification**: SC-001 through SC-015 define measurable performance criteria. Performance tests required (Lighthouse CI).

### ✅ III. Security & Privacy First
- **Compliance**:
  - MIME type validation + magic byte verification (FR-006, FR-007)
  - File size limits enforced client-side + server-side (FR-008)
  - Filename sanitization (FR-022)
  - Malware scanning via ClamAV integration (edge function)
  - Signed URLs for uploads (no direct storage access)
  - Input validation on all file metadata
- **Verification**: All security requirements from constitution addressed in FR-001 through FR-030.

### ✅ IV. Test-First Development
- **Compliance**: Test frameworks defined (Vitest, Deno Test, Playwright). Coverage targets set (100% core validation, 100% API endpoints).
- **Verification**: Contract tests required for all edge function endpoints. Integration tests for upload pipeline. Performance tests for benchmarks.

### ✅ V. Accessibility as Default
- **Compliance**:
  - Drag-drop zone has keyboard alternative (file picker button)
  - Progress indicators use ARIA live regions
  - Preview grid keyboard navigable
  - Error messages announced to screen readers
  - Focus management for modal previews
- **Verification**: axe-core audits required in CI pipeline. Manual keyboard navigation testing.

### ✅ VI. Data-Driven Validation
- **Compliance**: IAB standards externalized in JSON config. Platform limits (Google, Meta) documented with source URLs. Validation logic separated from UI.
- **Verification**: Validation configuration stored in separate module with changelog tracking updates.

**Status**: ✅ **PASS** - All constitution principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-upload-asset-processing/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Database schema + entities
├── quickstart.md        # Phase 1: Manual test scenarios
├── contracts/           # Phase 1: API endpoint specs
│   ├── upload.yaml      # POST /api/upload endpoint
│   ├── process.yaml     # POST /api/process/:id endpoint
│   └── status.yaml      # GET /api/status/:id endpoint
└── checklists/
    └── requirements.md  # Spec quality checklist (completed)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── upload/
│   │   │   ├── UploadZone.tsx           # Drag-drop + file picker
│   │   │   ├── UploadProgress.tsx       # Real-time progress UI
│   │   │   └── FileValidator.tsx        # Client-side validation
│   │   ├── preview/
│   │   │   ├── AssetGrid.tsx            # Lazy-loaded thumbnail grid
│   │   │   ├── AssetCard.tsx            # Individual asset preview
│   │   │   ├── VideoPreview.tsx         # Video player with thumbnail
│   │   │   └── CreativeSetTabs.tsx      # A/B/C set navigation
│   │   └── shared/
│   │       ├── ErrorBoundary.tsx
│   │       └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useFileUpload.ts             # Upload state management
│   │   ├── useProcessingStatus.ts       # SSE/WebSocket progress
│   │   └── useThumbnailCache.ts         # Lazy-load optimization
│   ├── services/
│   │   ├── uploadService.ts             # Supabase Storage upload
│   │   ├── validationService.ts         # MIME + size validation
│   │   └── apiClient.ts                 # Edge function calls
│   ├── types/
│   │   ├── upload.types.ts
│   │   ├── asset.types.ts
│   │   └── processing.types.ts
│   └── config/
│       └── validation-standards.json    # IAB + platform limits
└── tests/
    ├── unit/
    │   ├── validation.test.ts
    │   └── upload.test.ts
    ├── integration/
    │   └── upload-flow.test.ts
    └── e2e/
        └── complete-upload.spec.ts

supabase/
├── functions/
│   ├── process-upload/
│   │   ├── index.ts                     # Edge function entry
│   │   ├── zipExtractor.ts              # Zip extraction logic
│   │   ├── thumbnailGenerator.ts        # Sharp + FFmpeg
│   │   ├── creativeSetDetector.ts       # Folder pattern matching
│   │   └── malwareScanner.ts            # ClamAV integration
│   └── shared/
│       ├── storage.ts                   # R2 + Supabase helpers
│       └── database.ts                  # PostgreSQL queries
├── migrations/
│   ├── 20251109_create_upload_sessions.sql
│   ├── 20251109_create_creative_assets.sql
│   ├── 20251109_create_creative_sets.sql
│   ├── 20251109_create_processing_jobs.sql
│   └── 20251109_create_thumbnails.sql
└── tests/
    └── functions/
        └── process-upload.test.ts

tests/
├── contract/
│   ├── upload-endpoint.test.ts
│   ├── process-endpoint.test.ts
│   └── status-endpoint.test.ts
├── integration/
│   ├── upload-pipeline.test.ts
│   └── zip-extraction.test.ts
└── performance/
    ├── upload-benchmarks.ts
    └── thumbnail-generation.ts
```

**Structure Decision**: Web application structure selected based on frontend (Vite + React) + backend (Supabase Edge Functions) architecture. Frontend handles UI and direct uploads to Supabase Storage. Edge functions process files asynchronously (extraction, thumbnails, validation) and move to R2 for long-term storage. PostgreSQL stores metadata and job state.

## Feature Scope & Boundaries

### ✅ Included in This Feature (001)

**Upload Pipeline**:
- File upload interface (drag-drop + file picker)
- Multi-format support (JPG, PNG, GIF, MP4, WEBM, HTML5, ZIP)
- Client-side validation (MIME, size, format)
- Direct upload to Supabase Storage via signed URLs
- Resumable uploads for large files (> 50MB)

**Processing Pipeline**:
- Zip extraction with folder structure preservation
- Creative set detection (A/B/C pattern matching)
- Thumbnail generation (images via Sharp, videos via FFmpeg)
- Malware scanning (ClamAV integration)
- Real-time progress tracking (Supabase Realtime)
- Background job management

**Data Model**:
- `upload_sessions` - Upload operation tracking
- `creative_sets` - A/B/C variant grouping
- `creative_assets` - Individual file metadata
- `thumbnails` - Preview images
- `processing_jobs` - Background task state
- `folder_structure` - Hierarchy preservation

**User Experience**:
- Preview grid with lazy-loaded thumbnails
- Validation feedback (traffic light system)
- Error handling with actionable messages
- Keyboard navigation and screen reader support

### ❌ Deferred to Future Features

**002-project-sharing** (Future):
- `projects` table (shareable unit with slug)
- `advertisers` table (auto-created from domain)
- `share_links` table (password, expiration, view limits)
- Share link generation and delivery
- Email notification system
- Public share pages

**003-analytics** (Future):
- `view_analytics` table (hashed IP tracking)
- Time on page, downloads, creative views
- Analytics dashboard
- Export reports

**Phase 2 Enhancements** (Future):
- Flight dates and campaign timelines
- Calendar integration
- Preview ads on sites
- AI-powered features (auto-tagging, copy extraction)

### 🔗 Integration Points for Future Features

When implementing **002-project-sharing**, connect via:
1. On upload completion, create `project` record from `upload_session`
2. Link `creative_sets` to `project_id` (add foreign key)
3. Generate `share_link` with slug, associate with `project_id`
4. Transition asset URLs from Supabase Storage → R2 for permanence

**Migration Path**:
```sql
-- Future migration to connect upload_sessions → projects
ALTER TABLE creative_sets
  ADD COLUMN project_id UUID REFERENCES projects(id);

UPDATE creative_sets cs
SET project_id = (
  SELECT p.id FROM projects p
  WHERE p.upload_session_id = cs.upload_session_id
);
```

---

## Complexity Tracking

> **No violations detected** - All constitution principles satisfied without compromises.

All complexity justified by requirements:
- **Multiple storage backends** (Supabase + R2): Temporary staging vs. long-term CDN delivery, cost optimization at scale
- **Edge functions**: Serverless processing required for async zip extraction, thumbnail generation, malware scanning
- **Supabase Realtime (SSE)**: Real-time progress updates (constitution performance requirement), better UX than polling
- **Sharp + FFmpeg**: Industry-standard tools for high-quality thumbnail generation (user requirement FR-011, FR-012)
- **ClamAV malware scanning**: Security requirement for user-uploaded content, prevents malicious file distribution
- **folder_structure table**: Enables complex folder hierarchy queries, reconstructs original zip organization for display

---

## Post-Design Constitution Re-Evaluation

*Re-check after Phase 1 design (data model, contracts, architecture)*

### ✅ I. Simplicity Through Progressive Disclosure
**Design Verification**:
- Data model supports progressive feature revelation (creative_sets table enables Set-A/B/C tabs without changing core structure)
- API design separates concerns: `/upload` (simple) → `/process` (advanced) → `/status` (optional polling)
- UI component architecture mirrors P1-P5 priority: UploadZone (core) → AssetGrid (P2) → CreativeSetTabs (P3)
- **PASS**: Design maintains simplicity for P1 users while enabling advanced features for P3+

### ✅ II. Performance & Responsiveness
**Design Verification**:
- Direct upload to Supabase Storage bypasses edge function timeout limits
- Lazy loading architecture (IntersectionObserver + thumbnail_url separate from storage_url)
- Database indexes on high-traffic queries (upload_sessions.user_id, creative_assets.creative_set_id)
- Supabase Realtime reduces polling overhead (push vs pull for progress)
- Thumbnail standardization (300x180) enables predictable caching
- **PASS**: Architecture supports < 3s preview, < 10s extraction start, 60 FPS scroll

### ✅ III. Security & Privacy First
**Design Verification**:
- Row Level Security (RLS) policies enforce user-scoped access at database level
- Signed URLs with 1-hour expiration prevent unauthorized access
- Magic byte validation in edge functions (FILE_SIGNATURES constant)
- Malware scanning before R2 transfer (malwareScanner.ts module)
- No internal IDs exposed (all endpoints use UUID session_id)
- Error responses use machine-readable codes (prevents information leakage)
- **PASS**: Defense in depth with client + server + database security layers

### ✅ IV. Test-First Development
**Design Verification**:
- Contract tests defined for all 3 endpoints (upload.yaml, process.yaml, status.yaml)
- Integration test structure defined (upload-pipeline.test.ts, zip-extraction.test.ts)
- Performance benchmarks specified (upload-benchmarks.ts, thumbnail-generation.ts)
- Quickstart.md provides manual test scenarios for each user story
- Database constraints enforce data integrity (total_size_limit, file_index_valid)
- **PASS**: Complete test strategy covering contract, integration, performance, manual testing

### ✅ V. Accessibility as Default
**Design Verification**:
- ARIA live regions specified for progress updates (processing_jobs.progress_percentage)
- Keyboard navigation supported via semantic HTML structure (button, input file picker)
- Error messages stored as structured data (validation_notes field) for screen reader compatibility
- Quickstart.md includes accessibility test scenarios (keyboard nav, screen reader)
- **PASS**: Accessibility built into data model and API design

### ✅ VI. Data-Driven Validation
**Design Verification**:
- Validation standards externalized (validation-standards.json in frontend config)
- Validation results stored separately (validation_status ENUM, validation_notes TEXT)
- API returns structured validation data (validationStatus + validationNotes fields)
- Database tracks validation metadata (timestamp, source standards)
- **PASS**: Validation logic decoupled from implementation, supports dynamic updates

### 🎯 Final Status: ✅ **ALL PRINCIPLES SATISFIED POST-DESIGN**

**Key Design Strengths**:
1. **Data Model**: Supports progressive complexity (P1 simple uploads work without creative_sets)
2. **API Design**: RESTful separation of concerns enables independent feature testing
3. **Storage Architecture**: Dual-tier (Supabase + R2) balances performance and cost
4. **Security Model**: Multi-layer defense (RLS + signed URLs + validation + malware scan)
5. **Testing Strategy**: Complete coverage from contract to manual scenarios

**No Design Changes Required**: Architecture, data model, and API contracts fully compliant with all 6 constitution principles.
