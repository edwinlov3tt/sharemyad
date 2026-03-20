// Error handling utilities for R2 Storage Migration Workers

import type { ApiErrorResponse, ErrorCode } from './types';

// =============================================================================
// API Error Class
// =============================================================================

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }

  toResponse(): Response {
    return Response.json(this.toJSON(), {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// =============================================================================
// Error Response Factory
// =============================================================================

/**
 * Create standardized error response
 */
export function errorResponse(
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): Response {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return Response.json(body, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// =============================================================================
// Pre-built Error Responses
// =============================================================================

export const ErrorResponses = {
  invalidRequest: (message = 'Invalid request') =>
    errorResponse(400, 'INVALID_REQUEST', message),

  invalidSession: (message = 'Session not found or expired') =>
    errorResponse(400, 'INVALID_SESSION', message),

  fileTooLarge: (provided: number, maximum: number) =>
    errorResponse(400, 'FILE_TOO_LARGE', 'File size exceeds limit', {
      provided,
      maximum,
    }),

  invalidContentType: (contentType: string, allowed: readonly string[]) =>
    errorResponse(400, 'INVALID_CONTENT_TYPE', `Content type '${contentType}' is not allowed`, {
      provided: contentType,
      allowed: [...allowed],
    }),

  unauthorized: (message = 'Authentication required') =>
    errorResponse(401, 'UNAUTHORIZED', message),

  accessDenied: (message = 'Access denied') =>
    errorResponse(403, 'ACCESS_DENIED', message),

  assetNotFound: (assetId: string) =>
    errorResponse(404, 'ASSET_NOT_FOUND', `Asset '${assetId}' not found`),

  objectNotFound: (key: string) =>
    errorResponse(400, 'OBJECT_NOT_FOUND', `Object not found at key: ${key}`),

  etagMismatch: (expected: string, received: string) =>
    errorResponse(400, 'ETAG_MISMATCH', 'File integrity check failed', {
      expected,
      received,
    }),

  sizeMismatch: (expected: number, received: number) =>
    errorResponse(400, 'SIZE_MISMATCH', 'File size does not match', {
      expected,
      received,
    }),

  invalidKey: (message = 'Invalid storage key') =>
    errorResponse(400, 'INVALID_KEY', message),

  invalidAssetId: (message = 'Asset ID must be a valid UUID') =>
    errorResponse(400, 'INVALID_ASSET_ID', message),

  invalidType: (message = 'Type must be full, thumbnail, or download') =>
    errorResponse(400, 'INVALID_TYPE', message),

  rateLimited: (retryAfter?: number) =>
    Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          ...(retryAfter && { details: { retryAfter } }),
        },
      },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...(retryAfter && { 'Retry-After': String(retryAfter) }),
        },
      }
    ),

  internalError: (message = 'An unexpected error occurred') =>
    errorResponse(500, 'INTERNAL_ERROR', message),
};

// =============================================================================
// Error Handler
// =============================================================================

/**
 * Wrap handler with error handling
 */
export function withErrorHandling(
  handler: (request: Request, env: unknown, ctx: ExecutionContext) => Promise<Response>
) {
  return async (
    request: Request,
    env: unknown,
    ctx: ExecutionContext
  ): Promise<Response> => {
    try {
      return await handler(request, env, ctx);
    } catch (error) {
      console.error('Unhandled error:', error);

      if (error instanceof ApiError) {
        return error.toResponse();
      }

      // Log unexpected errors with stack trace
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }

      return ErrorResponses.internalError();
    }
  };
}

// =============================================================================
// Validation Error Builder
// =============================================================================

/**
 * Build validation error from array of error messages
 */
export function validationError(errors: string[]): Response {
  return errorResponse(400, 'INVALID_REQUEST', 'Validation failed', {
    errors,
  });
}
