// Rate limiting middleware for presign Worker
// Feature: 002-r2-storage-migration
// Task: T026 - Add rate limiting middleware (100 req/min per IP)

import type { Env } from '../../shared/types';
import { ErrorResponses } from '../../shared/errors';

// Rate limit configuration
const RATE_LIMIT_REQUESTS = 100; // Max requests
const RATE_LIMIT_WINDOW_SECONDS = 60; // Per minute

/**
 * Extract client IP from request
 * Uses CF-Connecting-IP header (Cloudflare provides this)
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * Generate rate limit key for IP
 */
function getRateLimitKey(ip: string): string {
  // Hash IP for privacy (don't store raw IPs)
  return `rate-limit:${ip}`;
}

/**
 * Check rate limit and return remaining requests
 *
 * Uses Cloudflare KV for distributed rate limiting.
 * Falls back to allowing requests if KV is unavailable.
 *
 * @param request - Incoming request
 * @param env - Worker environment
 * @returns Rate limit result with remaining requests
 */
export async function checkRateLimit(
  request: Request,
  env: Env
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  // Skip rate limiting if KV not configured
  if (!env.RATE_LIMIT_KV) {
    console.warn('Rate limit KV not configured, skipping rate limit');
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS };
  }

  const ip = getClientIP(request);
  const key = getRateLimitKey(ip);

  try {
    // Get current count
    const currentValue = await env.RATE_LIMIT_KV.get(key);
    const currentCount = currentValue ? parseInt(currentValue, 10) : 0;

    // Check if over limit
    if (currentCount >= RATE_LIMIT_REQUESTS) {
      // Get TTL to calculate retry-after
      const metadata = await env.RATE_LIMIT_KV.getWithMetadata<{ expiresAt: number }>(key);
      const retryAfter = metadata?.metadata?.expiresAt
        ? Math.ceil((metadata.metadata.expiresAt - Date.now()) / 1000)
        : RATE_LIMIT_WINDOW_SECONDS;

      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    // Increment counter
    const newCount = currentCount + 1;
    const expiresAt = Date.now() + RATE_LIMIT_WINDOW_SECONDS * 1000;

    await env.RATE_LIMIT_KV.put(key, String(newCount), {
      expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
      metadata: { expiresAt },
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_REQUESTS - newCount,
    };
  } catch (error) {
    // Log error but allow request (fail open for availability)
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS };
  }
}

/**
 * Rate limiting middleware
 * Returns error response if rate limited, null if allowed
 */
export async function rateLimitMiddleware(
  request: Request,
  env: Env
): Promise<Response | null> {
  const result = await checkRateLimit(request, env);

  if (!result.allowed) {
    return ErrorResponses.rateLimited(result.retryAfter);
  }

  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  remaining: number
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', String(RATE_LIMIT_REQUESTS));
  headers.set('X-RateLimit-Remaining', String(remaining));
  headers.set('X-RateLimit-Reset', String(RATE_LIMIT_WINDOW_SECONDS));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
