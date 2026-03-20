// Presigned URL generation for R2 uploads
// Feature: 002-r2-storage-migration
// Task: T022 - Implement presigned URL generation function

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { S3Client } from '@aws-sdk/client-s3';
import type { AllowedContentType, PresignedUrlResponse } from '../../shared/types';
import { PRESIGNED_URL_EXPIRY } from '../../shared/types';
import { generateTempUploadKey, getExpiryISOString } from '../../shared/utils';

/**
 * Generate a presigned PUT URL for direct R2 upload
 *
 * The URL allows the browser to upload directly to R2, bypassing
 * the Worker's 100MB request limit. The URL is valid for 1 hour.
 *
 * @param client - Configured S3Client
 * @param bucket - R2 bucket name
 * @param sessionId - Upload session ID
 * @param filename - Sanitized filename
 * @param contentType - MIME type of the file
 * @param contentLength - Expected file size in bytes
 * @returns Presigned URL response with key and expiry
 */
export async function generatePresignedUploadUrl(
  client: S3Client,
  bucket: string,
  sessionId: string,
  filename: string,
  contentType: AllowedContentType,
  contentLength: number
): Promise<PresignedUrlResponse> {
  // Generate the R2 object key
  const key = generateTempUploadKey(sessionId, filename);

  // Create the PutObject command with metadata
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    // Add metadata for tracking
    Metadata: {
      'session-id': sessionId,
      'original-filename': filename,
    },
  });

  // Generate the presigned URL
  // expiresIn is in seconds (3600 = 1 hour)
  const url = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  });

  return {
    url,
    key,
    expiresAt: getExpiryISOString(PRESIGNED_URL_EXPIRY),
    maxSizeBytes: contentLength,
  };
}
