-- =====================================================
-- PHASE 2: FIRM-ISOLATED RLS POLICIES
-- Run AFTER database-multi-tenant-migration.sql completes
-- and AFTER confirming firm_id is populated on all rows:
--
--   SELECT COUNT(*) FROM users WHERE firm_id IS NULL;
--   SELECT COUNT(*) FROM leads WHERE firm_id IS NULL;
--   SELECT COUNT(*) FROM documents WHERE firm_id IS NULL;
--
-- All three should return 0.
-- =====================================================


-- =====================================================
-- USERS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins and advisors can view all users" ON users;

-- Users can always see themselves
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admins and advisors can see all users within their firm only
CREATE POLICY "Staff can view users in same firm"
  ON users FOR SELECT
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('admin', 'advisor')
    )
  );


-- =====================================================
-- LEADS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Leads can view their own lead record" ON leads;
DROP POLICY IF EXISTS "Admins can manage all leads" ON leads;
DROP POLICY IF EXISTS "Advisors can view assigned leads" ON leads;

-- Leads can only see their own record
CREATE POLICY "Leads can view their own lead record"
  ON leads FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all leads within their firm
CREATE POLICY "Admins can manage leads in same firm"
  ON leads FOR ALL
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Advisors can view leads assigned to them, within their firm
CREATE POLICY "Advisors can view assigned leads in same firm"
  ON leads FOR SELECT
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    AND assigned_advisor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'advisor'
    )
  );


-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Leads can view their own documents" ON documents;
DROP POLICY IF EXISTS "Leads can upload documents" ON documents;
DROP POLICY IF EXISTS "Admins and assigned advisors can view documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;

-- Leads can view documents belonging to their own leads
CREATE POLICY "Leads can view their own documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = documents.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- Leads can upload to their own leads (firm_id must match their firm)
CREATE POLICY "Leads can upload documents"
  ON documents FOR INSERT
  WITH CHECK (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = documents.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- Admins and assigned advisors can view documents within their firm
CREATE POLICY "Staff can view documents in same firm"
  ON documents FOR SELECT
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      INNER JOIN leads l ON documents.lead_id = l.id
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'
          OR (u.role = 'advisor' AND l.assigned_advisor_id = u.id)
        )
    )
  );

-- Admins can fully manage documents within their firm
CREATE POLICY "Admins can manage documents in same firm"
  ON documents FOR ALL
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid()
    AND firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id = auth.uid()
    AND firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
  );


-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

CREATE POLICY "Admins can view audit logs in same firm"
  ON audit_logs FOR SELECT
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- =====================================================
-- END OF PHASE 2 RLS
-- Next: run database-phase2-not-null.sql
-- =====================================================
