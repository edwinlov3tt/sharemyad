import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'

const t = tokens

export function TopNav() {
  const { toggleUploadModal } = useWorkspace()

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        padding: `0 ${t.space[6]}px`,
        background: t.color.bgDefault,
        borderBottom: `1px solid ${t.color.borderDefault}`,
        fontFamily: t.font.family,
      }}
    >
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: t.space[2] }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: t.color.fgDefault,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="#fff" />
            <rect x="9" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.6" />
            <rect x="1" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.6" />
            <rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.3" />
          </svg>
        </div>
        <span
          style={{
            fontSize: t.text.bodyLg,
            fontWeight: t.weight.bold,
            color: t.color.fgDefault,
            letterSpacing: '-0.3px',
          }}
        >
          ShareMyAd
        </span>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: t.space[2] }}>
        <button
          onClick={toggleUploadModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: `6px ${t.space[4]}px`,
            borderRadius: t.radius.button,
            background: t.color.fgDefault,
            border: 'none',
            cursor: 'pointer',
            fontSize: t.text.bodySm,
            fontWeight: t.weight.semibold,
            color: '#ffffff',
            transition: `opacity ${t.transition.base}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Upload
        </button>

        {/* User avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: t.radius.full,
            background: `linear-gradient(135deg, ${t.color.brandBlue}20, ${t.color.brandBlue}40)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: t.text.caption,
            fontWeight: t.weight.bold,
            color: t.color.brandBlue,
            cursor: 'pointer',
            marginLeft: t.space[1],
          }}
        >
          E
        </div>
      </div>
    </header>
  )
}
