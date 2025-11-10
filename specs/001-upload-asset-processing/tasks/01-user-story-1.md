# User Story 1: Single File Upload - Upload & Asset Processing

**Status**: 🎯 **MVP - HIGHEST PRIORITY**

**Assigned To**: _[Team Member Name]_

**Estimated Time**: 8-12 hours

---

## Context

You're implementing the core upload feature: users can upload a single file (JPG, PNG, GIF, MP4) and see a preview with validation status in under 3 seconds. This is the MVP - everything else builds on this.

**Goal**: Marketing coordinator uploads a single banner ad, sees preview with "Standard IAB Medium Rectangle" validation, and can proceed to sharing (future feature).

## Prerequisites

**⚠️ BLOCKED UNTIL**:
- [ ] Foundation setup complete (00-foundation.md) - Tasks T001-T027 done
- [ ] All database migrations applied
- [ ] TypeScript types created
- [ ] Shared services available

## Your Tasks

Execute **tasks T028-T054** from `tasks.md`:

### Test-First Development (T028-T034)
**WRITE THESE FIRST - THEY MUST FAIL**:
- [ ] T028-T030: Contract tests for /api/upload, /api/process, /api/status endpoints
- [ ] T031: Unit test for client-side validation
- [ ] T032: Integration test for single file upload flow
- [ ] T033: E2E test for complete single file upload
- [ ] T034: **Verify all tests FAIL** (Red phase)

### Implementation (T035-T051)
**Now write code to make tests pass**:
- [ ] T035-T037: Validation service (MIME, size, dimensions)
- [ ] T038-T040: Upload components (UploadZone, FileValidator, UploadProgress)
- [ ] T041: useFileUpload hook with TanStack Query
- [ ] T042: Upload service with signed URLs
- [ ] T043-T047: API endpoints (upload, process, status) with server-side validation
- [ ] T048-T051: Preview components (AssetCard, AssetGrid) with validation feedback

### Test Verification (T052-T054)
- [ ] T052: **Verify all tests PASS** (Green phase)
- [ ] T053: Performance test: Single file upload < 3s
- [ ] T054: Accessibility test: Keyboard navigation with axe-core

## Constitution Compliance

**⚠️ Test-First Development (NON-NEGOTIABLE)**:
1. Write contract tests FIRST (T028-T033)
2. Run tests - they MUST FAIL
3. Implement minimal code to pass (T035-T051)
4. Verify tests PASS (T052-T054)
5. Refactor while keeping tests green

**Performance Target**: < 3 seconds from upload start to preview display (for files < 10MB)

**Accessibility**: Drag-drop zone must have keyboard alternative (file picker button)

**Security**: Multi-layer validation (client MIME + size, server magic bytes)

## Key Files to Create

```
frontend/src/
├── components/upload/
│   ├── UploadZone.tsx
│   ├── UploadProgress.tsx
│   └── FileValidator.tsx
├── components/preview/
│   ├── AssetCard.tsx
│   └── AssetGrid.tsx
├── hooks/
│   └── useFileUpload.ts
└── services/
    ├── uploadService.ts
    └── validationService.ts

supabase/functions/
├── upload/
│   └── index.ts
├── process-upload/
│   └── index.ts
└── status/
    └── index.ts

tests/
├── contract/
│   ├── upload-endpoint.test.ts
│   ├── process-endpoint.test.ts
│   └── status-endpoint.test.ts
└── integration/
    └── upload-pipeline.test.ts

frontend/tests/
├── unit/
│   └── validation.test.ts
└── e2e/
    └── complete-upload.spec.ts
```

## API Contracts

Reference these OpenAPI specs:
- `/specs/001-upload-asset-processing/contracts/upload.yaml`
- `/specs/001-upload-asset-processing/contracts/process.yaml`
- `/specs/001-upload-asset-processing/contracts/status.yaml`

## Manual Testing

After implementation, test manually using:
- **Quickstart**: `/specs/001-upload-asset-processing/quickstart.md` (Test Scenario 1, Test Cases 1.1-1.4)

**Expected Results**:
- Upload 300x250 JPG → Green checkmark "Standard IAB Medium Rectangle"
- Upload 400x300 PNG → Yellow warning "Non-standard dimensions"
- Upload MP4 video → Thumbnail shows first frame + play icon
- Upload 501MB file → Rejected immediately with clear error

## Verification Checklist

Before marking this workstream complete:

- [ ] All tests written FIRST and FAILED initially
- [ ] All tests now PASS
- [ ] Single file upload works in < 3 seconds (< 10MB files)
- [ ] Validation feedback shows green/yellow/red correctly
- [ ] Drag-drop AND file picker both work
- [ ] Keyboard navigation works (Tab to upload zone, Enter to activate)
- [ ] Contract tests validate all 3 API endpoints
- [ ] Video files show thumbnail with play icon overlay
- [ ] Progress bar updates during upload
- [ ] Errors display with actionable messages

## Demo Readiness

✅ After this is complete, you can demo:
- User uploads banner ad
- Sees preview immediately
- Validation status shows (green = standard, yellow = non-standard)
- This is the MVP!

## Next Steps

Once complete, User Story 2 (multiple files) can extend this foundation.

## Questions?

Reference these files:
- **Spec**: `/specs/001-upload-asset-processing/spec.md` (User Story 1)
- **Plan**: `/specs/001-upload-asset-processing/plan.md`
- **Quickstart**: `/specs/001-upload-asset-processing/quickstart.md` (Test Scenario 1)
- **Contracts**: `/specs/001-upload-asset-processing/contracts/*.yaml`
- **Full Tasks**: `/specs/001-upload-asset-processing/tasks.md` (Phase 3)
