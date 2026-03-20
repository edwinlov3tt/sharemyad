# Tasks: R2 Storage Migration

**Input**: Design documents from `/specs/002-r2-storage-migration/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Tests NOT requested in specification. Only quickstart.md manual tests included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths included in descriptions

## Path Conventions (from plan.md)

- **Frontend**: `frontend/src/` (React + Vite)
- **Workers**: `workers/` (Cloudflare Workers)
- **Database**: `supabase/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, Cloudflare configuration, dependencies

- [x] T001 Create Cloudflare Workers project structure in `workers/presign/`, `workers/asset-proxy/`, `workers/migration/`
- [x] T002 [P] Initialize wrangler.toml for presign Worker in `workers/presign/wrangler.toml`
- [x] T003 [P] Initialize wrangler.toml for asset-proxy Worker in `workers/asset-proxy/wrangler.toml`
- [x] T004 [P] Initialize wrangler.toml for migration Worker in `workers/migration/wrangler.toml`
- [x] T005 Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner in Workers
- [x] T006 [P] Configure R2 bucket bindings in wrangler.toml files
- [x] T007 [P] Add CORS configuration to R2 bucket per research.md (AllowedOrigins, AllowedMethods, AllowedHeaders)
- [x] T008 [P] Configure R2 lifecycle rule for temp-uploads/ cleanup (24hr expiry) per research.md
- [x] T009 Create shared types package in `workers/shared/types.ts` for PresignedUrlRequest, PresignedUrlResponse
- [x] T010 Add storage configuration to frontend in `frontend/src/config/storage.ts`

**Checkpoint**: Workers project structure ready, R2 configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema changes and shared TypeScript types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create database migration `supabase/migrations/20251126_001_add_storage_provider_type.sql` - storage_provider enum
- [x] T012 Create database migration `supabase/migrations/20251126_002_add_r2_columns.sql` - r2_key, r2_etag, migrated_at columns on creative_assets
- [x] T013 Create database migration `supabase/migrations/20251126_003_create_migration_jobs.sql` - migration_jobs table with status enum
- [x] T014 Create database migration `supabase/migrations/20251126_004_add_upload_sessions_target.sql` - target_storage column
- [x] T015 Run database migrations with `supabase db push` and verify schema changes
- [x] T016 [P] Update TypeScript types in `frontend/src/types/upload.types.ts` - add PresignedUploadUrl, UploadConfirmation interfaces
- [x] T017 [P] Update TypeScript types in `frontend/src/types/asset.types.ts` - add storageProvider, r2Key, r2Etag, migratedAt fields to CreativeAsset
- [x] T018 [P] Create MigrationJob types in `frontend/src/types/migration.types.ts`
- [x] T019 Create shared utility functions in `workers/shared/utils.ts` - sanitizeFilename, validateContentType, validateContentLength
- [x] T020 Create error response helpers in `workers/shared/errors.ts` - ApiError class, errorResponse function

**Checkpoint**: Foundation ready - database schema updated, types defined, user story implementation can begin

---

## Phase 3: User Story 1 - Upload Large Creative Bundle (Priority: P1) 🎯 MVP

**Goal**: Enable 500MB file uploads with real-time progress via presigned URLs to R2

**Independent Test**: Upload a 300MB file and verify it completes with progress updates, file stored in R2 with correct metadata

### Implementation for User Story 1

#### Presign Worker (POST /api/presign/upload)

- [x] T021 [US1] Implement S3Client configuration in `workers/presign/src/s3-client.ts` per research.md
- [x] T022 [US1] Implement presigned URL generation function in `workers/presign/src/presign.ts` using @aws-sdk/s3-request-presigner
- [x] T023 [US1] Implement session validation in `workers/presign/src/session.ts` - verify session exists, not expired
- [x] T024 [US1] Implement request validation in `workers/presign/src/validation.ts` - contentType, contentLength, filename
- [x] T025 [US1] Implement main Worker handler in `workers/presign/src/index.ts` per contracts/POST_presigned-url.md
- [x] T026 [US1] Add rate limiting middleware (100 req/min per IP) in `workers/presign/src/rate-limit.ts`

#### Confirm Upload Endpoint (POST /api/upload/confirm)

- [x] T027 [US1] Implement R2 HEAD request verification in `workers/presign/src/verify-upload.ts` - check ETag, size
- [x] T028 [US1] Implement R2 copy operation (temp-uploads → assets) in `workers/presign/src/move-asset.ts`
- [x] T029 [US1] Implement confirm upload handler in `workers/presign/src/confirm.ts` per contracts/POST_confirm-upload.md
- [x] T030 [US1] Add confirm endpoint to main Worker router in `workers/presign/src/index.ts`

#### Frontend Upload Service Changes

- [x] T031 [US1] Create R2 service in `frontend/src/services/r2Service.ts` - requestPresignedUrl(), confirmUpload()
- [x] T032 [US1] Update getSignedUploadUrl() in `frontend/src/services/uploadService.ts` to use R2 presigned URLs
- [x] T033 [US1] Update uploadFileToStorage() in `frontend/src/services/uploadService.ts` to extract ETag from R2 response
- [x] T034 [US1] Update triggerProcessing() in `frontend/src/services/uploadService.ts` to call confirmUpload with R2 metadata
- [x] T035 [US1] Update createUploadSession() in `frontend/src/services/uploadService.ts` to set target_storage='r2'
- [x] T036 [US1] Add client-side size validation (500MB limit) in `frontend/src/services/uploadService.ts`
- [x] T037 [US1] Update error messages for R2-specific errors in `frontend/src/services/uploadService.ts`

#### Deploy and Test

- [x] T038 [US1] Deploy presign Worker to Cloudflare with `wrangler deploy` in workers/presign/
- [ ] T039 [US1] Run quickstart.md Test Scenario 1 - Upload Large File manual tests
- [ ] T040 [US1] Verify SC-001 (500MB uploads succeed), SC-002 (progress every 2s), SC-003 (< 2min on 50Mbps)

**Checkpoint**: User Story 1 complete - 500MB uploads work end-to-end via R2

---

## Phase 4: User Story 2 - View Uploaded Assets (Priority: P2)

**Goal**: Serve uploaded assets from R2 with presigned GET URLs, fast thumbnail loading

**Independent Test**: Upload files, navigate to gallery, verify thumbnails load within 2 seconds from R2

### Implementation for User Story 2

#### Asset Proxy Worker (GET /api/assets/:assetId/url)

- [ ] T041 [US2] Implement presigned GET URL generation in `workers/asset-proxy/src/presign-get.ts` with type-specific expiry (1hr full, 24hr thumb, 15min download)
- [ ] T042 [US2] Implement asset lookup from database in `workers/asset-proxy/src/asset-lookup.ts` - check storage_provider
- [ ] T043 [US2] Implement URL caching with Workers KV in `workers/asset-proxy/src/cache.ts` - cache key, TTL logic
- [ ] T044 [US2] Implement share link authorization in `workers/asset-proxy/src/auth.ts` - validate shareSlug, check expiry/views
- [ ] T045 [US2] Implement main Worker handler in `workers/asset-proxy/src/index.ts` per contracts/GET_asset-url.md
- [ ] T046 [US2] Configure Workers KV namespace binding in `workers/asset-proxy/wrangler.toml`

#### Frontend Asset URL Generation

- [ ] T047 [US2] Create getAssetUrl() function in `frontend/src/services/r2Service.ts` - call asset-proxy Worker
- [ ] T048 [US2] Update asset retrieval in `frontend/src/services/uploadService.ts` getSessionAssets() to use dynamic URLs
- [ ] T049 [US2] Update thumbnail loading in `frontend/src/hooks/useThumbnailCache.ts` to use R2 URLs
- [ ] T050 [US2] Add fallback for Supabase assets (dual-read support) in `frontend/src/services/r2Service.ts`

#### Deploy and Test

- [ ] T051 [US2] Deploy asset-proxy Worker to Cloudflare with `wrangler deploy` in workers/asset-proxy/
- [ ] T052 [US2] Run quickstart.md Test Scenario 2 - View Gallery manual tests
- [ ] T053 [US2] Verify SC-004 (thumbnails load < 2s for first 12 items)

**Checkpoint**: User Story 2 complete - Assets served from R2 with caching

---

## Phase 5: User Story 3 - Migrate Existing Assets (Priority: P3)

**Goal**: Migrate existing Supabase Storage assets to R2 without breaking share links

**Independent Test**: Run migration on subset of assets, verify old share links still work, assets served from R2

### Implementation for User Story 3

#### Migration Worker

- [ ] T054 [US3] Implement batch asset fetcher in `workers/migration/src/batch-fetch.ts` - query assets where storage_provider='supabase'
- [ ] T055 [US3] Implement Supabase download function in `workers/migration/src/supabase-download.ts` - fetch file from Supabase URL
- [ ] T056 [US3] Implement R2 upload function in `workers/migration/src/r2-upload.ts` - put object with checksum verification
- [ ] T057 [US3] Implement database update function in `workers/migration/src/update-asset.ts` - set storage_provider='r2', r2_key, migrated_at
- [ ] T058 [US3] Implement migration job management in `workers/migration/src/job-manager.ts` - create, update, complete, fail
- [ ] T059 [US3] Implement error logging in `workers/migration/src/error-log.ts` - append to migration_jobs.error_log JSONB
- [ ] T060 [US3] Implement pause/resume capability in `workers/migration/src/pause-resume.ts` - use last_processed_id
- [ ] T061 [US3] Implement main migration handler in `workers/migration/src/index.ts` - POST /start, GET /status, POST /pause, POST /resume
- [ ] T062 [US3] Configure cron trigger for scheduled migration in `workers/migration/wrangler.toml` (optional)

#### Migration API Endpoints

- [ ] T063 [US3] Implement POST /api/migration/start endpoint in `workers/migration/src/handlers/start.ts`
- [ ] T064 [US3] Implement GET /api/migration/status/:jobId endpoint in `workers/migration/src/handlers/status.ts`
- [ ] T065 [US3] Implement POST /api/migration/pause/:jobId endpoint in `workers/migration/src/handlers/pause.ts`
- [ ] T066 [US3] Implement POST /api/migration/resume/:jobId endpoint in `workers/migration/src/handlers/resume.ts`

#### Deploy and Test

- [ ] T067 [US3] Deploy migration Worker to Cloudflare with `wrangler deploy` in workers/migration/
- [ ] T068 [US3] Run quickstart.md Test Scenario 3 - Migration manual tests
- [ ] T069 [US3] Verify SC-005 (zero data loss), SC-006 (backward compatibility)

**Checkpoint**: User Story 3 complete - Existing assets migrated to R2

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, cleanup, documentation

- [ ] T070 [P] Add audit logging for upload operations in `workers/presign/src/audit.ts` per FR-021
- [ ] T071 [P] Add audit logging for asset access in `workers/asset-proxy/src/audit.ts`
- [ ] T072 [P] Add audit logging for migration operations in `workers/migration/src/audit.ts`
- [ ] T073 Implement scheduled cleanup Worker for expired sessions in `workers/cleanup/src/index.ts`
- [ ] T074 Run quickstart.md Test Scenario 4 - File Validation tests
- [ ] T075 Run quickstart.md Test Scenario 5 - Security tests
- [ ] T076 Run quickstart.md Performance Benchmarks
- [ ] T077 [P] Run quickstart.md Browser Compatibility tests
- [ ] T078 [P] Run quickstart.md Accessibility tests
- [ ] T079 Update CLAUDE.md with R2 configuration details and new Worker endpoints
- [ ] T080 Verify rollback strategy per quickstart.md Rollback Verification

**Checkpoint**: All user stories complete, security hardened, tests passed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MUST complete before US2/US3 can be fully tested
- **User Story 2 (Phase 4)**: Depends on Foundational - Can start in parallel with US1 if different developers
- **User Story 3 (Phase 5)**: Depends on Foundational - Can start in parallel with US1/US2
- **Polish (Phase 6)**: Depends on US1, US2, US3 completion

### User Story Dependencies

| Story | Dependencies | Can Start After |
|-------|--------------|-----------------|
| US1 (Upload) | Phase 2 complete | Phase 2 |
| US2 (View Assets) | Phase 2 complete | Phase 2 |
| US3 (Migration) | Phase 2 complete, US2 for dual-read | Phase 2 |

### Within Each User Story

1. Worker implementation before frontend changes
2. Core functionality before error handling
3. Deploy before manual testing
4. All tests pass before checkpoint

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T004 can run in parallel (different wrangler.toml files)
- T006, T007, T008 can run in parallel (different configurations)

**Phase 2 (Foundational)**:
- T011-T014 can run in parallel (different migration files)
- T016, T017, T018 can run in parallel (different type files)

**Phase 3 (US1)**:
- Within presign Worker: T023, T024 can run in parallel
- Frontend changes T31-T37 can run in parallel after Worker deployed

**Phase 4 (US2)**:
- T041, T042, T043, T044 can run in parallel (different Worker files)
- T047, T048, T049, T050 can run in parallel (different frontend files)

**Phase 5 (US3)**:
- T054-T060 can run in parallel (different Worker files)
- T063, T064, T065, T066 can run in parallel (different handlers)

---

## Parallel Example: User Story 1 Worker Development

```bash
# Launch Worker implementation tasks in parallel:
Task: T023 "Implement session validation in workers/presign/src/session.ts"
Task: T024 "Implement request validation in workers/presign/src/validation.ts"

# Launch frontend changes in parallel (after Worker deployed):
Task: T031 "Create R2 service in frontend/src/services/r2Service.ts"
Task: T036 "Add client-side size validation in frontend/src/services/validationService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T020)
3. Complete Phase 3: User Story 1 (T021-T040)
4. **STOP and VALIDATE**: Run quickstart.md Test Scenario 1
5. Deploy MVP - 500MB uploads now work!

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. User Story 1 → 500MB uploads work → **Deploy MVP**
3. User Story 2 → R2 asset serving → Deploy
4. User Story 3 → Migration complete → Deploy
5. Polish → Security/audit → Final deployment

### Parallel Team Strategy

With 2+ developers:
1. Team completes Setup + Foundational together
2. Once Foundational complete:
   - Developer A: User Story 1 (presign Worker + frontend)
   - Developer B: User Story 2 (asset-proxy Worker)
3. After US1 MVP deployed:
   - Developer A: User Story 3 (migration Worker)
   - Developer B: Polish + testing

---

## Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Setup | 10 | - |
| Foundational | 10 | - |
| User Story 1 | 20 | US1 |
| User Story 2 | 13 | US2 |
| User Story 3 | 16 | US3 |
| Polish | 11 | - |
| **Total** | **80** | |

**Parallel Opportunities**: 35+ tasks marked [P]

**MVP Scope**: Complete through T040 (Setup + Foundational + US1) = 40 tasks

**Independent Test Criteria**:
- US1: Upload 300MB file, verify in R2, progress shown
- US2: View gallery, thumbnails load < 2s from R2
- US3: Run migration, old share links work, assets from R2
