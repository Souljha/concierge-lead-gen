# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Concierge Lead Generation System - A three-tier financial advisory CRM that automates lead intake, document collection, and FICA compliance verification for financial advisors. Leads submit documents via a secure "document vault", admins review/approve documents, and advisors receive "silver platter" ready-to-meet client profiles.

## Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking without emit
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes with Supabase (PostgreSQL + Auth + Storage)
- **Auth**: Magic link passwordless authentication via Supabase Auth

### Route Groups (App Router)
The app uses Next.js route groups for role-based organization:
- `app/(auth)/` - Authentication pages (login, magic-link)
- `app/(lead)/` - Lead-facing pages (document upload portal)
- `app/(admin)/` - Admin dashboard (document review workflow)
- `app/(advisor)/` - Advisor portal (approved client profiles)
- `app/api/` - Backend API routes

### Key Data Flow
1. Lead submits form on landing page → `app/api/leads/create/route.ts` creates user + lead records
2. System emails magic link → Lead accesses document vault at `/upload`
3. Lead uploads documents → Stored in Supabase Storage bucket `lead-documents`
4. Admin reviews documents → Approves/rejects via admin dashboard
5. Approved lead → Advisor notified, can download client package

### Supabase Clients
- `lib/supabase/client.ts` exports:
  - `createClient()` - Browser-side client
  - `createServerClient()` - Server Components / API Routes
- API routes requiring admin access use service role key directly via `createClient('@supabase/supabase-js')`

### Type System
All TypeScript types are centralized in `types/index.ts`:
- Database models: `User`, `Lead`, `Document`, `DocumentTemplate`, `Notification`, `AuditLog`
- Enums: `UserRole`, `LeadGoal`, `LeadStatus`, `DocumentType`, `DocumentStatus`
- API types: `ApiResponse<T>`, request/response interfaces
- Constants: `ALLOWED_FILE_TYPES`, `MAX_FILE_SIZE` (10MB), label mappings

### Design System
Custom "bank-grade" design tokens in `tailwind.config.js`:
- Colors: `navy` (primary), `gold` (accent), `forest` (success), `cream` (background)
- Fonts: Outfit (sans), Crimson Pro (serif)
- Custom shadows: `elegant`, `elegant-lg`, `glow-gold`

### Utilities
`lib/utils/index.ts` provides:
- `cn()` - Tailwind class merging (clsx + tailwind-merge)
- `validateFile()` - File type/size validation
- `generateSecureToken()` / `generateMagicLink()` - Auth token generation
- Status color/icon helpers for leads and documents

## Environment Variables

Required for development (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY    # Server-only, admin operations
NEXT_PUBLIC_APP_URL          # App URL (http://localhost:3000 for dev)
RESEND_API_KEY               # Email service (optional in dev - logs to console)
```

## Database

Schema defined in `database-schema.sql`. Core tables:
- `users` - All users with role ('lead', 'admin', 'advisor')
- `leads` - Lead profiles with goal, status, progress tracking
- `documents` - Uploaded documents with review status
- `document_templates` - Dynamic document requirements per goal type
- `notifications` - System notifications
- `audit_logs` - Compliance audit trail

Supabase Storage bucket: `lead-documents` (private)

## What Needs Building

The following are stubbed but not yet implemented:
- Admin dashboard (`app/(admin)/dashboard/page.tsx`)
- Document review interface (`app/(admin)/review/[leadId]/page.tsx`)
- Advisor portal (`app/(advisor)/clients/page.tsx`)
- Document upload API (`app/api/documents/upload/route.ts`)
- Email templates with Resend integration
- PDF cover sheet generation (jsPDF is installed)
