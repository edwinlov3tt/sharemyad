import type {
  Workspace, Folder, DesignSet, Version,
  Market, Client, OrgMember, ClientContact, ClientAssignment,
  ActivityLogEntry,
} from '../types';

// ─── Markets ────────────────────────────────────────────────────────────────

export const mockMarkets: Market[] = [
  { id: 'mkt-1', agency_id: 'ag-1', name: 'Southeast', description: 'Southeast US — FL, GA, NC, SC, TN', created_at: '2025-06-01T10:00:00Z', updated_at: '2025-06-01T10:00:00Z' },
  { id: 'mkt-2', agency_id: 'ag-1', name: 'West Coast', description: 'California & Pacific Northwest', created_at: '2025-06-01T10:00:00Z', updated_at: '2025-06-01T10:00:00Z' },
];

// ─── Clients ────────────────────────────────────────────────────────────────

export const mockClients: Client[] = [
  { id: 'cl-1', agency_id: 'ag-1', market_id: 'mkt-1', name: 'Nike', website_url: 'https://nike.com', logo_url: '', color: '#1A1A1A', status: 'active', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
  { id: 'cl-2', agency_id: 'ag-1', market_id: 'mkt-1', name: 'Coca-Cola', website_url: 'https://coca-cola.com', logo_url: '', color: '#DC2626', status: 'active', created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
  { id: 'cl-3', agency_id: 'ag-1', market_id: 'mkt-2', name: 'Spotify', website_url: 'https://spotify.com', logo_url: '', color: '#16A34A', status: 'active', created_at: '2026-02-10T10:00:00Z', updated_at: '2026-02-10T10:00:00Z' },
  { id: 'cl-4', agency_id: 'ag-1', market_id: 'mkt-2', name: 'Airbnb', website_url: 'https://airbnb.com', logo_url: '', color: '#EA580C', status: 'active', created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z' },
];

// ─── Org Members ────────────────────────────────────────────────────────────

export const mockOrgMembers: OrgMember[] = [
  { id: 'om-1', agency_id: 'ag-1', user_id: 'u-1', role: 'admin', display_name: 'David Martinez', email: 'david@agency.com', avatar_url: null, is_kam: false, created_at: '2025-06-01T10:00:00Z' },
  { id: 'om-2', agency_id: 'ag-1', user_id: 'u-2', role: 'ae', display_name: 'Sarah Lawson', email: 'sarah.l@agency.com', avatar_url: null, is_kam: false, created_at: '2025-07-01T10:00:00Z' },
  { id: 'om-3', agency_id: 'ag-1', user_id: 'u-3', role: 'dcm', display_name: 'Alex Chen', email: 'alex.c@agency.com', avatar_url: null, is_kam: true, created_at: '2025-07-15T10:00:00Z' },
  { id: 'om-4', agency_id: 'ag-1', user_id: 'u-4', role: 'designer', display_name: 'Mark Johnson', email: 'mark.j@agency.com', avatar_url: null, is_kam: false, created_at: '2025-08-01T10:00:00Z' },
  { id: 'om-5', agency_id: 'ag-1', user_id: 'u-5', role: 'ae', display_name: 'Priya Patel', email: 'priya.p@agency.com', avatar_url: null, is_kam: false, created_at: '2025-09-01T10:00:00Z' },
  { id: 'om-6', agency_id: 'ag-1', user_id: 'u-6', role: 'dcm', display_name: 'Jordan Kim', email: 'jordan.k@agency.com', avatar_url: null, is_kam: false, created_at: '2025-09-15T10:00:00Z' },
];

// Market memberships: AEs + DCMs → markets (designers are cross-market, not listed)
export const mockMarketMembers = [
  { id: 'mm-1', market_id: 'mkt-1', org_member_id: 'om-2' }, // Sarah Lawson → Southeast
  { id: 'mm-2', market_id: 'mkt-1', org_member_id: 'om-3' }, // Alex Chen → Southeast
  { id: 'mm-3', market_id: 'mkt-2', org_member_id: 'om-5' }, // Priya Patel → West Coast
  { id: 'mm-4', market_id: 'mkt-2', org_member_id: 'om-6' }, // Jordan Kim → West Coast
];

// ─── Client Contacts (external reviewers) ───────────────────────────────────

export const mockClientContacts: ClientContact[] = [
  { id: 'cc-1', client_id: 'cl-1', user_id: 'cu-1', name: 'Sarah Chen', email: 'sarah.chen@nike.com', title: 'Brand Manager', is_primary: true, can_approve: true, status: 'active', invited_at: '2026-01-20T10:00:00Z', last_login_at: '2026-03-22T14:30:00Z', created_at: '2026-01-20T10:00:00Z' },
  { id: 'cc-2', client_id: 'cl-1', user_id: null, name: 'Tom Bradley', email: 'tom.b@nike.com', title: 'Creative Director', is_primary: false, can_approve: true, status: 'invited', invited_at: '2026-03-10T10:00:00Z', last_login_at: null, created_at: '2026-03-10T10:00:00Z' },
  { id: 'cc-3', client_id: 'cl-2', user_id: 'cu-2', name: 'Lisa Park', email: 'lisa.park@cocacola.com', title: 'VP Marketing', is_primary: true, can_approve: true, status: 'active', invited_at: '2026-02-05T10:00:00Z', last_login_at: '2026-03-20T09:15:00Z', created_at: '2026-02-05T10:00:00Z' },
  { id: 'cc-4', client_id: 'cl-3', user_id: 'cu-3', name: 'Marcus Webb', email: 'marcus@spotify.com', title: 'Head of Design', is_primary: true, can_approve: true, status: 'active', invited_at: '2026-02-12T10:00:00Z', last_login_at: '2026-03-18T16:00:00Z', created_at: '2026-02-12T10:00:00Z' },
  { id: 'cc-5', client_id: 'cl-4', user_id: null, name: 'Aiko Tanaka', email: 'aiko@airbnb.com', title: 'Marketing Lead', is_primary: true, can_approve: true, status: 'invited', invited_at: '2026-03-05T10:00:00Z', last_login_at: null, created_at: '2026-03-05T10:00:00Z' },
];

// ─── Client Assignments (AE/DCM → Client) ───────────────────────────────────

export const mockClientAssignments: ClientAssignment[] = [
  { id: 'ca-1', client_id: 'cl-1', org_member_id: 'om-2', assignment_role: 'ae', is_primary: true, created_at: '2026-01-15T10:00:00Z' },   // Sarah Lawson → Nike (AE)
  { id: 'ca-2', client_id: 'cl-1', org_member_id: 'om-3', assignment_role: 'dcm', is_primary: true, created_at: '2026-01-15T10:00:00Z' },  // Alex Chen → Nike (DCM)
  { id: 'ca-3', client_id: 'cl-2', org_member_id: 'om-2', assignment_role: 'ae', is_primary: true, created_at: '2026-02-01T10:00:00Z' },   // Sarah Lawson → Coca-Cola (AE)
  { id: 'ca-4', client_id: 'cl-2', org_member_id: 'om-3', assignment_role: 'dcm', is_primary: true, created_at: '2026-02-01T10:00:00Z' },  // Alex Chen → Coca-Cola (DCM)
  { id: 'ca-5', client_id: 'cl-3', org_member_id: 'om-5', assignment_role: 'ae', is_primary: true, created_at: '2026-02-10T10:00:00Z' },   // Priya Patel → Spotify (AE)
  { id: 'ca-6', client_id: 'cl-3', org_member_id: 'om-6', assignment_role: 'dcm', is_primary: true, created_at: '2026-02-10T10:00:00Z' },  // Jordan Kim → Spotify (DCM)
  { id: 'ca-7', client_id: 'cl-4', org_member_id: 'om-5', assignment_role: 'ae', is_primary: true, created_at: '2026-03-01T10:00:00Z' },   // Priya Patel → Airbnb (AE)
  { id: 'ca-8', client_id: 'cl-4', org_member_id: 'om-6', assignment_role: 'dcm', is_primary: true, created_at: '2026-03-01T10:00:00Z' },  // Jordan Kim → Airbnb (DCM)
];

// ─── Activity Log ───────────────────────────────────────────────────────────

export const mockActivityLog: ActivityLogEntry[] = [
  { id: 'al-1', agency_id: 'ag-1', actor_type: 'client_contact', actor_id: 'cc-1', actor_name: 'Sarah Chen', action: 'approved', entity_type: 'version', entity_id: 'v-1-3', entity_name: 'Summer Vibes Leaderboard v3', metadata: { version_number: 3 }, client_id: 'cl-1', workspace_id: 'ws-1', created_at: '2026-03-24T10:45:00Z' },
  { id: 'al-2', agency_id: 'ag-1', actor_type: 'org_member', actor_id: 'om-2', actor_name: 'Sarah Lawson', action: 'uploaded', entity_type: 'version', entity_id: 'v-3-1', entity_name: 'Instagram Stories Set v1', metadata: { file_count: 4 }, client_id: 'cl-1', workspace_id: 'ws-1', created_at: '2026-03-23T15:30:00Z' },
  { id: 'al-3', agency_id: 'ag-1', actor_type: 'org_member', actor_id: 'om-4', actor_name: 'Mark Johnson', action: 'uploaded', entity_type: 'version', entity_id: 'v-2-2', entity_name: 'Product Launch MPU v2', metadata: { file_size: 195000 }, client_id: 'cl-1', workspace_id: 'ws-1', created_at: '2026-03-22T11:00:00Z' },
  { id: 'al-4', agency_id: 'ag-1', actor_type: 'client_contact', actor_id: 'cc-3', actor_name: 'Lisa Park', action: 'status_changed', entity_type: 'version', entity_id: 'v-6-1', entity_name: 'Holiday Email Banner v1', metadata: { old_status: 'pending', new_status: 'changes_requested' }, client_id: 'cl-2', workspace_id: 'ws-2', created_at: '2026-03-21T09:15:00Z' },
  { id: 'al-5', agency_id: 'ag-1', actor_type: 'org_member', actor_id: 'om-3', actor_name: 'Alex Chen', action: 'shared', entity_type: 'share_link', entity_id: 'sl-1', entity_name: 'Nike Q2 Campaign Share', metadata: { permissions: 'view' }, client_id: 'cl-1', workspace_id: 'ws-1', created_at: '2026-03-20T16:45:00Z' },
  { id: 'al-6', agency_id: 'ag-1', actor_type: 'org_member', actor_id: 'om-5', actor_name: 'Priya Patel', action: 'created', entity_type: 'client', entity_id: 'cl-4', entity_name: 'Airbnb', metadata: { market: 'West Coast' }, client_id: 'cl-4', workspace_id: 'ws-4', created_at: '2026-03-18T14:00:00Z' },
  { id: 'al-7', agency_id: 'ag-1', actor_type: 'org_member', actor_id: 'om-6', actor_name: 'Jordan Kim', action: 'invited', entity_type: 'client_contact', entity_id: 'cc-5', entity_name: 'Aiko Tanaka', metadata: { email: 'aiko@airbnb.com' }, client_id: 'cl-4', workspace_id: 'ws-4', created_at: '2026-03-18T14:30:00Z' },
  { id: 'al-8', agency_id: 'ag-1', actor_type: 'system', actor_id: 'system', actor_name: 'ShareMyAd', action: 'status_changed', entity_type: 'campaign', entity_id: 'camp-1', entity_name: 'Q2 Campaign: Summer Velocity', metadata: { old_status: 'draft', new_status: 'active' }, client_id: 'cl-1', workspace_id: 'ws-1', created_at: '2026-03-17T08:00:00Z' },
];

// ─── Workspaces (now with client_id) ────────────────────────────────────────

export const mockWorkspaces: Workspace[] = [
  { id: 'ws-1', agency_id: 'ag-1', client_id: 'cl-1', name: 'Nike', logo_url: '', color: '#1A1A1A', created_at: '2026-01-15T10:00:00Z' },
  { id: 'ws-2', agency_id: 'ag-1', client_id: 'cl-2', name: 'Coca-Cola', logo_url: '', color: '#DC2626', created_at: '2026-02-01T10:00:00Z' },
  { id: 'ws-3', agency_id: 'ag-1', client_id: 'cl-3', name: 'Spotify', logo_url: '', color: '#16A34A', created_at: '2026-02-10T10:00:00Z' },
  { id: 'ws-4', agency_id: 'ag-1', client_id: 'cl-4', name: 'Airbnb', logo_url: '', color: '#EA580C', created_at: '2026-03-01T10:00:00Z' },
];

// ─── Folders ────────────────────────────────────────────────────────────────

export const mockFolders: Folder[] = [
  { id: 'f-1', workspace_id: 'ws-1', parent_id: null, name: 'Q2 Campaign', created_at: '2026-02-01T10:00:00Z' },
  { id: 'f-2', workspace_id: 'ws-1', parent_id: null, name: 'Holiday Campaign', created_at: '2026-02-15T10:00:00Z' },
  { id: 'f-3', workspace_id: 'ws-1', parent_id: null, name: 'Brand Refresh', created_at: '2026-03-01T10:00:00Z' },
  { id: 'f-4', workspace_id: 'ws-1', parent_id: 'f-1', name: 'Display Ads', created_at: '2026-02-02T10:00:00Z' },
  { id: 'f-5', workspace_id: 'ws-1', parent_id: 'f-1', name: 'Social Ads', created_at: '2026-02-02T10:00:00Z' },
];

// ─── Design Sets ────────────────────────────────────────────────────────────

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5576c 0%, #ff6a88 100%)',
  'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
];

export const mockDesignSets: DesignSet[] = [
  { id: 'ds-1', folder_id: 'f-4', workspace_id: 'ws-1', name: 'Summer Vibes Leaderboard', category: 'display', format_label: '728 x 90', status: 'approved', created_at: '2026-02-10T10:00:00Z', updated_at: '2026-03-15T10:00:00Z' },
  { id: 'ds-2', folder_id: 'f-4', workspace_id: 'ws-1', name: 'Product Launch MPU', category: 'display', format_label: '300 x 250', status: 'changes_requested', created_at: '2026-02-12T10:00:00Z', updated_at: '2026-03-14T10:00:00Z' },
  { id: 'ds-3', folder_id: 'f-5', workspace_id: 'ws-1', name: 'Instagram Stories Set', category: 'social', format_label: '1080 x 1920', status: 'pending', created_at: '2026-02-15T10:00:00Z', updated_at: '2026-03-12T10:00:00Z' },
  { id: 'ds-4', folder_id: 'f-5', workspace_id: 'ws-1', name: 'Facebook Carousel', category: 'social', format_label: '1080 x 1080', status: 'approved', created_at: '2026-02-18T10:00:00Z', updated_at: '2026-03-10T10:00:00Z' },
  { id: 'ds-5', folder_id: 'f-1', workspace_id: 'ws-1', name: 'Brand Hero 30s', category: 'video', format_label: '1920 x 1080', status: 'pending', created_at: '2026-02-20T10:00:00Z', updated_at: '2026-03-08T10:00:00Z' },
  { id: 'ds-6', folder_id: 'f-2', workspace_id: 'ws-1', name: 'Holiday Email Banner', category: 'email', format_label: '600 x 200', status: 'changes_requested', created_at: '2026-02-22T10:00:00Z', updated_at: '2026-03-06T10:00:00Z' },
  { id: 'ds-7', folder_id: 'f-2', workspace_id: 'ws-1', name: 'Holiday Skyscraper', category: 'display', format_label: '160 x 600', status: 'approved', created_at: '2026-02-25T10:00:00Z', updated_at: '2026-03-04T10:00:00Z' },
  { id: 'ds-8', folder_id: 'f-3', workspace_id: 'ws-1', name: 'CTV Spot 15s', category: 'ctv', format_label: '3840 x 2160', status: 'pending', created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-02T10:00:00Z' },
];

// ─── Versions ───────────────────────────────────────────────────────────────

export const mockVersions: Record<string, Version[]> = {
  'ds-1': [
    { id: 'v-1-1', design_set_id: 'ds-1', version_number: 1, file_url: '', thumbnail_url: gradients[0], file_size: 245000, status: 'changes_requested', reviewer_name: 'Sarah Chen', review_note: 'CTA button needs to be larger and more visible against the gradient.', created_at: '2026-02-10T10:00:00Z' },
    { id: 'v-1-2', design_set_id: 'ds-1', version_number: 2, file_url: '', thumbnail_url: gradients[1], file_size: 252000, status: 'changes_requested', reviewer_name: 'Sarah Chen', review_note: 'Better, but the font color clashes with the background on mobile.', created_at: '2026-02-20T10:00:00Z' },
    { id: 'v-1-3', design_set_id: 'ds-1', version_number: 3, file_url: '', thumbnail_url: gradients[2], file_size: 248000, status: 'approved', reviewer_name: 'Sarah Chen', review_note: 'Perfect. Approved for Q2 launch.', created_at: '2026-03-05T10:00:00Z' },
  ],
  'ds-2': [
    { id: 'v-2-1', design_set_id: 'ds-2', version_number: 1, file_url: '', thumbnail_url: gradients[3], file_size: 180000, status: 'changes_requested', reviewer_name: 'Mark Johnson', review_note: 'Product image is too small. Need more prominent placement.', created_at: '2026-02-12T10:00:00Z' },
    { id: 'v-2-2', design_set_id: 'ds-2', version_number: 2, file_url: '', thumbnail_url: gradients[4], file_size: 195000, status: 'changes_requested', reviewer_name: 'Mark Johnson', review_note: 'Product is better but the copy feels too wordy. Simplify the headline.', created_at: '2026-03-01T10:00:00Z' },
  ],
  'ds-3': [
    { id: 'v-3-1', design_set_id: 'ds-3', version_number: 1, file_url: '', thumbnail_url: gradients[5], file_size: 420000, status: 'pending', reviewer_name: '', review_note: '', created_at: '2026-02-15T10:00:00Z' },
  ],
  'ds-4': [
    { id: 'v-4-1', design_set_id: 'ds-4', version_number: 1, file_url: '', thumbnail_url: gradients[6], file_size: 310000, status: 'approved', reviewer_name: 'Lisa Park', review_note: 'Love the carousel flow. Approved.', created_at: '2026-02-18T10:00:00Z' },
  ],
  'ds-5': [
    { id: 'v-5-1', design_set_id: 'ds-5', version_number: 1, file_url: '', thumbnail_url: gradients[7], file_size: 8500000, status: 'pending', reviewer_name: '', review_note: '', created_at: '2026-02-20T10:00:00Z' },
    { id: 'v-5-2', design_set_id: 'ds-5', version_number: 2, file_url: '', thumbnail_url: gradients[8], file_size: 8200000, status: 'pending', reviewer_name: '', review_note: '', created_at: '2026-03-01T10:00:00Z' },
  ],
  'ds-6': [
    { id: 'v-6-1', design_set_id: 'ds-6', version_number: 1, file_url: '', thumbnail_url: gradients[9], file_size: 95000, status: 'changes_requested', reviewer_name: 'Alex Rivera', review_note: 'Holiday theme is too generic. Need something more brand-specific.', created_at: '2026-02-22T10:00:00Z' },
  ],
  'ds-7': [
    { id: 'v-7-1', design_set_id: 'ds-7', version_number: 1, file_url: '', thumbnail_url: gradients[0], file_size: 175000, status: 'approved', reviewer_name: 'Sarah Chen', review_note: 'Great vertical composition. Approved.', created_at: '2026-02-25T10:00:00Z' },
  ],
  'ds-8': [
    { id: 'v-8-1', design_set_id: 'ds-8', version_number: 1, file_url: '', thumbnail_url: gradients[3], file_size: 15000000, status: 'pending', reviewer_name: '', review_note: '', created_at: '2026-03-01T10:00:00Z' },
  ],
};

// ─── Dashboard view models (derived from above) ────────────────────────────

export interface WorkspaceInfo {
  id: string;
  name: string;
  color: string;
  campaign: string;
  fileCount: number;
  progress: number;
  priority: 'high' | 'active' | 'review';
  marketName: string;
  clientId: string;
  assignedAE: string;
  assignedDCM: string;
}

export const mockWorkspaceInfos: WorkspaceInfo[] = [
  { id: 'ws-1', name: 'Nike', color: '#1A1A1A', campaign: 'Q2 Campaign: Summer Velocity', fileCount: 24, progress: 75, priority: 'high', marketName: 'Southeast', clientId: 'cl-1', assignedAE: 'Sarah Lawson', assignedDCM: 'Alex Chen' },
  { id: 'ws-2', name: 'Coca-Cola', color: '#DC2626', campaign: 'Global Summer Series 2026', fileCount: 128, progress: 25, priority: 'active', marketName: 'Southeast', clientId: 'cl-2', assignedAE: 'Sarah Lawson', assignedDCM: 'Alex Chen' },
  { id: 'ws-3', name: 'Spotify', color: '#16A34A', campaign: 'Wrapped Campaign Refresh', fileCount: 45, progress: 50, priority: 'review', marketName: 'West Coast', clientId: 'cl-3', assignedAE: 'Priya Patel', assignedDCM: 'Jordan Kim' },
  { id: 'ws-4', name: 'Airbnb', color: '#EA580C', campaign: 'Host Stories Q2', fileCount: 18, progress: 10, priority: 'active', marketName: 'West Coast', clientId: 'cl-4', assignedAE: 'Priya Patel', assignedDCM: 'Jordan Kim' },
];

// Keep legacy ActivityItem for backward compat with existing components
export interface ActivityItem {
  id: string;
  timestamp: string;
  label: string;
  description: string;
  highlight?: string;
  isRecent: boolean;
}

export const mockActivity: ActivityItem[] = [
  { id: 'a-1', timestamp: '10:45 AM', label: '10:45 AM', description: 'approved the Final Cut for', highlight: 'Nike Velocity', isRecent: true },
  { id: 'a-2', timestamp: 'Yesterday', label: 'Yesterday', description: 'New assets uploaded to Spotify Wrapped workspace by Sarah L.', highlight: undefined, isRecent: false },
  { id: 'a-3', timestamp: 'Mar 18', label: 'Mar 18', description: 'Comment thread started on Coca-Cola Poster regarding color grading.', highlight: undefined, isRecent: false },
  { id: 'a-4', timestamp: 'Mar 17', label: 'Mar 17', description: 'Agency Hub system update complete. New bento layouts active.', highlight: undefined, isRecent: false },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getGradient(index: number): string {
  return gradients[index % gradients.length];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getVersionsForSet(designSetId: string): Version[] {
  return mockVersions[designSetId] || [];
}

// ─── Lookup helpers ─────────────────────────────────────────────────────────

export function getClientForWorkspace(workspaceId: string): Client | undefined {
  const ws = mockWorkspaces.find(w => w.id === workspaceId);
  if (!ws) return undefined;
  return mockClients.find(c => c.id === ws.client_id);
}

export function getMarketForClient(clientId: string): Market | undefined {
  const client = mockClients.find(c => c.id === clientId);
  if (!client) return undefined;
  return mockMarkets.find(m => m.id === client.market_id);
}

export function getAssignmentsForClient(clientId: string): (ClientAssignment & { member: OrgMember })[] {
  return mockClientAssignments
    .filter(ca => ca.client_id === clientId)
    .map(ca => {
      const member = mockOrgMembers.find(om => om.id === ca.org_member_id)!;
      return { ...ca, member };
    });
}

export function getContactsForClient(clientId: string): ClientContact[] {
  return mockClientContacts.filter(cc => cc.client_id === clientId);
}

export function getActivityForWorkspace(workspaceId: string, limit = 5): ActivityLogEntry[] {
  return mockActivityLog
    .filter(a => a.workspace_id === workspaceId)
    .slice(0, limit);
}
