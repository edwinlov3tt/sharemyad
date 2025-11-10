# Parallel Development Task Handoffs

**Feature**: Upload & Asset Processing
**Branch**: `001-upload-asset-processing`

---

## Overview

This directory contains handoff prompts for parallel development of the Upload & Asset Processing feature. Each file represents an independent workstream that can be assigned to a different Claude Code instance or developer.

## Execution Order

### Sequential Requirements

1. **MUST COMPLETE FIRST**: `00-foundation.md`
   - Tasks T001-T027
   - Estimated: 4-6 hours
   - Blocks: ALL other workstreams
   - Creates: Database schema, TypeScript types, shared services

### Parallel Development (After Foundation)

Once foundation is complete, these can proceed **in parallel**:

2. **MVP Priority**: `01-user-story-1.md` (Single File Upload)
   - Tasks T028-T054
   - Estimated: 8-12 hours
   - Can start immediately after foundation
   - Delivers: MVP functionality

3. **Extends MVP**: `02-user-story-2.md` (Multiple Files)
   - Tasks T055-T066
   - Estimated: 4-6 hours
   - Can start immediately after foundation
   - Extends: User Story 1 components

4. **Complex Feature**: `03-user-story-3.md` (Zip Extraction)
   - Tasks T067-T083
   - Estimated: 8-10 hours
   - Can start immediately after foundation
   - Independent from User Story 2

5. **Performance Enhancement**: `04-user-story-4.md` (Background Processing)
   - Tasks T084-T100
   - Estimated: 6-8 hours
   - Can start immediately after foundation
   - Works best with User Story 3 (zip files)

6. **Optimization**: `05-user-story-5.md` (Thumbnails)
   - Tasks T101-T118
   - Estimated: 6-8 hours
   - Can start immediately after foundation
   - Enhances all user stories

### Final Phase

7. **Production Readiness**: `06-security-polish.md`
   - Tasks T119-T143
   - Estimated: 6-8 hours
   - Should wait until most user stories complete
   - Secures, polishes, and validates entire feature

---

## Parallel Team Strategy

### With 3 Developers

**Week 1**:
- **All**: Foundation (00-foundation.md) - 1 day
- **Dev A**: User Story 1 (01-user-story-1.md) - 2 days
- **Dev B**: User Story 5 (05-user-story-5.md) - 2 days
- **Dev C**: User Story 3 (03-user-story-3.md) - 2 days

**Week 2**:
- **Dev A**: User Story 2 (02-user-story-2.md) - 1 day
- **Dev B**: User Story 4 (04-user-story-4.md) - 1.5 days
- **Dev C**: Continue User Story 3 or Security (06-security-polish.md)
- **All**: Integration, testing, polish - 2 days

### With 5 Developers

**Day 1**:
- **All**: Foundation (00-foundation.md)

**Days 2-4**:
- **Dev A**: User Story 1 (01-user-story-1.md)
- **Dev B**: User Story 2 (02-user-story-2.md)
- **Dev C**: User Story 3 (03-user-story-3.md)
- **Dev D**: User Story 4 (04-user-story-4.md)
- **Dev E**: User Story 5 (05-user-story-5.md)

**Days 5-6**:
- **All**: Security & Polish (06-security-polish.md)

---

## Workstream Independence

Each user story (1-5) is designed to be **independently testable**:

- ✅ User Story 1 works standalone → Demo single file upload
- ✅ User Story 2 extends US1 → Demo multiple file upload
- ✅ User Story 3 works with just US1 foundation → Demo zip extraction
- ✅ User Story 4 enhances US1/US3 → Demo background processing
- ✅ User Story 5 enhances all → Demo optimized thumbnails

This allows incremental delivery and validation at each checkpoint.

---

## How to Use These Prompts

### For Claude Code Instances

1. Start a new Claude Code session
2. Copy the entire prompt from the relevant .md file
3. Paste into Claude Code
4. Claude will execute the tasks autonomously

### For Human Developers

1. Read the assigned .md file
2. Follow the task sequence (Test-First!)
3. Reference spec files as needed
4. Complete verification checklist before marking done

---

## Reference Documents

All workstreams reference these shared documents:

- **Spec**: `/specs/001-upload-asset-processing/spec.md` - User stories and requirements
- **Plan**: `/specs/001-upload-asset-processing/plan.md` - Technical approach and constitution
- **Data Model**: `/specs/001-upload-asset-processing/data-model.md` - Database schema
- **Research**: `/specs/001-upload-asset-processing/research.md` - Technology decisions
- **Contracts**: `/specs/001-upload-asset-processing/contracts/*.yaml` - API specs
- **Quickstart**: `/specs/001-upload-asset-processing/quickstart.md` - Manual test scenarios
- **Full Tasks**: `/specs/001-upload-asset-processing/tasks.md` - Complete task breakdown

---

## Constitution Reminders

Every workstream MUST follow these **NON-NEGOTIABLE** principles:

1. **Test-First Development**: Write tests FIRST, ensure they FAIL, then implement
2. **Simplicity**: P1 is simplest, features progressively disclosed
3. **Performance**: Specific measurable targets (< 3s, 60 FPS)
4. **Security**: Multi-layer validation, RLS policies, malware scanning
5. **Accessibility**: WCAG 2.1 AA, keyboard nav, screen readers
6. **Data-Driven**: Validation standards externalized in JSON

---

## Questions?

If any workstream is unclear:
1. Check the full task breakdown: `/specs/001-upload-asset-processing/tasks.md`
2. Read the relevant section in spec.md
3. Review constitution: `/.specify/memory/constitution.md`
4. Check CLAUDE.md for project patterns
