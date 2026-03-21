import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'

const t = tokens

export function TopNav() {
  const { filters, setFilter } = useWorkspace()

  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr auto',
        alignItems: 'center',
        height: 56,
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
            width: 28,
            height: 28,
            borderRadius: 8,
            background: t.color.fgDefault,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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

      {/* Center: Search bar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: `0 ${t.space[8]}px` }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
          <svg
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="15" height="15" viewBox="0 0 16 16" fill="none"
          >
            <circle cx="7" cy="7" r="5" stroke={t.color.fgMuted} strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke={t.color.fgMuted} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search files, folders, designs..."
            value={filters.search}
            onChange={e => setFilter({ search: e.target.value })}
            style={{
              width: '100%',
              padding: '9px 16px 9px 40px',
              borderRadius: t.radius.input,
              background: t.color.bgMuted,
              border: '1px solid transparent',
              color: t.color.fgDefault,
              fontSize: t.text.body,
              fontWeight: t.weight.regular,
              outline: 'none',
              fontFamily: t.font.family,
              transition: `all ${t.transition.base}`,
            }}
            onFocus={e => {
              e.currentTarget.style.background = t.color.bgDefault
              e.currentTarget.style.borderColor = t.color.borderDefault
              e.currentTarget.style.boxShadow = `0 0 0 3px ${t.color.brandBlue}10`
            }}
            onBlur={e => {
              e.currentTarget.style.background = t.color.bgMuted
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: t.space[2], justifyContent: 'flex-end' }}>
        {/* Invite */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: t.radius.button,
            border: `1px solid ${t.color.borderDefault}`,
            background: t.color.bgDefault,
            cursor: 'pointer',
            fontSize: t.text.bodySm,
            fontWeight: t.weight.medium,
            color: t.color.fgMuted,
            transition: `all ${t.transition.base}`,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = t.color.fgMuted
            e.currentTarget.style.color = t.color.fgDefault
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = t.color.borderDefault
            e.currentTarget.style.color = t.color.fgMuted
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1 14c0-2.761 2.239-5 5-5s5 2.239 5 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M12 5v4M14 7h-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Invite members
        </button>

        {/* Notifications */}
        <button
          title="Notifications"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: t.radius.full,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: t.color.fgMuted,
            transition: `all ${t.transition.base}`,
            position: 'relative',
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
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M4 6C4 3.79086 5.79086 2 8 2C10.2091 2 12 3.79086 12 6V9L13 11H3L4 9V6Z" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6.5 12C6.5 12.8284 7.17157 13.5 8 13.5C8.82843 13.5 9.5 12.8284 9.5 12" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 9,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: t.color.statusError,
              border: `2px solid ${t.color.bgDefault}`,
            }}
          />
        </button>

        {/* Help */}
        <button
          title="Help"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: t.radius.full,
            border: 'none',
            background: 'transparent',
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
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6 6.5C6 5.67157 6.67157 5 7.5 5H8.5C9.32843 5 10 5.67157 10 6.5C10 7.16667 9.58333 7.66667 8.75 8C8.25 8.2 8 8.5 8 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.5" fill="currentColor" />
          </svg>
        </button>

        {/* User avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: t.radius.full,
            background: `linear-gradient(135deg, ${t.color.brandBlue}20, ${t.color.brandBlue}40)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: t.text.bodySm,
            fontWeight: t.weight.bold,
            color: t.color.brandBlue,
            cursor: 'pointer',
          }}
        >
          E
        </div>
      </div>
    </header>
  )
}
