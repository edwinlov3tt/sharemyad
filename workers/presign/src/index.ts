// Presign Worker - Main Handler
// Now serves as the main API worker with D1 database

import type { Env } from '../../shared/types';
import { ErrorResponses } from '../../shared/errors';
import { withErrorHandling } from '../../shared/errors';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketName } from './s3-client';
import { generatePresignedUploadUrl } from './presign';
import { createSession, validateSession, markSessionUploading, SessionValidationError } from './session';
import { validatePresignedUrlRequest, parseRequestBody } from './validation';
import { rateLimitMiddleware, addRateLimitHeaders, checkRateLimit } from './rate-limit';
import { handleConfirmUpload } from './confirm';

/**
 * CORS headers for allowed origins
 */
function getCorsHeaders(request: Request, env: Env): Headers {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  const headers = new Headers();

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400');
  }

  return headers;
}

function handleCorsPrelight(request: Request, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, env),
  });
}

function withCors(response: Response, request: Request, env: Env): Response {
  const corsHeaders = getCorsHeaders(request, env);
  const headers = new Headers(response.headers);

  corsHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * POST /api/sessions - Create upload session
 */
async function handleCreateSession(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return ErrorResponses.invalidRequest('Invalid JSON');
  }

  const { sessionType, totalFiles, totalSizeBytes } = body;

  if (!sessionType || !['single', 'multiple', 'zip'].includes(sessionType)) {
    return ErrorResponses.invalidRequest('sessionType must be single, multiple, or zip');
  }
  if (typeof totalFiles !== 'number' || totalFiles < 1) {
    return ErrorResponses.invalidRequest('totalFiles must be a positive number');
  }
  if (typeof totalSizeBytes !== 'number' || totalSizeBytes < 1) {
    return ErrorResponses.invalidRequest('totalSizeBytes must be a positive number');
  }

  const session = await createSession(env.DB, sessionType, totalFiles, totalSizeBytes);

  return Response.json(session, { status: 201 });
}

/**
 * GET /api/sessions/:id - Get upload session
 */
async function handleGetSession(env: Env, sessionId: string): Promise<Response> {
  const session = await env.DB
    .prepare('SELECT * FROM upload_sessions WHERE id = ?')
    .bind(sessionId)
    .first();

  if (!session) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  return Response.json(session);
}

/**
 * PATCH /api/sessions/:id - Update session status
 */
async function handleUpdateSession(request: Request, env: Env, sessionId: string): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return ErrorResponses.invalidRequest('Invalid JSON');
  }

  const { status } = body;
  if (!status || !['pending', 'uploading', 'processing', 'completed', 'partial', 'failed'].includes(status)) {
    return ErrorResponses.invalidRequest('Invalid status');
  }

  await env.DB
    .prepare("UPDATE upload_sessions SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(status, sessionId)
    .run();

  const updated = await env.DB
    .prepare('SELECT * FROM upload_sessions WHERE id = ?')
    .bind(sessionId)
    .first();

  return Response.json(updated);
}

/**
 * GET /api/sessions/:id/assets - Get assets for a session
 */
async function handleGetSessionAssets(env: Env, sessionId: string): Promise<Response> {
  const assets = await env.DB
    .prepare(
      `SELECT ca.* FROM creative_assets ca
       JOIN creative_sets cs ON ca.creative_set_id = cs.id
       WHERE cs.upload_session_id = ?
       ORDER BY ca.upload_timestamp ASC`
    )
    .bind(sessionId)
    .all();

  return Response.json(assets.results || []);
}

/**
 * POST /api/presign/upload - Generate presigned PUT URL
 */
async function handlePresignUpload(request: Request, env: Env): Promise<Response> {
  const { body, error: parseError } = await parseRequestBody(request);
  if (parseError) {
    return ErrorResponses.invalidRequest(parseError);
  }

  const validation = validatePresignedUrlRequest(body);
  if (!validation.isValid) {
    return ErrorResponses.invalidRequest(validation.errors.join('; '));
  }

  const { sessionId, sanitizedFilename, contentType, contentLength } = validation.sanitizedData!;

  // Validate session via D1
  try {
    await validateSession(env.DB, sessionId);
  } catch (error) {
    if (error instanceof SessionValidationError) {
      return ErrorResponses.invalidSession(error.message);
    }
    throw error;
  }

  await markSessionUploading(env.DB, sessionId);

  const s3Client = createS3Client(env);
  const bucket = getBucketName(env);

  const presignedUrl = await generatePresignedUploadUrl(
    s3Client,
    bucket,
    sessionId,
    sanitizedFilename,
    contentType,
    contentLength
  );

  return Response.json(presignedUrl, { status: 200 });
}

/**
 * GET /api/assets/:id/url - Get presigned GET URL for an asset
 */
async function handleGetAssetUrl(env: Env, assetId: string, type: string): Promise<Response> {
  const asset = await env.DB
    .prepare('SELECT * FROM creative_assets WHERE id = ?')
    .bind(assetId)
    .first<{ r2_key: string; storage_url: string; mime_type: string }>();

  if (!asset) {
    return Response.json({ error: 'Asset not found' }, { status: 404 });
  }

  const r2Key = asset.r2_key || asset.storage_url;
  if (!r2Key) {
    return Response.json({ error: 'No storage key for asset' }, { status: 404 });
  }

  const s3Client = createS3Client(env);
  const bucket = getBucketName(env);

  const expirySeconds = type === 'thumbnail' ? 86400 : type === 'download' ? 900 : 3600;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: r2Key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: expirySeconds });

  return Response.json({
    url,
    expiresAt: new Date(Date.now() + expirySeconds * 1000).toISOString(),
    storageProvider: 'r2',
    cached: false,
  });
}

/**
 * Main request router
 */
async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return handleCorsPrelight(request, env);
  }

  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(request, env);
  if (rateLimitResponse) {
    return withCors(rateLimitResponse, request, env);
  }

  const rateLimitInfo = await checkRateLimit(request, env);

  let response: Response;

  // Session CRUD routes
  if (path === '/api/sessions' && request.method === 'POST') {
    response = await handleCreateSession(request, env);
  } else if (path.match(/^\/api\/sessions\/[^/]+$/) && request.method === 'GET') {
    const sessionId = path.split('/')[3];
    response = await handleGetSession(env, sessionId);
  } else if (path.match(/^\/api\/sessions\/[^/]+$/) && request.method === 'PATCH') {
    const sessionId = path.split('/')[3];
    response = await handleUpdateSession(request, env, sessionId);
  } else if (path.match(/^\/api\/sessions\/[^/]+\/assets$/) && request.method === 'GET') {
    const sessionId = path.split('/')[3];
    response = await handleGetSessionAssets(env, sessionId);
  }
  // Asset URL route
  else if (path.match(/^\/api\/assets\/[^/]+\/url$/) && request.method === 'GET') {
    const assetId = path.split('/')[3];
    response = await handleGetAssetUrl(env, assetId, url.searchParams.get('type') || 'full');
  }
  // Existing presign/confirm routes
  else if (path === '/api/presign/upload' && request.method === 'POST') {
    response = await handlePresignUpload(request, env);
  } else if (path === '/api/upload/confirm' && request.method === 'POST') {
    response = await handleConfirmUpload(request, env);
  } else if (path === '/health' && request.method === 'GET') {
    response = Response.json({ status: 'ok', service: 'sharemyad-api' });
  } else {
    response = ErrorResponses.invalidRequest(`Unknown endpoint: ${request.method} ${path}`);
  }

  response = withCors(response, request, env);
  response = addRateLimitHeaders(response, rateLimitInfo.remaining);

  return response;
}

export default {
  fetch: withErrorHandling(handleRequest),
};
