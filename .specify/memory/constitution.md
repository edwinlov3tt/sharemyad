<!--
Sync Impact Report:
- Version: 1.0.0 (Initial Constitution)
- Ratification Date: 2025-11-09
- Modified Principles: N/A (Initial creation)
- Added Sections: All sections (initial creation)
- Removed Sections: None
- Template Status:
  ✅ .specify/templates/plan-template.md - reviewed, Constitution Check section aligns
  ✅ .specify/templates/spec-template.md - reviewed, requirements align with principles
  ✅ .specify/templates/tasks-template.md - reviewed, test-first approach supported
- Follow-up TODOs: None
-->

# ShareMyAd Constitution

## Core Principles

### I. Simplicity Through Progressive Disclosure (NON-NEGOTIABLE)

**Rule**: All features MUST follow Hick's Law - the default interface shows only essential controls; advanced features are hidden behind explicit user action.

**Application**:
- Default view contains ONLY the minimum required for primary user flow
- Advanced options hidden behind "Advanced Options" toggle or similar
- Maximum one primary CTA per screen
- Smart defaults pre-configure 80% use cases

**Rationale**: ShareMyAd serves both technical and non-technical users. Overwhelming users with options reduces conversion. Progressive disclosure ensures novice users succeed while power users can access advanced features when needed.

### II. Performance & Responsiveness (NON-NEGOTIABLE)

**Rule**: All user-facing operations MUST meet strict performance targets without exception.

**Targets**:
- Upload to share link generation: < 60 seconds (for files up to 500MB)
- Page load time: < 2 seconds on 3G connection
- Time to interactive: < 3 seconds
- Asset preview rendering: < 500ms per asset
- API response time: < 200ms p95 latency
- Zero-click sharing: Link auto-copied to clipboard

**Testing**: Performance tests MUST be included in integration test suite. Performance regressions block deployment.

**Rationale**: Users share creative assets under tight deadlines. Slow tools get abandoned. The success metric is "< 60 seconds upload to share" and "< 3 clicks to complete primary flow."

### III. Security & Privacy First

**Rule**: Security considerations MUST be evaluated at design time, not retrofitted.

**Mandatory Practices**:
- Unguessable share slugs using nanoid (21+ characters minimum)
- Rate limiting on all public endpoints (100 requests/minute per IP)
- Password hashing using bcrypt (cost factor ≥ 12) when password protection enabled
- Audit logs for all share actions and views
- IP hashing for analytics (no PII storage)
- Input validation on all file uploads (type, size, content scanning)
- SQL injection prevention via parameterized queries only
- XSS prevention via content security policy and output encoding
- HTTPS-only in production (HSTS headers enforced)

**Prohibited**:
- Storing plaintext passwords
- Exposing internal IDs in public URLs
- Executing user-uploaded code without sandboxing
- Storing raw IP addresses in analytics

**Rationale**: Creative assets often contain unreleased marketing material. Breaches destroy trust and violate client confidentiality. Security is a feature, not a constraint.

### IV. Test-First Development

**Rule**: Tests MUST be written before implementation and MUST fail before code is written to pass them.

**Approach**:
- **Unit Tests**: Required for all validation logic, data transformations, utility functions
- **Integration Tests**: Required for file upload pipeline, extraction, validation, share link generation
- **Contract Tests**: Required for all API endpoints
- **Performance Tests**: Required for upload processing and page load scenarios

**Workflow**:
1. Write test describing expected behavior
2. Verify test fails (red)
3. Implement minimal code to pass (green)
4. Refactor while keeping tests green

**Coverage Targets**:
- Core validation logic: 100%
- API endpoints: 100%
- Business logic: ≥ 85%
- UI components: ≥ 70%

**Rationale**: ShareMyAd validates creative assets against industry standards. Incorrect validation wastes user time and damages credibility. Tests are the specification.

### V. Accessibility as Default

**Rule**: All UI MUST meet WCAG 2.1 Level AA standards without requiring user configuration.

**Requirements**:
- Keyboard navigation support for all interactive elements
- Screen reader compatibility (semantic HTML, ARIA labels)
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- Focus indicators visible on all interactive elements
- Alternative text for all images and visual content
- No time-based interactions without user control
- Responsive design supporting 320px minimum width

**Testing**: Accessibility audits using axe-core or similar MUST be part of CI pipeline.

**Rationale**: Creative professionals include users with diverse abilities. Inaccessible tools exclude talent and violate inclusive design principles.

### VI. Data-Driven Validation

**Rule**: Asset validation MUST be based on documented industry standards with clear sources.

**Standards**:
- IAB standard ad sizes and file size limits (documented in code)
- Platform-specific limits (Google Ads, Meta, TikTok, etc.) with source links
- Video specifications (duration, codec, bitrate) per platform
- Validation results displayed with traffic light system (green/yellow/red)

**Updates**:
- Standards MUST be externalized (not hardcoded magic numbers)
- Source URLs MUST be included in validation configuration
- Updates to standards require documentation of source and date

**Rationale**: Industry standards change frequently. Hardcoded values become stale and mislead users. Traceable standards enable confident updates.

## Code Quality & Maintainability

### Code Organization

**Structure**:
- **Frontend**: Vite + React + TypeScript with component-based architecture
- **Backend**: Supabase (PostgreSQL + Storage + Auth) + Edge Functions
- **Storage**: Cloudflare R2 for long-term asset storage
- **Hosting**: Vercel (frontend) + Supabase (backend)

**Patterns**:
- **Locality of Behavior**: Related code lives together; avoid excessive abstraction
- **Single Responsibility**: Each module has one clear purpose
- **DRY with Judgment**: Eliminate duplication when it reduces complexity, not as dogma
- **Type Safety**: TypeScript strict mode enabled; no `any` types except third-party integration boundaries

### Code Review Standards

**All PRs MUST**:
- Pass automated tests (unit, integration, contract)
- Pass accessibility audit
- Pass performance benchmarks
- Include updated documentation if API changes
- Follow existing naming conventions and project structure
- Address all linter warnings

**Complexity Justification**:
- New abstractions (classes, patterns) MUST justify why simpler direct code is insufficient
- Premature optimization is prohibited; optimize based on measured performance issues

## User Experience Consistency

### Design Principles

**Visual Consistency**:
- Use design system components (no one-off custom styling)
- Consistent spacing, typography, color palette
- Predictable interaction patterns (e.g., all modals behave identically)

**Feedback & Communication**:
- Loading states for all async operations (< 300ms shows spinner)
- Success/error messages use consistent toast/notification system
- Progress indicators for long operations (upload, processing)
- Clear error messages with actionable next steps (not generic "Error occurred")

**Copy & Tone**:
- Active voice, concise language
- Technical accuracy without jargon
- Action-oriented button labels ("Generate Share Link" not "Submit")

### Progressive Enhancement

**Core Functionality**:
- Basic upload and share link generation works without JavaScript (fallback form)
- Enhanced features (drag-and-drop, real-time validation) layer on top
- Graceful degradation for older browsers (warn users, don't break silently)

## Performance Requirements

### Load Time Targets

**Initial Load**:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

**Asset Handling**:
- Lazy load thumbnails (IntersectionObserver)
- Progressive image loading (blur-up technique)
- CDN delivery for all static assets
- Efficient video thumbnail generation (first frame extraction)

### Scalability

**Limits** (enforced and communicated):
- Max upload: 500MB per zip
- Max files: 500 per project
- Storage quota: 10GB per user (MVP)
- API rate limits: 100 requests/minute per IP

**Background Processing**:
- Large zip extraction runs asynchronously with progress updates
- Thumbnail generation batched to avoid blocking
- Validation runs concurrently for multiple assets

## Security Best Practices

### Input Validation

**File Uploads**:
- Whitelist allowed MIME types (JPG, PNG, GIF, MP4, WEBM, HTML)
- Verify file signatures (magic bytes), not just extensions
- Scan for malware using ClamAV or cloud-based scanning
- Limit filename length and sanitize special characters
- Reject zip bombs and excessively nested archives

**User Input**:
- Sanitize all text inputs before storage and display
- Validate email addresses using RFC-compliant regex
- Validate URLs using URL parsing library (not regex)
- Limit input lengths to prevent DoS

### Data Protection

**At Rest**:
- Encrypt sensitive data in database (advertiser details if collected)
- Use Supabase RLS (Row Level Security) to enforce access control

**In Transit**:
- HTTPS only (redirect HTTP → HTTPS)
- HSTS headers (max-age: 31536000)
- Secure cookie flags (httpOnly, secure, sameSite)

**Access Control**:
- Share links scoped to project (no cross-project data leakage)
- Optional password protection using bcrypt
- Optional view count limits (self-destructing links)
- Optional expiration dates (never expire by default)

### Audit & Monitoring

**Logging**:
- Log all share link creation events (user, timestamp, project)
- Log all share link access (hashed IP, timestamp, user agent)
- Log failed authentication attempts (rate limiting trigger)
- Log file upload events (size, type, validation result)

**Alerting**:
- Alert on abnormal upload patterns (potential abuse)
- Alert on repeated authentication failures (brute force attempts)
- Alert on performance degradation (p95 > 500ms)

## Governance

### Amendment Process

**Proposing Changes**:
1. Document the proposed change (what, why, impact)
2. Identify affected systems and migration requirements
3. Get consensus from team (async approval for minor, meeting for major)
4. Update constitution with version bump

**Version Semantics**:
- **MAJOR** (X.0.0): Backward incompatible change (e.g., removing a principle, changing testing approach)
- **MINOR** (x.Y.0): New principle or material expansion (e.g., adding new security requirement)
- **PATCH** (x.y.Z): Clarifications, wording fixes, non-semantic changes

### Compliance

**Code Review Gate**:
- All PRs MUST verify compliance with constitution principles
- Violations MUST be justified in "Complexity Tracking" section of plan.md
- Unjustified violations block merge

**Retrospectives**:
- Monthly review: Are principles helping or hindering?
- Quarterly review: Do principles need updating based on learnings?

**Conflict Resolution**:
- When constitution conflicts with business needs, update constitution (don't silently violate)
- Document why change is needed and what was learned

### Technical Decision Framework

**When evaluating architecture or implementation choices**:

1. **Does it align with Simplicity Through Progressive Disclosure?**
   - Will this add complexity to the default user experience?
   - Can this be hidden behind advanced options?

2. **Does it meet Performance Requirements?**
   - Have we measured impact on load time, responsiveness?
   - Will this cause regressions in our target metrics?

3. **Is it Secure by Default?**
   - Have we threat-modeled this feature?
   - Does it introduce new attack surface?

4. **Is it Testable?**
   - Can we write tests that fail before implementing?
   - How will we verify correctness?

5. **Is it Accessible?**
   - Can keyboard-only users access this?
   - Have we tested with screen readers?

6. **Is it Maintainable?**
   - Will future developers understand this in 6 months?
   - Are we adding complexity that solves today's problem only?

**Decision Documentation**: Significant technical decisions MUST be documented in plan.md with rationale referencing applicable constitution principles.

**Version**: 1.0.0 | **Ratified**: 2025-11-09 | **Last Amended**: 2025-11-09
