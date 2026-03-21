import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'

const t = tokens

type NavItem = { id: string; label: string; icon: JSX.Element }

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M3 7.5L10 2L17 7.5V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 17V11H12V17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'folders',
    label: 'Folders',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M3 5C3 4.44772 3.44772 4 4 4H8L10 6H16C16.5523 6 17 6.44772 17 7V15C17 15.5523 16.5523 16 16 16H4C3.44772 16 3 15.5523 3 15V5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    id: 'shared',
    label: 'Shared',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <circle cx="7" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 16C2 13.7909 3.79086 12 6 12H8C10.2091 12 12 13.7909 12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 12H14C16.2091 12 18 13.7909 18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'trash',
    label: 'Trash',
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M4 6H16M7 6V4.5C7 4.22386 7.22386 4 7.5 4H12.5C12.7761 4 13 4.22386 13 4.5V6M5 6L6 16.5C6 16.7761 6.22386 17 6.5 17H13.5C13.7761 17 14 16.7761 14 16.5L15 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function IconRail() {
  const { sidebarSection, setSidebarSection } = useWorkspace()

  return (
    <nav
      style={{
        width: 72,
        minWidth: 72,
        height: '100%',
        background: t.color.bgDefault,
        borderRight: `1px solid ${t.color.borderDefault}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: t.space[4],
        gap: t.space[2],
      }}
    >
      {NAV_ITEMS.map(item => {
        const isActive = sidebarSection === item.id
        return (
          <button
            key={item.id}
            onClick={() => setSidebarSection(isActive && item.id !== 'home' ? 'home' : item.id)}
            title={item.label}
            style={{
              width: 52,
              height: 48,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              color: isActive ? t.color.brandBlue : t.color.fgMuted,
              background: isActive ? `${t.color.brandBlue}0c` : 'transparent',
              transition: `all ${t.transition.base}`,
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = t.color.bgMuted
                e.currentTarget.style.color = t.color.fgDefault
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = t.color.fgMuted
              }
            }}
          >
            {item.icon}
            <span style={{ fontSize: 10, fontWeight: t.weight.medium, lineHeight: 1, letterSpacing: '0.1px' }}>
              {item.label}
            </span>
          </button>
        )
      })}

      {/* Bottom: settings */}
      <div style={{ marginTop: 'auto', paddingBottom: t.space[4] }}>
        <button
          title="Settings"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            color: t.color.fgMuted,
            background: 'transparent',
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
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 1.5V3M9 15V16.5M1.5 9H3M15 9H16.5M3.05 3.05L4.11 4.11M13.89 13.89L14.95 14.95M14.95 3.05L13.89 4.11M4.11 13.89L3.05 14.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
