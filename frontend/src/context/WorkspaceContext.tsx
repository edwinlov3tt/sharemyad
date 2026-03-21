import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { DesignSet, Folder, FilterState, WorkspaceView, ContentLayout } from '../types/workspace.types'
import { MOCK_DESIGN_SETS, MOCK_FOLDERS } from '../data/mockWorkspaceData'

interface WorkspaceState {
  folders: Folder[]
  designSets: DesignSet[]
  filteredDesignSets: DesignSet[]
  selectedFolderId: string | null
  activeDesignSet: DesignSet | null
  view: WorkspaceView
  contentLayout: ContentLayout
  filters: FilterState
  showUploadModal: boolean
  sidebarSection: string
  selectFolder: (folderId: string | null) => void
  openDesignSet: (set: DesignSet) => void
  closeDesignSet: () => void
  setFilter: (filter: Partial<FilterState>) => void
  toggleUploadModal: () => void
  setSidebarSection: (section: string) => void
  setContentLayout: (layout: ContentLayout) => void
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

function getAllFolderIds(folder: Folder): string[] {
  return [folder.id, ...folder.children.flatMap(getAllFolderIds)]
}

function findFolder(folders: Folder[], id: string): Folder | null {
  for (const f of folders) {
    if (f.id === id) return f
    const found = findFolder(f.children, id)
    if (found) return found
  }
  return null
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [activeDesignSet, setActiveDesignSet] = useState<DesignSet | null>(null)
  const [view, setView] = useState<WorkspaceView>('grid')
  const [contentLayout, setContentLayout] = useState<ContentLayout>('grid')
  const [filters, setFilters] = useState<FilterState>({ status: 'all', category: 'all', search: '' })
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [sidebarSection, setSidebarSection] = useState('home')

  const selectFolder = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId)
  }, [])

  const openDesignSet = useCallback((set: DesignSet) => {
    setActiveDesignSet(set)
    setView('detail')
  }, [])

  const closeDesignSet = useCallback(() => {
    setActiveDesignSet(null)
    setView('grid')
  }, [])

  const setFilter = useCallback((partial: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...partial }))
  }, [])

  const toggleUploadModal = useCallback(() => {
    setShowUploadModal(prev => !prev)
  }, [])

  const handleSetSidebarSection = useCallback((section: string) => {
    setSidebarSection(section)
  }, [])

  const handleSetContentLayout = useCallback((layout: ContentLayout) => {
    setContentLayout(layout)
  }, [])

  const filteredDesignSets = useMemo(() => {
    return MOCK_DESIGN_SETS.filter(set => {
      if (selectedFolderId) {
        const folder = findFolder(MOCK_FOLDERS, selectedFolderId)
        if (folder) {
          const validIds = getAllFolderIds(folder)
          if (!validIds.includes(set.folderId)) return false
        }
      }
      if (filters.status !== 'all') {
        const latestStatus = set.versions[set.versions.length - 1].status
        if (latestStatus !== filters.status) return false
      }
      if (filters.category !== 'all' && set.category !== filters.category) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!set.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [selectedFolderId, filters])

  const value: WorkspaceState = {
    folders: MOCK_FOLDERS,
    designSets: MOCK_DESIGN_SETS,
    filteredDesignSets,
    selectedFolderId,
    activeDesignSet,
    view,
    contentLayout,
    filters,
    showUploadModal,
    sidebarSection,
    selectFolder,
    openDesignSet,
    closeDesignSet,
    setFilter,
    toggleUploadModal,
    setSidebarSection: handleSetSidebarSection,
    setContentLayout: handleSetContentLayout,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
