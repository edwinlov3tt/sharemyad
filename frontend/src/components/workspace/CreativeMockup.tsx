import { memo } from 'react'
import type { DesignVersion } from '../../types/workspace.types'

interface CreativeMockupProps {
  version: DesignVersion
  size?: 'sm' | 'md' | 'lg'
  showOverlay?: boolean
}

export const CreativeMockup = memo(function CreativeMockup({ version, size = 'md', showOverlay = false }: CreativeMockupProps) {
  const h = size === 'lg' ? 280 : size === 'md' ? 200 : 160

  return (
    <div
      style={{
        width: '100%',
        height: h,
        borderRadius: 10,
        background: `linear-gradient(135deg, ${version.previewColor} 0%, ${version.previewColor}ee 40%, ${version.previewAccent}20 100%)`,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Decorative radials */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 70% 30%, ${version.previewAccent}18 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${version.previewAccent}12 0%, transparent 40%)`,
        }}
      />

      {/* Tagline area */}
      <div style={{ position: 'absolute', top: 16, left: 18, right: 18 }}>
        <div
          style={{
            width: 32,
            height: 4,
            borderRadius: 2,
            background: `${version.previewAccent}50`,
            marginBottom: 12,
          }}
        />
        <div
          style={{
            fontSize: size === 'lg' ? 22 : 16,
            fontWeight: 700,
            color: version.previewAccent,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {version.tagline}
        </div>
      </div>

      {/* CTA button mockup */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 16,
          padding: '5px 12px',
          borderRadius: 6,
          background: `${version.previewAccent}20`,
          border: `1px solid ${version.previewAccent}30`,
          color: version.previewAccent,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Learn More
      </div>

      {/* Decorative bars */}
      <div style={{ position: 'absolute', bottom: 14, left: 16, display: 'flex', gap: 4 }}>
        {[40, 28, 20].map((w, i) => (
          <div
            key={i}
            style={{
              width: w,
              height: 3,
              borderRadius: 2,
              background: `${version.previewAccent}${(30 - i * 8).toString(16).padStart(2, '0')}`,
            }}
          />
        ))}
      </div>

      {/* Hover overlay */}
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              opacity: 0.9,
            }}
          >
            Click to Review
          </span>
        </div>
      )}
    </div>
  )
})
