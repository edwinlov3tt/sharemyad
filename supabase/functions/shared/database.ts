// PostgreSQL query helpers for Supabase Edge Functions
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getSupabaseClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }

  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  )
}

export async function withTransaction<T>(
  supabase: SupabaseClient,
  callback: () => Promise<T>
): Promise<T> {
  // Supabase JS doesn't expose transaction API directly
  // Use RPC for transactions when needed
  return callback()
}

export function handleDatabaseError(error: unknown): Response {
  console.error('Database error:', error)

  if (error instanceof Error) {
    return new Response(
      JSON.stringify({
        error: 'Database operation failed',
        code: 'DATABASE_ERROR',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify({
      error: 'Unknown database error',
      code: 'UNKNOWN_ERROR',
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Thumbnail metadata interface
 * Matches the thumbnails table schema from data-model.md
 */
export interface ThumbnailMetadata {
  id?: string // UUID, auto-generated
  creative_asset_id: string // Foreign key to creative_assets
  thumbnail_url: string // R2 storage URL
  width: number // Should be 300
  height: number // Should be 180
  file_size_bytes: number
  format: string // Should be 'jpeg'
  generated_at?: string // Timestamp, auto-generated
}

/**
 * Insert thumbnail metadata into database
 *
 * @param supabase - Supabase client
 * @param thumbnail - Thumbnail metadata
 * @returns Inserted thumbnail record
 */
export async function insertThumbnailMetadata(
  supabase: SupabaseClient,
  thumbnail: ThumbnailMetadata
): Promise<ThumbnailMetadata> {
  const { data, error } = await supabase
    .from('thumbnails')
    .insert({
      creative_asset_id: thumbnail.creative_asset_id,
      thumbnail_url: thumbnail.thumbnail_url,
      width: thumbnail.width,
      height: thumbnail.height,
      file_size_bytes: thumbnail.file_size_bytes,
      format: thumbnail.format,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to insert thumbnail metadata: ${error.message}`)
  }

  return data
}

/**
 * Batch insert thumbnail metadata
 * Inserts multiple thumbnails with error handling
 *
 * @param supabase - Supabase client
 * @param thumbnails - Array of thumbnail metadata
 * @returns Array of insertion results
 */
export async function insertThumbnailBatch(
  supabase: SupabaseClient,
  thumbnails: ThumbnailMetadata[]
): Promise<Array<{ success: boolean; data?: ThumbnailMetadata; error?: string }>> {
  const results: Array<{ success: boolean; data?: ThumbnailMetadata; error?: string }> = []

  for (const thumbnail of thumbnails) {
    try {
      const data = await insertThumbnailMetadata(supabase, thumbnail)
      results.push({ success: true, data })
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

/**
 * Get thumbnail by asset ID
 *
 * @param supabase - Supabase client
 * @param assetId - Creative asset ID
 * @returns Thumbnail metadata or null if not found
 */
export async function getThumbnailByAssetId(
  supabase: SupabaseClient,
  assetId: string
): Promise<ThumbnailMetadata | null> {
  const { data, error } = await supabase
    .from('thumbnails')
    .select('*')
    .eq('creative_asset_id', assetId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null
    }
    throw new Error(`Failed to get thumbnail: ${error.message}`)
  }

  return data
}

/**
 * Update thumbnail URL
 * Used when re-generating thumbnail or moving to different storage
 *
 * @param supabase - Supabase client
 * @param assetId - Creative asset ID
 * @param newThumbnailUrl - New thumbnail URL
 * @returns Updated thumbnail metadata
 */
export async function updateThumbnailUrl(
  supabase: SupabaseClient,
  assetId: string,
  newThumbnailUrl: string
): Promise<ThumbnailMetadata> {
  const { data, error } = await supabase
    .from('thumbnails')
    .update({ thumbnail_url: newThumbnailUrl })
    .eq('creative_asset_id', assetId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update thumbnail URL: ${error.message}`)
  }

  return data
}
