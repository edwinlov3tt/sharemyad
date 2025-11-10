// Asset card component with thumbnail and validation status
import React, { useRef, useState } from 'react'
import type { CreativeAsset } from '../../types/asset.types'
import { useThumbnailCache } from '../../hooks/useThumbnailCache'

export interface AssetCardProps {
  asset: CreativeAsset
  onClick?: () => void
  /**
   * Thumbnail URL (300x180 JPEG)
   * If not provided, falls back to tempStorageUrl or storageUrl
   */
  thumbnailUrl?: string
  /**
   * Whether to enable lazy loading (default: true)
   */
  lazyLoad?: boolean
}

/**
 * Asset card component with thumbnail display and validation status indicator
 * Constitution Principle I: Simplicity Through Progressive Disclosure
 * Constitution Principle V: Accessibility as Default
 *
 * Features (User Story 5):
 * - Lazy-loaded thumbnails (IntersectionObserver)
 * - GIF animation on hover
 * - Video thumbnail with play icon (via VideoPreview)
 * - 60 FPS smooth scroll performance
 */
export function AssetCard({ asset, onClick, thumbnailUrl, lazyLoad = true }: AssetCardProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  // Determine if this is a GIF
  const isGIF = asset.mimeType === 'image/gif'

  // Use thumbnail URL if provided, otherwise fall back to storage URL
  const imageUrl = thumbnailUrl || asset.tempStorageUrl || asset.storageUrl

  // Lazy load thumbnail (only if lazyLoad enabled)
  const { isVisible, isLoaded } = useThumbnailCache(
    cardRef,
    imageUrl,
    { eager: !lazyLoad }
  )

  const statusConfig = {
    valid: {
      color: '#16a34a',
      bgColor: '#86efac',
      label: 'Valid',
      icon: '✓',
    },
    warning: {
      color: '#ca8a04',
      bgColor: '#fde047',
      label: 'Warning',
      icon: '⚠',
    },
    invalid: {
      color: '#dc2626',
      bgColor: '#fca5a5',
      label: 'Invalid',
      icon: '✗',
    },
    pending: {
      color: '#6b7280',
      bgColor: '#d1d5db',
      label: 'Pending',
      icon: '○',
    },
  }

  const config = statusConfig[asset.validationStatus]

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div
      ref={cardRef}
      data-testid="asset-card"
      style={{
        border: `2px solid ${config.bgColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${asset.filenameOriginal} - ${config.label}`}
      onMouseEnter={(e) => {
        setIsHovering(true)
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
      }}
      onMouseLeave={(e) => {
        setIsHovering(false)
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* Thumbnail/Preview */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '66.67%', // 3:2 aspect ratio
          backgroundColor: '#f3f4f6',
          overflow: 'hidden',
        }}
      >
        {asset.fileType === 'image' && isVisible && (
          <>
            <img
              src={isGIF && isHovering ? (asset.storageUrl || asset.tempStorageUrl) : imageUrl}
              alt={asset.filenameOriginal}
              data-testid="thumbnail-image"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
              }}
            />
            {!isLoaded && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '24px',
                  height: '24px',
                  border: '3px solid #e5e7eb',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            )}
          </>
        )}

        {asset.fileType === 'video' && (
          <video
            src={asset.tempStorageUrl || asset.storageUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            preload="metadata"
          />
        )}

        {asset.fileType === 'html5' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e5e7eb',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b7280"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
        )}

        {/* Validation Status Badge */}
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '9999px',
            backgroundColor: config.bgColor,
            fontSize: '0.75rem',
            fontWeight: '600',
            color: config.color,
          }}
          role="status"
          aria-label={`Validation status: ${config.label}`}
        >
          <span aria-hidden="true">{config.icon}</span>
          <span>{config.label}</span>
        </div>
      </div>

      {/* Asset Info */}
      <div
        style={{
          padding: '1rem',
        }}
      >
        {/* Filename */}
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            marginBottom: '0.5rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={asset.filenameOriginal}
        >
          {asset.filenameOriginal}
        </p>

        {/* Metadata */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#6b7280',
          }}
        >
          {/* Dimensions */}
          {asset.width && asset.height && (
            <span>
              {asset.width} × {asset.height}
            </span>
          )}

          {/* Duration (for videos) */}
          {asset.durationSeconds && (
            <span>• {Math.round(asset.durationSeconds)}s</span>
          )}

          {/* File Size */}
          <span>• {formatFileSize(asset.fileSizeBytes)}</span>

          {/* File Type */}
          <span>• {asset.fileType.toUpperCase()}</span>
        </div>

        {/* Validation Notes */}
        {asset.validationNotes && (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: 0,
              marginTop: '0.5rem',
              fontStyle: 'italic',
            }}
          >
            {asset.validationNotes}
          </p>
        )}
      </div>

      {/* CSS for loading spinner animation */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
