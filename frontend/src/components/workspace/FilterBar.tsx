import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'
import { CATEGORY_COLORS } from '../../data/mockWorkspaceData'
import type { DesignCategory, DesignStatus } from '../../types/workspace.types'

const t = tokens

const CATEGORIES: Array<'all' | DesignCategory> = ['all', 'Display', 'Social', 'Video', 'Email', 'CTV']
const STATUSES: Array<'all' | DesignStatus> = ['all', 'approved', 'changes', 'pending']

export function FilterBar() {
  const { filters, setFilter, filteredDesignSets, designSets, selectedFolderId } = useWorkspace()

  return (
    <div style={{ marginBottom: t.space[6] }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: t.space[5],
        }}
      >
        <div>
          <h1
            style={{
              fontSize: t.text.h3,
              fontWeight: t.weight.bold,
              color: t.color.fgDefault,
              margin: 0,
              letterSpacing: '-0.5px',
              lineHeight: 1,
            }}
          >
            Designs
          </h1>
          <p
            style={{
              fontSize: t.text.bodySm,
              color: t.color.fgMuted,
              margin: 0,
              marginTop: 4,
            }}
          >
            {filteredDesignSets.length} of {designSets.length} design sets
            {selectedFolderId ? ' in folder' : ''}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="7" cy="7" r="5" stroke={t.color.fgMuted} strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke={t.color.fgMuted} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={e => setFilter({ search: e.target.value })}
            style={{
              padding: '7px 14px 7px 34px',
              borderRadius: t.radius.input,
              width: 180,
              background: t.color.bgDefault,
              border: `1px solid ${t.color.borderDefault}`,
              color: t.color.fgDefault,
              fontSize: t.text.bodySm,
              fontWeight: t.weight.medium,
              outline: 'none',
              fontFamily: t.font.family,
              transition: `border-color ${t.transition.base}, box-shadow ${t.transition.base}`,
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = t.color.brandBlue
              e.currentTarget.style.boxShadow = `0 0 0 3px ${t.color.brandBlue}15`
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = t.color.borderDefault
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>
      </div>

      {/* Filter row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: t.space[2],
          flexWrap: 'wrap',
        }}
      >
        {/* Category pills */}
        {CATEGORIES.map(cat => {
          const isActive = filters.category === cat
          const color = cat !== 'all' ? CATEGORY_COLORS[cat] : undefined
          return (
            <button
              key={cat}
              onClick={() => setFilter({ category: cat })}
              style={{
                padding: '5px 12px',
                borderRadius: t.radius.full,
                background: isActive
                  ? (color ? `${color}12` : t.color.fgDefault)
                  : t.color.bgDefault,
                border: `1px solid ${isActive
                  ? (color ? `${color}30` : t.color.fgDefault)
                  : t.color.borderDefault}`,
                color: isActive
                  ? (color || '#ffffff')
                  : t.color.fgMuted,
                fontSize: t.text.caption,
                fontWeight: t.weight.medium,
                cursor: 'pointer',
                transition: `all ${t.transition.base}`,
                lineHeight: 1,
              }}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          )
        })}

        {/* Divider dot */}
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: t.color.borderMuted }} />

        {/* Status pills */}
        {STATUSES.map(status => {
          const isActive = filters.status === status
          const dotColors: Record<string, string> = {
            approved: '#22c55e',
            changes: '#f59e0b',
            pending: '#3765f6',
          }
          const dot = status !== 'all' ? dotColors[status] : undefined
          return (
            <button
              key={status}
              onClick={() => setFilter({ status })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: t.radius.full,
                background: isActive ? t.color.bgDefault : t.color.bgDefault,
                border: `1px solid ${isActive ? t.color.fgDefault : t.color.borderDefault}`,
                color: isActive ? t.color.fgDefault : t.color.fgMuted,
                fontSize: t.text.caption,
                fontWeight: isActive ? t.weight.semibold : t.weight.medium,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: `all ${t.transition.base}`,
                lineHeight: 1,
              }}
            >
              {dot && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: dot,
                    opacity: isActive ? 1 : 0.5,
                  }}
                />
              )}
              {status === 'all' ? 'Any status' : status}
            </button>
          )
        })}
      </div>
    </div>
  )
}
