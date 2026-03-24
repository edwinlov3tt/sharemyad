-- ShareMyAd Schema: Link workspaces to clients, approvals to client contacts

-- Add client_id to workspaces (each workspace belongs to a client)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_workspaces_client ON workspaces(client_id);

-- Add client_contact_id to approvals (links signature to the external reviewer)
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS client_contact_id UUID REFERENCES client_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_approvals_contact ON approvals(client_contact_id);
