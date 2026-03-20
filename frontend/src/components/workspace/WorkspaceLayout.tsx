import type { ReactNode } from 'react'
import { FolderSidebar } from './FolderSidebar'
import { tokens } from '../../config/designTokens'

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 52px)',
        overflow: 'hidden',
      }}
    >
      <FolderSidebar />
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
