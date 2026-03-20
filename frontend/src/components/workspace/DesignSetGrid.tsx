import { useCallback } from 'react'
import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'
import { StackedCard } from './StackedCard'
import type { DesignSet } from '../../types/workspace.types'

const t = tokens

export function DesignSetGrid() {
  const { filteredDesignSets, openDesignSet } = useWorkspace()

  const handleClick = useCallback(
    (set: DesignSet) => openDesignSet(set),
    [openDesignSet]
  )

  if (filteredDesignSets.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: t.color.fgMuted,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="8" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="28" y="8" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
            <rect x="4" y="32" width="16" height="8" rx="3" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
            <rect x="28" y="32" width="16" height="8" rx="3" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
          </svg>
        </div>
        <div style={{ fontSize: t.text.body, fontWeight: t.weight.semibold }}>
          No designs match your filters
        </div>
        <div style={{ fontSize: t.text.bodySm, marginTop: 4 }}>
          Try adjusting your search or filter criteria
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: t.space[6],
        paddingBottom: t.space[12],
      }}
    >
      {filteredDesignSets.map((set, i) => (
        <StackedCard
          key={set.id}
          designSet={set}
          index={i}
          onOpen={handleClick}
        />
      ))}
    </div>
  )
}
