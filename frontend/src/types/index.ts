export type Category = 'display' | 'social' | 'video' | 'email' | 'ctv';

export type Status = 'pending' | 'changes_requested' | 'approved';

export type Permission = 'view' | 'download' | 'comment';

export interface Agency {
  id: string;
  name: string;
  logo_url: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  agency_id: string;
  client_id: string;
  name: string;
  logo_url: string;
  color: string;
  created_at: string;
}

export interface Folder {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
}

export interface DesignSet {
  id: string;
  folder_id: string | null;
  workspace_id: string;
  name: string;
  category: Category;
  format_label: string;
  status: Status;
  created_at: string;
  updated_at: string;
  versions?: Version[];
}

export interface Version {
  id: string;
  design_set_id: string;
  version_number: number;
  file_url: string;
  thumbnail_url: string;
  file_size: number;
  status: Status;
  reviewer_name: string;
  review_note: string;
  created_at: string;
}

export interface ShareLink {
  id: string;
  design_set_id: string | null;
  workspace_id: string;
  slug: string;
  password_hash: string;
  expires_at: string | null;
  max_views: number;
  view_count: number;
  permissions: Permission;
  is_active: boolean;
  created_at: string;
}

export interface Approval {
  id: string;
  version_id: string;
  client_contact_id: string | null;
  signer_name: string;
  signer_email: string;
  signature_data: string;
  approval_note: string;
  approved_at: string;
}

// Organization & Role Types

export type OrgRole = 'admin' | 'ae' | 'dcm' | 'designer';
export type ClientStatus = 'active' | 'inactive' | 'archived';
export type ContactStatus = 'invited' | 'active' | 'deactivated';

export interface Market {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  agency_id: string;
  market_id: string;
  name: string;
  website_url: string | null;
  logo_url: string | null;
  color: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
  // joined data
  market?: Market;
  workspace?: Workspace;
}

export interface OrgMember {
  id: string;
  agency_id: string;
  user_id: string;
  role: OrgRole;
  display_name: string;
  email: string;
  avatar_url: string | null;
  is_kam: boolean;
  created_at: string;
}

export interface MarketMember {
  id: string;
  market_id: string;
  org_member_id: string;
  created_at: string;
}

export interface ClientContact {
  id: string;
  client_id: string;
  user_id: string | null;
  name: string;
  email: string;
  title: string | null;
  is_primary: boolean;
  can_approve: boolean;
  status: ContactStatus;
  invited_at: string;
  last_login_at: string | null;
  created_at: string;
}

export interface ClientAssignment {
  id: string;
  client_id: string;
  org_member_id: string;
  assignment_role: 'ae' | 'dcm';
  is_primary: boolean;
  created_at: string;
}

export interface DesignSetAssignment {
  id: string;
  design_set_id: string;
  org_member_id: string;
  assigned_by: string;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  agency_id: string;
  actor_type: 'org_member' | 'client_contact' | 'system';
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  metadata: Record<string, unknown>;
  client_id: string | null;
  workspace_id: string | null;
  created_at: string;
}

export type LogoVariant = 'full' | 'icon' | 'wordmark' | 'monochrome';
export type LogoBackground = 'light' | 'dark' | 'transparent';
export type ColorGroup = 'primary' | 'secondary' | 'accent' | 'neutral';
export type FontUsage = 'headline' | 'body' | 'accent' | 'mono';
export type ImageCategory = 'photography' | 'illustration' | 'texture' | 'icon' | 'pattern';

export interface BrandKit {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandLogo {
  id: string;
  brand_kit_id: string;
  name: string;
  variant: LogoVariant;
  file_url: string;
  background_type: LogoBackground;
  file_format: string;
  sort_order: number;
  created_at: string;
}

export interface BrandColor {
  id: string;
  brand_kit_id: string;
  name: string;
  hex_value: string;
  rgb_value: string;
  cmyk_value: string;
  pantone_value: string;
  color_group: ColorGroup;
  sort_order: number;
  created_at: string;
}

export interface BrandFont {
  id: string;
  brand_kit_id: string;
  family_name: string;
  usage: FontUsage;
  weights: string;
  file_url: string;
  sample_text: string;
  license_info: string;
  sort_order: number;
  created_at: string;
}

export interface BrandImage {
  id: string;
  brand_kit_id: string;
  name: string;
  file_url: string;
  thumbnail_url: string;
  category: ImageCategory;
  tags: string;
  width: number;
  height: number;
  file_size: number;
  file_format: string;
  sort_order: number;
  created_at: string;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type FlightStatus = 'scheduled' | 'live' | 'paused' | 'completed' | 'ended';
export type FlightChannel = 'display' | 'social' | 'video' | 'email' | 'ctv' | 'ooh' | 'search';

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  start_date: string;
  end_date: string;
  budget_label: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignFlight {
  id: string;
  campaign_id: string;
  design_set_id: string | null;
  name: string;
  channel: FlightChannel;
  status: FlightStatus;
  start_date: string;
  end_date: string;
  spend_label: string;
  impressions_label: string;
  notes: string;
  sort_order: number;
  created_at: string;
}
