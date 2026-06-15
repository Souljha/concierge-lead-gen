-- =====================================================
-- PATCH: Add firm_id to subscriptions + payment_history
-- Run this if database-subscriptions.sql was created
-- AFTER the multi-tenant migration ran (so the migration
-- skipped these tables and they're missing firm_id).
-- =====================================================

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

ALTER TABLE payment_history
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE SET NULL;

-- Backfill from the owner user's firm
UPDATE subscriptions s
SET firm_id = u.firm_id
FROM users u
WHERE s.user_id = u.id
  AND s.firm_id IS NULL;

UPDATE payment_history ph
SET firm_id = u.firm_id
FROM users u
WHERE ph.user_id = u.id
  AND ph.firm_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_firm_id ON subscriptions(firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_firm_id ON payment_history(firm_id);
