import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext'
import { TopNav } from './components/workspace/TopNav'
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout'
import { FilterBar } from './components/workspace/FilterBar'
import { DesignSetGrid } from './components/workspace/DesignSetGrid'
import { VersionDetailView } from './components/workspace/VersionDetailView'
import { UploadModal } from './components/workspace/UploadModal'

function WorkspaceContent() {
  const { view } = useWorkspace()

  return (
    <>
      {view === 'grid' ? (
        <>
          <FilterBar />
          <DesignSetGrid />
        </>
      ) : (
        <VersionDetailView />
      )}
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <WorkspaceProvider>
        <div
          style={{
            minHeight: '100vh',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          }}
        >
          <TopNav />
          <WorkspaceLayout>
            <WorkspaceContent />
          </WorkspaceLayout>
          <UploadModal />
        </div>
      </WorkspaceProvider>
    </ErrorBoundary>
  )
}

export default App
