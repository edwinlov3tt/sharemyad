# API Contract: Generate Presigned Upload URL

**Endpoint**: `POST /api/presign/upload`
**Worker**: `presign`
**Authentication**: Supabase JWT (optional for anonymous uploads)

## Purpose

Generate a presigned PUT URL for direct browser-to-R2 upload. This bypasses the Worker's 100MB request limit by allowing the browser to upload directly to R2.

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | No | Bearer token from Supabase Auth (optional) |
| Content-Type | Yes | `application/json` |

### Body

```typescript
interface PresignedUrlRequest {
  sessionId: string;      // Upload session ID from Supabase
  filename: string;       // Original filename
  contentType: string;    // MIME type (e.g., "image/png")
  contentLength: number;  // File size in bytes
}
```

### Example

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "banner-300x250.png",
  "contentType": "image/png",
  "contentLength": 245678
}
```

## Response

### Success (200 OK)

```typescript
interface PresignedUrlResponse {
  url: string;           // Presigned PUT URL
  key: string;           // R2 object key
  expiresAt: string;     // ISO 8601 expiration timestamp
  maxSizeBytes: number;  // Maximum allowed size (500MB)
}
```

### Example

```json
{
  "url": "https://sharemyad-assets.{account-id}.r2.cloudflarestorage.com/temp-uploads/550e8400.../banner-300x250.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "key": "temp-uploads/550e8400-e29b-41d4-a716-446655440000/banner-300x250.png",
  "expiresAt": "2025-11-26T13:00:00.000Z",
  "maxSizeBytes": 524288000
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid request body |
| 400 | INVALID_SESSION | Session ID not found or expired |
| 400 | FILE_TOO_LARGE | contentLength exceeds 500MB limit |
| 400 | INVALID_CONTENT_TYPE | Content type not in allowed list |
| 401 | UNAUTHORIZED | Invalid or expired JWT (if required) |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

### Error Body

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 500MB limit",
    "details": {
      "provided": 600000000,
      "maximum": 524288000
    }
  }
}
```

## Validation Rules

1. **sessionId**: Must be valid UUID, session must exist and not be expired
2. **filename**: Max 255 characters, sanitized server-side
3. **contentType**: Must be one of: `image/jpeg`, `image/png`, `image/gif`, `video/mp4`, `video/webm`, `application/zip`
4. **contentLength**: Must be > 0 and <= 524288000 (500MB)

## Usage Flow

```
┌─────────────┐     1. Request presigned URL     ┌─────────────┐
│   Browser   │ ────────────────────────────────>│   Worker    │
│             │                                   │   /presign  │
│             │     2. Return presigned URL       │             │
│             │ <────────────────────────────────│             │
│             │                                   └─────────────┘
│             │
│             │     3. PUT file directly to R2   ┌─────────────┐
│             │ ────────────────────────────────>│     R2      │
│             │                                   │   Bucket    │
│             │     4. 200 OK + ETag             │             │
│             │ <────────────────────────────────│             │
└─────────────┘                                   └─────────────┘
```

## Rate Limiting

- 100 requests per minute per IP
- 10 concurrent presigned URLs per session

## Security Considerations

1. **CORS**: Only allowed origins can request presigned URLs
2. **Expiry**: URLs expire after 1 hour
3. **Validation**: File type and size validated before generating URL
4. **Scope**: URL is scoped to specific key (cannot upload to other paths)
5. **Single-use**: Each presigned URL should be used once

## Implementation Notes

```typescript
// Worker implementation
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Validate request
    const body = await request.json();

    // Verify session exists
    const session = await verifySession(body.sessionId, env);
    if (!session) {
      return errorResponse(400, 'INVALID_SESSION', 'Session not found');
    }

    // Validate content type
    if (!ALLOWED_TYPES.includes(body.contentType)) {
      return errorResponse(400, 'INVALID_CONTENT_TYPE', 'Content type not allowed');
    }

    // Validate size
    if (body.contentLength > MAX_SIZE) {
      return errorResponse(400, 'FILE_TOO_LARGE', 'File exceeds 500MB limit');
    }

    // Generate presigned URL
    const key = `temp-uploads/${body.sessionId}/${sanitize(body.filename)}`;
    const url = await generatePresignedPutUrl(env.R2_BUCKET, key, {
      contentType: body.contentType,
      expiresIn: 3600,
    });

    return Response.json({
      url,
      key,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      maxSizeBytes: MAX_SIZE,
    });
  }
};
```
