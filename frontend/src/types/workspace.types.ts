// Workspace types for brand ad management

export type DesignStatus = 'approved' | 'changes' | 'pending'
export type DesignCategory = 'Display' | 'Social' | 'Video' | 'Email' | 'CTV'
export type WorkspaceView = 'grid' | 'detail'

export interface DesignVersion {
  id: string
  label: string
  status: DesignStatus
  date: string
  note: string
  reviewer: string | null
  previewColor: string
  previewAccent: string
  tagline: string
}

export interface DesignSet {
  id: string
  name: string
  folderId: string
  category: DesignCategory
  format: string
  createdAt: string
  versions: DesignVersion[]
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  children: Folder[]
}

export interface FilterState {
  status: 'all' | DesignStatus
  category: 'all' | DesignCategory
  search: string
}
