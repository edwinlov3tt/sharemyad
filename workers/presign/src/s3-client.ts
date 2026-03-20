// S3Client configuration for R2 presigned URL generation
// Feature: 002-r2-storage-migration
// Task: T021 - Implement S3Client configuration

import { S3Client } from '@aws-sdk/client-s3';
import type { Env } from '../../shared/types';

/**
 * Create configured S3Client for R2
 *
 * Uses S3-compatible API with Cloudflare R2 credentials.
 * Credentials are passed via Worker environment variables.
 */
export function createS3Client(env: Env): S3Client {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ACCOUNT_ID) {
    throw new Error('Missing R2 credentials in environment');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Get R2 bucket name from environment
 */
export function getBucketName(env: Env): string {
  return env.R2_BUCKET_NAME || 'sharemyad';
}
