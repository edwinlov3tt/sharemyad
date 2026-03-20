import { useState } from 'react'
import { tokens } from '../../config/designTokens'
import { CATEGORY_COLORS, STATUS_CONFIG } from '../../data/mockWorkspaceData'
import { useWorkspace } from '../../context/WorkspaceContext'
import { StatusBadge } from './StatusBadge'
import { CreativeMockup } from './CreativeMockup'

const t = tokens

export function VersionDetailView() {
  const { activeDesignSet, closeDesignSet } = useWorkspace()
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [compareMode, setCompareMode] = useState(false)

  if (!activeDesignSet) return null

  const catColor = CATEGORY_COLORS[activeDesignSet.category] || '#888'

  const toggleSelect = (vId: string) => {
    setSelectedVersions(prev =>
      prev.includes(vId) ? prev.filter(id => id !== vId) : prev.length < 3 ? [...prev, vId] : prev
    )
  }

  const displayVersions = compareMode
    ? activeDesignSet.versions.filter(v => selectedVersions.includes(v.id))
    : activeDesignSet.versions

  return (
    <div style={{ animation: 'fadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <button
            onClick={closeDesignSet}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: t.color.fgMuted,
              cursor: 'pointer',
              fontSize: t.text.caption,
              fontWeight: t.weight.semibold,
              padding: 0,
              marginBottom: 12,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              transition: `color ${t.transition.base}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = t.color.fgDefault }}
            onMouseLeave={e => { e.currentTarget.style.color = t.color.fgMuted }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All Designs
          </button>
          <h2
            style={{
              fontSize: t.text.h3,
              fontWeight: t.weight.bold,
              color: t.color.fgDefault,
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              marginBottom: 6,
            }}
          >
            {activeDesignSet.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: t.text.bodySm, color: t.color.fgMuted, fontWeight: t.weight.medium }}>
              {activeDesignSet.format}
            </span>
            <span style={{ color: t.color.borderMuted }}>·</span>
            <span style={{ fontSize: t.text.bodySm, color: t.color.fgMuted, fontWeight: t.weight.medium }}>
              {activeDesignSet.createdAt}
            </span>
            <span
              style={{
                fontSize: t.text.micro,
                fontWeight: t.weight.bold,
                color: catColor,
                background: `${catColor}10`,
                border: `1px solid ${catColor}25`,
                borderRadius: 6,
                padding: '2px 7px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {activeDesignSet.category}
            </span>
          </div>
        </div>

        {/* Compare controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginTop: 4 }}>
          {selectedVersions.length >= 2 && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              style={{
                padding: '8px 16px',
                borderRadius: t.radius.button,
                background: compareMode ? t.color.actionBgPrimary : t.color.bgMuted,
                color: compareMode ? '#ffffff' : t.color.fgDefault,
                border: `1px solid ${compareMode ? t.color.actionBgPrimary : t.color.borderDefault}`,
                fontSize: t.text.caption,
                fontWeight: t.weight.semibold,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: `all ${t.transition.base}`,
              }}
            >
              {compareMode ? 'Exit Compare' : `Compare ${selectedVersions.length}`}
            </button>
          )}
          <span style={{ fontSize: t.text.overline, color: t.color.fgMuted, fontWeight: t.weight.medium }}>
            {selectedVersions.length > 0 ? `${selectedVersions.length} selected` : 'Select to compare'}
          </span>
        </div>
      </div>

      {/* Version Timeline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 32,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {activeDesignSet.versions.map((v, i) => {
          const cfg = STATUS_CONFIG[v.status]
          return (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  minWidth: 70,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: cfg.bg,
                    border: `2px solid ${cfg.dot}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: t.text.overline,
                    fontWeight: t.weight.bold,
                    color: cfg.text,
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    color: t.color.fgMuted,
                    fontWeight: t.weight.semibold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {v.date}
                </span>
              </div>
              {i < activeDesignSet.versions.length - 1 && (
                <div
                  style={{
                    width: 40,
                    height: 2,
                    background: t.color.borderDefault,
                    borderRadius: 1,
                    margin: '0 -4px',
                    marginBottom: 18,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Version Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            compareMode && selectedVersions.length >= 2
              ? `repeat(${Math.min(selectedVersions.length, 3)}, 1fr)`
              : activeDesignSet.versions.length <= 2
                ? 'repeat(2, 1fr)'
                : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        {displayVersions.map((version, i) => {
          const isSelected = selectedVersions.includes(version.id)
          const cfg = STATUS_CONFIG[version.status]
          return (
            <div
              key={version.id}
              style={{
                borderRadius: t.radius.card,
                background: t.color.bgDefault,
                border: `1px solid ${isSelected ? `${cfg.dot}50` : t.color.borderDefault}`,
                overflow: 'hidden',
                transition: `border-color ${t.transition.base}, box-shadow ${t.transition.base}`,
                animation: `fadeSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.06}s both`,
                boxShadow: isSelected
                  ? `0 0 0 1px ${cfg.dot}30, ${t.shadow.depth}`
                  : t.shadow.widget,
              }}
            >
              <div style={{ position: 'relative' }}>
                <CreativeMockup version={version} size="lg" />
                {/* Select checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(version.id) }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: isSelected ? cfg.dot : 'rgba(0,0,0,0.4)',
                    border: `1.5px solid ${isSelected ? cfg.dot : 'rgba(255,255,255,0.4)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: `all ${t.transition.base}`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {isSelected && (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5l3.5 3.5L13 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>

              <div style={{ padding: '14px 16px 16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: t.text.body, fontWeight: t.weight.bold, color: t.color.fgDefault }}>
                    {version.label}
                  </span>
                  <StatusBadge status={version.status} size="sm" />
                </div>

                {version.note && (
                  <div
                    style={{
                      fontSize: t.text.bodySm,
                      color: t.color.fgMuted,
                      lineHeight: 1.5,
                      marginBottom: 12,
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{version.note}&rdquo;
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {version.reviewer && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${version.previewAccent}60, ${version.previewAccent}30)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          fontWeight: t.weight.bold,
                          color: version.previewAccent,
                        }}
                      >
                        {version.reviewer.charAt(0)}
                      </div>
                      <span style={{ fontSize: t.text.overline, color: t.color.fgMuted, fontWeight: t.weight.medium }}>
                        {version.reviewer}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                    {version.status === 'pending' && (
                      <>
                        <button
                          style={{
                            padding: '5px 12px',
                            borderRadius: 6,
                            fontSize: t.text.overline,
                            fontWeight: t.weight.semibold,
                            background: 'rgba(34,197,94,0.08)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            color: '#16a34a',
                            cursor: 'pointer',
                            letterSpacing: '0.02em',
                          }}
                        >
                          Approve
                        </button>
                        <button
                          style={{
                            padding: '5px 12px',
                            borderRadius: 6,
                            fontSize: t.text.overline,
                            fontWeight: t.weight.semibold,
                            background: 'rgba(245,158,11,0.08)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            color: '#d97706',
                            cursor: 'pointer',
                            letterSpacing: '0.02em',
                          }}
                        >
                          Request Changes
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
