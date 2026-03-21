import { useState } from 'react'
import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'
import { CATEGORY_COLORS } from '../../data/mockWorkspaceData'
import type { DesignCategory, DesignStatus } from '../../types/workspace.types'

const t = tokens

const CATEGORIES: Array<'all' | DesignCategory> = ['all', 'Display', 'Social', 'Video', 'Email', 'CTV']
const STATUSES: Array<'all' | DesignStatus> = ['all', 'approved', 'changes', 'pending']

export function ContentToolbar() {
  const { filters, setFilter, filteredDesignSets, designSets, contentLayout, setContentLayout, selectedFolderId } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'recent' | 'starred'>('recent')

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 14px',
    borderRadius: t.radius.button,
    border: 'none',
    background: isActive ? t.color.bgDefault : 'transparent',
    boxShadow: isActive ? t.shadow.widget : 'none',
    cursor: 'pointer',
    fontSize: t.text.bodySm,
    fontWeight: isActive ? t.weight.semibold : t.weight.medium,
    color: isActive ? t.color.fgDefault : t.color.fgMuted,
    transition: `all ${t.transition.base}`,
  })

  const hasActiveFilters = filters.category !== 'all' || filters.status !== 'all'

  return (
    <div style={{ marginBottom: t.space[4] }}>
      {/* Header row: title + tabs on left, count + controls on right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: t.space[3],
        }}
      >
        {/* Left: Title + tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: t.space[5] }}>
          <h2 style={{ fontSize: t.text.h5, fontWeight: t.weight.semibold, color: t.color.fgDefault, margin: 0 }}>
            Your files
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: t.color.bgMuted,
              borderRadius: t.radius.button,
              padding: 3,
            }}
          >
            <button style={tabStyle(activeTab === 'recent')} onClick={() => setActiveTab('recent')}>
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 3V6L8 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Recent
            </button>
            <button style={tabStyle(activeTab === 'starred')} onClick={() => setActiveTab('starred')}>
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="none" />
              </svg>
              Starred
            </button>
          </div>

          {/* Avatar stack placeholder */}
          <div style={{ display: 'flex', marginLeft: t.space[2] }}>
            {['#3765f6', '#e94560', '#22c55e', '#f59e0b'].map((color, i) => (
              <div
                key={i}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: t.radius.full,
                  background: `${color}20`,
                  border: `2px solid ${t.color.bgMuted}`,
                  marginLeft: i > 0 ? -8 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: t.weight.bold,
                  color: color,
                }}
              >
                {['A', 'B', 'D', 'E'][i]}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Count + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: t.space[3] }}>
          <span style={{ fontSize: t.text.bodySm, color: t.color.fgMuted }}>
            {filteredDesignSets.length} of {designSets.length}{selectedFolderId ? ' in folder' : ''}
          </span>

          {/* Filter button */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: t.radius.button,
              border: `1px solid ${hasActiveFilters ? t.color.brandBlue + '40' : t.color.borderDefault}`,
              background: hasActiveFilters ? `${t.color.brandBlue}08` : t.color.bgDefault,
              cursor: 'pointer',
              fontSize: t.text.bodySm,
              fontWeight: t.weight.medium,
              color: hasActiveFilters ? t.color.brandBlue : t.color.fgMuted,
              transition: `all ${t.transition.base}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.fgMuted }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = hasActiveFilters ? t.color.brandBlue + '40' : t.color.borderDefault }}
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path d="M1 2H11L7 6.5V10L5 11V6.5L1 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            Filter
          </button>

          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${t.color.borderDefault}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setContentLayout('list')}
              title="List view"
              style={{
                width: 34,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: contentLayout === 'list' ? t.color.bgMuted : 'transparent',
                cursor: 'pointer',
                color: contentLayout === 'list' ? t.color.fgDefault : t.color.fgMuted,
                transition: `all ${t.transition.fast}`,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <path d="M1 3H13M1 7H13M1 11H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => setContentLayout('grid')}
              title="Grid view"
              style={{
                width: 34,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderLeft: `1px solid ${t.color.borderDefault}`,
                background: contentLayout === 'grid' ? t.color.bgMuted : 'transparent',
                cursor: 'pointer',
                color: contentLayout === 'grid' ? t.color.fgDefault : t.color.fgMuted,
                transition: `all ${t.transition.fast}`,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter pills - single row, compact */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => {
          const isActive = filters.category === cat
          const color = cat !== 'all' ? CATEGORY_COLORS[cat] : undefined
          return (
            <button
              key={cat}
              onClick={() => setFilter({ category: cat })}
              style={{
                padding: '4px 11px',
                borderRadius: t.radius.full,
                background: isActive ? (color ? `${color}12` : t.color.fgDefault) : 'transparent',
                border: `1px solid ${isActive ? (color ? `${color}30` : t.color.fgDefault) : t.color.borderDefault}`,
                color: isActive ? (color || '#fff') : t.color.fgMuted,
                fontSize: t.text.caption,
                fontWeight: t.weight.medium,
                cursor: 'pointer',
                transition: `all ${t.transition.base}`,
                lineHeight: 1,
              }}
            >
              {cat === 'all' ? 'All Types' : cat}
            </button>
          )
        })}

        <span style={{ width: 1, height: 16, background: t.color.borderDefault, margin: `0 4px` }} />

        {STATUSES.map(status => {
          const isActive = filters.status === status
          const dotColors: Record<string, string> = { approved: '#22c55e', changes: '#f59e0b', pending: '#3765f6' }
          const dot = status !== 'all' ? dotColors[status] : undefined
          return (
            <button
              key={status}
              onClick={() => setFilter({ status })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 11px',
                borderRadius: t.radius.full,
                background: isActive ? `${dot || t.color.fgDefault}10` : 'transparent',
                border: `1px solid ${isActive ? (dot || t.color.fgDefault) + '40' : t.color.borderDefault}`,
                color: isActive ? (dot || t.color.fgDefault) : t.color.fgMuted,
                fontSize: t.text.caption,
                fontWeight: isActive ? t.weight.semibold : t.weight.medium,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: `all ${t.transition.base}`,
                lineHeight: 1,
              }}
            >
              {dot && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, opacity: isActive ? 1 : 0.5 }} />
              )}
              {status === 'all' ? 'Any Status' : status}
            </button>
          )
        })}
      </div>
    </div>
  )
}
