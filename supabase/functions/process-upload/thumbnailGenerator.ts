/**
 * Thumbnail Generator
 *
 * Generates optimized thumbnails for images and videos using:
 * - Sharp for images (300x180, aspect ratio preserved)
 * - FFmpeg for videos (extract frame at 1-second mark)
 *
 * From: specs/001-upload-asset-processing/research.md (Decision #3)
 * Tasks: T104-T107
 */

// Note: Sharp and FFmpeg will need to be installed in the Deno runtime
// For now, we'll use placeholder implementations that can be replaced with actual libraries

interface ThumbnailResult {
  buffer: ArrayBuffer
  width: number
  height: number
  format: 'jpeg'
  sizeBytes: number
}

interface VideoThumbnailOptions {
  timestamp?: number // Timestamp in seconds to extract frame (default: 1.0)
  width?: number // Target width (default: 300)
  height?: number // Target height (default: 180)
}

interface ImageThumbnailOptions {
  width?: number // Target width (default: 300)
  height?: number // Target height (default: 180)
  quality?: number // JPEG quality 1-100 (default: 80)
  fit?: 'contain' | 'cover' | 'fill' // How to resize (default: 'contain')
}

/**
 * Thumbnail Generator Class
 * Handles thumbnail generation for both images and videos
 */
export class ThumbnailGenerator {
  private static readonly DEFAULT_WIDTH = 300
  private static readonly DEFAULT_HEIGHT = 180
  private static readonly DEFAULT_QUALITY = 80
  private static readonly DEFAULT_VIDEO_TIMESTAMP = 1.0 // 1 second

  /**
   * Generate thumbnail for image using Sharp
   * Preserves aspect ratio and outputs JPEG at 300x180
   *
   * @param imageBuffer - Source image buffer (JPG, PNG, GIF)
   * @param options - Thumbnail generation options
   * @returns ThumbnailResult with generated thumbnail data
   */
  async generateImageThumbnail(
    imageBuffer: ArrayBuffer,
    options: ImageThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    const {
      width = ThumbnailGenerator.DEFAULT_WIDTH,
      height = ThumbnailGenerator.DEFAULT_HEIGHT,
      quality = ThumbnailGenerator.DEFAULT_QUALITY,
      fit = 'contain',
    } = options

    try {
      // Use Sharp for high-quality image thumbnail generation
      // Sharp is available via npm: specifier in Deno
      const sharp = (await import('npm:sharp@0.33.1')).default

      const thumbnail = await sharp(Buffer.from(imageBuffer))
        .resize(width, height, {
          fit: fit,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .jpeg({ quality })
        .toBuffer()

      return {
        buffer: thumbnail.buffer,
        width,
        height,
        format: 'jpeg',
        sizeBytes: thumbnail.length
      }
    } catch (error) {
      throw new Error(
        `Failed to generate image thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Generate thumbnail for video using FFmpeg
   * Extracts frame at 1-second mark and resizes to 300x180
   *
   * @param videoPath - Path to video file (or URL)
   * @param options - Video thumbnail extraction options
   * @returns ThumbnailResult with extracted frame as JPEG
   */
  async generateVideoThumbnail(
    videoPath: string,
    options: VideoThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    const {
      timestamp = ThumbnailGenerator.DEFAULT_VIDEO_TIMESTAMP,
      width = ThumbnailGenerator.DEFAULT_WIDTH,
      height = ThumbnailGenerator.DEFAULT_HEIGHT,
    } = options

    try {
      // Use FFmpeg to extract video frame
      const outputPath = `/tmp/thumbnail-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

      // Use Deno.Command to run FFmpeg
      const command = new Deno.Command('ffmpeg', {
        args: [
          '-ss', timestamp.toString(),           // Seek to timestamp
          '-i', videoPath,                       // Input video
          '-vframes', '1',                       // Extract 1 frame
          '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
          '-y',                                  // Overwrite output file
          outputPath
        ],
        stdout: 'piped',
        stderr: 'piped',
      })

      const { code, stderr } = await command.output()

      if (code !== 0) {
        const errorText = new TextDecoder().decode(stderr)
        throw new Error(`FFmpeg failed: ${errorText}`)
      }

      // Read the generated thumbnail
      const thumbnailBuffer = await Deno.readFile(outputPath)

      // Clean up temporary file
      try {
        await Deno.remove(outputPath)
      } catch {
        // Ignore cleanup errors
      }

      return {
        buffer: thumbnailBuffer.buffer,
        width,
        height,
        format: 'jpeg',
        sizeBytes: thumbnailBuffer.length
      }
    } catch (error) {
      throw new Error(
        `Failed to generate video thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Generate thumbnail for GIF (uses image thumbnail generator)
   * Extracts first frame and converts to JPEG
   *
   * @param gifBuffer - Source GIF buffer
   * @param options - Thumbnail generation options
   * @returns ThumbnailResult with first frame as JPEG
   */
  async generateGIFThumbnail(
    gifBuffer: ArrayBuffer,
    options: ImageThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    // GIF thumbnails use the same process as image thumbnails
    // Sharp can handle GIF input and extract first frame
    return this.generateImageThumbnail(gifBuffer, options)
  }

  /**
   * Validate that generated thumbnail meets requirements
   *
   * @param thumbnail - Generated thumbnail result
   * @throws Error if thumbnail doesn't meet requirements
   */
  validateThumbnail(thumbnail: ThumbnailResult): void {
    if (thumbnail.width !== ThumbnailGenerator.DEFAULT_WIDTH) {
      throw new Error(
        `Thumbnail width ${thumbnail.width} does not match required ${ThumbnailGenerator.DEFAULT_WIDTH}`
      )
    }

    if (thumbnail.height !== ThumbnailGenerator.DEFAULT_HEIGHT) {
      throw new Error(
        `Thumbnail height ${thumbnail.height} does not match required ${ThumbnailGenerator.DEFAULT_HEIGHT}`
      )
    }

    if (thumbnail.format !== 'jpeg') {
      throw new Error(`Thumbnail format ${thumbnail.format} must be JPEG`)
    }

    if (thumbnail.sizeBytes <= 0) {
      throw new Error('Thumbnail size must be greater than 0')
    }

    // Sanity check: thumbnails should typically be < 200KB
    const MAX_THUMBNAIL_SIZE = 200 * 1024
    if (thumbnail.sizeBytes > MAX_THUMBNAIL_SIZE) {
      console.warn(
        `Thumbnail size ${thumbnail.sizeBytes} exceeds recommended max ${MAX_THUMBNAIL_SIZE}`
      )
    }
  }

  /**
   * Generate thumbnail based on file type
   * Automatically detects type and calls appropriate generator
   *
   * @param fileBuffer - Source file buffer
   * @param mimeType - MIME type of source file
   * @param filePath - Optional file path (required for videos)
   * @returns ThumbnailResult with generated thumbnail
   */
  async generateThumbnail(
    fileBuffer: ArrayBuffer,
    mimeType: string,
    filePath?: string
  ): Promise<ThumbnailResult> {
    if (mimeType.startsWith('image/gif')) {
      return this.generateGIFThumbnail(fileBuffer)
    } else if (mimeType.startsWith('image/')) {
      return this.generateImageThumbnail(fileBuffer)
    } else if (mimeType.startsWith('video/')) {
      if (!filePath) {
        throw new Error('Video file path required for video thumbnail generation')
      }
      return this.generateVideoThumbnail(filePath)
    } else {
      throw new Error(`Unsupported MIME type for thumbnail generation: ${mimeType}`)
    }
  }
}

/**
 * Singleton instance for convenient access
 */
export const thumbnailGenerator = new ThumbnailGenerator()

/**
 * Batch thumbnail generation with concurrency control
 * Generates thumbnails for multiple files with rate limiting
 *
 * @param files - Array of file information
 * @param maxConcurrent - Maximum number of concurrent generation tasks (default: 10)
 * @returns Array of ThumbnailResults
 */
export async function generateThumbnailBatch(
  files: Array<{
    buffer: ArrayBuffer
    mimeType: string
    filePath?: string
    assetId: string
  }>,
  maxConcurrent: number = 10
): Promise<Array<{ assetId: string; thumbnail: ThumbnailResult; error?: string }>> {
  const generator = new ThumbnailGenerator()
  const results: Array<{ assetId: string; thumbnail: ThumbnailResult; error?: string }> = []

  // Process files in batches to avoid overwhelming system
  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent)

    const batchResults = await Promise.allSettled(
      batch.map(async (file) => {
        try {
          const thumbnail = await generator.generateThumbnail(
            file.buffer,
            file.mimeType,
            file.filePath
          )

          generator.validateThumbnail(thumbnail)

          return {
            assetId: file.assetId,
            thumbnail,
          }
        } catch (error) {
          return {
            assetId: file.assetId,
            thumbnail: null as unknown as ThumbnailResult,
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
        // This shouldn't happen as we catch errors above, but handle it anyway
        results.push({
          assetId: 'unknown',
          thumbnail: null as unknown as ThumbnailResult,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        })
      }
    }
  }

  return results
}
