import { useCallback } from 'react'
import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'
import { STATUS_CONFIG, CATEGORY_COLORS } from '../../data/mockWorkspaceData'
import type { DesignSet } from '../../types/workspace.types'

const t = tokens

function FileRow({ set, onOpen }: { set: DesignSet; onOpen: (set: DesignSet) => void }) {
  const latestVersion = set.versions[set.versions.length - 1]
  const statusCfg = STATUS_CONFIG[latestVersion.status]
  const catColor = CATEGORY_COLORS[set.category]

  return (
    <tr
      onClick={() => onOpen(set)}
      style={{ cursor: 'pointer', transition: `background ${t.transition.fast}` }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.color.bgMuted }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {/* Checkbox */}
      <td style={{ padding: '10px 12px', width: 40 }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: `1.5px solid ${t.color.borderMuted}`,
            cursor: 'pointer',
          }}
        />
      </td>

      {/* Name */}
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M2 4C2 3.44772 2.44772 3 3 3H6.5L8 5H13C13.5523 5 14 5.44772 14 6V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z"
              fill={catColor}
              opacity="0.15"
              stroke={catColor}
              strokeWidth="0.8"
            />
          </svg>
          <span style={{ fontSize: t.text.bodySm, fontWeight: t.weight.medium, color: t.color.fgDefault }}>
            {set.name}
          </span>
          <span
            style={{
              fontSize: t.text.micro,
              fontWeight: t.weight.medium,
              color: catColor,
              background: `${catColor}10`,
              padding: '2px 6px',
              borderRadius: t.radius.full,
            }}
          >
            {set.category}
          </span>
        </div>
      </td>

      {/* Shared By */}
      <td style={{ padding: '10px 12px' }}>
        {set.sharedBy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: t.radius.full,
                background: `${catColor}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: t.text.micro,
                fontWeight: t.weight.bold,
                color: catColor,
                flexShrink: 0,
              }}
            >
              {set.sharedBy.charAt(0)}
            </div>
            <span style={{ fontSize: t.text.bodySm, color: t.color.fgDefault }}>
              {set.sharedBy}
            </span>
          </div>
        )}
      </td>

      {/* File Size */}
      <td style={{ padding: '10px 12px' }}>
        <span style={{ fontSize: t.text.bodySm, color: t.color.fgMuted }}>
          {set.fileSize || '—'}
        </span>
      </td>

      {/* Last Modified */}
      <td style={{ padding: '10px 12px' }}>
        <span style={{ fontSize: t.text.bodySm, color: t.color.fgMuted }}>
          {set.createdAt}
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: '10px 12px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: t.text.caption,
            fontWeight: t.weight.medium,
            color: statusCfg.text,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusCfg.dot,
            }}
          />
          {statusCfg.label}
        </span>
      </td>

      {/* Action */}
      <td style={{ padding: '10px 12px', width: 40 }}>
        <button
          onClick={e => e.stopPropagation()}
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            borderRadius: 4,
            cursor: 'pointer',
            color: t.color.fgMuted,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="3.5" r="1" fill="currentColor" />
            <circle cx="7" cy="7" r="1" fill="currentColor" />
            <circle cx="7" cy="10.5" r="1" fill="currentColor" />
          </svg>
        </button>
      </td>
    </tr>
  )
}

export function FileTable() {
  const { filteredDesignSets, openDesignSet } = useWorkspace()

  const handleOpen = useCallback(
    (set: DesignSet) => openDesignSet(set),
    [openDesignSet]
  )

  if (filteredDesignSets.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: t.color.fgMuted }}>
        <div style={{ fontSize: t.text.body, fontWeight: t.weight.semibold }}>No files match your filters</div>
        <div style={{ fontSize: t.text.bodySm, marginTop: 4 }}>Try adjusting your search or filter criteria</div>
      </div>
    )
  }

  const headerStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: t.text.caption,
    fontWeight: t.weight.medium,
    color: t.color.fgMuted,
    textAlign: 'left',
    borderBottom: `1px solid ${t.color.borderDefault}`,
    whiteSpace: 'nowrap',
  }

  return (
    <div
      style={{
        background: t.color.bgDefault,
        borderRadius: t.radius.card,
        border: `1px solid ${t.color.borderDefault}`,
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: t.font.family }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle, width: 40 }} />
            <th style={headerStyle}>Name</th>
            <th style={headerStyle}>Shared By</th>
            <th style={headerStyle}>File Size</th>
            <th style={headerStyle}>Last Modified</th>
            <th style={headerStyle}>Status</th>
            <th style={{ ...headerStyle, width: 40 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredDesignSets.map(set => (
            <FileRow key={set.id} set={set} onOpen={handleOpen} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
