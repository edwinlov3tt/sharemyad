# Foundation Setup - Upload & Asset Processing

**Status**: 🚧 **MUST COMPLETE FIRST** - Blocks all other workstreams

**Assigned To**: _[Team Member Name]_

**Estimated Time**: 4-6 hours

---

## Context

This is the foundational infrastructure that ALL user stories depend on. No other work can proceed until this phase is complete. You're setting up the database schema, TypeScript types, and shared services that will be used by all features.

## Prerequisites

- [ ] Read `/specs/001-upload-asset-processing/spec.md` - Understand user stories and requirements
- [ ] Read `/specs/001-upload-asset-processing/plan.md` - Understand technical approach
- [ ] Read `/specs/001-upload-asset-processing/data-model.md` - Understand database schema
- [ ] Review `/specs/001-upload-asset-processing/tasks.md` - Full task list

## Your Tasks

Execute **tasks T001-T027** from `tasks.md`:

### Phase 1: Setup (T001-T010)
- Create frontend project structure with Vite + React + TypeScript
- Initialize package.json with dependencies
- Configure TypeScript, ESLint, Prettier
- Setup Supabase functions directory
- Create validation-standards.json
- Setup test frameworks (Vitest, Playwright)

### Phase 2: Foundational (T011-T027)
- Create all 6 database migrations (upload_sessions, creative_sets, creative_assets, thumbnails, processing_jobs, folder_structure)
- Create database triggers and RLS policies
- Create TypeScript types (upload.types.ts, asset.types.ts, processing.types.ts)
- Create shared services (database.ts, storage.ts, apiClient.ts)
- Create shared components (ErrorBoundary.tsx, LoadingSpinner.tsx)

## Constitution Compliance

**⚠️ CRITICAL - These are NON-NEGOTIABLE**:

1. **TypeScript Strict Mode** - No `any` types, enable all strict checks
2. **Test-First Development** - Write tests before implementation (though most tests come in user story phases)
3. **Security First** - Verify RLS policies enforce user-scoped access
4. **Data-Driven Validation** - Validation standards in JSON with source URLs
5. **Performance** - Database indexes on high-traffic queries

## Key Files to Create

```
frontend/
├── src/
│   ├── types/
│   │   ├── upload.types.ts
│   │   ├── asset.types.ts
│   │   └── processing.types.ts
│   ├── services/
│   │   └── apiClient.ts
│   ├── components/shared/
│   │   ├── ErrorBoundary.tsx
│   │   └── LoadingSpinner.tsx
│   └── config/
│       └── validation-standards.json

supabase/
├── functions/shared/
│   ├── database.ts
│   └── storage.ts
└── migrations/
    ├── 20251109_001_create_upload_sessions.sql
    ├── 20251109_002_create_creative_sets.sql
    ├── 20251109_003_create_creative_assets.sql
    ├── 20251109_004_create_thumbnails.sql
    ├── 20251109_005_create_processing_jobs.sql
    ├── 20251109_006_create_folder_structure.sql
    ├── 20251109_007_create_triggers.sql
    └── 20251109_008_create_rls_policies.sql
```

## Verification Checklist

Before marking this workstream complete:

- [ ] All migrations run successfully in local Supabase instance
- [ ] TypeScript compiles with no errors (strict mode)
- [ ] Database schema matches data-model.md exactly
- [ ] RLS policies enforce user_id scoping
- [ ] validation-standards.json includes IAB, Google, Meta, TikTok standards with source URLs
- [ ] Shared services have proper error handling
- [ ] ErrorBoundary component handles React errors gracefully

## Next Steps

Once complete, **NOTIFY ALL OTHER TEAM MEMBERS** that foundation is ready. User Stories 1-5 can now proceed in parallel.

## Questions?

Reference these files:
- **Spec**: `/specs/001-upload-asset-processing/spec.md`
- **Plan**: `/specs/001-upload-asset-processing/plan.md`
- **Data Model**: `/specs/001-upload-asset-processing/data-model.md`
- **Research**: `/specs/001-upload-asset-processing/research.md`
- **Full Tasks**: `/specs/001-upload-asset-processing/tasks.md`
