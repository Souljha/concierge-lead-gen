-- =====================================================
-- PHASE 2: ENFORCE NOT NULL ON firm_id COLUMNS
-- Run LAST — only after:
--   1. database-multi-tenant-migration.sql ran successfully
--   2. database-phase2-rls.sql ran successfully
--   3. All three queries below return 0:
--
--   SELECT COUNT(*) FROM users WHERE firm_id IS NULL;
--   SELECT COUNT(*) FROM leads WHERE firm_id IS NULL;
--   SELECT COUNT(*) FROM documents WHERE firm_id IS NULL;
--   SELECT COUNT(*) FROM notifications WHERE firm_id IS NULL;
--
-- audit_logs.firm_id stays nullable — system events may occur
-- without a firm context (e.g. unauthenticated health checks).
-- =====================================================

ALTER TABLE users        ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE leads        ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE documents    ALTER COLUMN firm_id SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN firm_id SET NOT NULL;
