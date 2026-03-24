-- ShareMyAd Schema: Activity Log + Design Set Assignments

-- Activity Log: comprehensive audit trail of all actions in the system.
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('org_member', 'client_contact', 'system')),
  actor_id UUID NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  metadata JSONB DEFAULT '{}',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_activity_log_agency ON activity_log(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_client ON activity_log(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_workspace ON activity_log(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON activity_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Design Set Assignments: tracks which designer is assigned to which design set.
-- Designers are org-wide but get specific work assignments.
CREATE TABLE IF NOT EXISTS design_set_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_set_id UUID NOT NULL REFERENCES design_sets(id) ON DELETE CASCADE,
  org_member_id UUID NOT NULL REFERENCES org_members(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES org_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(design_set_id, org_member_id)
);

ALTER TABLE design_set_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_dsa_design_set ON design_set_assignments(design_set_id);
CREATE INDEX IF NOT EXISTS idx_dsa_member ON design_set_assignments(org_member_id);
