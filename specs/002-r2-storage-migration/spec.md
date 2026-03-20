# Feature Specification: R2 Storage Migration

**Feature Branch**: `002-r2-storage-migration`
**Created**: 2025-11-26
**Status**: Draft
**Input**: User description: "Migrate file storage from Supabase to Cloudflare R2 to support 500MB uploads with zero egress costs."

## Overview

This feature migrates the file storage system from Supabase Storage to Cloudflare R2 to enable large file uploads (up to 500MB) and eliminate bandwidth egress costs. The current system is limited to ~50MB uploads due to edge function constraints and incurs costs at scale.

## Clarifications

### Session 2025-11-26

- Q: Should resumable uploads (User Story 2, FR-005) be included given the implementation complexity? → A: Remove resumable uploads entirely; defer to future feature if user feedback indicates need. Core value is enabling 500MB uploads, not upload resumption.

## User Scenarios & Testing

### User Story 1 - Upload Large Creative Bundle (Priority: P1)

An Ad Operations specialist needs to upload a complete campaign creative bundle (300MB zip containing all ad sizes) for client review. Currently, they cannot upload files larger than 50MB and must split their bundle into multiple uploads.

**Why this priority**: This is the core value proposition - enabling 500MB uploads that users cannot do today. Without this, the migration has no user-facing benefit.

**Independent Test**: Can be fully tested by uploading a 300MB zip file and verifying it completes successfully with progress feedback. Delivers immediate value by removing the current size limitation.

**Acceptance Scenarios**:

1. **Given** a user on the upload page with a 300MB zip file, **When** they drag and drop the file, **Then** the upload begins immediately with a progress indicator showing percentage complete
2. **Given** an upload in progress at 50% (150MB transferred), **When** the user watches the progress bar, **Then** it updates smoothly and accurately reflects bytes uploaded
3. **Given** a 500MB file (maximum allowed), **When** uploaded, **Then** the system accepts it and begins processing within 5 seconds of completion
4. **Given** a 501MB file (exceeds limit), **When** user attempts to upload, **Then** system displays a clear error message before upload begins: "File exceeds 500MB limit"

---

### User Story 2 - View Uploaded Assets (Priority: P2)

After upload completes, the user needs to view their assets in the gallery with thumbnails loading quickly regardless of file storage location.

**Why this priority**: Users need confirmation their upload worked and quick visual preview. This validates the end-to-end flow works with the new storage backend.

**Independent Test**: Can be tested by uploading files and navigating to gallery view, verifying thumbnails load within acceptable time.

**Acceptance Scenarios**:

1. **Given** an upload just completed with 50 image assets, **When** the gallery view loads, **Then** the first 12 thumbnails appear within 2 seconds
2. **Given** a gallery with 100 assets, **When** the user scrolls down, **Then** additional thumbnails load lazily without blocking the UI
3. **Given** a slow network connection (3G), **When** viewing the gallery, **Then** placeholder images show immediately while actual thumbnails load progressively

---

### User Story 3 - Migrate Existing Assets (Priority: P3)

System administrators need to migrate existing assets from the old storage system to the new one without disrupting active users or breaking existing share links.

**Why this priority**: Existing users have uploaded content that must remain accessible. This is critical for production deployment but can be done after new uploads work.

**Independent Test**: Can be tested by running migration on a subset of existing assets and verifying old URLs redirect to new storage correctly.

**Acceptance Scenarios**:

1. **Given** 1000 existing assets in old storage, **When** migration runs, **Then** all assets are copied to new storage with same paths maintained
2. **Given** an existing share link created before migration, **When** a client visits the link after migration, **Then** all assets load correctly from new storage
3. **Given** migration in progress, **When** a user uploads new content, **Then** new uploads go directly to new storage without interference

---

### Edge Cases

- What happens when a user's network drops during upload?
  - System detects incomplete upload and marks it for cleanup after 24 hours
  - User must restart the upload from the beginning (no resume capability in this version)

- What happens when storage service is temporarily unavailable?
  - System shows clear error message: "Storage temporarily unavailable. Please try again in a few minutes."
  - No partial data is corrupted

- What happens when upload completes but processing fails?
  - Upload is preserved in storage
  - User sees "Processing failed" status with retry option
  - Original file remains available for reprocessing

- What happens when user uploads a file disguised as valid type (e.g., exe renamed to .zip)?
  - System validates file content (magic bytes), not just extension
  - Invalid files are rejected with message: "File content does not match expected format"

- What happens when two users upload files with identical names simultaneously?
  - Each upload gets a unique identifier; filenames do not conflict
  - Both uploads complete successfully

## Requirements

### Functional Requirements

**Upload Handling**

- **FR-001**: System MUST accept file uploads up to 500MB in size
- **FR-002**: System MUST provide real-time upload progress feedback (percentage and bytes transferred)
- **FR-003**: System MUST validate file size before upload begins (client-side check)
- **FR-004**: System MUST enforce 500MB limit server-side regardless of client validation bypass

**File Validation**

- **FR-005**: System MUST validate file types by examining file content (magic bytes), not just file extension
- **FR-006**: System MUST support these file types: ZIP, PNG, JPG/JPEG, GIF, MP4, WEBM, HTML (in zip bundles)
- **FR-007**: System MUST reject files that fail content validation with a descriptive error message
- **FR-008**: System MUST sanitize filenames to remove potentially dangerous characters

**Storage Operations**

- **FR-009**: System MUST generate secure, time-limited URLs for file uploads (1 hour expiration)
- **FR-010**: System MUST store files with unique identifiers to prevent path collisions
- **FR-011**: System MUST support concurrent uploads from multiple users without interference
- **FR-012**: System MUST clean up incomplete uploads after 24 hours

**Asset Retrieval**

- **FR-013**: System MUST generate secure, time-limited URLs for file downloads
- **FR-014**: System MUST serve assets through a content delivery network for global performance
- **FR-015**: System MUST support generating thumbnail URLs distinct from full-resolution URLs

**Migration**

- **FR-016**: System MUST provide a migration path for existing assets without data loss
- **FR-017**: System MUST maintain backward compatibility with existing share links during and after migration
- **FR-018**: System MUST allow migration to run incrementally without service interruption

**Security**

- **FR-019**: System MUST restrict storage access to authorized domains only (CORS)
- **FR-020**: System MUST never expose storage credentials to client-side code
- **FR-021**: System MUST log all upload operations for audit purposes

### Key Entities

- **Upload Session**: Represents a single upload operation. Contains upload identifier, file metadata (name, size, type), upload status (pending, in-progress, complete, failed), creation timestamp, and expiration time.

- **Stored Asset**: Represents a file in storage. Contains unique storage key, original filename, file size in bytes, MIME type, upload session reference, and creation timestamp.

- **Presigned URL**: Temporary authorization for storage access. Contains target storage key, operation type (upload or download), expiration timestamp, and requesting user/session reference.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can successfully upload files up to 500MB in size (100% of attempts under 500MB succeed)
- **SC-002**: Upload progress feedback updates at least every 2 seconds during active transfer
- **SC-003**: 95% of 500MB uploads complete within 2 minutes on a 50Mbps connection
- **SC-004**: Gallery thumbnails load within 2 seconds for the first 12 visible items
- **SC-005**: Zero data loss during migration of existing assets (100% of assets accessible after migration)
- **SC-006**: Existing share links continue to work after migration (100% backward compatibility)
- **SC-007**: Invalid file types are rejected before any data is stored (0 invalid files reach storage)
- **SC-008**: System handles 100 concurrent uploads without degradation

## Assumptions

- Users have modern browsers with File API support (Chrome 88+, Firefox 78+, Safari 14+, Edge 88+)
- Network bandwidth is the primary constraint for upload speed, not server processing
- Existing assets total less than 100GB and can be migrated within a single maintenance window
- The application already has a mechanism for tracking upload sessions and asset metadata
- Users are willing to wait up to 2 minutes for large (500MB) uploads to complete
- If an upload fails, users will manually retry (no automatic retry or resume)

## Out of Scope

- Resumable uploads (deferred to future feature based on user feedback)
- Automatic retry of failed uploads (user must manually retry)
- Offline upload queuing (requires network connection)
- Client-side compression before upload
- Virus/malware scanning of uploaded files (may be added in future feature)
- Multi-file drag-and-drop in single operation (handled by existing feature)
