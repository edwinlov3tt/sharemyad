import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'
import { CATEGORY_COLORS } from '../../data/mockWorkspaceData'

const t = tokens

export function SuggestedActivity() {
  const { designSets, openDesignSet } = useWorkspace()

  // Take 4 most recent sets as "suggested"
  const suggested = [...designSets]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)

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
        Suggested from your activity
      </div>
      <div style={{ display: 'flex', gap: t.space[3], overflowX: 'auto', paddingBottom: 2 }}>
        {suggested.map(set => {
          const latestVersion = set.versions[set.versions.length - 1]
          const catColor = CATEGORY_COLORS[set.category]
          return (
            <button
              key={set.id}
              onClick={() => openDesignSet(set)}
              style={{
                minWidth: 160,
                maxWidth: 180,
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: `transform ${t.transition.base}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: '100%',
                  height: 120,
                  borderRadius: t.radius.card,
                  background: `linear-gradient(135deg, ${latestVersion.previewColor}, ${latestVersion.previewColor}ee)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* File type badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    fontSize: t.text.micro,
                    fontWeight: t.weight.bold,
                    color: catColor,
                    background: `${t.color.bgDefault}dd`,
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  {set.category}
                </div>
                {/* Folder icon */}
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.3 }}>
                  <path
                    d="M6 10C6 8.89543 6.89543 8 8 8H16L20 12H32C33.1046 12 34 12.8954 34 14V30C34 31.1046 33.1046 32 32 32H8C6.89543 32 6 31.1046 6 30V10Z"
                    fill={catColor}
                  />
                </svg>
              </div>
              {/* Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path
                    d="M2 4C2 3.44772 2.44772 3 3 3H6.5L8 5H13C13.5523 5 14 5.44772 14 6V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z"
                    fill={catColor}
                    opacity="0.5"
                  />
                </svg>
                <span
                  style={{
                    fontSize: t.text.bodySm,
                    fontWeight: t.weight.medium,
                    color: t.color.fgDefault,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {set.name.split('—')[0].trim()}
                </span>
              </div>
              <div style={{ fontSize: t.text.caption, color: t.color.fgMuted, marginTop: 2, paddingLeft: 18 }}>
                {set.createdAt}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
