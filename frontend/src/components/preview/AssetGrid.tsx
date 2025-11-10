// Asset grid component for displaying multiple assets
import React from 'react'
import { AssetCard } from './AssetCard'
import type { CreativeAsset } from '../../types/asset.types'

export interface AssetGridProps {
  assets: CreativeAsset[]
  onAssetClick?: (asset: CreativeAsset) => void
  emptyMessage?: string
  isLoading?: boolean
  loadingCount?: number
  /** Filter assets by creative set ID (User Story 3: T079) */
  filterBySetId?: string | null
  /** Show set indicator on each asset card */
  showSetIndicator?: boolean
}

/**
 * Asset grid component with responsive layout
 * Constitution Principle I: Simplicity Through Progressive Disclosure
 * Constitution Principle II: Performance & Responsiveness - Lazy loading ready
 * User Story 2 (T062): Extended for multiple assets grid layout
 * User Story 3 (T079): Extended for set-based filtering
 */
export function AssetGrid({
  assets,
  onAssetClick,
  emptyMessage = 'No assets uploaded yet',
  isLoading = false,
  loadingCount = 0,
  filterBySetId,
  showSetIndicator = false,
}: AssetGridProps): JSX.Element {
  // Filter assets by creative set if filterBySetId is provided
  const filteredAssets = React.useMemo(() => {
    if (!filterBySetId) {
      return assets
    }
    return assets.filter(asset => asset.creative_set_id === filterBySetId)
  }, [assets, filterBySetId])
  // Show skeleton loading state while assets are being uploaded
  if (isLoading && assets.length === 0 && loadingCount > 0) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          width: '100%',
        }}
        data-testid="asset-grid-loading"
        role="list"
        aria-label={`Loading ${loadingCount} asset${loadingCount === 1 ? '' : 's'}`}
        aria-busy="true"
      >
        {Array.from({ length: loadingCount }, (_, i) => (
          <div
            key={`skeleton-${i}`}
            role="listitem"
            style={{
              aspectRatio: '16/10',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
            aria-label="Loading asset"
          />
        ))}
      </div>
    )
  }

  // Empty state
  if (filteredAssets.length === 0 && !isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2rem',
          textAlign: 'center',
        }}
        data-testid="asset-grid-empty"
        role="status"
        aria-live="polite"
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p
          style={{
            fontSize: '1rem',
            color: '#6b7280',
            margin: 0,
            marginTop: '1rem',
          }}
        >
          {emptyMessage}
        </p>
      </div>
    )
  }

  // Grid with assets
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        width: '100%',
      }}
      data-testid="asset-grid"
      role="list"
      aria-label={`${filteredAssets.length} asset${filteredAssets.length === 1 ? '' : 's'}${
        isLoading ? ', uploading more' : ''
      }${filterBySetId ? ' in selected set' : ''}`}
      aria-busy={isLoading}
    >
      {filteredAssets.map((asset) => (
        <div key={asset.id} role="listitem" data-testid="asset-card">
          <AssetCard
            asset={asset}
            onClick={onAssetClick ? () => onAssetClick(asset) : undefined}
          />
        </div>
      ))}

      {/* Show skeleton placeholders for assets still uploading */}
      {isLoading &&
        loadingCount > assets.length &&
        Array.from({ length: loadingCount - assets.length }, (_, i) => (
          <div
            key={`loading-${i}`}
            role="listitem"
            style={{
              aspectRatio: '16/10',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
            aria-label="Uploading asset"
          />
        ))}
    </div>
  )
}

// Add global styles for skeleton animation (if not already present)
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `
  if (!document.querySelector('style[data-asset-grid-styles]')) {
    style.setAttribute('data-asset-grid-styles', '')
    document.head.appendChild(style)
  }
}
