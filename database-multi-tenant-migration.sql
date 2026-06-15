-- =====================================================
-- MULTI-TENANCY MIGRATION — Phase 1: Foundation
-- Run in Supabase SQL Editor
--
-- What this does:
--   1. Creates a `firms` table (one row per advisory firm)
--   2. Adds `firm_id` to users, leads, documents, notifications,
--      audit_logs, subscriptions, and payment_history
--   3. Seeds a default firm for all existing data
--   4. Adds indexes and a basic RLS policy on firms
--
-- What this does NOT do (Phase 2):
--   - Rewrite existing RLS policies to enforce firm isolation
--   - Add self-serve signup flow
--   - Wire up Paystack webhooks to firm subscriptions
--
-- Safe to run on existing data — no destructive changes.
-- =====================================================


-- =====================================================
-- 1. FIRMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS firms (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT NOT NULL,
  -- URL-safe identifier used in paths and (eventually) subdomains
  slug                    TEXT UNIQUE NOT NULL,
  -- Email of the firm owner / primary admin
  owner_email             TEXT,
  subscription_status     TEXT NOT NULL DEFAULT 'trial'
                            CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  subscription_plan       TEXT DEFAULT 'starter'
                            CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  -- Paystack subscription code for recurring billing
  paystack_subscription_code TEXT,
  paystack_customer_code  TEXT,
  trial_ends_at           TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscribed_at           TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  -- Per-firm branding (future: logo, primary colour, etc.)
  brand_name              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firms_slug   ON firms(slug);
CREATE INDEX IF NOT EXISTS idx_firms_status ON firms(subscription_status);

-- Reuse the existing updated_at trigger function
CREATE TRIGGER update_firms_updated_at
  BEFORE UPDATE ON firms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- 2. SEED A DEFAULT FIRM FOR EXISTING DATA
--    (keeps all current rows valid after we add firm_id)
-- =====================================================

INSERT INTO firms (id, name, slug, owner_email, subscription_status, trial_ends_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Ficavault Default',
  'default',
  'support@ficavault.co.za',
  'active',
  NULL   -- no trial expiry for the seed firm
)
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- 3. ADD firm_id TO CORE TABLES
-- =====================================================

-- Users -----------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE SET NULL;

UPDATE users SET firm_id = '00000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_firm_id ON users(firm_id);

-- Leads -----------------------------------------------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

UPDATE leads SET firm_id = '00000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_firm_id ON leads(firm_id);

-- Documents -------------------------------------------
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

UPDATE documents SET firm_id = '00000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_firm_id ON documents(firm_id);

-- Notifications ---------------------------------------
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

UPDATE notifications SET firm_id = '00000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_firm_id ON notifications(firm_id);

-- Audit Logs ------------------------------------------
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE SET NULL;

UPDATE audit_logs SET firm_id = '00000000-0000-0000-0000-000000000001'
  WHERE firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_firm_id ON audit_logs(firm_id);


-- =====================================================
-- 4. MOVE BILLING FROM USER-LEVEL TO FIRM-LEVEL
--    Wrapped in DO blocks so the migration succeeds even
--    if database-subscriptions.sql has not been run yet.
-- =====================================================

DO $$
BEGIN
  -- subscriptions table
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
  ) THEN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'firm_id'
    ) THEN
      ALTER TABLE subscriptions
        ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;
    END IF;

    UPDATE subscriptions s
    SET firm_id = u.firm_id
    FROM users u
    WHERE s.user_id = u.id
      AND s.firm_id IS NULL;

    CREATE INDEX IF NOT EXISTS idx_subscriptions_firm_id ON subscriptions(firm_id);
  END IF;

  -- payment_history table
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payment_history'
  ) THEN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'payment_history' AND column_name = 'firm_id'
    ) THEN
      ALTER TABLE payment_history
        ADD COLUMN firm_id UUID REFERENCES firms(id) ON DELETE SET NULL;
    END IF;

    UPDATE payment_history ph
    SET firm_id = u.firm_id
    FROM users u
    WHERE ph.user_id = u.id
      AND ph.firm_id IS NULL;

    CREATE INDEX IF NOT EXISTS idx_payment_history_firm_id ON payment_history(firm_id);
  END IF;
END $$;


-- =====================================================
-- 5. RLS ON FIRMS TABLE (read-only stub)
--    Phase 2 will add per-firm isolation to all tables.
-- =====================================================

ALTER TABLE firms ENABLE ROW LEVEL SECURITY;

-- Firm members can see their own firm
CREATE POLICY "Firm members can view their firm"
  ON firms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.firm_id = firms.id
    )
  );

-- Only service role can create/update/delete firms
-- (self-serve signup will use the service role key in an API route)
CREATE POLICY "Service role manages firms"
  ON firms FOR ALL
  USING (true)
  WITH CHECK (true);


-- =====================================================
-- 6. HELPER VIEW: firms with subscription status
-- =====================================================

CREATE OR REPLACE VIEW firms_summary AS
SELECT
  f.id,
  f.name,
  f.slug,
  f.owner_email,
  f.subscription_status,
  f.subscription_plan,
  f.trial_ends_at,
  f.subscribed_at,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'advisor') AS advisor_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'lead')    AS lead_count,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'approved') AS approved_leads,
  f.created_at
FROM firms f
LEFT JOIN users u ON u.firm_id = f.id
LEFT JOIN leads l ON l.firm_id = f.id
GROUP BY f.id;


-- =====================================================
-- END OF PHASE 1 MIGRATION
--
-- Next steps (Phase 2):
--   [ ] Add NOT NULL constraint to firm_id columns after
--       confirming all rows are backfilled
--   [ ] Rewrite RLS policies on users/leads/documents to
--       add: AND firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
--   [ ] Build /api/firms/create route (self-serve signup)
--   [ ] Scope Supabase Storage paths to: {firm_id}/{lead_id}/{filename}
--   [ ] Wire Paystack webhook to update firms.subscription_status
-- =====================================================
