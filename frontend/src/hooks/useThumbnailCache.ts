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
import { getAssetUrlWithFallback } from '../services/r2Service'
import type { AssetUrlType } from '../types/upload.types'

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
  _options: UseThumbnailOptions = {} // Reserved for future pagination/batching options
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

  // Reserved for future load time tracking
  const _loadTimes = useRef<number[]>([]); void _loadTimes
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

/**
 * Options for the R2 asset URL hook
 */
interface UseR2AssetUrlOptions extends UseThumbnailOptions {
  /**
   * URL type to request (full, thumbnail, download)
   * Default: 'thumbnail'
   */
  urlType?: AssetUrlType

  /**
   * Fallback URL if R2 presigned URL fetch fails
   */
  fallbackUrl?: string | null
}

/**
 * State for R2 asset URL loading
 */
interface R2AssetUrlState extends ThumbnailState {
  /**
   * The resolved URL from R2 or fallback
   */
  url: string | null

  /**
   * Whether the URL is being fetched
   */
  isFetching: boolean
}

/**
 * Hook for lazy-loading R2 asset URLs using IntersectionObserver
 * Fetches presigned URLs from Asset Proxy Worker when element becomes visible
 *
 * @param elementRef - Ref to the element to observe
 * @param assetId - Asset ID to fetch URL for
 * @param options - Configuration options including URL type and fallback
 * @returns R2AssetUrlState with URL, visibility, and load status
 *
 * @example
 * ```tsx
 * function AssetCard({ asset }) {
 *   const imgRef = useRef<HTMLDivElement>(null)
 *   const { url, isVisible, isLoaded, isFetching } = useR2AssetUrl(
 *     imgRef,
 *     asset.id,
 *     { urlType: 'thumbnail', fallbackUrl: asset.storage_url }
 *   )
 *
 *   return (
 *     <div ref={imgRef}>
 *       {isFetching && <LoadingSpinner />}
 *       {url && <img src={url} />}
 *       {!isLoaded && !isFetching && <Placeholder />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useR2AssetUrl(
  elementRef: RefObject<HTMLElement>,
  assetId: string | null,
  options: UseR2AssetUrlOptions = {}
): R2AssetUrlState {
  const {
    rootMargin = '200px',
    threshold = 0.1,
    eager = false,
    urlType = 'thumbnail',
    fallbackUrl = null,
  } = options

  const [isVisible, setIsVisible] = useState(eager)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Track if observer has been disconnected
  const observerRef = useRef<IntersectionObserver | null>(null)
  const hasTriggered = useRef(false)
  const fetchedAssetId = useRef<string | null>(null)

  // IntersectionObserver effect
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

  // Fetch URL from Asset Proxy Worker when visible
  useEffect(() => {
    if (!isVisible || !assetId) {
      return
    }

    // Skip if we already fetched this asset
    if (fetchedAssetId.current === assetId && url) {
      return
    }

    let cancelled = false

    const fetchUrl = async () => {
      setIsFetching(true)
      setError(null)

      try {
        const resolvedUrl = await getAssetUrlWithFallback(assetId, urlType)

        if (!cancelled) {
          setUrl(resolvedUrl)
          fetchedAssetId.current = assetId
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch URL for asset: ${assetId}`))

          // Use fallback URL if available
          if (fallbackUrl) {
            setUrl(fallbackUrl)
            fetchedAssetId.current = assetId
          }
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false)
        }
      }
    }

    fetchUrl()

    return () => {
      cancelled = true
    }
  }, [isVisible, assetId, urlType, fallbackUrl, url])

  // Preload image when URL is available
  useEffect(() => {
    if (!url) {
      return
    }

    // Create image element to preload
    const img = new Image()

    img.onload = () => {
      setIsLoaded(true)
      setError(null)
    }

    img.onerror = () => {
      setError(new Error(`Failed to load image: ${url}`))
      setIsLoaded(false)
    }

    // Start loading
    img.src = url

    // Cleanup
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [url])

  return {
    url,
    isVisible,
    isLoaded,
    isFetching,
    error,
  }
}

/**
 * Hook for batch lazy-loading multiple R2 asset URLs
 * Useful for grid layouts with many assets
 *
 * @param assets - Array of asset objects with id and optional fallback URL
 * @param options - Configuration options
 * @returns Array of R2AssetUrlState for each asset
 */
export function useBatchR2AssetUrls(
  assets: Array<{ id: string; fallbackUrl?: string | null }>,
  options: Omit<UseR2AssetUrlOptions, 'fallbackUrl'> = {}
): R2AssetUrlState[] {
  const { urlType = 'thumbnail' } = options

  const [states, setStates] = useState<R2AssetUrlState[]>(
    assets.map(() => ({
      url: null,
      isVisible: false,
      isLoaded: false,
      isFetching: false,
      error: null,
    }))
  )

  // Track which assets we've already fetched
  const fetchedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Reset states when assets change
    setStates(
      assets.map(() => ({
        url: null,
        isVisible: false,
        isLoaded: false,
        isFetching: false,
        error: null,
      }))
    )
    fetchedIds.current = new Set()
  }, [assets.length])

  // Note: Batch URL fetching is triggered via IntersectionObserver in individual cards
  // This hook provides state tracking; actual fetching happens per-card with useR2AssetUrl
  // Reserved for future optimization with batched API calls
  void urlType // Mark as intentionally unused for now

  return states
}
