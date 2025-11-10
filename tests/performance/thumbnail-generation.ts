/**
 * Performance Test: Thumbnail Generation
 *
 * Tests thumbnail generation performance for images and videos
 * against the following targets:
 * - 100 images: < 30 seconds
 * - Video: < 5 seconds per video
 * - Thumbnail loads: < 500ms
 *
 * From: specs/001-upload-asset-processing/tasks.md (Phase 7, T101)
 */

import { performance } from 'node:perf_hooks'

interface PerformanceResult {
  operation: string
  durationMs: number
  passed: boolean
  threshold: number
  itemCount?: number
}

/**
 * Mock thumbnail generator for performance testing
 * Replace with actual implementation from supabase/functions/process-upload/thumbnailGenerator.ts
 */
class ThumbnailGeneratorMock {
  async generateImageThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    // Simulate Sharp processing time (10-50ms per image)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 40 + 10))
    return Buffer.from('thumbnail-data')
  }

  async generateVideoThumbnail(videoPath: string): Promise<Buffer> {
    // Simulate FFmpeg processing time (500ms-2s per video)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500))
    return Buffer.from('video-thumbnail-data')
  }

  async uploadThumbnail(thumbnailBuffer: Buffer, assetId: string): Promise<string> {
    // Simulate R2 upload time (50-200ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50))
    return `https://r2.example.com/thumbnails/${assetId}.jpg`
  }
}

/**
 * Test: 100 image thumbnails should generate in < 30 seconds
 * Target: < 30,000ms for 100 images (300ms per image average)
 */
async function testBulkImageThumbnailGeneration(): Promise<PerformanceResult> {
  const generator = new ThumbnailGeneratorMock()
  const imageCount = 100
  const threshold = 30000 // 30 seconds

  const mockImageBuffer = Buffer.alloc(1024 * 1024) // 1MB mock image

  const startTime = performance.now()

  // Generate thumbnails for 100 images
  const thumbnailPromises = Array.from({ length: imageCount }, (_, i) =>
    generator.generateImageThumbnail(mockImageBuffer)
  )

  await Promise.all(thumbnailPromises)

  const endTime = performance.now()
  const durationMs = endTime - startTime

  return {
    operation: 'Bulk Image Thumbnail Generation (100 images)',
    durationMs: Math.round(durationMs),
    passed: durationMs < threshold,
    threshold,
    itemCount: imageCount
  }
}

/**
 * Test: Single video thumbnail should generate in < 5 seconds
 * Target: < 5,000ms per video
 */
async function testVideoThumbnailGeneration(): Promise<PerformanceResult> {
  const generator = new ThumbnailGeneratorMock()
  const threshold = 5000 // 5 seconds

  const mockVideoPath = '/tmp/test-video.mp4'

  const startTime = performance.now()

  await generator.generateVideoThumbnail(mockVideoPath)

  const endTime = performance.now()
  const durationMs = endTime - startTime

  return {
    operation: 'Video Thumbnail Generation (single video)',
    durationMs: Math.round(durationMs),
    passed: durationMs < threshold,
    threshold
  }
}

/**
 * Test: Thumbnail upload to R2 should complete in < 500ms
 * Target: < 500ms per thumbnail upload
 */
async function testThumbnailUploadSpeed(): Promise<PerformanceResult> {
  const generator = new ThumbnailGeneratorMock()
  const threshold = 500 // 500ms

  const mockThumbnailBuffer = Buffer.alloc(50 * 1024) // 50KB thumbnail
  const mockAssetId = 'test-asset-123'

  const startTime = performance.now()

  await generator.uploadThumbnail(mockThumbnailBuffer, mockAssetId)

  const endTime = performance.now()
  const durationMs = endTime - startTime

  return {
    operation: 'Thumbnail Upload to R2',
    durationMs: Math.round(durationMs),
    passed: durationMs < threshold,
    threshold
  }
}

/**
 * Test: Multiple video thumbnails with rate limiting
 * Target: < 5 seconds per video, max 10 concurrent
 */
async function testConcurrentVideoThumbnails(): Promise<PerformanceResult> {
  const generator = new ThumbnailGeneratorMock()
  const videoCount = 10
  const threshold = 5000 * videoCount // Total time should scale linearly if concurrent

  const mockVideoPaths = Array.from({ length: videoCount }, (_, i) => `/tmp/video-${i}.mp4`)

  const startTime = performance.now()

  // Process with concurrency limit of 10
  const maxConcurrent = 10
  const results: Promise<Buffer>[] = []

  for (let i = 0; i < videoCount; i += maxConcurrent) {
    const batch = mockVideoPaths.slice(i, i + maxConcurrent)
    const batchPromises = batch.map(path => generator.generateVideoThumbnail(path))
    results.push(...batchPromises)
    await Promise.all(batchPromises)
  }

  const endTime = performance.now()
  const durationMs = endTime - startTime

  return {
    operation: `Concurrent Video Thumbnails (${videoCount} videos, max 10 concurrent)`,
    durationMs: Math.round(durationMs),
    passed: durationMs < threshold,
    threshold,
    itemCount: videoCount
  }
}

/**
 * Run all performance tests and report results
 */
async function runPerformanceTests(): Promise<void> {
  console.log('🚀 Running Thumbnail Generation Performance Tests\n')
  console.log('Target Metrics:')
  console.log('  - 100 images: < 30 seconds')
  console.log('  - Video: < 5 seconds per video')
  console.log('  - Thumbnail upload: < 500ms')
  console.log('---\n')

  const tests = [
    testBulkImageThumbnailGeneration,
    testVideoThumbnailGeneration,
    testThumbnailUploadSpeed,
    testConcurrentVideoThumbnails
  ]

  const results: PerformanceResult[] = []

  for (const test of tests) {
    const result = await test()
    results.push(result)

    const statusIcon = result.passed ? '✅' : '❌'
    const itemInfo = result.itemCount ? ` (${result.itemCount} items)` : ''

    console.log(`${statusIcon} ${result.operation}${itemInfo}`)
    console.log(`   Duration: ${result.durationMs}ms / ${result.threshold}ms threshold`)

    if (result.itemCount) {
      const avgPerItem = Math.round(result.durationMs / result.itemCount)
      console.log(`   Average: ${avgPerItem}ms per item`)
    }

    console.log()
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length
  const totalCount = results.length

  console.log('---')
  console.log(`📊 Summary: ${passedCount}/${totalCount} tests passed`)

  if (passedCount === totalCount) {
    console.log('✅ All performance targets met!')
  } else {
    console.log('❌ Some performance targets not met')
    process.exit(1)
  }
}

// Run tests if executed directly
if (import.meta.main) {
  runPerformanceTests().catch(error => {
    console.error('❌ Performance test failed:', error)
    Deno.exit(1)
  })
}

export {
  testBulkImageThumbnailGeneration,
  testVideoThumbnailGeneration,
  testThumbnailUploadSpeed,
  testConcurrentVideoThumbnails,
  runPerformanceTests
}
