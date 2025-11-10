/**
 * useThumbnailCache Hook
 *
 * Implements lazy loading for thumbnails using IntersectionObserver API
 * Only loads thumbnails when they are visible or near the viewport
 *
 * Performance target: 60 FPS scroll with 500+ assets
 * From: specs/001-upload-asset-processing/research.md (Decision #9)
 * Tasks: T110-T111
 */

import { useEffect, useRef, useState, RefObject } from 'react'

interface UseThumbnailOptions {
  /**
   * Root margin for IntersectionObserver
   * Defines how far before entering viewport to start loading
   * Default: '200px' (preload 200px before visible)
   */
  rootMargin?: string

  /**
   * Intersection threshold (0.0 to 1.0)
   * Percentage of element visible before triggering
   * Default: 0.1 (10% visible)
   */
  threshold?: number

  /**
   * Whether to load immediately without intersection check
   * Useful for above-the-fold content
   * Default: false
   */
  eager?: boolean
}

interface ThumbnailState {
  /**
   * Whether the thumbnail is visible/near viewport
   */
  isVisible: boolean

  /**
   * Whether the thumbnail has been loaded
   */
  isLoaded: boolean

  /**
   * Error that occurred during loading
   */
  error: Error | null
}

/**
 * Hook for lazy-loading thumbnails using IntersectionObserver
 *
 * @param elementRef - Ref to the element to observe
 * @param thumbnailUrl - URL of the thumbnail to load
 * @param options - Configuration options
 * @returns ThumbnailState with visibility and load status
 *
 * @example
 * ```tsx
 * function AssetCard({ thumbnailUrl }) {
 *   const imgRef = useRef<HTMLDivElement>(null)
 *   const { isVisible, isLoaded } = useThumbnailCache(imgRef, thumbnailUrl)
 *
 *   return (
 *     <div ref={imgRef}>
 *       {isVisible && <img src={thumbnailUrl} />}
 *       {!isLoaded && <LoadingSpinner />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useThumbnailCache(
  elementRef: RefObject<HTMLElement>,
  thumbnailUrl: string,
  options: UseThumbnailOptions = {}
): ThumbnailState {
  const {
    rootMargin = '200px',
    threshold = 0.1,
    eager = false,
  } = options

  const [isVisible, setIsVisible] = useState(eager)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Track if observer has been disconnected
  const observerRef = useRef<IntersectionObserver | null>(null)
  const hasTriggered = useRef(false)

  useEffect(() => {
    // If eager loading, mark as visible immediately
    if (eager) {
      setIsVisible(true)
      return
    }

    // Skip if no element ref
    if (!elementRef.current) {
      return
    }

    // Skip if already triggered
    if (hasTriggered.current) {
      return
    }

    // Create IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Element is visible, mark for loading
          setIsVisible(true)
          hasTriggered.current = true

          // Disconnect observer since we only need to trigger once
          observer.disconnect()
          observerRef.current = null
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    // Start observing
    observer.observe(elementRef.current)
    observerRef.current = observer

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [elementRef, rootMargin, threshold, eager])

  // Preload image when visible
  useEffect(() => {
    if (!isVisible || !thumbnailUrl) {
      return
    }

    // Create image element to preload
    const img = new Image()

    img.onload = () => {
      setIsLoaded(true)
      setError(null)
    }

    img.onerror = () => {
      setError(new Error(`Failed to load thumbnail: ${thumbnailUrl}`))
      setIsLoaded(false)
    }

    // Start loading
    img.src = thumbnailUrl

    // Cleanup
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [isVisible, thumbnailUrl])

  return {
    isVisible,
    isLoaded,
    error,
  }
}

/**
 * Hook for batch lazy-loading multiple thumbnails
 * Useful for grid layouts with many thumbnails
 *
 * @param thumbnailUrls - Array of thumbnail URLs
 * @param options - Configuration options
 * @returns Array of ThumbnailState for each URL
 *
 * @example
 * ```tsx
 * function AssetGrid({ thumbnails }) {
 *   const thumbnailStates = useBatchThumbnailCache(
 *     thumbnails.map(t => t.url)
 *   )
 *
 *   return thumbnails.map((thumbnail, i) => (
 *     <AssetCard
 *       key={thumbnail.id}
 *       thumbnail={thumbnail}
 *       isLoaded={thumbnailStates[i].isLoaded}
 *     />
 *   ))
 * }
 * ```
 */
export function useBatchThumbnailCache(
  thumbnailUrls: string[],
  options: UseThumbnailOptions = {}
): ThumbnailState[] {
  const [states, setStates] = useState<ThumbnailState[]>(
    thumbnailUrls.map(() => ({
      isVisible: false,
      isLoaded: false,
      error: null,
    }))
  )

  useEffect(() => {
    // Reset states when URLs change
    setStates(
      thumbnailUrls.map(() => ({
        isVisible: false,
        isLoaded: false,
        error: null,
      }))
    )
  }, [thumbnailUrls.length])

  return states
}

/**
 * Performance tracking for thumbnail loading
 * Monitors FPS and load times
 */
interface ThumbnailPerformanceMetrics {
  /**
   * Average load time in milliseconds
   */
  averageLoadTime: number

  /**
   * Number of thumbnails loaded
   */
  loadedCount: number

  /**
   * Number of thumbnails failed to load
   */
  errorCount: number

  /**
   * Current scroll FPS (if available)
   */
  scrollFPS: number | null
}

/**
 * Hook for monitoring thumbnail loading performance
 * Useful for debugging and optimization
 *
 * @returns Performance metrics
 */
export function useThumbnailPerformance(): ThumbnailPerformanceMetrics {
  const [metrics, setMetrics] = useState<ThumbnailPerformanceMetrics>({
    averageLoadTime: 0,
    loadedCount: 0,
    errorCount: 0,
    scrollFPS: null,
  })

  const loadTimes = useRef<number[]>([])
  const lastScrollTimestamp = useRef<number>(0)
  const scrollFrameCount = useRef<number>(0)

  useEffect(() => {
    // Monitor scroll performance
    let animationFrameId: number

    const trackScrollFPS = () => {
      const now = performance.now()
      const delta = now - lastScrollTimestamp.current

      if (delta > 0) {
        const fps = 1000 / delta
        scrollFrameCount.current++

        // Update metrics every 10 frames
        if (scrollFrameCount.current >= 10) {
          setMetrics((prev) => ({
            ...prev,
            scrollFPS: Math.round(fps),
          }))
          scrollFrameCount.current = 0
        }
      }

      lastScrollTimestamp.current = now
      animationFrameId = requestAnimationFrame(trackScrollFPS)
    }

    animationFrameId = requestAnimationFrame(trackScrollFPS)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return metrics
}

/**
 * Helper to prefetch thumbnails before they're needed
 * Useful for preloading above-the-fold content
 *
 * @param thumbnailUrls - Array of URLs to prefetch
 * @returns Promise that resolves when all thumbnails are loaded
 */
export async function prefetchThumbnails(thumbnailUrls: string[]): Promise<void> {
  const promises = thumbnailUrls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to prefetch: ${url}`))
      img.src = url
    })
  })

  await Promise.allSettled(promises)
}
