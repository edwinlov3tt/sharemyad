-- ShareMyAd Schema: RLS Policies for new tables
-- Role-based access: Admin (all), AE/DCM (own market), Designer (org-wide), Client Contact (own client)

-- ─── Agencies ───────────────────────────────────────────────────────────────

CREATE POLICY "org_members_view_agency" ON agencies FOR SELECT TO authenticated
  USING (id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "authenticated_create_agency" ON agencies FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "admins_update_agency" ON agencies FOR UPDATE TO authenticated
  USING (id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── Markets ────────────────────────────────────────────────────────────────

CREATE POLICY "org_members_view_markets" ON markets FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "admins_manage_markets" ON markets FOR ALL TO authenticated
  USING (agency_id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── Clients ────────────────────────────────────────────────────────────────

-- Admins + designers see all clients in org; AE/DCM see clients in their markets
CREATE POLICY "view_clients" ON clients FOR SELECT TO authenticated
  USING (
    agency_id IN (
      SELECT agency_id FROM org_members WHERE user_id = auth.uid()
        AND (role IN ('admin', 'designer')
          OR id IN (SELECT org_member_id FROM market_members WHERE market_id = clients.market_id))
    )
    OR id IN (SELECT client_id FROM client_contacts WHERE user_id = auth.uid())
  );

-- Admins and market members (AE/DCM) can create clients in their markets
CREATE POLICY "create_clients" ON clients FOR INSERT TO authenticated
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM org_members WHERE user_id = auth.uid()
        AND (role = 'admin'
          OR (role IN ('ae', 'dcm') AND id IN (
            SELECT org_member_id FROM market_members WHERE market_id = clients.market_id)))
    )
  );

-- ─── Org Members ────────────────────────────────────────────────────────────

CREATE POLICY "org_members_view_colleagues" ON org_members FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "admins_manage_org_members" ON org_members FOR ALL TO authenticated
  USING (agency_id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Self-insert for first member (creating an org)
CREATE POLICY "self_insert_org_member" ON org_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ─── Market Members ─────────────────────────────────────────────────────────

CREATE POLICY "org_view_market_members" ON market_members FOR SELECT TO authenticated
  USING (market_id IN (SELECT id FROM markets WHERE agency_id IN (
    SELECT agency_id FROM org_members WHERE user_id = auth.uid())));

CREATE POLICY "admins_manage_market_members" ON market_members FOR ALL TO authenticated
  USING (market_id IN (SELECT id FROM markets WHERE agency_id IN (
    SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role = 'admin')));

-- ─── Client Contacts ────────────────────────────────────────────────────────

-- Contacts can see themselves
CREATE POLICY "contacts_view_self" ON client_contacts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Org members can see contacts for accessible clients
CREATE POLICY "org_view_contacts" ON client_contacts FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT c.id FROM clients c WHERE c.agency_id IN (
      SELECT agency_id FROM org_members WHERE user_id = auth.uid())));

-- AEs and DCMs can invite contacts for their clients
CREATE POLICY "members_invite_contacts" ON client_contacts FOR INSERT TO authenticated
  WITH CHECK (client_id IN (
    SELECT ca.client_id FROM client_assignments ca
    JOIN org_members om ON ca.org_member_id = om.id
    WHERE om.user_id = auth.uid())
    OR client_id IN (
      SELECT c.id FROM clients c WHERE c.agency_id IN (
        SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role = 'admin')));

-- ─── Client Assignments ─────────────────────────────────────────────────────

CREATE POLICY "org_view_assignments" ON client_assignments FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT c.id FROM clients c WHERE c.agency_id IN (
      SELECT agency_id FROM org_members WHERE user_id = auth.uid())));

CREATE POLICY "admins_manage_assignments" ON client_assignments FOR ALL TO authenticated
  USING (client_id IN (
    SELECT c.id FROM clients c WHERE c.agency_id IN (
      SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role = 'admin')));

-- ─── Activity Log ───────────────────────────────────────────────────────────

-- Admins see all activity
CREATE POLICY "admins_view_all_activity" ON activity_log FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Designers see all activity in their org
CREATE POLICY "designers_view_activity" ON activity_log FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role = 'designer'));

-- AE/DCM see activity for their market's clients
CREATE POLICY "market_members_view_activity" ON activity_log FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT c.id FROM clients c
    JOIN market_members mm ON mm.market_id = c.market_id
    JOIN org_members om ON mm.org_member_id = om.id
    WHERE om.user_id = auth.uid()));

-- Client contacts see activity for their client
CREATE POLICY "contacts_view_activity" ON activity_log FOR SELECT TO authenticated
  USING (client_id IN (SELECT client_id FROM client_contacts WHERE user_id = auth.uid()));

-- Org members can insert activity
CREATE POLICY "org_insert_activity" ON activity_log FOR INSERT TO authenticated
  WITH CHECK (
    agency_id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid())
    OR client_id IN (SELECT client_id FROM client_contacts WHERE user_id = auth.uid()));

-- ─── Design Set Assignments ─────────────────────────────────────────────────

CREATE POLICY "org_view_dsa" ON design_set_assignments FOR SELECT TO authenticated
  USING (design_set_id IN (
    SELECT ds.id FROM design_sets ds
    JOIN workspaces w ON w.id = ds.workspace_id
    WHERE w.agency_id IN (SELECT agency_id FROM org_members WHERE user_id = auth.uid())));

CREATE POLICY "members_manage_dsa" ON design_set_assignments FOR ALL TO authenticated
  USING (design_set_id IN (
    SELECT ds.id FROM design_sets ds
    JOIN workspaces w ON w.id = ds.workspace_id
    WHERE w.agency_id IN (
      SELECT agency_id FROM org_members WHERE user_id = auth.uid() AND role IN ('admin', 'dcm'))));
