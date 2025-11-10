/**
 * VideoPreview Component
 *
 * Displays video thumbnail with play icon overlay
 * Clicking opens modal with full video player
 *
 * From: specs/001-upload-asset-processing/tasks.md (T112)
 */

import React, { useRef, useState } from 'react'
import { useThumbnailCache } from '../../hooks/useThumbnailCache'

interface VideoPreviewProps {
  /**
   * Video asset ID
   */
  assetId: string

  /**
   * Thumbnail URL (300x180 JPEG)
   */
  thumbnailUrl: string

  /**
   * Full-resolution video URL
   */
  videoUrl: string

  /**
   * Video filename for display
   */
  filename: string

  /**
   * Video duration in seconds
   */
  duration?: number

  /**
   * Video dimensions (width x height)
   */
  dimensions?: {
    width: number
    height: number
  }

  /**
   * Optional click handler
   */
  onClick?: () => void

  /**
   * Whether to show duration overlay
   * Default: true
   */
  showDuration?: boolean

  /**
   * Accessibility label for play button
   */
  ariaLabel?: string
}

/**
 * VideoPreview Component
 *
 * Features:
 * - Lazy-loaded thumbnail with IntersectionObserver
 * - Play icon overlay
 * - Duration display (bottom-right corner)
 * - Keyboard accessible (Enter/Space to play)
 * - Screen reader friendly
 */
export function VideoPreview({
  assetId,
  thumbnailUrl,
  videoUrl,
  filename,
  duration,
  dimensions,
  onClick,
  showDuration = true,
  ariaLabel,
}: VideoPreviewProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  // Lazy load thumbnail
  const { isVisible, isLoaded, error } = useThumbnailCache(containerRef, thumbnailUrl)

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      ref={containerRef}
      className="video-preview-container"
      data-testid="video-preview"
      data-asset-id={assetId}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || `Play video: ${filename}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '300 / 180',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {/* Thumbnail Image */}
      {isVisible && !error && (
        <img
          src={thumbnailUrl}
          alt={`Thumbnail for ${filename}`}
          data-testid="video-thumbnail"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
          onLoad={() => {
            // Image loaded
          }}
        />
      )}

      {/* Loading State */}
      {!isLoaded && !error && (
        <div
          className="loading-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
          }}
        >
          <div
            className="spinner"
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="error-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#2a0a0a',
            color: '#ff6b6b',
            fontSize: '14px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          Failed to load thumbnail
        </div>
      )}

      {/* Play Icon Overlay */}
      <div
        className="play-icon-overlay"
        data-testid="play-icon-overlay"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: isHovering ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {/* Play triangle */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            marginLeft: '4px', // Optical centering
          }}
        >
          <path
            d="M8 6L22 14L8 22V6Z"
            fill="white"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Duration Badge */}
      {showDuration && duration && duration > 0 && (
        <div
          className="duration-badge"
          data-testid="duration-badge"
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          {formatDuration(duration)}
        </div>
      )}

      {/* Dimensions Badge (optional, appears on hover) */}
      {isHovering && dimensions && (
        <div
          className="dimensions-badge"
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          {dimensions.width}×{dimensions.height}
        </div>
      )}

      {/* Focus Indicator */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .video-preview-container:focus {
          outline: 3px solid #4a9eff;
          outline-offset: 2px;
        }

        .video-preview-container:hover .play-icon-overlay {
          transform: translate(-50%, -50%) scale(1.1);
        }

        .video-preview-container:active .play-icon-overlay {
          transform: translate(-50%, -50%) scale(0.95);
        }
      `}</style>
    </div>
  )
}

/**
 * VideoPlayer Modal Component
 * Opens when user clicks video preview
 *
 * Features:
 * - Full-screen video playback
 * - Native HTML5 controls
 * - ESC key to close
 * - Click outside to close
 * - Keyboard accessible
 */
interface VideoPlayerModalProps {
  videoUrl: string
  filename: string
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayerModal({
  videoUrl,
  filename,
  isOpen,
  onClose,
}: VideoPlayerModalProps): JSX.Element | null {
  const videoRef = useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="video-modal-overlay"
      data-testid="video-player-modal"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '32px',
      }}
    >
      <div
        className="video-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1200px',
          maxHeight: '80vh',
          width: '100%',
        }}
      >
        <div
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              color: 'white',
              fontSize: '18px',
              margin: 0,
            }}
          >
            {filename}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close video player"
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '32px',
              cursor: 'pointer',
              padding: '8px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <video
          ref={videoRef}
          data-testid="video-player"
          src={videoUrl}
          controls
          autoPlay
          style={{
            width: '100%',
            maxHeight: 'calc(80vh - 64px)',
            backgroundColor: '#000',
            borderRadius: '8px',
          }}
        >
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  )
}

export default VideoPreview
