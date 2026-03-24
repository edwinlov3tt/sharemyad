-- ShareMyAd Schema: Market Members, Client Contacts, Client Assignments

-- Market Members: assigns AEs and DCMs to specific markets.
-- Designers are cross-market and do NOT appear here.
CREATE TABLE IF NOT EXISTS market_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  org_member_id UUID NOT NULL REFERENCES org_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(market_id, org_member_id)
);

ALTER TABLE market_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_market_members_market ON market_members(market_id);
CREATE INDEX IF NOT EXISTS idx_market_members_member ON market_members(org_member_id);

-- Client Contacts: external users (client-side) who review and approve creatives.
-- user_id is NULL until they accept an invite and create an account.
CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT,
  is_primary BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'deactivated')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, email)
);

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_user ON client_contacts(user_id);

-- Client Assignments: which AE/DCM is assigned to a specific client.
CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_member_id UUID NOT NULL REFERENCES org_members(id) ON DELETE CASCADE,
  assignment_role TEXT NOT NULL CHECK (assignment_role IN ('ae', 'dcm')),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, org_member_id)
);

ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_client_assignments_client ON client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_member ON client_assignments(org_member_id);
