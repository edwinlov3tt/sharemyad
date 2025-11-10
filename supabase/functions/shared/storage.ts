// R2 + Supabase Storage helpers
import { S3Client, PutObjectCommand, GetObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3'
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cloudflare R2 Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: Deno.env.get('R2_ENDPOINT') ?? '',
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
  },
})

export const R2_BUCKET = Deno.env.get('R2_BUCKET_NAME') ?? 'sharemyad-assets'

// Upload file to R2 for long-term storage
export async function uploadToR2(
  key: string,
  body: Uint8Array | ReadableStream,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  })

  await r2Client.send(command)

  // Return R2 public URL
  const r2PublicUrl = Deno.env.get('R2_PUBLIC_URL') ?? ''
  return `${r2PublicUrl}/${key}`
}

// Get file from R2
export async function getFromR2(key: string): Promise<ReadableStream | null> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })

  try {
    const response = await r2Client.send(command)
    return response.Body as ReadableStream
  } catch (error) {
    console.error('Error getting file from R2:', error)
    return null
  }
}

// Create signed upload URL for Supabase Storage (temporary staging)
export async function createSignedUploadUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<{ url: string; path: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error) {
    throw new Error(`Failed to create signed upload URL: ${error.message}`)
  }

  return {
    url: data.signedUrl,
    path: data.path,
  }
}

// Move file from Supabase Storage to R2
export async function moveToR2(
  supabase: SupabaseClient,
  supabaseBucket: string,
  supabasePath: string,
  r2Key: string,
  contentType: string
): Promise<string> {
  // Download from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(supabaseBucket)
    .download(supabasePath)

  if (downloadError || !fileData) {
    throw new Error(`Failed to download from Supabase: ${downloadError?.message}`)
  }

  // Convert Blob to Uint8Array
  const arrayBuffer = await fileData.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  // Upload to R2
  const r2Url = await uploadToR2(r2Key, uint8Array, contentType)

  // Delete from Supabase Storage (cleanup)
  await supabase.storage.from(supabaseBucket).remove([supabasePath])

  return r2Url
}

/**
 * Upload thumbnail to R2 storage
 * Generates path: thumbnails/{assetId}.jpg
 *
 * @param assetId - Unique asset identifier
 * @param thumbnailBuffer - Thumbnail image buffer (JPEG)
 * @returns R2 URL for the uploaded thumbnail
 */
export async function uploadThumbnailToR2(
  assetId: string,
  thumbnailBuffer: ArrayBuffer
): Promise<string> {
  const key = `thumbnails/${assetId}.jpg`
  const uint8Array = new Uint8Array(thumbnailBuffer)

  const r2Url = await uploadToR2(key, uint8Array, 'image/jpeg')

  return r2Url
}

/**
 * Upload full-resolution asset to R2 storage
 * Generates path: assets/{projectId}/{assetId}{extension}
 *
 * @param projectId - Project identifier
 * @param assetId - Asset identifier
 * @param assetBuffer - Full asset buffer
 * @param contentType - MIME type of asset
 * @param extension - File extension (e.g., '.jpg', '.mp4')
 * @returns R2 URL for the uploaded asset
 */
export async function uploadAssetToR2(
  projectId: string,
  assetId: string,
  assetBuffer: ArrayBuffer,
  contentType: string,
  extension: string
): Promise<string> {
  const key = `assets/${projectId}/${assetId}${extension}`
  const uint8Array = new Uint8Array(assetBuffer)

  const r2Url = await uploadToR2(key, uint8Array, contentType)

  return r2Url
}

/**
 * Batch upload thumbnails to R2
 * Uploads multiple thumbnails with concurrency control
 *
 * @param thumbnails - Array of thumbnail data
 * @param maxConcurrent - Maximum concurrent uploads (default: 10)
 * @returns Array of upload results
 */
export async function uploadThumbnailBatch(
  thumbnails: Array<{
    assetId: string
    buffer: ArrayBuffer
  }>,
  maxConcurrent: number = 10
): Promise<Array<{ assetId: string; url: string; error?: string }>> {
  const results: Array<{ assetId: string; url: string; error?: string }> = []

  // Process in batches
  for (let i = 0; i < thumbnails.length; i += maxConcurrent) {
    const batch = thumbnails.slice(i, i + maxConcurrent)

    const batchResults = await Promise.allSettled(
      batch.map(async (thumbnail) => {
        try {
          const url = await uploadThumbnailToR2(thumbnail.assetId, thumbnail.buffer)
          return {
            assetId: thumbnail.assetId,
            url,
          }
        } catch (error) {
          return {
            assetId: thumbnail.assetId,
            url: '',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    // Collect results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          assetId: 'unknown',
          url: '',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        })
      }
    }
  }

  return results
}
