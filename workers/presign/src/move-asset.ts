// Move asset from temp storage to permanent storage in R2
// Feature: 002-r2-storage-migration
// Task: T028 - Implement R2 copy operation (temp-uploads → assets)

import type { Env } from '../../shared/types';
import { tempKeyToAssetKey } from '../../shared/utils';

export interface MoveResult {
  success: boolean;
  newKey: string;
  error?: string;
}

/**
 * Move an object from temp-uploads/ to assets/ in R2
 *
 * R2 doesn't have native rename, so we:
 * 1. Copy the object to new location
 * 2. Delete the original
 *
 * This is atomic in terms of R2 operations but not transactional.
 * If delete fails, we may have duplicates (cleaned up by lifecycle rules).
 *
 * @param env - Worker environment with R2 binding
 * @param tempKey - Current key in temp-uploads/ prefix
 * @returns Move result with new key
 */
export async function moveAssetToPermanent(
  env: Env,
  tempKey: string
): Promise<MoveResult> {
  // Validate temp key format
  if (!tempKey.startsWith('temp-uploads/')) {
    return {
      success: false,
      newKey: '',
      error: 'Key must start with temp-uploads/',
    };
  }

  // Generate permanent key
  const permanentKey = tempKeyToAssetKey(tempKey);

  try {
    // Get the source object
    const sourceObject = await env.R2_BUCKET.get(tempKey);
    if (!sourceObject) {
      return {
        success: false,
        newKey: permanentKey,
        error: `Source object not found: ${tempKey}`,
      };
    }

    // Copy to permanent location with same metadata
    await env.R2_BUCKET.put(permanentKey, sourceObject.body, {
      httpMetadata: sourceObject.httpMetadata,
      customMetadata: sourceObject.customMetadata,
    });

    // Verify copy succeeded by checking new object exists
    const copiedObject = await env.R2_BUCKET.head(permanentKey);
    if (!copiedObject) {
      return {
        success: false,
        newKey: permanentKey,
        error: 'Copy verification failed: object not found at new location',
      };
    }

    // Delete the original temp object
    // If this fails, lifecycle rules will clean it up within 24 hours
    try {
      await env.R2_BUCKET.delete(tempKey);
    } catch (deleteError) {
      console.warn(`Failed to delete temp object ${tempKey}:`, deleteError);
      // Non-fatal: lifecycle rules will clean up
    }

    return {
      success: true,
      newKey: permanentKey,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to move asset ${tempKey}:`, error);
    return {
      success: false,
      newKey: permanentKey,
      error: `Move operation failed: ${message}`,
    };
  }
}

/**
 * Delete an object from R2 (for cleanup/rollback)
 */
export async function deleteObject(env: Env, key: string): Promise<boolean> {
  try {
    await env.R2_BUCKET.delete(key);
    return true;
  } catch (error) {
    console.error(`Failed to delete object ${key}:`, error);
    return false;
  }
}
