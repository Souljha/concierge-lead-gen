-- =====================================================
-- CONCIERGE LEAD GENERATION DATABASE SCHEMA
-- PostgreSQL / Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('lead', 'admin', 'advisor');

CREATE TYPE lead_goal AS ENUM (
  'retirement', 
  'investment', 
  'tax_planning', 
  'estate_planning', 
  'new_client'
);

CREATE TYPE lead_status AS ENUM (
  'pending_documents',
  'documents_submitted', 
  'under_review', 
  'approved', 
  'rejected'
);

CREATE TYPE document_type AS ENUM (
  'id_copy',
  'utility_bill',
  'pension_statement',
  'bank_statement',
  'tax_return',
  'investment_portfolio',
  'proof_of_address',
  'marriage_certificate',
  'other'
);

CREATE TYPE document_status AS ENUM (
  'pending',
  'uploaded',
  'reviewing',
  'approved',
  'rejected'
);

CREATE TYPE notification_type AS ENUM (
  'document_uploaded',
  'document_rejected',
  'lead_approved',
  'meeting_scheduled',
  'lead_assigned'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (all system users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'lead',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Leads table (prospect information)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal lead_goal NOT NULL,
  phone TEXT,
  status lead_status DEFAULT 'pending_documents',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  assigned_advisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  meeting_scheduled_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_advisor_id ON leads(assigned_advisor_id);

-- Documents table (individual uploaded files)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status document_status DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_lead_id ON documents(lead_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(document_type);

-- Document Templates (requirements per goal type)
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_type lead_goal NOT NULL,
  document_type document_type NOT NULL,
  is_required BOOLEAN DEFAULT true,
  display_name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_type, document_type)
);

CREATE INDEX idx_doc_templates_goal ON document_templates(goal_type);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Audit Logs table (compliance & security)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- SEED DATA: Document Templates
-- =====================================================

-- Retirement Goal Documents
INSERT INTO document_templates (goal_type, document_type, is_required, display_name, description, display_order) VALUES
('retirement', 'id_copy', true, 'Photo ID', 'Valid government-issued ID (Passport, Driver''s License, National ID)', 1),
('retirement', 'utility_bill', true, 'Proof of Address', 'Recent utility bill or bank statement showing current address (within 3 months)', 2),
('retirement', 'pension_statement', true, 'Pension Statement', 'Latest pension/retirement account statement', 3),
('retirement', 'bank_statement', false, 'Bank Statement', 'Recent bank statement (optional but helpful)', 4);

-- Investment Goal Documents
INSERT INTO document_templates (goal_type, document_type, is_required, display_name, description, display_order) VALUES
('investment', 'id_copy', true, 'Photo ID', 'Valid government-issued ID', 1),
('investment', 'utility_bill', true, 'Proof of Address', 'Recent utility bill or bank statement (within 3 months)', 2),
('investment', 'investment_portfolio', false, 'Investment Portfolio', 'Current investment holdings summary', 3),
('investment', 'bank_statement', true, 'Bank Statement', 'Recent bank statement showing available funds', 4);

-- Tax Planning Goal Documents
INSERT INTO document_templates (goal_type, document_type, is_required, display_name, description, display_order) VALUES
('tax_planning', 'id_copy', true, 'Photo ID', 'Valid government-issued ID', 1),
('tax_planning', 'utility_bill', true, 'Proof of Address', 'Recent utility bill (within 3 months)', 2),
('tax_planning', 'tax_return', true, 'Tax Return', 'Most recent tax return document', 3),
('tax_planning', 'bank_statement', false, 'Bank Statement', 'Recent bank statement (optional)', 4);

-- Estate Planning Goal Documents
INSERT INTO document_templates (goal_type, document_type, is_required, display_name, description, display_order) VALUES
('estate_planning', 'id_copy', true, 'Photo ID', 'Valid government-issued ID', 1),
('estate_planning', 'utility_bill', true, 'Proof of Address', 'Recent utility bill (within 3 months)', 2),
('estate_planning', 'marriage_certificate', false, 'Marriage Certificate', 'If applicable', 3),
('estate_planning', 'investment_portfolio', false, 'Asset Summary', 'Summary of assets and investments', 4);

-- New Client Goal Documents
INSERT INTO document_templates (goal_type, document_type, is_required, display_name, description, display_order) VALUES
('new_client', 'id_copy', true, 'Photo ID', 'Valid government-issued ID (Required for FICA)', 1),
('new_client', 'utility_bill', true, 'Proof of Address', 'Recent utility bill or bank statement (Required for FICA)', 2),
('new_client', 'bank_statement', false, 'Bank Statement', 'Recent bank statement (helpful but optional)', 3);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate lead progress
CREATE OR REPLACE FUNCTION calculate_lead_progress(lead_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_required INTEGER;
  uploaded_count INTEGER;
  progress INTEGER;
BEGIN
  -- Get total required documents for this lead's goal
  SELECT COUNT(*)
  INTO total_required
  FROM document_templates dt
  INNER JOIN leads l ON l.id = lead_uuid
  WHERE dt.goal_type = l.goal AND dt.is_required = true;

  -- Get count of uploaded/approved documents
  SELECT COUNT(*)
  INTO uploaded_count
  FROM documents d
  WHERE d.lead_id = lead_uuid 
    AND d.is_required = true
    AND d.status IN ('uploaded', 'reviewing', 'approved');

  -- Calculate percentage
  IF total_required > 0 THEN
    progress := ROUND((uploaded_count::FLOAT / total_required::FLOAT) * 100);
  ELSE
    progress := 0;
  END IF;

  RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update lead progress when documents change
CREATE OR REPLACE FUNCTION update_lead_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET progress_percentage = calculate_lead_progress(NEW.lead_id)
  WHERE id = NEW.lead_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_change_update_progress
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_lead_progress();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins and advisors can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'advisor')
    )
  );

-- Leads policies
CREATE POLICY "Leads can view their own lead record"
  ON leads FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'advisor')
    )
  );

CREATE POLICY "Admins can manage all leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Advisors can view assigned leads"
  ON leads FOR SELECT
  USING (
    assigned_advisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Documents policies
CREATE POLICY "Leads can view their own documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = documents.lead_id
      AND leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Leads can upload documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = documents.lead_id
      AND leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and assigned advisors can view documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN leads l ON documents.lead_id = l.id
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'advisor' AND l.assigned_advisor_id = u.id)
      )
    )
  );

CREATE POLICY "Admins can manage all documents"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Document Templates policies (public read)
CREATE POLICY "Anyone can view document templates"
  ON document_templates FOR SELECT
  USING (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Audit Logs policies (admin only)
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- STORAGE BUCKETS (Supabase Storage)
-- =====================================================

-- Create storage bucket for documents
-- Run this in Supabase dashboard or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lead-documents', 'lead-documents', false);

-- Storage policies for lead-documents bucket
-- CREATE POLICY "Leads can upload their own documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'lead-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Authenticated users can view documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'lead-documents' AND auth.role() = 'authenticated');

-- =====================================================
-- VIEWS (Helpful queries)
-- =====================================================

-- View: Leads with document completion status
CREATE OR REPLACE VIEW leads_summary AS
SELECT 
  l.id,
  l.user_id,
  u.full_name,
  u.email,
  l.goal,
  l.status,
  l.progress_percentage,
  l.assigned_advisor_id,
  a.full_name as advisor_name,
  l.created_at,
  l.updated_at,
  COUNT(d.id) as total_documents,
  COUNT(CASE WHEN d.status = 'approved' THEN 1 END) as approved_documents,
  COUNT(CASE WHEN d.status = 'rejected' THEN 1 END) as rejected_documents,
  COUNT(CASE WHEN d.is_required AND d.status != 'approved' THEN 1 END) as pending_required_documents
FROM leads l
INNER JOIN users u ON l.user_id = u.id
LEFT JOIN users a ON l.assigned_advisor_id = a.id
LEFT JOIN documents d ON l.id = d.lead_id
GROUP BY l.id, u.full_name, u.email, a.full_name;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_documents_lead_status ON documents(lead_id, status);
CREATE INDEX idx_leads_status_advisor ON leads(status, assigned_advisor_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE users IS 'All system users: leads, admins, and advisors';
COMMENT ON TABLE leads IS 'Lead prospects and their onboarding status';
COMMENT ON TABLE documents IS 'Individual uploaded compliance documents';
COMMENT ON TABLE document_templates IS 'Required documents per goal type';
COMMENT ON TABLE notifications IS 'In-app notification system';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';

COMMENT ON COLUMN leads.progress_percentage IS 'Auto-calculated based on document completion';
COMMENT ON COLUMN documents.file_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN documents.is_required IS 'Whether document is mandatory for FICA compliance';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
