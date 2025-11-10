# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ShareMyAd** is a lightweight web application for uploading creative assets (banner ads, social ads, videos), validating them against industry standards, and generating professional shareable links for client review. The platform emphasizes simplicity through progressive disclosure following Hick's Law.

### Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Supabase (PostgreSQL + Storage + Auth) + Edge Functions
- **Storage**: Cloudflare R2 for long-term asset storage
- **Hosting**: Vercel (frontend) + Supabase (backend)
- **Processing**: Edge functions for zip extraction/validation

### Supabase Database Configuration

**CRITICAL**: This project uses ONE database only. Do NOT use any other Supabase project.

**Project**: ShareMyAd
**Project Reference ID**: `gnurilaiddffxfjujegu`
**Region**: us-east-2
**Supabase URL**: `https://gnurilaiddffxfjujegu.supabase.co`
**Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdudXJpbGFpZGRmZnhmanVqZWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NDk3MzksImV4cCI6MjA3ODMyNTczOX0.FSjyDjyxSBzDT6vUYGhgwJ946noSbeUkXIvuTlYoSYw`

**Environment Variables**:
```
REACT_APP_SUPABASE_URL=https://gnurilaiddffxfjujegu.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdudXJpbGFpZGRmZnhmanVqZWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NDk3MzksImV4cCI6MjA3ODMyNTczOX0.FSjyDjyxSBzDT6vUYGhgwJ946noSbeUkXIvuTlYoSYw
```

**CLI Commands**: Always use `--project-ref gnurilaiddffxfjujegu` or ensure project is linked with `supabase link --project-ref gnurilaiddffxfjujegu`

## Architecture

### Data Hierarchy

```
Advertiser (auto-created from website_url domain)
└── Project (upload session)
    └── Creative Sets (A/B/C variants if detected from folder structure)
        └── Creatives (individual assets: JPG, PNG, GIF, MP4, WEBM, HTML5)
```

### Core User Flow (MVP)

1. **Upload** → Drag & drop or click upload (zip/folder/files up to 500MB)
2. **Process** → Extract and validate assets while user enters advertiser details
3. **Preview** → Review validation results with traffic light system (green/yellow/red)
4. **Share** → Generate unique link with optional email delivery

### Database Schema

**Key Tables**:
- `advertisers` - Auto-generated profiles from website domains
- `projects` - Upload sessions with share_slug, expires_at, view_count
- `creative_sets` - Versions/variants (A/B/C from folder structure)
- `creatives` - Individual assets with validation_status, dimensions, file_size
- `share_links` - Public access with password_hash, max_views, expiration
- `view_analytics` - Tracking with hashed IPs (no PII storage)

### Validation Engine

Asset validation uses **documented industry standards** (IAB, Google Ads, Meta, TikTok):

```javascript
// Standards externalized, not hardcoded
const IAB_STANDARDS = {
  'display': {
    '300x250': { name: 'Medium Rectangle', maxSize: 200 },
    '728x90': { name: 'Leaderboard', maxSize: 200 },
    '320x50': { name: 'Mobile Banner', maxSize: 100 }
  },
  'social': {
    '1080x1080': { name: 'Instagram Square', maxSize: 30720 },
    '1200x630': { name: 'Facebook Link', maxSize: 8192 }
  }
}
```

**Validation Results**:
- ✓ Green: Standard {platform} {size}
- ⚠ Yellow: Non-standard dimensions
- ✗ Red: File too large or invalid format

## Constitution & Principles

**Location**: `.specify/memory/constitution.md` (v1.0.0)

All code MUST comply with these **NON-NEGOTIABLE** principles:

### I. Simplicity Through Progressive Disclosure
- Default view: ONLY essential controls visible
- Advanced features hidden behind explicit toggles
- Maximum one primary CTA per screen
- Smart defaults for 80% use cases

### II. Performance & Responsiveness
- Upload to share: **< 60 seconds** (up to 500MB)
- Page load: **< 2 seconds** on 3G
- Time to interactive: **< 3 seconds**
- Asset preview: **< 500ms** per asset
- API response: **< 200ms** p95 latency
- Performance regressions **block deployment**

### III. Security & Privacy First
- Share slugs: nanoid (21+ chars minimum)
- Rate limiting: 100 req/min per IP
- Password hashing: bcrypt (cost ≥ 12)
- IP hashing for analytics (no PII storage)
- HTTPS-only, HSTS headers, secure cookies
- Input validation on all uploads (MIME type, file signatures, malware scan)

### IV. Test-First Development
- Tests written **before** implementation (Red-Green-Refactor)
- Coverage: 100% core validation, 100% API endpoints, ≥85% business logic
- Test types: Unit, Integration, Contract, Performance
- Tests must **fail** before code passes them

### V. Accessibility as Default
- WCAG 2.1 Level AA compliance
- Keyboard navigation, screen reader support
- Color contrast ≥ 4.5:1 (normal), ≥ 3:1 (large)
- axe-core audits in CI pipeline

### VI. Data-Driven Validation
- Standards externalized (no magic numbers)
- Source URLs documented in validation config
- Updates require source citation and date

## Specify Framework Workflow

This repository uses the **Specify framework** for feature development. All slash commands begin with `/speckit.`:

### Feature Development Lifecycle

1. **`/speckit.specify "feature description"`**
   - Generates feature spec from natural language
   - Creates branch `N-short-name` (auto-increments N)
   - Creates `specs/N-short-name/spec.md` with user stories (P1, P2, P3...)
   - Each user story MUST be independently testable

2. **`/speckit.clarify`** (optional)
   - Identifies underspecified areas in spec
   - Asks targeted clarification questions (max 5)
   - Updates spec.md with answers

3. **`/speckit.plan`**
   - Generates `plan.md` (tech context, constitution check)
   - Phase 0: `research.md` (resolve unknowns)
   - Phase 1: `data-model.md`, `contracts/`, `quickstart.md`
   - Re-evaluates constitution compliance post-design

4. **`/speckit.tasks`**
   - Generates `tasks.md` from design artifacts
   - Organizes tasks by user story (P1 → P2 → P3)
   - Each story independently implementable and testable
   - Includes parallel execution opportunities

5. **`/speckit.checklist`** (optional)
   - Generates custom checklists (UX, security, performance, etc.)
   - Stored in `specs/N-short-name/checklists/`

6. **`/speckit.implement`**
   - Checks checklist completion status (warns if incomplete)
   - Executes tasks from tasks.md
   - Follows test-first workflow

7. **`/speckit.analyze`** (after task generation)
   - Non-destructive cross-artifact consistency check
   - Validates spec.md ↔ plan.md ↔ tasks.md alignment

### Specify Directory Structure

```
specs/
└── N-short-name/           # Feature number + kebab-case name
    ├── spec.md             # User stories with priorities
    ├── plan.md             # Implementation plan
    ├── research.md         # Phase 0 research decisions
    ├── data-model.md       # Entities and relationships
    ├── quickstart.md       # Test scenarios
    ├── tasks.md            # Dependency-ordered task list
    ├── contracts/          # API endpoint specs
    └── checklists/         # Custom validation checklists
```

### Best Practices from Spec Creation (001-upload-asset-processing)

**Feature Scope Management**:
- Clearly define what's **included** vs. **deferred** to future features
- Create "Feature Scope & Boundaries" section in plan.md with:
  - ✅ Included in This Feature (###)
  - ❌ Deferred to Future Features
  - 🔗 Integration Points for Future Features
- Provide migration paths for future feature integration
- Example: 001 focused on upload/processing only, deferring projects, share links, and analytics to 002-003

**User Story Independence**:
- Each user story (P1, P2, P3...) MUST be independently testable
- P1 = Simplest case, establishes foundation (e.g., single file upload)
- P2 = Builds on P1 (e.g., multiple files)
- P3 = Most complex (e.g., zip extraction with creative sets)
- Higher priorities = Performance/UX enhancements, not dependencies
- Test: Can you demo P1 without P2? If no, refactor priorities

**Test-First Development (Critical)**:
- Tests MUST be written BEFORE implementation
- Tests MUST FAIL initially (Red phase)
- Implement minimal code to pass (Green phase)
- Refactor while keeping tests green (Refactor phase)
- Include explicit "Verify tests FAIL" tasks in tasks.md
- Include explicit "Verify tests PASS" tasks after implementation

**Constitution Compliance**:
- Check compliance BEFORE research (plan.md: Constitution Check)
- Re-check compliance AFTER design (plan.md: Post-Design Re-Evaluation)
- Verify all 6 principles satisfied at both checkpoints
- Document any justified complexity in "Complexity Tracking" section

**Performance Targets**:
- Define specific, measurable targets in plan.md (e.g., "< 3s preview", "60 FPS scroll")
- Map targets to Success Criteria in spec.md (SC-001, SC-002...)
- Create performance test tasks in tasks.md
- Include timing measurements in quickstart.md manual tests

**Validation Standards**:
- Externalize validation rules in JSON config files
- Include source URLs for all standards (IAB, Google, Meta, TikTok)
- Add version tracking and lastUpdated timestamps
- Provide fallback rules for non-standard cases
- Example structure:
```json
{
  "version": "1.0.0",
  "sources": {
    "iab": "https://www.iab.com/..."
  },
  "standards": {
    "display": { "iab": [...] }
  }
}
```

**Edge Case Coverage**:
- Document edge cases in spec.md with "What happens when..." format
- Include error scenarios (corrupted files, password-protected archives, network interruption)
- Implement graceful degradation (partial success, not complete failure)
- Add edge case test scenarios in quickstart.md

**Parallel Execution**:
- Mark tasks with [P] when they can run concurrently
- Criteria for [P]: Different files, no dependencies on incomplete tasks
- Identify parallel opportunities per phase in tasks.md
- Example: All migrations can run in parallel, all type definitions can run in parallel

**Task Organization**:
- Phase 1: Setup (project initialization)
- Phase 2: Foundational (BLOCKS all user stories)
- Phase 3+: One phase per user story (P1, P2, P3...)
- Final Phase: Polish & cross-cutting concerns
- Each phase should have a clear **Checkpoint** deliverable

**Complexity Justification**:
- When adding complexity, document in plan.md "Complexity Tracking"
- Format: Component → Why Needed → Why Simpler Alternative Rejected
- Example: "ClamAV malware scanning → Security requirement for user uploads → No client-side alternative exists"
- All complexity must serve constitution principles or explicit requirements

**Quickstart Manual Tests**:
- Create test case for EACH acceptance scenario from spec.md
- Include "Expected Results" with checkboxes
- Add "Actual Results" placeholders for tester notes
- Organize by user story (Test Scenario 1 = User Story 1)
- Include performance benchmarks table with Target | Actual | Pass/Fail columns
- Add accessibility testing section (keyboard nav, screen reader)
- Add browser compatibility matrix

## Code Patterns

### Locality of Behavior
Keep related code close together:
```typescript
// ✓ Good: Validation logic near data structure
interface Creative {
  width: number;
  height: number;
  validateDimensions(): ValidationResult;
}

// ✗ Bad: Validation in separate "ValidationService"
```

### Type Safety
- TypeScript strict mode enabled
- No `any` types except third-party integration boundaries
- Use discriminated unions for validation states

### Progressive Features
Features revealed based on user action:
```typescript
// Default: Simple upload UI
<UploadZone />

// Advanced (hidden by default):
<AdvancedOptions>
  <BulkRename />
  <Compression />
  <EmailDelivery />
</AdvancedOptions>
```

## API Endpoints

```typescript
// Core Operations
POST   /api/upload                 // Multipart upload → project_id
GET    /api/projects/:id           // Project details + creatives
POST   /api/projects/:id/share     // Generate shareable link
POST   /api/projects/:id/email     // Send email to recipients

// Public Access (no auth required)
GET    /share/:slug                // Public view page
GET    /share/:slug/download       // Download all assets (if enabled)

// Processing
POST   /api/projects/:id/process   // Apply compression/renaming
PATCH  /api/creatives/:id          // Update creative metadata
```

## Performance Limits

**Enforced Constraints**:
- Max upload: 500MB per zip
- Max files: 500 per project
- Storage quota: 10GB per user (MVP)
- API rate limits: 100 requests/minute per IP

**Optimization Requirements**:
- Lazy load thumbnails (IntersectionObserver)
- Progressive image loading (blur-up technique)
- CDN delivery for all static assets
- Background processing for large zips with progress updates

## Security Requirements

### Input Validation
- Whitelist MIME types: JPG, PNG, GIF, MP4, WEBM, HTML
- Verify file signatures (magic bytes), not just extensions
- Scan for malware (ClamAV or cloud-based)
- Reject zip bombs and excessively nested archives
- Sanitize filenames (length limits, special chars)

### Access Control
- Share links scoped to project (no cross-project leakage)
- Optional password protection (bcrypt cost ≥ 12)
- Optional view count limits (self-destructing links)
- Optional expiration dates (never expire by default)
- Supabase RLS (Row Level Security) for all tables

### Audit Logging
Log all share link events:
- Creation (user, timestamp, project)
- Access (hashed IP, timestamp, user agent)
- Failed auth attempts (trigger rate limiting)
- File uploads (size, type, validation result)

## Development Workflow

### Constitution Compliance Check
All PRs MUST:
1. Pass automated tests (unit, integration, contract, performance)
2. Pass accessibility audit (axe-core)
3. Pass performance benchmarks (no regressions)
4. Address all linter warnings
5. Justify complexity in `plan.md` "Complexity Tracking" section

### Complexity Justification
When violating "Solve Today's Problems" or "Minimal Abstraction":

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Repository pattern | Multi-storage backend (R2 + Supabase) | Direct DB access couples to single backend |

### Version Semantics (Constitution)
- **MAJOR** (X.0.0): Removing principles, changing testing approach
- **MINOR** (x.Y.0): New principle or material expansion
- **PATCH** (x.y.Z): Clarifications, wording fixes

## Success Metrics

- Upload to share time: **< 60 seconds**
- Zero-click sharing: Link auto-copied to clipboard
- Successful validation rate: **≥ 90%**
- Primary flow: **< 3 clicks**

## Implementation Priority (Roadmap)

### Week 1-2: Core Upload Flow
- Upload interface (drag-and-drop)
- Extraction pipeline (zip handling, folder structure detection)
- Validation engine (IAB standards, platform limits)
- Basic preview grid

### Week 3-4: Sharing & Delivery
- Link generation (nanoid slugs)
- Public share pages
- Email integration
- Download functionality

### Week 5-6: Polish & Advanced Features
- Advertiser profiles (auto-created from domains)
- Progressive UI features (bulk rename, compression)
- Analytics tracking (hashed IPs)
- Performance optimization

### Phase 2 (Post-MVP)
- Flight dates (start/end dates for campaigns)
- Calendar integration (visual timeline + personal calendar sync)
- Preview on sites (show ads in context)
- AI features (auto-tagging, copy extraction, grammar validation, accessibility checks)

## Active Technologies
- TypeScript 5.3+ (frontend + edge functions), Node.js 20+ (build tooling) (001-upload-asset-processing)

## Recent Changes
- 001-upload-asset-processing: Added TypeScript 5.3+ (frontend + edge functions), Node.js 20+ (build tooling)
