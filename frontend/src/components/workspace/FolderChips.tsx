import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'
import type { Folder } from '../../types/workspace.types'

const t = tokens

function flattenFolders(folders: Folder[]): Folder[] {
  const result: Folder[] = []
  for (const f of folders) {
    result.push(f)
    if (f.children.length > 0) {
      result.push(...flattenFolders(f.children))
    }
  }
  return result
}

export function FolderChips() {
  const { folders, selectedFolderId, selectFolder } = useWorkspace()
  const allFolders = flattenFolders(folders)

  return (
    <div style={{ marginBottom: t.space[6] }}>
      <div
        style={{
          fontSize: t.text.body,
          fontWeight: t.weight.semibold,
          color: t.color.fgDefault,
          marginBottom: t.space[3],
        }}
      >
        Folders
      </div>
      <div
        style={{
          display: 'flex',
          gap: t.space[2],
          flexWrap: 'wrap',
        }}
      >
        {allFolders.map(folder => {
          const isSelected = selectedFolderId === folder.id
          return (
            <button
              key={folder.id}
              onClick={() => selectFolder(isSelected ? null : folder.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: t.radius.button,
                border: `1px solid ${isSelected ? t.color.brandBlue + '30' : t.color.borderDefault}`,
                background: isSelected ? `${t.color.brandBlue}08` : t.color.bgDefault,
                cursor: 'pointer',
                fontSize: t.text.bodySm,
                fontWeight: t.weight.medium,
                color: isSelected ? t.color.brandBlue : t.color.fgDefault,
                transition: `all ${t.transition.base}`,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = t.color.fgMuted
                  e.currentTarget.style.boxShadow = t.shadow.widget
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = t.color.borderDefault
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.6 }}>
                <path
                  d="M2 4C2 3.44772 2.44772 3 3 3H6.5L8 5H13C13.5523 5 14 5.44772 14 6V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z"
                  fill={isSelected ? t.color.brandBlue : '#f5a623'}
                  stroke={isSelected ? t.color.brandBlue : '#e8941f'}
                  strokeWidth="0.5"
                />
              </svg>
              {folder.name}
              {/* kebab */}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 2, opacity: 0.35 }}>
                <circle cx="6" cy="3" r="0.8" fill="currentColor" />
                <circle cx="6" cy="6" r="0.8" fill="currentColor" />
                <circle cx="6" cy="9" r="0.8" fill="currentColor" />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
