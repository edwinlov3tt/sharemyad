# Research: Upload & Asset Processing

**Date**: 2025-11-09
**Feature**: Upload & Asset Processing
**Branch**: 001-upload-asset-processing

## Overview

This document captures technology decisions, best practices research, and architectural patterns for implementing the upload and asset processing feature.

## 1. File Upload Strategy

### Decision: Direct Upload to Supabase Storage with Signed URLs

**Rationale**:
- Bypasses backend entirely for upload, reducing server load and latency
- Supports resumable uploads natively for files > 50MB
- Provides built-in progress tracking via browser Upload Progress API
- Integrates seamlessly with Supabase Auth for security
- Signed URLs expire after defined period (1 hour) for security

**Alternatives Considered**:
- **Multipart form upload through backend**: Rejected due to increased latency, no resumable support, server memory overhead
- **Presigned S3 URLs**: Considered but Supabase Storage provides simpler integration with PostgreSQL and Auth

**Implementation Pattern**:
```typescript
// Client requests signed upload URL from edge function
const { url, path } = await supabase.storage
  .from('uploads')
  .createSignedUploadUrl('temp-uploads/' + uploadId)

// Direct upload to storage with progress tracking
await fetch(url, {
  method: 'PUT',
  body: file,
  onUploadProgress: (progress) => {
    updateProgress(progress.loaded / progress.total)
  }
})
```

**Source**: [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)

---

## 2. Zip Extraction Approach

### Decision: Server-Side Extraction in Edge Functions Using JSZip

**Rationale**:
- Client-side extraction (in-browser) would block UI for large files and consume excessive memory
- JSZip is lightweight (40KB), works in Deno runtime, supports streaming
- Edge function can process asynchronously without blocking user
- Allows malware scanning before extraction
- Can enforce 500-file limit server-side

**Alternatives Considered**:
- **Client-side extraction with Web Workers**: Rejected due to memory constraints (500MB zip would exceed browser limits), no malware scanning capability
- **Unzipper library**: Considered but JSZip has better Deno compatibility and simpler API

**Implementation Pattern**:
```typescript
// Edge function receives webhook after upload completes
const zip = await JSZip.loadAsync(fileBuffer)
const files = []

// Stream extraction to avoid memory overflow
for (const [path, file] of Object.entries(zip.files)) {
  if (files.length >= 500) break // Enforce limit

  const content = await file.async('arraybuffer')
  await uploadToR2(path, content)
  files.push({ path, size: file._data.uncompressedSize })
}
```

**Source**: [JSZip Documentation](https://stuk.github.io/jszip/)

---

## 3. Thumbnail Generation

### Decision: Sharp for Images, FFmpeg for Videos

**Rationale**:
- **Sharp**: Fast (libvips-based), supports all required formats (JPG, PNG, GIF), runs in Deno, produces high-quality thumbnails at 300x180
- **FFmpeg**: Industry standard for video processing, extracts frames at specific timestamps (1-second mark), works via Deno FFI or subprocess
- Both support streaming to avoid loading full files into memory

**Alternatives Considered**:
- **Canvas API (browser-side)**: Rejected due to security (no file access from server), quality issues, browser resource constraints
- **ImageMagick**: Considered but Sharp is faster and has lower memory footprint
- **Native Deno Image library**: Not mature enough, lacks format support

**Implementation Pattern**:
```typescript
// Image thumbnail with Sharp
import sharp from 'sharp'

const thumbnail = await sharp(imageBuffer)
  .resize(300, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .jpeg({ quality: 80 })
  .toBuffer()

// Video thumbnail with FFmpeg
import { exec } from 'deno/std/process'

await exec([
  'ffmpeg',
  '-ss', '00:00:01',  // Extract frame at 1 second
  '-i', inputPath,
  '-vframes', '1',
  '-vf', 'scale=300:180:force_original_aspect_ratio=decrease',
  outputPath
])
```

**Source**:
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [FFmpeg Thumbnail Guide](https://trac.ffmpeg.org/wiki/Create%20a%20thumbnail%20image%20every%20X%20seconds%20of%20the%20video)

---

## 4. Real-Time Progress Updates

### Decision: Server-Sent Events (SSE) via Supabase Realtime

**Rationale**:
- Supabase Realtime provides PostgreSQL change streams (LISTEN/NOTIFY)
- SSE is simpler than WebSockets, unidirectional (server → client) fits use case
- Automatic reconnection on network interruption
- No additional infrastructure required (uses existing Supabase connection)
- Lower overhead than polling

**Alternatives Considered**:
- **WebSockets**: Rejected as bidirectional communication not needed, more complex setup
- **HTTP Polling (every 2 seconds)**: Rejected due to high server load, latency, not true real-time

**Implementation Pattern**:
```typescript
// Edge function updates processing_jobs table
await supabase
  .from('processing_jobs')
  .update({ progress: 45, status: 'processing' })
  .eq('id', jobId)

// Frontend subscribes to changes
const subscription = supabase
  .channel(`job:${jobId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'processing_jobs',
    filter: `id=eq.${jobId}`
  }, (payload) => {
    setProgress(payload.new.progress)
  })
  .subscribe()
```

**Source**: [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)

---

## 5. Creative Set Detection

### Decision: Pattern Matching on Folder Names

**Rationale**:
- Simple regex patterns cover 90% of common naming conventions (A/B/C, Set-A/Set-B, Version-1/Version-2)
- No AI/ML overhead required for MVP
- Fast execution (< 1ms per folder)
- Deterministic results (easier to test and debug)

**Alternatives Considered**:
- **ML-based classification**: Rejected as overkill for MVP, adds latency, requires training data
- **User manual tagging**: Rejected as adds friction, violates simplicity principle

**Implementation Pattern**:
```typescript
// Detect creative sets from folder structure
const SET_PATTERNS = [
  /^(Set-)?([A-Z])$/i,           // "A", "B", "Set-A", "Set-B"
  /^Version[-_]?(\d+)$/i,        // "Version-1", "Version_2"
  /^v(\d+)$/i,                   // "v1", "v2"
  /^Test[-_]?([A-Z\d]+)$/i       // "Test-A", "Test_1"
]

function detectCreativeSets(folders: string[]): CreativeSet[] {
  const sets = new Map<string, string[]>()

  for (const folder of folders) {
    for (const pattern of SET_PATTERNS) {
      const match = folder.match(pattern)
      if (match) {
        const setName = match[1] || match[2]
        sets.set(setName, [...(sets.get(setName) || []), folder])
        break
      }
    }
  }

  return Array.from(sets.entries()).map(([name, folders]) => ({
    name,
    folders
  }))
}
```

**Source**: Common creative workflow patterns from industry observation

---

## 6. File Validation Strategy

### Decision: Multi-Layer Validation (Client + Server)

**Rationale**:
- **Client-side** (MIME type + size): Immediate feedback, prevents unnecessary uploads, better UX
- **Server-side** (magic bytes + ClamAV): Security enforcement, can't be bypassed, prevents malware
- Layered approach balances UX and security

**Alternatives Considered**:
- **Server-side only**: Rejected due to poor UX (user uploads 500MB only to get rejected)
- **Client-side only**: Rejected due to security risk (easily bypassed)

**Implementation Pattern**:
```typescript
// Client-side validation
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif',
  'video/mp4', 'video/webm',
  'text/html', 'application/zip'
]

function validateFile(file: File): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported file type' }
  }
  if (file.size > 500 * 1024 * 1024) {
    return { valid: false, error: 'File exceeds 500MB limit' }
  }
  return { valid: true }
}

// Server-side magic byte validation
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'application/zip': [0x50, 0x4B, 0x03, 0x04]
}

function verifyMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean {
  const signature = FILE_SIGNATURES[mimeType]
  const bytes = new Uint8Array(buffer.slice(0, signature.length))
  return signature.every((byte, i) => bytes[i] === byte)
}
```

**Source**:
- [File Signatures List](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [OWASP File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)

---

## 7. Storage Architecture

### Decision: Dual Storage (Supabase for Staging, R2 for Long-Term)

**Rationale**:
- **Supabase Storage**: Fast uploads (co-located with PostgreSQL), temporary staging (delete after 24h), simpler auth
- **Cloudflare R2**: Lower cost for long-term storage ($0.015/GB vs $0.021/GB), global CDN, better for public sharing
- Files move from Supabase → R2 after processing completes

**Alternatives Considered**:
- **R2 only**: Rejected due to more complex auth integration, slower initial upload path
- **Supabase only**: Rejected due to higher long-term cost (10GB/user = $2.10/user/year vs $1.50)

**Implementation Pattern**:
```typescript
// Upload to Supabase Storage (temporary)
await supabase.storage
  .from('uploads')
  .upload(tempPath, file)

// Process in edge function
const processed = await processAsset(tempPath)

// Move to R2 for long-term storage
await r2.putObject({
  Bucket: 'sharemyad-assets',
  Key: `projects/${projectId}/${assetId}`,
  Body: processed,
  ContentType: mimeType
})

// Delete from Supabase after 24h (via cron job)
```

**Source**:
- [Supabase Storage Pricing](https://supabase.com/pricing)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)

---

## 8. Resumable Upload Implementation

### Decision: Supabase Storage Native TUS Protocol Support

**Rationale**:
- Supabase Storage implements TUS (Tus Upload Protocol) natively
- Automatic chunking for files > 6MB
- Client-side retry logic built into Supabase JS SDK
- No custom implementation required

**Alternatives Considered**:
- **Custom chunking**: Rejected due to complexity, reinventing wheel
- **No resumable support**: Rejected as violates requirement FR-028

**Implementation Pattern**:
```typescript
// Supabase SDK automatically handles chunking and resume
const { data, error } = await supabase.storage
  .from('uploads')
  .upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    // TUS automatically enabled for files > 6MB
  })

// On network failure, SDK automatically retries from last successful chunk
```

**Source**: [Supabase Storage TUS Support](https://supabase.com/docs/guides/storage#resumable-uploads)

---

## 9. Performance Optimization

### Decision: Lazy Loading + IntersectionObserver for Thumbnails

**Rationale**:
- Only load visible thumbnails (viewport + margin)
- Reduces initial page load from 500 requests to ~20 requests (grid shows ~15 visible)
- Native browser API (IntersectionObserver), no library required
- Smooth 60 FPS scroll performance

**Alternatives Considered**:
- **Load all thumbnails**: Rejected due to poor performance (500 requests, 30+ seconds load time)
- **Virtual scrolling library (react-window)**: Considered but IntersectionObserver simpler for grid layout

**Implementation Pattern**:
```typescript
function useLazyThumbnail(ref: RefObject<HTMLElement>) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // Preload 200px before entering viewport
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return isVisible
}
```

**Source**: [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

## 10. Error Handling and Recovery

### Decision: Graceful Degradation with Partial Success

**Rationale**:
- Corrupted file at position 100/250 should not fail entire upload
- Successfully processed files (99) remain accessible
- User can retry failed portion or continue with partial upload
- Aligns with constitution requirement for clear error messages with actionable next steps

**Implementation Pattern**:
```typescript
// Edge function processes files with error recovery
const results = []
for (const file of files) {
  try {
    const processed = await processFile(file)
    results.push({ file, status: 'success', data: processed })
  } catch (error) {
    results.push({ file, status: 'failed', error: error.message })
    // Continue processing remaining files
  }
}

// Return partial success response
return {
  totalFiles: files.length,
  successful: results.filter(r => r.status === 'success').length,
  failed: results.filter(r => r.status === 'failed'),
  results
}
```

**Source**: Industry best practice for batch processing systems

---

## Summary of Key Decisions

| Component | Technology | Primary Reason |
|-----------|------------|----------------|
| Upload | Supabase Storage + Signed URLs | Resumable, progress tracking, security |
| Extraction | JSZip (Deno) | Lightweight, streaming support |
| Image Thumbnails | Sharp | Fast (libvips), high quality |
| Video Thumbnails | FFmpeg | Industry standard, precise frame extraction |
| Progress Updates | Supabase Realtime (SSE) | Native integration, auto-reconnect |
| Set Detection | Regex Pattern Matching | Simple, fast, deterministic |
| Validation | Multi-layer (client + server) | UX + security balance |
| Storage | Supabase (staging) + R2 (long-term) | Cost optimization, CDN delivery |
| Lazy Loading | IntersectionObserver | Native API, 60 FPS performance |
| Error Handling | Partial Success Pattern | Graceful degradation, user control |

---

## Open Questions Resolved

1. **How to handle 500MB uploads without timeout?**
   - Resolved: Direct upload to Supabase Storage bypasses edge function timeout limits. Edge function only processes after upload completes.

2. **How to prevent memory overflow during zip extraction?**
   - Resolved: JSZip streaming API + process files one-by-one, upload to R2 immediately, don't accumulate in memory.

3. **How to maintain 60 FPS scroll with 500 thumbnails?**
   - Resolved: IntersectionObserver lazy loading + only render visible items (~15 visible + 10 buffer = 25 total rendered).

4. **How to preserve processing state across page refresh?**
   - Resolved: PostgreSQL `processing_jobs` table stores state. Frontend queries on mount, subscribes to updates via Realtime.

5. **How to detect corrupted video files before user sees broken preview?**
   - Resolved: FFmpeg returns error code if file unreadable. Edge function catches error, generates placeholder thumbnail, stores warning in database.

---

## 11. Validation Standards Structure

### Decision: Externalized JSON Configuration with Source URLs

**Example Structure** (`frontend/src/config/validation-standards.json`):

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-11-09",
  "sources": {
    "iab": "https://www.iab.com/wp-content/uploads/2019/04/IABNewAdPortfolio_LW_FixedSizeSpec.pdf",
    "google": "https://support.google.com/google-ads/answer/1722096",
    "meta": "https://www.facebook.com/business/help/103816146375741",
    "tiktok": "https://ads.tiktok.com/help/article?aid=9552"
  },
  "standards": {
    "display": {
      "iab": [
        {
          "width": 300,
          "height": 250,
          "name": "Medium Rectangle",
          "maxSizeKB": 200,
          "category": "display"
        },
        {
          "width": 728,
          "height": 90,
          "name": "Leaderboard",
          "maxSizeKB": 200,
          "category": "display"
        },
        {
          "width": 320,
          "height": 50,
          "name": "Mobile Banner",
          "maxSizeKB": 100,
          "category": "display"
        },
        {
          "width": 160,
          "height": 600,
          "name": "Wide Skyscraper",
          "maxSizeKB": 200,
          "category": "display"
        }
      ]
    },
    "social": {
      "meta": [
        {
          "width": 1200,
          "height": 628,
          "name": "Facebook Link Post",
          "maxSizeKB": 8192,
          "category": "social"
        },
        {
          "width": 1080,
          "height": 1080,
          "name": "Instagram Square",
          "maxSizeKB": 30720,
          "category": "social"
        }
      ],
      "tiktok": [
        {
          "width": 1080,
          "height": 1920,
          "name": "TikTok Video Portrait",
          "maxSizeKB": 512000,
          "category": "social",
          "aspectRatio": "9:16"
        }
      ]
    },
    "video": {
      "google": [
        {
          "width": 1920,
          "height": 1080,
          "name": "YouTube In-Stream",
          "maxSizeKB": 1024000,
          "maxDurationSeconds": 60,
          "category": "video"
        }
      ]
    }
  },
  "fallback": {
    "allowNonStandard": true,
    "maxFileSizeKB": 512000,
    "validationLevel": "warning"
  }
}
```

**Validation Logic**:
```typescript
import validationStandards from './config/validation-standards.json'

interface ValidationResult {
  status: 'valid' | 'warning' | 'invalid'
  message: string
  standard?: string
}

function validateAsset(
  width: number,
  height: number,
  fileSizeBytes: number,
  mimeType: string
): ValidationResult {
  const fileSizeKB = fileSizeBytes / 1024

  // Check all standards for exact dimension match
  for (const [category, platforms] of Object.entries(validationStandards.standards)) {
    for (const [platform, specs] of Object.entries(platforms)) {
      const match = specs.find(spec =>
        spec.width === width && spec.height === height
      )

      if (match) {
        if (fileSizeKB <= match.maxSizeKB) {
          return {
            status: 'valid',
            message: `Standard ${platform.toUpperCase()} ${match.name} (${width}x${height})`,
            standard: `${platform}:${match.name}`
          }
        } else {
          return {
            status: 'invalid',
            message: `File size ${Math.round(fileSizeKB)}KB exceeds ${match.maxSizeKB}KB limit for ${match.name}`,
            standard: `${platform}:${match.name}`
          }
        }
      }
    }
  }

  // No standard match - check fallback rules
  if (validationStandards.fallback.allowNonStandard) {
    if (fileSizeKB <= validationStandards.fallback.maxFileSizeKB) {
      return {
        status: 'warning',
        message: `Non-standard dimensions: ${width}x${height}. File accepted but may not meet platform requirements.`
      }
    }
  }

  return {
    status: 'invalid',
    message: `Non-standard dimensions and file size ${Math.round(fileSizeKB)}KB exceeds maximum allowed`
  }
}
```

**Rationale**:
- JSON structure enables easy updates without code changes
- Source URLs provide traceability for standard changes
- Version tracking supports changelog and audit trail
- Fallback rules handle edge cases gracefully

**Source**: Constitution Principle VI (Data-Driven Validation)

---

## Next Steps

Phase 1 will generate:
1. **data-model.md** - PostgreSQL schema for entities identified in spec
2. **contracts/** - OpenAPI specs for edge function endpoints
3. **quickstart.md** - Manual test scenarios for each user story
