# Security & Polish - Upload & Asset Processing

**Status**: 🔒 **Final Phase**

**Assigned To**: _[Team Member Name]_

**Estimated Time**: 6-8 hours

---

## Context

You're implementing security hardening (malware scanning, validation enforcement) and polishing the feature for production (accessibility, browser compatibility, documentation). This phase ensures the feature is secure, accessible, and production-ready.

**Goal**: All uploads scanned for malware, all components accessible (keyboard nav, screen readers), all browsers supported, complete documentation.

## Prerequisites

**⚠️ BLOCKED UNTIL**:
- [ ] Foundation setup complete (00-foundation.md)
- [ ] At least User Story 1 complete (01-user-story-1.md)

**Recommended**:
- All user stories complete for comprehensive testing

## Your Tasks

Execute **tasks T119-T143** from `tasks.md`:

### Security Hardening (T119-T124)
- [ ] T119-T120: Implement ClamAV malware scanner in edge function
- [ ] T121: Add password-protected zip detection
- [ ] T122: Add security headers (HTTPS, HSTS) to all edge functions
- [ ] T123: Audit and verify RLS policies
- [ ] T124: Verify signed URLs expire after 1 hour

### Accessibility (T125-T127)
- [ ] T125: Run axe-core audit and fix violations
- [ ] T126: Test complete keyboard navigation flow
- [ ] T127: Test screen reader compatibility (NVDA/JAWS)

### Performance Optimization (T128-T130)
- [ ] T128: Run Lighthouse CI and address regressions
- [ ] T129: Optimize bundle size and code splitting
- [ ] T130: Verify API response times < 200ms p95

### Browser Compatibility (T131-T134)
- [ ] T131: Test in Chrome 90+
- [ ] T132: Test in Firefox 88+
- [ ] T133: Test in Safari 14+
- [ ] T134: Test in Edge 90+

### Documentation (T135-T137)
- [ ] T135: Update CLAUDE.md with implementation details
- [ ] T136: Create API documentation from OpenAPI specs
- [ ] T137: Document environment variables in README

### Testing & Validation (T138-T140)
- [ ] T138: Run complete quickstart.md manual test scenarios
- [ ] T139: Verify all 15 success criteria met (SC-001 through SC-015)
- [ ] T140: Verify all 30 functional requirements (FR-001 through FR-030)

### Code Quality (T141-T143)
- [ ] T141: Run ESLint and fix warnings
- [ ] T142: Code review and refactoring for simplicity
- [ ] T143: Remove unused dependencies

## Constitution Compliance

**Security (NON-NEGOTIABLE)**:
- All uploads scanned for malware before R2 transfer
- All file signatures verified (magic bytes)
- All RLS policies enforce user-scoped access
- All signed URLs expire (1-hour maximum)

**Accessibility (NON-NEGOTIABLE)**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation for all features
- Screen reader support
- Color contrast ≥ 4.5:1

**Performance (NON-NEGOTIABLE)**:
- No performance regressions (Lighthouse CI)
- API response < 200ms p95
- All success criteria met

## Key Files to Create/Modify

```
supabase/functions/process-upload/
└── malwareScanner.ts             # NEW: ClamAV integration

frontend/
├── README.md                      # UPDATE: Environment variables, setup
└── lighthouse.config.js           # NEW: Performance benchmarks

docs/
└── api/                           # NEW: API documentation
    ├── upload.md
    ├── process.md
    └── status.md

CLAUDE.md                          # UPDATE: Implementation patterns
```

## Manual Testing Checklist

### Accessibility Testing
- [ ] Tab through entire upload flow (no mouse)
- [ ] Upload zone focusable and activatable via keyboard
- [ ] File picker opens with Enter/Space
- [ ] Preview grid navigable with arrow keys
- [ ] Screen reader announces progress updates
- [ ] Screen reader announces validation results
- [ ] Error messages announced clearly
- [ ] Focus indicators visible on all elements

### Browser Compatibility
Test complete upload flow in each browser:
- [ ] Chrome 90+ (Windows, macOS, Linux)
- [ ] Firefox 88+ (Windows, macOS, Linux)
- [ ] Safari 14+ (macOS, iOS)
- [ ] Edge 90+ (Windows)

Verify:
- [ ] Drag-drop works
- [ ] File picker works
- [ ] Upload progress displays
- [ ] Previews load
- [ ] Validation status shows

### Security Testing
- [ ] Upload legitimate file → Passes malware scan
- [ ] Upload EICAR test file → Rejected with clear error
- [ ] Upload password-protected zip → Error: "Cannot extract password-protected archive"
- [ ] Try to access another user's upload session → 403 Forbidden (RLS blocks)
- [ ] Signed URL expires after 1 hour → 401 Unauthorized

### Performance Testing
Run benchmarks from `quickstart.md`:
- [ ] Single file upload (< 10MB): < 3 seconds
- [ ] Zip extraction start (500MB): < 10 seconds
- [ ] Thumbnail generation (100 images): < 30 seconds
- [ ] Video thumbnail extraction: < 5 seconds per video
- [ ] Preview grid scroll (500+ assets): 60 FPS
- [ ] API response: < 200ms p95 latency

## Success Criteria Verification

Verify all 15 success criteria from spec.md:
- [ ] SC-001: Single file preview < 3s
- [ ] SC-002: Zip extraction begins < 10s
- [ ] SC-003: 100 image thumbnails < 30s
- [ ] SC-004: Video thumbnail < 5s
- [ ] SC-005: 500 files without degradation
- [ ] SC-006: State preservation 100% reliable
- [ ] SC-007: Progress updates every 2s
- [ ] SC-008: 60 FPS scroll with 500+ assets
- [ ] SC-009: 95% upload success rate
- [ ] SC-010: Notification within 3s
- [ ] SC-011: Creative set detection 90% accuracy
- [ ] SC-012: Validation < 1s
- [ ] SC-013: 100% actionable error messages
- [ ] SC-014: 95% resumable upload recovery
- [ ] SC-015: 100% duplicate filename handling

## Functional Requirements Verification

Verify all 30 functional requirements from spec.md (FR-001 through FR-030):
- [ ] FR-001: Drag-and-drop interface
- [ ] FR-002: Click-to-browse file picker
- [ ] FR-003: Support JPG, PNG, GIF, MP4, WEBM, HTML5
- [ ] FR-004: Support zip files up to 500MB
- [ ] FR-005: 500-file maximum limit enforced
- ...continue through FR-030

## Production Readiness Checklist

Before marking feature complete:
- [ ] All tests pass (unit, integration, contract, E2E, performance)
- [ ] axe-core audit passes (0 violations)
- [ ] Lighthouse score: Performance ≥ 90, Accessibility = 100
- [ ] All 4 browsers tested and working
- [ ] Malware scanning active and tested
- [ ] RLS policies enforce user-scoped access
- [ ] All success criteria met
- [ ] All functional requirements met
- [ ] Documentation complete (API docs, README, CLAUDE.md)
- [ ] No ESLint warnings
- [ ] No unused dependencies
- [ ] Code reviewed for simplicity

## Demo Readiness

✅ After this is complete, feature is PRODUCTION READY:
- Users can safely upload files
- All uploads scanned for malware
- Accessible to users with disabilities
- Works in all major browsers
- Performance targets met
- Secure and compliant with constitution

## Questions?

Reference these files:
- **Spec**: `/specs/001-upload-asset-processing/spec.md` (Success Criteria, Requirements)
- **Plan**: `/specs/001-upload-asset-processing/plan.md` (Constitution compliance)
- **Quickstart**: `/specs/001-upload-asset-processing/quickstart.md` (All test scenarios)
- **Full Tasks**: `/specs/001-upload-asset-processing/tasks.md` (Phases 8-9)
