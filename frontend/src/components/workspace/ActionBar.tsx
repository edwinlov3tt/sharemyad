import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'

const t = tokens

interface ActionCardProps {
  icon: JSX.Element
  label: string
  accent?: string
  filled?: boolean
  onClick?: () => void
}

function ActionCard({ icon, label, accent, filled, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        padding: `${t.space[4]}px ${t.space[5]}px`,
        minWidth: 130,
        borderRadius: t.radius.card,
        border: filled ? 'none' : `1px solid ${t.color.borderDefault}`,
        background: filled ? (accent || t.color.brandBlue) : t.color.bgDefault,
        cursor: 'pointer',
        transition: `all ${t.transition.base}`,
        color: filled ? '#ffffff' : t.color.fgDefault,
      }}
      onMouseEnter={e => {
        if (filled) {
          e.currentTarget.style.opacity = '0.9'
          e.currentTarget.style.transform = 'translateY(-1px)'
        } else {
          e.currentTarget.style.borderColor = t.color.fgMuted
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = t.shadow.widget
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.transform = 'translateY(0)'
        if (!filled) {
          e.currentTarget.style.borderColor = t.color.borderDefault
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <span style={{ opacity: filled ? 1 : 0.7 }}>{icon}</span>
      <span style={{ fontSize: t.text.bodySm, fontWeight: t.weight.medium }}>
        {label}
      </span>
    </button>
  )
}

export function ActionBar() {
  const { toggleUploadModal, setSidebarSection } = useWorkspace()

  return (
    <div
      style={{
        display: 'flex',
        gap: t.space[3],
        marginBottom: t.space[6],
        overflowX: 'auto',
        paddingBottom: 2,
      }}
    >
      <ActionCard
        filled
        accent={t.color.brandBlue}
        onClick={toggleUploadModal}
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
        label="Create"
      />
      <ActionCard
        onClick={toggleUploadModal}
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V12M10 4L7 7M10 4L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 13V15C3 15.5523 3.44772 16 4 16H16C16.5523 16 17 15.5523 17 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        }
        label="Upload or drop"
      />
      <ActionCard
        onClick={() => setSidebarSection('folders')}
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5C3 4.44772 3.44772 4 4 4H8L10 6H16C16.5523 6 17 6.44772 17 7V15C17 15.5523 16.5523 16 16 16H4C3.44772 16 3 15.5523 3 15V5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M8 10H12M10 8V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        }
        label="Create folder"
      />
      <ActionCard
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 3V5M10 15V17M3 10H5M15 10H17M5.05 5.05L6.46 6.46M13.54 13.54L14.95 14.95M14.95 5.05L13.54 6.46M6.46 13.54L5.05 14.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        }
        label="Share link"
      />
      <ActionCard
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 3H14L16 5V17H4V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M7 3V7H13V3" stroke="currentColor" strokeWidth="1.3" />
            <path d="M7 12H13M7 14.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        }
        label="Get signatures"
      />
    </div>
  )
}
