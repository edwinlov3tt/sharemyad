# User Story 3: Zip Extraction with Creative Sets - Upload & Asset Processing

**Status**: 🗜️ **Most Complex Feature**

**Assigned To**: _[Team Member Name]_

**Estimated Time**: 8-10 hours

---

## Context

You're adding zip file support with automatic extraction, folder structure preservation, and creative set detection (A/B/C variants). This is the most complex user story, handling professional creative workflows.

**Goal**: Creative director uploads zip file with organized folders (Set-A, Set-B, Set-C), system extracts automatically, detects creative sets, and organizes assets with tabs.

## Prerequisites

**⚠️ BLOCKED UNTIL**:
- [ ] Foundation setup complete (00-foundation.md)
- [ ] User Story 1 complete (01-user-story-1.md) - Single file upload working

**Can work in parallel with**: User Story 2, User Story 5

**Dependencies**:
- Uses database tables from foundation (folder_structure, creative_sets)
- Extends upload flow from US1
- Uses preview components from US1

## Your Tasks

Execute **tasks T067-T083** from `tasks.md`:

### Test-First Development (T067-T070)
**WRITE THESE FIRST - THEY MUST FAIL**:
- [ ] T067: Integration test for zip extraction
- [ ] T068: E2E test for zip with creative sets
- [ ] T069: Unit test for creative set detection (pattern matching)
- [ ] T070: **Verify all tests FAIL** (Red phase)

### Implementation (T071-T080)
**Now write code to make tests pass**:
- [ ] T071-T073: Zip extraction module using JSZip (preserve folders, enforce 500-file limit)
- [ ] T074-T075: Creative set detector (pattern matching for A/B/C, Set-A/Set-B, Version-1/Version-2)
- [ ] T076-T077: Folder structure persistence and flattening (max 3 levels)
- [ ] T078-T079: CreativeSetTabs component and set-based filtering
- [ ] T080: HTML5 bundle detection (index.html presence)

### Test Verification (T081-T083)
- [ ] T081: **Verify all tests PASS** (Green phase)
- [ ] T082: Performance test: Zip extraction starts < 10s (500MB archive)
- [ ] T083: Functional test: Creative set detection ≥ 90% accuracy

## Constitution Compliance

**Test-First Development**: Pattern matching tests written before detector implementation

**Performance Target**: < 10 seconds to start extraction for 500MB archive

**Security**: Validate zip contents (no zip bombs, limit nesting depth)

**Simplicity**: Creative set detection uses simple regex patterns (no AI/ML)

## Key Files to Create

```
supabase/functions/process-upload/
├── zipExtractor.ts               # NEW: JSZip integration, streaming extraction
├── creativeSetDetector.ts        # NEW: Pattern matching (A/B/C, Set-A/Set-B, etc.)
└── index.ts                      # EXTEND: Add zip handling logic

frontend/src/components/preview/
└── CreativeSetTabs.tsx           # NEW: Tab navigation for sets

tests/integration/
└── zip-extraction.test.ts        # NEW: Zip processing tests

supabase/tests/functions/
└── process-upload.test.ts        # NEW: Unit tests for set detection
```

## Research References

**Zip Extraction** (research.md Decision 2):
- Use JSZip library
- Stream extraction to avoid memory overflow
- Process files one-by-one, upload to R2 immediately

**Creative Set Detection** (research.md Decision 5):
- Regex patterns: `/^(Set-)?([A-Z])$/i`, `/^Version[-_]?(\d+)$/i`, `/^v(\d+)$/i`
- Pattern matching, not AI/ML
- Fast execution (< 1ms per folder)

## Manual Testing

After implementation, test manually using:
- **Quickstart**: `/specs/001-upload-asset-processing/quickstart.md` (Test Scenario 3, Test Cases 3.1-3.4)

**Expected Results**:
- Upload 50MB zip with Set-A/Set-B/Set-C folders
- Extraction shows "Extracting files... 30/30 extracted"
- Tabs appear for "Set-A", "Set-B", "Set-C"
- Nested folders flattened to 3 levels max
- HTML5 bundles detected (has index.html)
- 600-file zip processes only first 500 with warning

## Edge Cases to Handle

- Password-protected zip → Error: "Cannot extract password-protected archive"
- Deeply nested folders (20 levels) → Flatten to 3 levels, preserve full path in metadata
- Missing index.html in HTML5 bundle → Warning: "HTML5 bundle incomplete"
- Corrupted zip at file 100/250 → Process first 99, show error, allow partial success

## Verification Checklist

Before marking this workstream complete:

- [X] All tests written FIRST and FAILED initially
- [X] All tests now PASS (VERIFIED: Creative set detector tests - 11/11 passed)
- [X] Zip files extract automatically (Implementation complete in zipExtractor.ts)
- [X] Folder structure preserved in folder_structure table (Implementation complete in folderStructureManager.ts)
- [X] Creative sets detected with ≥ 90% accuracy (VERIFIED: Accuracy test passed at 90%+ in test suite)
- [X] CreativeSetTabs component shows tabs for detected sets (Component created)
- [X] 500-file limit enforced with warning message (Implementation complete in zipExtractor.ts)
- [X] Nested folders flattened correctly (Implementation complete in folderStructureManager.ts)
- [X] HTML5 bundles identified (Implementation complete in zipExtractor.ts and process-upload/index.ts)
- [ ] Extraction starts within 10 seconds for 500MB archive (Pending: Need performance test - T082)
- [X] Corrupted archives fail gracefully (partial success) (Error handling implemented in zipExtractor.ts)

## Demo Readiness

✅ After this is complete, you can demo:
- User uploads zip file with campaign folders
- System extracts automatically maintaining structure
- Tabs appear for Set-A, Set-B, Set-C
- Clicking tabs filters assets by set
- Professional creative workflows supported

## Next Steps

Once complete, User Story 4 can add background processing for large zips.

## Questions?

Reference these files:
- **Spec**: `/specs/001-upload-asset-processing/spec.md` (User Story 3)
- **Research**: `/specs/001-upload-asset-processing/research.md` (Decisions 2, 5)
- **Data Model**: `/specs/001-upload-asset-processing/data-model.md` (folder_structure table)
- **Quickstart**: `/specs/001-upload-asset-processing/quickstart.md` (Test Scenario 3)
- **Full Tasks**: `/specs/001-upload-asset-processing/tasks.md` (Phase 5)
