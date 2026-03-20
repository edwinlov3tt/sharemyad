import { memo } from 'react'
import { STATUS_CONFIG } from '../../data/mockWorkspaceData'
import type { DesignStatus } from '../../types/workspace.types'

interface StatusBadgeProps {
  status: DesignStatus
  size?: 'sm' | 'md'
}

export const StatusBadge = memo(function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  const sz = size === 'sm'
    ? { px: 8, py: 2, fs: 10, dot: 5 }
    : { px: 12, py: 5, fs: 12, dot: 6 }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 100,
        padding: `${sz.py}px ${sz.px}px`,
        fontSize: sz.fs,
        fontWeight: 600,
        color: cfg.text,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}
    >
      <span
        style={{
          width: sz.dot,
          height: sz.dot,
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  )
})
