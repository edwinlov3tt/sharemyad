# API Contract: Get Asset URL

**Endpoint**: `GET /api/assets/:assetId/url`
**Worker**: `asset-proxy`
**Authentication**: None (public share links) or Supabase JWT (authenticated access)

## Purpose

Generate a presigned URL for accessing an asset. Supports both R2 and Supabase storage backends for backward compatibility during migration.

## Request

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| assetId | UUID | Asset identifier |

### Query Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| type | No | `full` | URL type: `full`, `thumbnail`, `download` |
| shareSlug | No | - | Share link slug (for public access) |

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | No | Bearer token (required if no shareSlug) |

### Example

```
GET /api/assets/660e8400-e29b-41d4-a716-446655440001/url?type=thumbnail
Authorization: Bearer eyJ...

GET /api/assets/660e8400-e29b-41d4-a716-446655440001/url?type=full&shareSlug=abc123xyz
```

## Response

### Success (200 OK)

```typescript
interface AssetUrlResponse {
  url: string;              // Presigned URL or public URL
  expiresAt: string | null; // ISO 8601 timestamp (null for public URLs)
  storageProvider: 'r2' | 'supabase';
  cached: boolean;          // Whether URL was served from cache
}
```

### Example (R2 Asset)

```json
{
  "url": "https://sharemyad-assets.{account-id}.r2.cloudflarestorage.com/assets/550e8400.../banner-300x250.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "expiresAt": "2025-11-27T12:00:00.000Z",
  "storageProvider": "r2",
  "cached": false
}
```

### Example (Supabase Asset - Legacy)

```json
{
  "url": "https://gnurilaiddffxfjujegu.supabase.co/storage/v1/object/public/temp-uploads/uploads/550e8400.../banner-300x250.png",
  "expiresAt": null,
  "storageProvider": "supabase",
  "cached": true
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_ASSET_ID | Asset ID not valid UUID |
| 400 | INVALID_TYPE | Type must be full, thumbnail, or download |
| 401 | UNAUTHORIZED | No auth token or share slug provided |
| 403 | ACCESS_DENIED | Share slug expired or asset not in share |
| 404 | ASSET_NOT_FOUND | Asset does not exist |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

## URL Types

### `full` (default)
- Returns URL to full-resolution asset
- Expiry: 1 hour for R2, no expiry for Supabase
- Use case: Viewing asset in detail modal

### `thumbnail`
- Returns URL to thumbnail version (if available)
- Expiry: 24 hours for R2 (longer cache)
- Fallback: Returns full URL if thumbnail not generated
- Use case: Gallery grid view

### `download`
- Returns URL with `Content-Disposition: attachment` header
- Expiry: 15 minutes (shorter for security)
- Use case: Download button

## Access Control

### Authenticated Access
- Requires valid JWT in Authorization header
- User must own the asset OR be granted access via share link

### Public Access (Share Links)
- Requires `shareSlug` query parameter
- Share link must be valid (not expired, views remaining)
- Asset must be part of the shared project

```
Authorization Check:

1. If Authorization header present:
   ├── Validate JWT
   └── Check user owns asset OR has access via active share
       └── If yes → Generate URL
       └── If no → 403 ACCESS_DENIED

2. If shareSlug present:
   ├── Validate share slug exists
   ├── Check not expired
   ├── Check views remaining (if limited)
   └── Check asset belongs to shared project
       └── If yes → Generate URL, increment view count
       └── If no → 403 ACCESS_DENIED

3. If neither:
   └── 401 UNAUTHORIZED
```

## Caching Strategy

### URL Caching (Worker KV)
- Thumbnail URLs cached for 23 hours (regenerate before 24hr expiry)
- Full URLs cached for 50 minutes (regenerate before 1hr expiry)
- Cache key: `url:{assetId}:{type}:{storageProvider}`

### CDN Caching
- R2 URLs automatically cached by Cloudflare CDN
- Cache-Control headers set based on URL type

## Implementation Notes

```typescript
// Worker implementation
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/api\/assets\/([^/]+)\/url$/);
    if (!match) return notFound();

    const assetId = match[1];
    const type = url.searchParams.get('type') || 'full';
    const shareSlug = url.searchParams.get('shareSlug');

    // Validate asset ID
    if (!isValidUUID(assetId)) {
      return errorResponse(400, 'INVALID_ASSET_ID');
    }

    // Validate type
    if (!['full', 'thumbnail', 'download'].includes(type)) {
      return errorResponse(400, 'INVALID_TYPE');
    }

    // Get asset from database
    const asset = await getAsset(assetId, env);
    if (!asset) return errorResponse(404, 'ASSET_NOT_FOUND');

    // Authorization check
    const authResult = await checkAccess(request, asset, shareSlug, env);
    if (!authResult.allowed) {
      return errorResponse(authResult.status, authResult.code);
    }

    // Check cache
    const cacheKey = `url:${assetId}:${type}:${asset.storageProvider}`;
    const cached = await env.URL_CACHE.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return Response.json({ ...data, cached: true });
    }

    // Generate URL based on storage provider
    let assetUrl: string;
    let expiresAt: Date | null;

    if (asset.storageProvider === 'r2') {
      const expiry = getExpiry(type);
      assetUrl = await generatePresignedGetUrl(env.R2_BUCKET, asset.r2Key, {
        expiresIn: expiry,
        responseDisposition: type === 'download' ? 'attachment' : undefined,
      });
      expiresAt = new Date(Date.now() + expiry * 1000);
    } else {
      // Supabase - return existing public URL
      assetUrl = asset.storageUrl;
      expiresAt = null;
    }

    // Cache the URL
    const response = {
      url: assetUrl,
      expiresAt: expiresAt?.toISOString() || null,
      storageProvider: asset.storageProvider,
    };
    await env.URL_CACHE.put(cacheKey, JSON.stringify(response), {
      expirationTtl: getCacheTtl(type),
    });

    return Response.json({ ...response, cached: false });
  }
};

function getExpiry(type: string): number {
  switch (type) {
    case 'thumbnail': return 86400;  // 24 hours
    case 'download': return 900;     // 15 minutes
    default: return 3600;            // 1 hour
  }
}

function getCacheTtl(type: string): number {
  switch (type) {
    case 'thumbnail': return 82800;  // 23 hours
    case 'download': return 600;     // 10 minutes
    default: return 3000;            // 50 minutes
  }
}
```

## Rate Limiting

- Authenticated: 1000 requests per minute per user
- Public (share links): 100 requests per minute per IP
- Thumbnail type: Higher limits (gallery views generate many requests)
