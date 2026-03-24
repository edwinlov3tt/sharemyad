-- ShareMyAd Schema: Markets
-- Markets are geographic/divisional groupings within an organization.
-- AEs and DCMs are assigned to markets; Designers are cross-market.

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, name)
);

ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_markets_agency ON markets(agency_id);
