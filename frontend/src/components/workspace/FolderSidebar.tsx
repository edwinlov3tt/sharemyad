import { useState } from 'react'
import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'
import type { Folder } from '../../types/workspace.types'

const t = tokens

function FolderItem({ folder, depth = 0 }: { folder: Folder; depth?: number }) {
  const { selectedFolderId, selectFolder } = useWorkspace()
  const [expanded, setExpanded] = useState(true)
  const isSelected = selectedFolderId === folder.id
  const hasChildren = folder.children.length > 0

  return (
    <div>
      <button
        onClick={() => selectFolder(isSelected ? null : folder.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: `6px 10px 6px ${10 + depth * 16}px`,
          background: isSelected ? `${t.color.brandBlue}0a` : 'transparent',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: t.text.bodySm,
          fontWeight: isSelected ? t.weight.semibold : t.weight.regular,
          color: isSelected ? t.color.brandBlue : t.color.fgDefault,
          textAlign: 'left',
          transition: `all ${t.transition.base}`,
        }}
        onMouseEnter={e => {
          if (!isSelected) e.currentTarget.style.background = t.color.bgMuted
        }}
        onMouseLeave={e => {
          if (!isSelected) e.currentTarget.style.background = 'transparent'
        }}
      >
        {hasChildren && (
          <span
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            style={{
              display: 'inline-flex',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: `transform ${t.transition.fast}`,
              cursor: 'pointer',
              flexShrink: 0,
              color: t.color.fgMuted,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        {!hasChildren && <span style={{ width: 10, flexShrink: 0 }} />}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path
            d="M2 4C2 3.44772 2.44772 3 3 3H6.5L8 5H13C13.5523 5 14 5.44772 14 6V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z"
            fill={isSelected ? t.color.brandBlue : t.color.fgMuted}
            opacity={isSelected ? 0.2 : 0.15}
            stroke={isSelected ? t.color.brandBlue : t.color.fgMuted}
            strokeWidth="0.8"
          />
        </svg>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {folder.name}
        </span>
      </button>
      {hasChildren && expanded && (
        <div>
          {folder.children.map(child => (
            <FolderItem key={child.id} folder={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderPanel() {
  const { folders, sidebarSection } = useWorkspace()
  const isOpen = sidebarSection === 'folders'

  if (!isOpen) return null

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        height: '100%',
        background: t.color.bgDefault,
        borderRight: `1px solid ${t.color.borderDefault}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${t.space[4]}px ${t.space[4]}px ${t.space[2]}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: t.text.bodySm,
            fontWeight: t.weight.semibold,
            color: t.color.fgDefault,
          }}
        >
          All Folders
        </span>
        <button
          title="New folder"
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            borderRadius: 6,
            cursor: 'pointer',
            color: t.color.fgMuted,
            transition: `all ${t.transition.base}`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = t.color.bgMuted
            e.currentTarget.style.color = t.color.fgDefault
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = t.color.fgMuted
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Folder tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${t.space[2]}px` }}>
        {folders.map(folder => (
          <FolderItem key={folder.id} folder={folder} />
        ))}
      </div>

      {/* Storage meter */}
      <div
        style={{
          padding: `${t.space[4]}px`,
          borderTop: `1px solid ${t.color.borderDefault}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: t.text.caption, fontWeight: t.weight.medium, color: t.color.fgDefault }}>
            Storage
          </span>
          <span style={{ fontSize: t.text.caption, color: t.color.fgMuted }}>
            52%
          </span>
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: t.color.bgMuted,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '52%',
              height: '100%',
              borderRadius: 2,
              background: `linear-gradient(90deg, ${t.color.brandBlue}, ${t.color.brandBlue}cc)`,
            }}
          />
        </div>
        <div style={{ fontSize: t.text.micro, color: t.color.fgMuted, marginTop: 4 }}>
          5.2 GB of 10 GB used
        </div>
      </div>
    </aside>
  )
}
