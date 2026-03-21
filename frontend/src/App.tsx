import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext'
import { TopNav } from './components/workspace/TopNav'
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout'
import { ActionBar } from './components/workspace/ActionBar'
import { FolderChips } from './components/workspace/FolderChips'
import { SuggestedActivity } from './components/workspace/SuggestedActivity'
import { ContentToolbar } from './components/workspace/ContentToolbar'
import { DesignSetGrid } from './components/workspace/DesignSetGrid'
import { FileTable } from './components/workspace/FileTable'
import { VersionDetailView } from './components/workspace/VersionDetailView'
import { UploadModal } from './components/workspace/UploadModal'

function WorkspaceContent() {
  const { view, contentLayout } = useWorkspace()

  if (view === 'detail') {
    return <VersionDetailView />
  }

  return (
    <>
      <ActionBar />
      <FolderChips />
      <SuggestedActivity />
      <ContentToolbar />
      {contentLayout === 'grid' ? <DesignSetGrid /> : <FileTable />}
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
