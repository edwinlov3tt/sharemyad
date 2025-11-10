# Quickstart: Manual Testing Guide

**Date**: 2025-11-09
**Feature**: Upload & Asset Processing
**Branch**: 001-upload-asset-processing

## Overview

This guide provides manual test scenarios for validating the Upload & Asset Processing feature. Each scenario corresponds to a user story from spec.md and can be tested independently.

## Prerequisites

- Local development environment running (Vite dev server + Supabase local)
- Test user account created in Supabase Auth
- Sample test files prepared (see Test Assets section below)

## Test Assets Preparation

### Create Test Files

```bash
# Create test directory
mkdir -p test-assets

# 1. Standard IAB banner (300x250 JPG)
# Use any image editor to create a 300x250 JPG, or download from:
# https://via.placeholder.com/300x250.jpg
curl https://via.placeholder.com/300x250.jpg -o test-assets/banner-300x250.jpg

# 2. Non-standard dimensions (400x300 PNG)
curl https://via.placeholder.com/400x300.png -o test-assets/non-standard.png

# 3. Video file (MP4, ~5MB)
# Download sample video or create with FFmpeg:
ffmpeg -f lavfi -i testsrc=duration=30:size=1920x1080:rate=30 -pix_fmt yuv420p test-assets/video-30s.mp4

# 4. High-res image (5000x3000 PNG)
curl https://via.placeholder.com/5000x3000.png -o test-assets/high-res.png

# 5. Animated GIF
# Download sample GIF or create with ImageMagick

# 6. Create zip file with creative sets
mkdir -p test-assets/campaign/Set-A test-assets/campaign/Set-B
cp test-assets/banner-300x250.jpg test-assets/campaign/Set-A/
cp test-assets/banner-300x250.jpg test-assets/campaign/Set-B/
cd test-assets && zip -r campaign.zip campaign/ && cd ..
```

---

## Test Scenario 1: Single File Upload (P1)

**User Story**: Single file upload with instant preview
**Goal**: Verify user can upload one file and see preview immediately

### Test Case 1.1: Upload Standard JPG

**Steps**:
1. Navigate to upload page (`http://localhost:5173/upload`)
2. Drag `banner-300x250.jpg` onto upload zone
3. Observe upload progress indicator
4. Wait for preview to appear

**Expected Results**:
- ✅ Upload progress shows percentage (0% → 100%)
- ✅ Preview appears within 3 seconds
- ✅ Thumbnail displays correctly
- ✅ Dimensions shown: "300 x 250"
- ✅ Validation status: Green checkmark with "Standard IAB Medium Rectangle"
- ✅ File size displayed: "~50 KB"

**Actual Results**: _[To be filled during testing]_

---

### Test Case 1.2: Upload MP4 Video

**Steps**:
1. Click "Upload Files" button
2. Select `video-30s.mp4` from file picker
3. Observe upload progress
4. Wait for preview generation

**Expected Results**:
- ✅ Upload progress shows percentage
- ✅ Video thumbnail (first frame) appears within 5 seconds
- ✅ Play icon overlay visible on thumbnail
- ✅ Duration displayed: "0:30"
- ✅ File size displayed: "~5 MB"
- ✅ Clicking thumbnail opens video player

**Actual Results**: _[To be filled during testing]_

---

### Test Case 1.3: Upload Non-Standard Dimensions

**Steps**:
1. Upload `non-standard.png` (400x300)
2. Wait for processing

**Expected Results**:
- ✅ File accepts (no rejection)
- ✅ Preview appears
- ✅ Validation status: Yellow warning icon
- ✅ Message: "Non-standard dimensions: 400 x 300"
- ✅ File still usable for sharing

**Actual Results**: _[To be filled during testing]_

---

### Test Case 1.4: Upload Oversized File (Error Case)

**Steps**:
1. Attempt to upload file > 500MB (create with: `dd if=/dev/zero of=test-assets/large.bin bs=1M count=501`)
2. Observe error handling

**Expected Results**:
- ✅ Upload rejected immediately (no upload starts)
- ✅ Error message: "File exceeds maximum size of 500MB"
- ✅ Error appears before any processing
- ✅ User can dismiss error and upload different file

**Actual Results**: _[To be filled during testing]_

---

## Test Scenario 2: Multiple Files Upload (P2)

**User Story**: Upload multiple individual files at once
**Goal**: Verify concurrent upload and grid preview display

### Test Case 2.1: Upload 8 Mixed Files

**Steps**:
1. Select 8 files at once (5 JPGs, 2 PNGs, 1 MP4) using file picker
2. Observe concurrent upload
3. Wait for all previews

**Expected Results**:
- ✅ All 8 files upload simultaneously
- ✅ Overall progress bar shows aggregate completion
- ✅ Individual progress for each file visible
- ✅ Grid displays all 8 previews when complete
- ✅ Each preview shows:
  - Thumbnail
  - Filename
  - Dimensions
  - Validation status
- ✅ Video file shows play icon overlay

**Actual Results**: _[To be filled during testing]_

---

### Test Case 2.2: Upload with Duplicate Filenames

**Steps**:
1. Create two files with same name: `cp banner-300x250.jpg banner-300x250-copy.jpg && mv banner-300x250-copy.jpg banner-300x250.jpg`
2. Upload both files together

**Expected Results**:
- ✅ Both files accepted
- ✅ System auto-renames to avoid conflict: "banner-300x250.jpg", "banner-300x250-1.jpg"
- ✅ Both previews display with distinct filenames
- ✅ No data loss

**Actual Results**: _[To be filled during testing]_

---

### Test Case 2.3: Partial Upload Failure

**Steps**:
1. Upload 5 files (mix of valid and one invalid type like .pdf)
2. Observe error handling

**Expected Results**:
- ✅ 4 valid files upload successfully
- ✅ Invalid file shows error: "File type not supported: .pdf"
- ✅ Error does not block successful uploads
- ✅ 4 previews appear in grid
- ✅ Error message actionable: "Supported types: JPG, PNG, GIF, MP4, WEBM, HTML"

**Actual Results**: _[To be filled during testing]_

---

## Test Scenario 3: Zip File Upload (P3)

**User Story**: Zip extraction with creative set detection
**Goal**: Verify automatic extraction and folder structure preservation

### Test Case 3.1: Upload Zip with Creative Sets

**Steps**:
1. Upload `campaign.zip` (contains Set-A and Set-B folders)
2. Wait for extraction
3. Observe creative set detection

**Expected Results**:
- ✅ Upload completes (zip file accepted)
- ✅ Extraction progress shows: "Extracting files... X/Y extracted"
- ✅ Progress updates every 2 seconds
- ✅ Two creative sets detected: "Set-A", "Set-B"
- ✅ UI shows tabs for each set
- ✅ Clicking tabs switches between sets
- ✅ Each set shows correct assets
- ✅ Original folder structure preserved in metadata

**Actual Results**: _[To be filled during testing]_

---

### Test Case 3.2: Nested Folder Structure

**Steps**:
1. Create zip with deep nesting: `Campaign/Display/300x250/banner.jpg`
2. Upload and wait for extraction

**Expected Results**:
- ✅ Extraction succeeds
- ✅ Folder structure flattened to meaningful levels (e.g., "Display" becomes set)
- ✅ Full original path preserved in asset metadata
- ✅ Warning if > 3 levels: "Deeply nested folders detected - structure simplified for display"

**Actual Results**: _[To be filled during testing]_

---

### Test Case 3.3: File Limit Enforcement (500 files)

**Steps**:
1. Create zip with 600 files
2. Upload

**Expected Results**:
- ✅ Upload accepts (zip < 500MB)
- ✅ Extraction processes first 500 files
- ✅ Warning displayed: "File limit reached: 500 of 600 files processed"
- ✅ 500 previews displayed
- ✅ System remains responsive

**Actual Results**: _[To be filled during testing]_

---

## Test Scenario 4: Background Processing (P4)

**User Story**: Real-time progress with background processing
**Goal**: Verify async processing and state preservation

### Test Case 4.1: Navigate Away During Processing

**Steps**:
1. Upload large zip (250 files)
2. When extraction reaches ~20%, navigate to different page
3. Wait 10 seconds
4. Navigate back to upload page

**Expected Results**:
- ✅ Processing continues during navigation
- ✅ On return, current progress displays: "Processing... 150/250 files (60%)"
- ✅ Progress picks up where it left off (no restart)
- ✅ State preserved in database

**Actual Results**: _[To be filled during testing]_

---

### Test Case 4.2: Page Refresh During Processing

**Steps**:
1. Upload large zip
2. When extraction reaches ~50%, refresh browser (F5)
3. Observe recovery

**Expected Results**:
- ✅ Page reloads successfully
- ✅ Upload state recovers automatically
- ✅ Progress resumes from last checkpoint (~50%)
- ✅ No data loss
- ✅ Processing continues smoothly

**Actual Results**: _[To be filled during testing]_

---

### Test Case 4.3: Background Completion Notification

**Steps**:
1. Upload large zip
2. Navigate to different browser tab
3. Wait for processing to complete

**Expected Results**:
- ✅ Browser notification appears: "Your 250 files are ready for review"
- ✅ Clicking notification navigates to preview page
- ✅ All 250 assets displayed
- ✅ Creative sets organized correctly

**Actual Results**: _[To be filled during testing]_

---

### Test Case 4.4: Processing Failure Recovery

**Steps**:
1. Upload corrupted zip (corrupt file at position 100/250)
2. Observe error handling

**Expected Results**:
- ✅ Processing runs until error encountered
- ✅ Error notification: "Processing failed at file 100/250: corrupted archive"
- ✅ First 99 successfully processed files remain accessible
- ✅ User can:
  - Retry processing (attempt to continue)
  - Or accept partial upload (use 99 files)
- ✅ No complete failure (partial success preserved)

**Actual Results**: _[To be filled during testing]_

---

## Test Scenario 5: Thumbnail Generation (P5)

**User Story**: Optimized thumbnails for fast preview
**Goal**: Verify thumbnail generation and lazy loading

### Test Case 5.1: High-Res Image Thumbnail

**Steps**:
1. Upload `high-res.png` (5000x3000, ~15MB)
2. Wait for thumbnail generation

**Expected Results**:
- ✅ Thumbnail (300x180) generates within 500ms
- ✅ Thumbnail loads quickly in preview grid
- ✅ Clicking thumbnail opens full-resolution modal
- ✅ Modal shows full 5000x3000 image
- ✅ File size displays: "15 MB (original)"
- ✅ Thumbnail quality sufficient for review

**Actual Results**: _[To be filled during testing]_

---

### Test Case 5.2: Video Thumbnail Extraction

**Steps**:
1. Upload 45-second MP4 video (1920x1080)
2. Wait for thumbnail extraction

**Expected Results**:
- ✅ Thumbnail extracted from first frame (1-second mark)
- ✅ Thumbnail shows representative frame (not black screen)
- ✅ Play icon overlay on thumbnail
- ✅ Clicking opens video player with full video
- ✅ Video plays smoothly

**Actual Results**: _[To be filled during testing]_

---

### Test Case 5.3: Lazy Loading Performance

**Steps**:
1. Upload zip with 50 high-res images
2. Scroll through preview grid
3. Monitor scroll performance

**Expected Results**:
- ✅ Only visible thumbnails load initially (~15-20 visible)
- ✅ Thumbnails load as user scrolls into view
- ✅ Scroll performance smooth (60 FPS)
- ✅ No lag or stuttering during scroll
- ✅ Network tab shows progressive loading (not all 50 at once)

**Actual Results**: _[To be filled during testing]_

---

### Test Case 5.4: Animated GIF Preview

**Steps**:
1. Upload animated GIF (5MB, 10 frames)
2. Observe thumbnail behavior

**Expected Results**:
- ✅ Thumbnail shows first frame (static)
- ✅ Hovering thumbnail plays GIF animation
- ✅ Clicking opens full GIF with all frames
- ✅ Full GIF loops continuously

**Actual Results**: _[To be filled during testing]_

---

## Performance Benchmarks

### Timing Measurements

Record actual timings during testing:

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Single file upload (< 10MB) | < 3s | ___ | ___ |
| Zip extraction start (500MB) | < 10s | ___ | ___ |
| Thumbnail generation (100 images) | < 30s | ___ | ___ |
| Video thumbnail extraction | < 5s per video | ___ | ___ |
| Preview grid scroll (500 assets) | 60 FPS | ___ | ___ |
| API response time | < 200ms p95 | ___ | ___ |

---

## Edge Cases Testing

### Edge Case 1: Password-Protected Zip

**Steps**: Upload password-protected zip

**Expected**: Error "Cannot extract password-protected archive. Please upload unprotected zip file"

**Actual**: ___

---

### Edge Case 2: Special Characters in Filename

**Steps**: Upload file named `banner#1@2024!.jpg`

**Expected**:
- File accepted
- Filename sanitized to `banner-1-2024.jpg`
- Original name preserved in metadata

**Actual**: ___

---

### Edge Case 3: Network Interruption

**Steps**:
1. Start uploading large file
2. Disconnect network mid-upload
3. Reconnect network

**Expected**:
- Upload pauses
- Auto-resumes from last successful chunk
- Completes successfully

**Actual**: ___

---

### Edge Case 4: Corrupted Video File

**Steps**: Upload corrupted MP4

**Expected**:
- Thumbnail extraction fails gracefully
- Placeholder image shown
- Warning: "Video file may be corrupted - unable to generate preview"
- File still included in share link

**Actual**: ___

---

## Accessibility Testing

### Keyboard Navigation

**Test**: Navigate entire upload flow using only keyboard (Tab, Enter, Space, Arrow keys)

**Expected**:
- ✅ Upload zone focusable
- ✅ File picker activates via Enter/Space
- ✅ Preview grid navigable with arrows
- ✅ Thumbnails selectable with Enter
- ✅ Modal dismissible with Esc
- ✅ Focus indicators visible on all elements

**Actual**: ___

---

### Screen Reader

**Test**: Complete upload with screen reader (NVDA/JAWS)

**Expected**:
- ✅ Upload zone announces: "Drop files here or click to browse"
- ✅ Progress updates announced via ARIA live region
- ✅ Preview grid announced with item count
- ✅ Validation status announced (valid/warning/error)
- ✅ Error messages read clearly

**Actual**: ___

---

## Browser Compatibility

Test in each browser:

| Browser | Version | Upload | Preview | Progress | Notes |
|---------|---------|--------|---------|----------|-------|
| Chrome | 90+ | ___ | ___ | ___ | ___ |
| Firefox | 88+ | ___ | ___ | ___ | ___ |
| Safari | 14+ | ___ | ___ | ___ | ___ |
| Edge | 90+ | ___ | ___ | ___ | ___ |

---

## Test Summary

**Date Tested**: ___
**Tester**: ___
**Environment**: ___

**Results**:
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

**Critical Issues Found**: ___

**Recommendations**: ___
