# Quickstart: R2 Storage Migration

**Feature**: 002-r2-storage-migration
**Date**: 2025-11-26

This guide provides manual test scenarios to validate the R2 storage migration implementation.

## Prerequisites

- [ ] Cloudflare account with R2 enabled
- [ ] R2 bucket created (`sharemyad-assets`)
- [ ] R2 API credentials configured in Workers
- [ ] CORS rules configured on R2 bucket
- [ ] Database migrations applied
- [ ] Workers deployed (presign, asset-proxy, migration)
- [ ] Local development environment running

## Test Scenario 1: Upload Large File (User Story 1)

**Objective**: Verify 500MB file uploads complete successfully with progress feedback.

### Setup
1. Generate a test file: `dd if=/dev/urandom of=test-500mb.bin bs=1M count=500`
2. Rename to valid type: `mv test-500mb.bin test-large.zip`
3. Open application in browser

### Test Steps

| Step | Action | Expected Result | Actual | Pass? |
|------|--------|-----------------|--------|-------|
| 1 | Open upload page | Upload zone visible | | [ ] |
| 2 | Drag 500MB test file to upload zone | Progress indicator appears | | [ ] |
| 3 | Observe progress bar during upload | Progress updates every ~2 seconds | | [ ] |
| 4 | Wait for upload to complete | Success message shown | | [ ] |
| 5 | Check database: `SELECT storage_provider, r2_key FROM creative_assets ORDER BY upload_timestamp DESC LIMIT 1` | `storage_provider = 'r2'`, `r2_key` populated | | [ ] |
| 6 | Verify file in R2 console | File exists in `assets/{session}/` prefix | | [ ] |

### Edge Case Tests

| Test | Action | Expected Result | Actual | Pass? |
|------|--------|-----------------|--------|-------|
| 501MB file | Upload 501MB file | Client-side rejection before upload starts with clear error | | [ ] |
| Network drop | Disconnect network at 50% | Upload fails, session marked failed, temp file cleaned up | | [ ] |
| Duplicate upload | Upload same file twice in same session | Second file gets unique name (file-1.zip) | | [ ] |

---

## Test Scenario 2: View Gallery (User Story 2)

**Objective**: Verify assets are displayed with thumbnails loading quickly.

### Setup
1. Complete Test Scenario 1 (have uploaded assets)
2. Upload additional 5 image files (various sizes)

### Test Steps

| Step | Action | Expected Result | Actual | Pass? |
|------|--------|-----------------|--------|-------|
| 1 | Navigate to gallery view | Gallery loads | | [ ] |
| 2 | Measure time to first thumbnail | First 12 thumbnails appear within 2 seconds | | [ ] |
| 3 | Scroll down (if >12 assets) | Additional thumbnails load lazily | | [ ] |
| 4 | Click on an asset | Full-resolution image/video loads | | [ ] |
| 5 | Check network tab | URLs point to R2 (presigned URLs) | | [ ] |

### Edge Case Tests

| Test | Action | Expected Result | Actual | Pass? |
|------|--------|-----------------|--------|-------|
| Mixed storage | View gallery with both Supabase and R2 assets | All assets display correctly | | [ ] |
| Expired URL | Wait >1 hour, refresh page | New presigned URLs generated, assets load | | [ ] |
| 3G simulation | Enable slow network, view gallery | Placeholders show, thumbnails load progressively | | [ ] |

---

## Test Scenario 3: Migration (User Story 3)

**Objective**: Verify existing Supabase assets migrate to R2 without disruption.

### Setup
1. Ensure there are assets with `storage_provider = 'supabase'` in database
2. Note an existing share link URL that uses these assets
3. Access Migration Worker endpoint

### Test Steps

| Step | Action | Expected Result | Actual | Pass? |
|------|--------|-----------------|--------|-------|
| 1 | Query assets: `SELECT COUNT(*) FROM creative_assets WHERE storage_provider = 'supabase'` | Note count (e.g., 50) | | [ ] |
| 2 | Trigger migration: `POST /api/migration/start` | Migration job created, returns job ID | | [ ] |
| 3 | Monitor progress: `GET /api/migration/status/{jobId}` | Progress updates (migrated_assets increases) | | [ ] |
| 4 | Wait for completion | Job status = 'completed', migrated = total | | [ ] |
| 5 | Verify database: `SELECT COUNT(*) FROM creative_assets WHERE storage_provider = 'r2'` | All assets now 'r2' | | [ ] |
| 6 | Access original share link | All assets load correctly | | [ ] |
| 7 | Check R2 console | All files present in `assets/` prefix | | [ ] |

### Edge Case Tests

| Test | Action | Expected Result | Actual | Pass? |
|------|--------|-----------------|--------|-------|
| Pause migration | Trigger pause during migration | Job paused, resumable | | [ ] |
| New upload during migration | Upload new file while migration runs | New file goes to R2, migration continues | | [ ] |
| Failed asset | Simulate Supabase unavailable for one file | Job completes with failed_assets=1, error logged | | [ ] |

---

## Test Scenario 4: File Validation (FR-005 through FR-008)

**Objective**: Verify file validation by magic bytes works correctly.

### Test Steps

| Step | Action | Expected Result | Actual | Pass? |
|------|--------|-----------------|--------|-------|
| 1 | Upload valid PNG file | Accepted, validation passes | | [ ] |
| 2 | Upload valid JPEG file | Accepted, validation passes | | [ ] |
| 3 | Upload valid GIF file | Accepted, validation passes | | [ ] |
| 4 | Upload valid MP4 file | Accepted, validation passes | | [ ] |
| 5 | Upload valid WEBM file | Accepted, validation passes | | [ ] |
| 6 | Upload valid ZIP file | Accepted, validation passes | | [ ] |
| 7 | Rename .exe to .png, upload | Rejected with "File content does not match expected format" | | [ ] |
| 8 | Upload file with special chars in name (e.g., `test<>file.png`) | Filename sanitized, upload succeeds | | [ ] |

---

## Test Scenario 5: Security (FR-019 through FR-021)

**Objective**: Verify security measures are working.

### Test Steps

| Step | Action | Expected Result | Actual | Pass? |
|------|--------|-----------------|--------|-------|
| 1 | Try upload from unauthorized origin (curl) | CORS error, upload rejected | | [ ] |
| 2 | Try to access presigned URL after expiry | 403 Forbidden | | [ ] |
| 3 | Check browser dev tools | No R2 credentials visible in requests | | [ ] |
| 4 | Query audit log: `SELECT * FROM audit_log WHERE action = 'upload' ORDER BY created_at DESC LIMIT 5` | Upload operations logged | | [ ] |

---

## Performance Benchmarks

| Metric | Target | Actual | Pass? |
|--------|--------|--------|-------|
| 500MB upload time (50Mbps) | < 2 minutes | | [ ] |
| Progress update frequency | Every 2 seconds | | [ ] |
| Gallery first paint (12 thumbnails) | < 2 seconds | | [ ] |
| Presigned URL generation | < 100ms | | [ ] |
| Asset URL generation | < 200ms | | [ ] |
| 100 concurrent uploads | No degradation | | [ ] |

## Browser Compatibility

| Browser | Upload | Gallery | Download | Pass? |
|---------|--------|---------|----------|-------|
| Chrome 88+ | | | | [ ] |
| Firefox 78+ | | | | [ ] |
| Safari 14+ | | | | [ ] |
| Edge 88+ | | | | [ ] |

## Accessibility Testing

| Test | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Keyboard navigation: Tab to upload zone | Focus visible | | [ ] |
| Screen reader: Upload progress | Progress announced | | [ ] |
| Color contrast: Error messages | Ratio ≥ 4.5:1 | | [ ] |
| Focus indicators | Visible on all interactive elements | | [ ] |

## Rollback Verification

In case of issues, verify rollback works:

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Change default target_storage to 'supabase' | New uploads go to Supabase | [ ] |
| 2 | Upload new file | File stored in Supabase Storage | [ ] |
| 3 | View R2 assets | Previously migrated R2 assets still accessible | [ ] |
| 4 | View Supabase assets | Original Supabase assets still accessible | [ ] |

## Notes

- Test with real file sizes, not mocked data
- Clear browser cache between test runs for accurate timing
- Monitor R2 usage in Cloudflare dashboard during tests
- Check Worker logs for errors during upload flow
