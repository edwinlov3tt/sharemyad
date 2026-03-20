# API Contract: Confirm Upload

**Endpoint**: `POST /api/upload/confirm`
**Worker**: `presign`
**Authentication**: Supabase JWT (optional for anonymous uploads)

## Purpose

Confirm that a file was successfully uploaded to R2. This endpoint creates the asset record in the database and moves the file from temp storage to permanent storage.

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | No | Bearer token from Supabase Auth (optional) |
| Content-Type | Yes | `application/json` |

### Body

```typescript
interface UploadConfirmRequest {
  sessionId: string;      // Upload session ID
  key: string;            // R2 object key from presigned URL response
  etag: string;           // ETag returned by R2 after upload
  contentLength: number;  // Actual uploaded file size
  filename: string;       // Original filename
  contentType: string;    // MIME type
}
```

### Example

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "key": "temp-uploads/550e8400.../banner-300x250.png",
  "etag": "\"d41d8cd98f00b204e9800998ecf8427e\"",
  "contentLength": 245678,
  "filename": "banner-300x250.png",
  "contentType": "image/png"
}
```

## Response

### Success (200 OK)

```typescript
interface UploadConfirmResponse {
  asset: {
    id: string;
    creativeSetId: string;
    filenameOriginal: string;
    filenameSanitized: string;
    fileType: 'image' | 'video' | 'html5';
    mimeType: string;
    fileSizeBytes: number;
    storageProvider: 'r2';
    r2Key: string;
    uploadTimestamp: string;
    validationStatus: 'pending' | 'valid' | 'warning' | 'invalid';
  };
  session: {
    id: string;
    status: 'uploading' | 'processing' | 'completed' | 'partial';
    uploadedFiles: number;
    totalFiles: number;
  };
}
```

### Example

```json
{
  "asset": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "creativeSetId": "770e8400-e29b-41d4-a716-446655440002",
    "filenameOriginal": "banner-300x250.png",
    "filenameSanitized": "banner-300x250.png",
    "fileType": "image",
    "mimeType": "image/png",
    "fileSizeBytes": 245678,
    "storageProvider": "r2",
    "r2Key": "assets/550e8400.../banner-300x250.png",
    "uploadTimestamp": "2025-11-26T12:30:00.000Z",
    "validationStatus": "pending"
  },
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "uploading",
    "uploadedFiles": 1,
    "totalFiles": 5
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid request body |
| 400 | INVALID_SESSION | Session not found or expired |
| 400 | INVALID_KEY | R2 key does not match session |
| 400 | OBJECT_NOT_FOUND | File not found in R2 at specified key |
| 400 | ETAG_MISMATCH | ETag doesn't match (file may be corrupted) |
| 400 | SIZE_MISMATCH | Reported size doesn't match actual file |
| 401 | UNAUTHORIZED | Invalid or expired JWT |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

### Error Body

```json
{
  "error": {
    "code": "ETAG_MISMATCH",
    "message": "File integrity check failed",
    "details": {
      "expected": "\"d41d8cd98f00b204e9800998ecf8427e\"",
      "received": "\"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6\""
    }
  }
}
```

## Validation Rules

1. **sessionId**: Must be valid UUID, session must exist and not expired
2. **key**: Must start with `temp-uploads/{sessionId}/`
3. **etag**: Must match ETag returned by R2 HEAD request
4. **contentLength**: Must match actual object size in R2
5. **contentType**: Must match allowed types

## Processing Flow

```
┌─────────────┐                                  ┌─────────────┐
│   Browser   │     1. POST /upload/confirm      │   Worker    │
│             │ ────────────────────────────────>│             │
│             │                                   │             │
│             │                                   │  2. HEAD R2 │
│             │                                   │  (verify)   │
│             │                                   │      │      │
│             │                                   │      ▼      │
│             │                                   │  3. Copy to │
│             │                                   │  assets/    │
│             │                                   │      │      │
│             │                                   │      ▼      │
│             │                                   │  4. Create  │
│             │                                   │  DB record  │
│             │                                   │      │      │
│             │     5. Return asset details       │      ▼      │
│             │ <────────────────────────────────│             │
└─────────────┘                                   └─────────────┘
```

## Implementation Notes

```typescript
// Worker implementation
async function confirmUpload(body: UploadConfirmRequest, env: Env) {
  // 1. Verify session
  const session = await getSession(body.sessionId, env);
  if (!session) throw new ApiError(400, 'INVALID_SESSION');

  // 2. Verify key belongs to session
  if (!body.key.startsWith(`temp-uploads/${body.sessionId}/`)) {
    throw new ApiError(400, 'INVALID_KEY');
  }

  // 3. Verify object exists in R2 with matching etag
  const object = await env.R2_BUCKET.head(body.key);
  if (!object) throw new ApiError(400, 'OBJECT_NOT_FOUND');

  if (object.etag !== body.etag) {
    throw new ApiError(400, 'ETAG_MISMATCH');
  }

  if (object.size !== body.contentLength) {
    throw new ApiError(400, 'SIZE_MISMATCH');
  }

  // 4. Move to permanent location
  const permanentKey = body.key.replace('temp-uploads/', 'assets/');
  await env.R2_BUCKET.copy(body.key, permanentKey);
  await env.R2_BUCKET.delete(body.key);

  // 5. Create asset record
  const asset = await createAsset({
    sessionId: body.sessionId,
    filename: body.filename,
    contentType: body.contentType,
    size: body.contentLength,
    storageProvider: 'r2',
    r2Key: permanentKey,
    r2Etag: body.etag,
  }, env);

  // 6. Update session progress
  const updatedSession = await updateSessionProgress(body.sessionId, env);

  return { asset, session: updatedSession };
}
```

## Idempotency

This endpoint is **not idempotent**. Calling it multiple times with the same parameters will:
- Fail with `OBJECT_NOT_FOUND` after the first successful call (temp file was moved)

Clients should handle this by checking if asset already exists before retrying.

## Session Completion

When `uploadedFiles === totalFiles`, the session status automatically transitions to `processing` or `completed` based on validation results.
