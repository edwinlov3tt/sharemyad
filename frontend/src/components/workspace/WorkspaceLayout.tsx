import type { ReactNode } from 'react'
import { IconRail } from './IconRail'
import { FolderPanel } from './FolderSidebar'
import { tokens } from '../../config/designTokens'

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
      }}
    >
      <IconRail />
      <FolderPanel />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          background: tokens.color.bgMuted,
          padding: `${tokens.space[6]}px ${tokens.space[8]}px`,
        }}
      >
        {children}
      </main>
    </div>
  )
}
