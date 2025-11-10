# Feature Specification: Upload & Asset Processing

**Feature Branch**: `001-upload-asset-processing`
**Created**: 2025-11-09
**Status**: Draft
**Input**: User description: "Develop 'Upload & Asset Processing' feature: Handle multi-format file uploads with automatic extraction, thumbnail generation, and asset organization. Process zip files while maintaining folder structure and detect creative sets."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single File Upload with Instant Preview (Priority: P1)

A marketing coordinator needs to quickly share individual creative assets with clients. They drag and drop a single banner ad file onto the upload zone and immediately see a preview with validation status.

**Why this priority**: This is the simplest, most common use case. Users can upload and validate single assets immediately without dealing with zip files or complex organization. This establishes the core upload pipeline for future sharing features.

**Independent Test**: Can be fully tested by uploading a single JPG/PNG/GIF/MP4 file, verifying the preview appears with dimensions and validation status, and confirming processing completes successfully. Delivers immediate validation feedback without dependencies on other features.

**Acceptance Scenarios**:

1. **Given** user is on the upload page, **When** they drag a single JPG banner ad (300x250) onto the upload zone, **Then** the file uploads, a thumbnail preview appears, dimensions are displayed (300x250), and validation status shows green checkmark with "Standard IAB Medium Rectangle"

2. **Given** user is on the upload page, **When** they click the upload button and select a single MP4 video file (5MB), **Then** the file uploads with progress indicator, video thumbnail (first frame) appears, duration displays (e.g., "0:30"), and file size shows (5MB)

3. **Given** user has uploaded a single PNG file (non-standard dimensions 400x300), **When** processing completes, **Then** preview shows yellow warning "Non-standard dimensions: 400x300" with file still accepted

4. **Given** user selects a file exceeding 500MB, **When** upload attempts to start, **Then** system rejects the file immediately with error message "File exceeds maximum size of 500MB" before any processing

---

### User Story 2 - Multiple Individual Files Upload (Priority: P2)

A creative team needs to share a campaign's complete asset set (10-50 individual files) without creating a zip file first. They select multiple files at once and see all previews organized in a grid.

**Why this priority**: Many users don't want to manually create zip files. Uploading multiple files at once enables faster workflows while maintaining simplicity. Builds on P1 by handling multiple assets simultaneously.

**Independent Test**: Can be tested by selecting 5-10 files at once (mixed JPG, PNG, MP4), verifying all files upload concurrently, all previews appear in a grid layout, and each has individual validation status. Works independently of zip extraction.

**Acceptance Scenarios**:

1. **Given** user is on the upload page, **When** they select 8 files at once (5 JPGs, 2 PNGs, 1 MP4) via file picker, **Then** all 8 files upload concurrently, progress bar shows overall completion percentage, and grid displays all 8 previews when complete

2. **Given** user drags 12 files onto the upload zone, **When** upload begins, **Then** system shows "Uploading 12 files..." with individual progress for each file, and failed uploads display error messages without blocking successful uploads

3. **Given** user uploads 15 files totaling 450MB, **When** processing completes, **Then** all thumbnails load progressively (lazy loading), video files show first-frame thumbnails with play icon overlay, and validation status appears for each asset

4. **Given** user uploads files with duplicate names (e.g., "banner.jpg" appears twice), **When** processing completes, **Then** system preserves both files with auto-renamed filenames (e.g., "banner.jpg", "banner-1.jpg") and displays both with clear naming

---

### User Story 3 - Zip File Upload with Automatic Extraction (Priority: P3)

A creative director receives a zip file from a designer containing organized campaign folders (A/B test variants). They upload the zip file and the system automatically extracts it, maintains the folder structure, and detects the A/B variant organization.

**Why this priority**: Professional creative workflows often involve zip files with organized folder structures. Auto-extraction and structure preservation eliminates manual file organization. This is the most complex use case but builds on the foundation of P1 and P2.

**Independent Test**: Can be tested by uploading a zip file containing nested folders (e.g., "Campaign/Set-A/300x250.jpg", "Campaign/Set-B/300x250.jpg"), verifying extraction maintains folder hierarchy, creative sets are detected (Set-A, Set-B), and all assets are organized accordingly. Delivers value for complex campaigns.

**Acceptance Scenarios**:

1. **Given** user uploads a 50MB zip file containing 3 folders (Set-A, Set-B, Set-C) with 10 files each, **When** extraction begins, **Then** progress bar shows "Extracting files... 30/30 extracted", folder structure is preserved, and creative sets are auto-detected with tabs for "Set-A", "Set-B", "Set-C"

2. **Given** zip file contains nested folders (e.g., "Campaign/Display/300x250/banner.jpg"), **When** extraction completes, **Then** system flattens to meaningful levels (e.g., "Display" becomes a creative set), assets are grouped correctly, and original path is preserved in metadata

3. **Given** zip file contains mixed file types (15 JPGs, 5 MP4s, 2 HTML5 bundles), **When** extraction completes, **Then** all supported formats are processed, HTML5 bundles are identified (index.html detected), and unsupported files show warning "File type not supported: .pdf"

4. **Given** zip file is 480MB (under limit) but contains 600 files (over 500-file limit), **When** extraction completes, **Then** system processes first 500 files and displays warning "File limit reached: 500 of 600 files processed"

---

### User Story 4 - Background Processing with Real-Time Progress (Priority: P4)

A user uploads a large zip file (400MB with 300 files) and needs to continue working while processing happens. They see real-time progress updates and receive notification when processing completes.

**Why this priority**: Large uploads require background processing to avoid blocking the user. Real-time progress feedback builds trust and sets expectations. This is a performance/UX enhancement that makes P3 practical for large files.

**Independent Test**: Can be tested by uploading a large zip file, verifying user can navigate away from upload page while processing continues, progress updates appear in real-time, and notification appears when complete. Works independently by enhancing existing upload flows.

**Acceptance Scenarios**:

1. **Given** user uploads a 350MB zip file with 250 files, **When** upload completes and extraction begins, **Then** progress indicator shows "Extracting files... 45/250 (18%)", updates every 2 seconds, and user can navigate to other pages without interrupting processing

2. **Given** background processing is running (extraction at 60%), **When** user refreshes the page or returns later, **Then** progress state is preserved, current status displays "Processing... 150/250 files (60%)", and processing continues from current point

3. **Given** extraction completes in background, **When** user is on a different page, **Then** browser notification appears "Your 250 files are ready for review", clicking notification navigates to preview page with all extracted assets

4. **Given** processing fails mid-extraction (e.g., corrupted zip file at file #100), **When** error occurs, **Then** user sees error notification "Processing failed at file 100/250: corrupted archive", successfully processed files (99) remain accessible, and user can retry or continue with partial upload

---

### User Story 5 - Thumbnail Generation for All Visual Assets (Priority: P5)

A user uploads a mix of high-resolution images (5000x3000 PNGs) and videos (1080p MP4s). The system automatically generates optimized thumbnails for fast preview loading without requiring the full files to load.

**Why this priority**: High-resolution files are too large to display directly in preview grids. Thumbnails enable fast, responsive previews regardless of original file size. This is a performance optimization that enhances all upload workflows (P1-P3).

**Independent Test**: Can be tested by uploading large image/video files, verifying thumbnails load quickly (< 500ms each) in preview grid, full-resolution files are accessible via click/download, and thumbnail quality is sufficient for review. Enhances existing upload flows.

**Acceptance Scenarios**:

1. **Given** user uploads a 15MB PNG file (5000x3000 resolution), **When** processing completes, **Then** thumbnail (300x180) generates and loads in under 500ms, clicking thumbnail opens full-resolution preview modal, and file size displays as "15 MB (original)"

2. **Given** user uploads a 45-second MP4 video (1920x1080, 30MB), **When** processing completes, **Then** video thumbnail extracts from first frame (1 second mark), thumbnail shows play icon overlay, and clicking opens video player with full video

3. **Given** user uploads 50 high-resolution images in a zip file, **When** extraction completes and preview grid loads, **Then** thumbnails lazy-load as user scrolls (IntersectionObserver pattern assumed), only visible thumbnails load initially, and scroll performance remains smooth (60fps)

4. **Given** user uploads animated GIF (5MB, 10 frames), **When** processing completes, **Then** thumbnail shows first frame as static image, hovering thumbnail plays GIF animation preview, and clicking opens full GIF with all frames

---

### Edge Cases

- **What happens when zip file is password-protected?** System attempts extraction, detects password requirement, displays error "Cannot extract password-protected archive. Please upload unprotected zip file", and upload fails gracefully with clear instructions.

- **What happens when folder structure is excessively nested?** (e.g., 20 levels deep) System flattens to maximum 3 meaningful levels, preserves full original path in metadata, and displays warning "Deeply nested folders detected - structure simplified for display".

- **What happens when filename contains special characters?** (e.g., "banner#1@2024!.jpg") System sanitizes filename for storage (removes/replaces special chars), preserves original filename in display metadata, and logs sanitization for audit trail.

- **What happens when two files have identical content but different names?** System stores both files (treats as separate assets), calculates file hashes for future deduplication feature, but does not block upload in current implementation.

- **What happens when upload is interrupted mid-transfer?** (network disconnect, browser crash) System supports resumable uploads for files > 50MB (chunked upload assumed), smaller files restart from beginning, and progress is preserved where possible.

- **What happens when HTML5 bundle is missing index.html?** System detects bundle attempt (e.g., folder with .html/.js/.css files), displays warning "HTML5 bundle incomplete - missing index.html", and treats individual files as separate assets instead of bundle.

- **What happens when video file is corrupted or unplayable?** System attempts thumbnail extraction, fails gracefully with placeholder image, displays warning "Video file may be corrupted - unable to generate preview", but still allows file to be included in share link.

- **What happens when user uploads 500 files (at limit) and then tries to upload 1 more?** System displays error before upload "File limit reached: 500 files maximum per project. Remove files to upload more", and new upload is blocked until user removes existing files.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept file uploads via drag-and-drop interface on designated upload zone

- **FR-002**: System MUST accept file uploads via click-to-browse file picker with multi-select support

- **FR-003**: System MUST support individual file uploads for JPG, PNG, GIF, MP4, WEBM, and HTML5 bundle formats

- **FR-004**: System MUST support zip file uploads up to 500MB maximum size

- **FR-005**: System MUST enforce 500-file maximum limit per project upload

- **FR-006**: System MUST validate file MIME types against whitelist (image/jpeg, image/png, image/gif, video/mp4, video/webm, text/html, application/zip)

- **FR-007**: System MUST verify file signatures (magic bytes) to prevent MIME type spoofing

- **FR-008**: System MUST reject files exceeding size limits before processing begins with clear error message

- **FR-009**: System MUST extract zip file contents while preserving original folder structure

- **FR-010**: System MUST auto-detect creative set variants from folder organization (e.g., folders named "A", "B", "C" or "Set-A", "Set-B", "Set-C")

- **FR-011**: System MUST generate thumbnail previews for all image formats (JPG, PNG, GIF)

- **FR-012**: System MUST extract first-frame thumbnails from video files (MP4, WEBM)

- **FR-013**: System MUST extract video metadata including duration, dimensions, and file size

- **FR-014**: System MUST identify HTML5 bundles by presence of index.html file in uploaded folders

- **FR-015**: System MUST process uploads in background for files/archives requiring more than 5 seconds processing time

- **FR-016**: System MUST provide real-time progress updates during extraction and processing (update interval: every 2 seconds)

- **FR-017**: System MUST display upload progress as percentage completion for active transfers

- **FR-018**: System MUST preserve processing state if user navigates away from upload page

- **FR-019**: System MUST notify user when background processing completes via browser notification

- **FR-020**: System MUST display preview grid showing all uploaded assets with thumbnails

- **FR-021**: System MUST display asset metadata including filename, dimensions (width x height), file size, and format

- **FR-022**: System MUST sanitize filenames by removing/replacing special characters for safe storage

- **FR-023**: System MUST handle duplicate filenames by auto-appending numeric suffix (e.g., "file-1.jpg", "file-2.jpg")

- **FR-024**: System MUST support concurrent uploads for multiple individual files (parallel processing)

- **FR-025**: System MUST display individual error messages for failed uploads without blocking successful uploads

- **FR-026**: System MUST provide clear error messages for unsupported file types

- **FR-027**: System MUST lazy-load thumbnails in preview grid to optimize performance for large file sets

- **FR-028**: System MUST support resumable uploads for files larger than 50MB in case of network interruption

- **FR-029**: System MUST flatten excessively nested folder structures (> 3 levels) while preserving full path in metadata

- **FR-030**: System MUST fail gracefully when encountering corrupted zip archives, displaying specific error and preserving any successfully extracted files

### Key Entities

- **Upload Session**: Represents a single upload operation (single file, multiple files, or zip archive). Contains upload start time, completion status, total file count, total size, and processing progress.

- **Creative Asset**: Individual file uploaded or extracted from archive. Contains filename (original and sanitized), file type/format, MIME type, file size, dimensions (for images/videos), duration (for videos), storage URL, thumbnail URL, upload timestamp, and parent Creative Set reference.

- **Creative Set**: Grouping of related creative assets detected from folder structure. Contains set name (e.g., "Set-A", "Set-B"), original folder path, asset count, and parent Upload Session reference.

- **Thumbnail**: Generated preview image for visual assets. Contains source asset reference, thumbnail dimensions (standardized, e.g., 300x180), storage URL, generation timestamp, and format (always JPG for consistency).

- **Processing Job**: Background task for long-running operations (zip extraction, thumbnail generation). Contains job ID, job type (extraction/thumbnail), current status (queued/processing/completed/failed), progress percentage, started timestamp, completed timestamp, and error details if failed.

- **Folder Structure Node**: Represents folder hierarchy from extracted zip archives. Contains folder name, parent folder reference, depth level, child folders, and contained assets. Used to reconstruct original organization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload single files and see preview with validation status in under 3 seconds (for files < 10MB)

- **SC-002**: Users can upload zip files up to 500MB and begin seeing extracted previews within 10 seconds of upload completion

- **SC-003**: System processes and displays thumbnails for 100 images in under 30 seconds

- **SC-004**: Video thumbnail extraction completes in under 5 seconds per video file

- **SC-005**: Users can upload 500 files (maximum limit) without system performance degradation

- **SC-006**: Background processing preserves state across page refreshes with 100% reliability

- **SC-007**: Real-time progress updates occur every 2 seconds with no more than 1-second delay from actual progress

- **SC-008**: Thumbnail lazy-loading maintains 60 FPS scroll performance in preview grid with 500+ assets

- **SC-009**: 95% of uploads complete successfully on first attempt without user intervention

- **SC-010**: Users receive background processing completion notification within 3 seconds of actual completion

- **SC-011**: System correctly identifies and organizes creative sets (A/B/C variants) from folder structure in 90% of structured zip uploads

- **SC-012**: File validation (MIME type, size, signature) rejects invalid files in under 1 second before processing begins

- **SC-013**: Error messages for failed uploads include actionable next steps in 100% of failure cases

- **SC-014**: Resumable uploads successfully recover and complete after network interruption in 95% of cases

- **SC-015**: System handles duplicate filenames without data loss or conflicts in 100% of cases

### Assumptions

- Users have modern browsers supporting drag-and-drop file API (Chrome 60+, Firefox 55+, Safari 11+, Edge 79+)
- Users have stable internet connection capable of uploading 500MB within reasonable timeframe (< 10 minutes on 10 Mbps connection)
- Zip file extraction assumes standard ZIP format (no 7z, RAR, or other archive formats in MVP)
- Thumbnail generation dimensions standardized to 300x180 (16:9 aspect ratio) with aspect-ratio preservation and letterboxing
- Video thumbnail extraction uses first frame at 1-second mark (assumes videos are at least 1 second long)
- Browser notification permission assumed granted by user for background processing completion alerts
- HTML5 bundles assumed to have index.html in root of bundle folder (no deep searching for entry point)
- Creative set detection uses simple pattern matching on folder names (A/B/C, Set-A/Set-B/Set-C, Version-1/Version-2) rather than AI/ML
- Concurrent upload limit assumed to be 10 files at once (browser connection limit)
- File hash calculation for deduplication stored but not enforced in current implementation (reserved for future feature)
