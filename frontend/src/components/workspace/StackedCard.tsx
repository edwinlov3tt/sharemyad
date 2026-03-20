import { useState, memo, useCallback } from 'react'
import { tokens } from '../../config/designTokens'
import { CATEGORY_COLORS } from '../../data/mockWorkspaceData'
import type { DesignSet } from '../../types/workspace.types'
import { StatusBadge } from './StatusBadge'
import { CreativeMockup } from './CreativeMockup'

const t = tokens

interface StackedCardProps {
  designSet: DesignSet
  index: number
  onOpen: (set: DesignSet) => void
}

export const StackedCard = memo(function StackedCard({ designSet, index, onOpen }: StackedCardProps) {
  const [hovered, setHovered] = useState(false)
  const vCount = designSet.versions.length
  const latestVersion = designSet.versions[designSet.versions.length - 1]
  const hasApproved = designSet.versions.some(v => v.status === 'approved')
  const allApproved = designSet.versions.every(v => v.status === 'approved')
  const catColor = CATEGORY_COLORS[designSet.category] || '#888'
  const handleClick = useCallback(() => onOpen(designSet), [onOpen, designSet])

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        animation: `fadeSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.07}s both`,
      }}
    >
      {/* Stacked cards behind */}
      {vCount > 1 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: vCount > 2 ? 8 : 6,
              left: 8,
              right: 8,
              bottom: -6,
              borderRadius: t.radius.card,
              background: t.color.bgDefault,
              border: `1px solid ${t.color.borderDefault}`,
              transform: hovered ? 'rotate(-2deg) translateY(-2px)' : 'rotate(-1.5deg)',
              transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
          {vCount > 2 && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 12,
                right: 12,
                bottom: -10,
                borderRadius: t.radius.card,
                background: t.color.bgMuted,
                border: `1px solid ${t.color.borderDefault}`,
                transform: hovered ? 'rotate(2deg) translateY(-1px)' : 'rotate(1deg)',
                transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          )}
        </>
      )}

      {/* Main card */}
      <div
        style={{
          position: 'relative',
          borderRadius: t.radius.card,
          background: t.color.bgDefault,
          border: `1px solid ${hovered ? t.color.borderMuted : t.color.borderDefault}`,
          overflow: 'hidden',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          boxShadow: hovered ? t.shadow.depth : t.shadow.widget,
        }}
      >
        <CreativeMockup version={latestVersion} size="md" showOverlay={hovered} />

        <div style={{ padding: '14px 16px 16px' }}>
          {/* Name + Category */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: t.text.body,
                fontWeight: t.weight.semibold,
                color: t.color.fgDefault,
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {designSet.name}
            </div>
            <div
              style={{
                fontSize: t.text.micro,
                fontWeight: t.weight.bold,
                color: catColor,
                background: `${catColor}10`,
                border: `1px solid ${catColor}25`,
                borderRadius: 6,
                padding: '2px 7px',
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {designSet.category}
            </div>
          </div>

          {/* Format */}
          <div
            style={{
              fontSize: t.text.overline,
              color: t.color.fgMuted,
              marginBottom: 10,
              fontWeight: t.weight.medium,
            }}
          >
            {designSet.format}
          </div>

          {/* Version count + status + date */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: t.color.bgMuted,
                  borderRadius: 6,
                  padding: '3px 8px',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="10" height="10" rx="1.5" stroke={t.color.fgMuted} strokeWidth="1.5" fill="none" />
                  <rect x="5" y="1" width="10" height="10" rx="1.5" stroke={t.color.fgMuted} strokeWidth="1.5" fill={t.color.bgMuted} />
                </svg>
                <span
                  style={{
                    fontSize: t.text.overline,
                    fontWeight: t.weight.bold,
                    color: t.color.fgMuted,
                  }}
                >
                  {vCount} {vCount === 1 ? 'version' : 'versions'}
                </span>
              </div>
              <StatusBadge
                status={allApproved ? 'approved' : hasApproved ? 'approved' : latestVersion.status}
              />
            </div>
            <div
              style={{
                fontSize: t.text.micro,
                color: t.color.fgMuted,
                fontWeight: t.weight.medium,
              }}
            >
              {designSet.createdAt}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
