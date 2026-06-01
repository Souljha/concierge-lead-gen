# Concierge Lead Generation System - Project Blueprint

## 🎯 Executive Summary

A three-tier financial advisory CRM system that transforms chaotic lead intake into organized, compliance-ready client onboarding.

### Problem Statement
Financial advisors waste 40% of their time on administrative tasks related to lead qualification, document collection, and FICA compliance verification.

### Solution
A "middle layer" application that:
- ✅ Captures leads with intelligent form routing
- ✅ Automates document collection based on client goals
- ✅ Provides admin verification workflow
- ✅ Delivers "silver platter" ready-to-meet clients to advisors

---

## 🏗️ System Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- React Dropzone (file uploads)

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL database)
- Supabase Storage (encrypted file storage)
- Supabase Auth (authentication)

**Security:**
- Row Level Security (RLS) in Supabase
- Encrypted file storage
- JWT-based authentication
- HTTPS-only communication
- Input sanitization

**External Services:**
- Resend/SendGrid (email notifications)
- jsPDF (PDF generation)
- Google Calendar API (optional - calendar sync)

---

## 📊 Database Schema

### Core Tables

#### 1. users
Stores all system users (admins, advisors, leads)
```sql
- id (uuid, PK)
- email (text, unique)
- full_name (text)
- role (enum: 'lead', 'admin', 'advisor')
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. leads
Lead profile and status tracking
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- goal (enum: 'retirement', 'investment', 'tax_planning', 'estate_planning', 'new_client')
- phone (text)
- status (enum: 'pending_documents', 'documents_submitted', 'under_review', 'approved', 'rejected')
- progress_percentage (integer, 0-100)
- assigned_advisor_id (uuid, FK -> users.id, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- meeting_scheduled_at (timestamp, nullable)
```

#### 3. documents
Individual document tracking
```sql
- id (uuid, PK)
- lead_id (uuid, FK -> leads.id)
- document_type (enum: 'id_copy', 'utility_bill', 'pension_statement', 'bank_statement', 'tax_return', 'investment_portfolio', 'other')
- file_name (text)
- file_path (text) - Supabase Storage path
- file_size (integer) - bytes
- mime_type (text)
- status (enum: 'pending', 'uploaded', 'reviewing', 'approved', 'rejected')
- uploaded_at (timestamp)
- reviewed_at (timestamp, nullable)
- reviewed_by (uuid, FK -> users.id, nullable)
- rejection_reason (text, nullable)
- is_required (boolean)
```

#### 4. document_templates
Dynamic document requirements based on goal
```sql
- id (uuid, PK)
- goal_type (enum: matching leads.goal)
- document_type (enum: matching documents.document_type)
- is_required (boolean)
- display_name (text)
- description (text)
- display_order (integer)
```

#### 5. notifications
System notification tracking
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- type (enum: 'document_uploaded', 'document_rejected', 'lead_approved', 'meeting_scheduled')
- title (text)
- message (text)
- read (boolean, default false)
- created_at (timestamp)
```

#### 6. audit_logs
Security and compliance audit trail
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- action (text) - e.g., 'document_upload', 'document_approval'
- entity_type (text) - e.g., 'document', 'lead'
- entity_id (uuid)
- metadata (jsonb)
- ip_address (text)
- created_at (timestamp)
```

---

## 🔄 User Flow Diagrams

### Flow 1: Lead Capture to Document Submission

```
┌─────────────────┐
│  LANDING PAGE   │
│  Lead enters:   │
│  - Name         │
│  - Email        │
│  - Goal         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SYSTEM ACTION  │
│  1. Create user │
│  2. Create lead │
│  3. Generate    │
│     secure link │
│  4. Send email  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LEAD RECEIVES  │
│  Secure email   │
│  with magic link│
│  to doc vault   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DOCUMENT VAULT  │
│ Shows required  │
│ docs based on   │
│ their goal:     │
│                 │
│ If Retirement:  │
│ ✓ ID Copy       │
│ ✓ Utility Bill  │
│ ✓ Pension Stmt  │
│                 │
│ If New Client:  │
│ ✓ ID Copy       │
│ ✓ Utility Bill  │
│ ✓ Bank Stmt     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LEAD UPLOADS    │
│ Drag & drop or  │
│ click to upload │
│ Progress: 33%   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ALL DOCS        │
│ UPLOADED        │
│ Status:         │
│ "Under Review"  │
└─────────────────┘
```

### Flow 2: Admin Review Workflow

```
┌─────────────────┐
│  ADMIN NOTIFIED │
│  Email: "New    │
│  docs from      │
│  John Smith"    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ADMIN DASHBOARD │
│ Shows pending   │
│ leads in queue  │
│                 │
│ John Smith      │
│ ├─ ID Copy ✓    │
│ ├─ Util Bill ✓  │
│ └─ Pension 🔍   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ADMIN REVIEWS   │
│ Each document:  │
│                 │
│ Decision:       │
│ ○ Approve       │
│ ○ Reject        │
└────────┬────────┘
         │
         ├─ If REJECT ──────┐
         │                  │
         │                  ▼
         │         ┌─────────────────┐
         │         │ SYSTEM SENDS    │
         │         │ Email to lead:  │
         │         │ "Please re-     │
         │         │  upload ID,     │
         │         │  image blurry"  │
         │         └─────────────────┘
         │
         └─ If ALL APPROVED
                   │
                   ▼
         ┌─────────────────┐
         │ LEAD STATUS:    │
         │ "APPROVED"      │
         │                 │
         │ Trigger:        │
         │ - Generate PDF  │
         │ - Notify Advisor│
         └─────────────────┘
```

### Flow 3: Advisor View (Silver Platter)

```
┌─────────────────┐
│ ADVISOR NOTIFIED│
│ Email: "New     │
│ client ready:   │
│ John Smith"     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ADVISOR PORTAL  │
│                 │
│ John Smith      │
│ Goal: Retirement│
│ Status: ✅ FICA │
│         Verified│
│                 │
│ [Download ZIP]  │
│ [View Profile]  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DOWNLOADS ZIP   │
│ Contains:       │
│ - Cover Sheet   │
│   (auto-gen)    │
│ - All docs      │
│ - Client info   │
│                 │
│ Meeting ready!  │
└─────────────────┘
```

---

## 🎨 UI/UX Design Principles

### Design Philosophy: "Bank-Grade Trust"

**Visual Language:**
- **Typography**: Sophisticated serif for headings (Crimson Pro), clean sans-serif for body (Outfit)
- **Color Palette**: 
  - Primary: Deep Navy (#1A2332)
  - Accent: Gold (#D4AF37) 
  - Success: Forest Green (#2D5A3D)
  - Background: Warm Cream (#FAF9F6)
- **Spacing**: Generous whitespace, 8px grid system
- **Motion**: Subtle, purposeful animations (page transitions, progress indicators)

### Key UI Components

1. **Progress Tracker**
   - Visual checklist with completion percentage
   - Real-time updates as documents upload
   - Color-coded status indicators

2. **Document Upload Zone**
   - Drag-and-drop with visual feedback
   - File type validation
   - Image preview for uploaded files
   - Progress bars for uploads

3. **Admin Review Interface**
   - Side-by-side document viewer
   - One-click approve/reject
   - Quick rejection reason templates
   - Bulk actions for efficiency

4. **Advisor Dashboard**
   - "At a glance" lead cards
   - FICA compliance badges
   - One-click document downloads
   - Meeting calendar integration

---

## 🔒 Security Implementation

### Data Encryption
- Files encrypted at rest in Supabase Storage
- TLS 1.3 for data in transit
- Encrypted database backups

### Access Control
- Row Level Security (RLS) policies on all tables
- Role-based access control (RBAC)
- JWT tokens with 1-hour expiration
- Magic link authentication (passwordless)

### Compliance
- GDPR-compliant data handling
- Audit logs for all document actions
- Data retention policies
- Right to deletion implementation

### File Upload Security
- File type validation (whitelist approach)
- File size limits (10MB per document)
- Virus scanning integration point
- Signed URLs for document access (1-hour expiry)

---

## 📧 Email Notification System

### Email Templates

1. **Lead Welcome Email**
   - Subject: "Welcome! Complete Your Profile with [Advisor Firm]"
   - Content: Magic link to document vault, what to expect
   
2. **Document Rejection Email**
   - Subject: "Action Required: Document Re-upload Needed"
   - Content: Specific rejection reasons, re-upload link

3. **Admin Alert Email**
   - Subject: "New Lead Documents Ready for Review"
   - Content: Lead name, goal, link to admin dashboard

4. **Advisor Notification Email**
   - Subject: "New Client Ready: [Lead Name]"
   - Content: Lead summary, FICA status, download link

---

## 📦 Deliverables Structure

```
concierge-lead-gen/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── magic-link/
│   ├── (lead)/
│   │   ├── upload/
│   │   └── thank-you/
│   ├── (admin)/
│   │   ├── dashboard/
│   │   └── review/[leadId]/
│   ├── (advisor)/
│   │   └── clients/
│   ├── api/
│   │   ├── leads/
│   │   ├── documents/
│   │   ├── auth/
│   │   └── notifications/
│   └── page.tsx (landing page)
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── upload/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── utils/
│   └── types/
├── public/
└── styles/
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Database schema setup
- ✅ Supabase configuration
- ✅ Authentication system
- ✅ Basic routing structure

### Phase 2: Lead Flow (Week 2)
- ✅ Landing page with lead capture
- ✅ Document vault interface
- ✅ File upload functionality
- ✅ Progress tracking

### Phase 3: Admin System (Week 3)
- ✅ Admin dashboard
- ✅ Document review interface
- ✅ Approval/rejection workflow
- ✅ Email notifications

### Phase 4: Advisor Portal (Week 4)
- ✅ Advisor dashboard
- ✅ Client list view
- ✅ Document download system
- ✅ PDF cover sheet generation

### Phase 5: Polish & Testing (Week 5)
- ✅ Security hardening
- ✅ Performance optimization
- ✅ Mobile responsive design
- ✅ User acceptance testing

---

## 📈 Success Metrics

- **Lead Conversion**: % of captured leads that complete document upload
- **Admin Efficiency**: Average time to review and approve a lead
- **Advisor Satisfaction**: Time saved vs. manual process
- **Document Quality**: % of documents accepted on first submission
- **System Uptime**: 99.9% availability target

---

## 🔮 Future Enhancements

1. **AI Document Validation**: Automatic ID/document verification
2. **CRM Integration**: Sync with Salesforce, HubSpot
3. **E-Signature**: Built-in DocuSign integration
4. **Multi-language Support**: Support for additional languages
5. **Mobile App**: Native iOS/Android applications
6. **Analytics Dashboard**: Business intelligence reporting
7. **Chatbot**: AI assistant for lead questions

---

## 📞 Support & Maintenance

**Monitoring:**
- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)
- Analytics (Plausible/PostHog)

**Backup Strategy:**
- Daily automated database backups
- Document storage replication
- Disaster recovery plan

**Update Cadence:**
- Security patches: Immediate
- Feature updates: Bi-weekly
- Major releases: Quarterly

---

*This blueprint provides the strategic foundation for building a production-ready Concierge Lead Generation system.*
