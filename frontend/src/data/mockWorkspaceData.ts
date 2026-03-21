import type { DesignSet, DesignStatus, DesignCategory, Folder } from '../types/workspace.types'

// Status badge configuration
export const STATUS_CONFIG: Record<DesignStatus, {
  label: string
  bg: string
  border: string
  text: string
  dot: string
}> = {
  approved: { label: 'Approved', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', text: '#16a34a', dot: '#22c55e' },
  changes: { label: 'Changes', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#d97706', dot: '#f59e0b' },
  pending: { label: 'Pending', bg: 'rgba(55,101,246,0.08)', border: 'rgba(55,101,246,0.2)', text: '#3765f6', dot: '#3765f6' },
}

// Category color map
export const CATEGORY_COLORS: Record<DesignCategory, string> = {
  Display: '#3765f6',
  Social: '#e94560',
  Video: '#ff6b35',
  Email: '#f59e0b',
  CTV: '#6c5ce7',
}

// Folder tree
export const MOCK_FOLDERS: Folder[] = [
  {
    id: 'root',
    name: 'Main Folder',
    parentId: null,
    children: [
      { id: 'f-example', name: 'Example', parentId: 'root', children: [] },
      {
        id: 'f-social',
        name: 'Social Media',
        parentId: 'root',
        children: [
          { id: 'f-social-ig', name: 'Instagram', parentId: 'f-social', children: [] },
          { id: 'f-social-fb', name: 'Facebook', parentId: 'f-social', children: [] },
        ],
      },
      { id: 'f-kitchen', name: 'Kitchen', parentId: 'root', children: [] },
      { id: 'f-team', name: 'Team', parentId: 'root', children: [] },
    ],
  },
]

// Mock design sets
export const MOCK_DESIGN_SETS: DesignSet[] = [
  {
    id: 'ds-001',
    name: 'Spring Campaign — Hero Banner',
    folderId: 'f-example',
    category: 'Display',
    format: '1200x628',
    createdAt: 'Mar 12, 2026',
    fileSize: '250 MB',
    sharedBy: 'Adrian Carter',
    versions: [
      { id: 'v1', label: 'v1 — Initial', status: 'changes', date: 'Mar 12', note: 'Needs warmer tones per client feedback', previewColor: '#e8eff8', previewAccent: '#3765f6', tagline: 'Escape to Paradise', reviewer: 'Sarah M.' },
      { id: 'v2', label: 'v2 — Color Update', status: 'changes', date: 'Mar 13', note: 'Typography too small on mobile', previewColor: '#f0e8f8', previewAccent: '#6c5ce7', tagline: 'Your Next Getaway', reviewer: 'Sarah M.' },
      { id: 'v3', label: 'v3 — Type Fix', status: 'approved', date: 'Mar 14', note: 'Approved — ship it!', previewColor: '#e8f8f0', previewAccent: '#22c55e', tagline: 'Discover Meridian', reviewer: 'James K.' },
    ],
  },
  {
    id: 'ds-002',
    name: 'Product Launch — Social Set',
    folderId: 'f-social',
    category: 'Social',
    format: '1080x1080',
    createdAt: 'Mar 10, 2026',
    fileSize: '325 MB',
    sharedBy: 'Bella Thompson',
    versions: [
      { id: 'v1', label: 'v1 — Draft', status: 'changes', date: 'Mar 10', note: 'Logo placement off-brand', previewColor: '#f5f5f5', previewAccent: '#ff6b35', tagline: 'Power Redefined', reviewer: 'Amy L.' },
      { id: 'v2', label: 'v2 — Brand Aligned', status: 'pending', date: 'Mar 14', note: 'Awaiting client review', previewColor: '#eef0f8', previewAccent: '#e94560', tagline: 'Next-Gen Energy', reviewer: null },
    ],
  },
  {
    id: 'ds-003',
    name: 'Retargeting — Banner Set',
    folderId: 'f-example',
    category: 'Display',
    format: '300x250 + 728x90',
    createdAt: 'Mar 8, 2026',
    fileSize: '340 MB',
    sharedBy: 'Daniel Foster',
    versions: [
      { id: 'v1', label: 'v1 — Concept A', status: 'pending', date: 'Mar 8', note: 'Softer approach — lifestyle imagery', previewColor: '#f8f0e8', previewAccent: '#d4a574', tagline: 'Naturally Yours', reviewer: null },
      { id: 'v2', label: 'v2 — Concept B', status: 'pending', date: 'Mar 8', note: 'Bold approach — product-focused', previewColor: '#e8f0e8', previewAccent: '#22c55e', tagline: 'Pure Botanicals', reviewer: null },
      { id: 'v3', label: 'v3 — Concept A Rev', status: 'pending', date: 'Mar 11', note: 'Updated CTA and color palette', previewColor: '#f0e8f0', previewAccent: '#c67bb5', tagline: 'Bloom Daily', reviewer: null },
      { id: 'v4', label: 'v4 — Final Candidate', status: 'approved', date: 'Mar 15', note: 'Client loved this direction', previewColor: '#e8f0f0', previewAccent: '#22b8cf', tagline: 'Live Beautifully', reviewer: 'Marcus R.' },
    ],
  },
  {
    id: 'ds-004',
    name: 'Brand Awareness — Video Thumb',
    folderId: 'f-team',
    category: 'Video',
    format: '1920x1080',
    createdAt: 'Mar 14, 2026',
    fileSize: '221 MB',
    sharedBy: 'Emily Richardson',
    versions: [
      { id: 'v1', label: 'v1 — High Energy', status: 'approved', date: 'Mar 14', note: 'Strong performance angle', previewColor: '#f8e8e8', previewAccent: '#ef4444', tagline: 'No Limits', reviewer: 'Coach Dan' },
    ],
  },
  {
    id: 'ds-005',
    name: 'Holiday Promo — Email Header',
    folderId: 'f-kitchen',
    category: 'Email',
    format: '600x200',
    createdAt: 'Mar 6, 2026',
    fileSize: '992 MB',
    sharedBy: 'Samuel Hayes',
    versions: [
      { id: 'v1', label: 'v1 — Warm Glow', status: 'changes', date: 'Mar 6', note: "Too dark — can't read on mobile", previewColor: '#f8f4e8', previewAccent: '#f59e0b', tagline: 'Light the Season', reviewer: 'Priya S.' },
      { id: 'v2', label: 'v2 — Bright Edit', status: 'approved', date: 'Mar 9', note: 'Perfect. Approved for send.', previewColor: '#faf8f0', previewAccent: '#c4940a', tagline: 'Warmth Delivered', reviewer: 'Priya S.' },
    ],
  },
  {
    id: 'ds-006',
    name: 'Q2 Awareness — Connected TV',
    folderId: 'f-example',
    category: 'CTV',
    format: '1920x1080',
    createdAt: 'Mar 15, 2026',
    fileSize: '180 MB',
    sharedBy: 'Adrian Carter',
    versions: [
      { id: 'v1', label: 'v1 — Trust Theme', status: 'pending', date: 'Mar 15', note: 'Initial concept — family focus', previewColor: '#eaf0f8', previewAccent: '#3765f6', tagline: 'Protection You Trust', reviewer: null },
      { id: 'v2', label: 'v2 — Modern Take', status: 'pending', date: 'Mar 16', note: 'Sleeker, younger demographic', previewColor: '#eeeaf8', previewAccent: '#6c5ce7', tagline: 'Insure Smarter', reviewer: null },
      { id: 'v3', label: 'v3 — Hybrid', status: 'pending', date: 'Mar 17', note: 'Merged best of both — awaiting review', previewColor: '#e8f4f4', previewAccent: '#22c55e', tagline: 'Your Future, Covered', reviewer: null },
    ],
  },
  {
    id: 'ds-007',
    name: 'Spa Special Women',
    folderId: 'f-social',
    category: 'Social',
    format: '1080x1080',
    createdAt: 'Mar 3, 2026',
    fileSize: '145 MB',
    sharedBy: 'Bella Thompson',
    versions: [
      { id: 'v1', label: 'v1 — Soft Pastels', status: 'approved', date: 'Mar 3', note: 'Final approved version', previewColor: '#f8eef4', previewAccent: '#e94560', tagline: 'Special Discounts for Women', reviewer: 'Sarah M.' },
    ],
  },
  {
    id: 'ds-008',
    name: 'Lawn Care Services',
    folderId: 'f-kitchen',
    category: 'Display',
    format: '300x250',
    createdAt: 'Mar 1, 2026',
    fileSize: '88 MB',
    sharedBy: 'Daniel Foster',
    versions: [
      { id: 'v1', label: 'v1 — Green Theme', status: 'approved', date: 'Mar 1', note: 'Ready for deployment', previewColor: '#e8f8e8', previewAccent: '#22c55e', tagline: 'Lawn Care Services', reviewer: 'Marcus R.' },
      { id: 'v2', label: 'v2 — Seasonal Update', status: 'pending', date: 'Mar 18', note: 'Spring seasonal variant', previewColor: '#f0f8e8', previewAccent: '#70b845', tagline: 'Spring Fresh Lawns', reviewer: null },
    ],
  },
]
