# 🏦 Concierge Lead Generation System

A professional, bank-grade lead management and document collection system for financial advisors. This application streamlines the client onboarding process by automating document collection, verification, and compliance checks.

## 🎯 Key Features

- **🔐 Secure Document Upload**: Bank-grade encryption for sensitive financial documents
- **📊 Progress Tracking**: Real-time progress indicators for leads
- **✅ Admin Verification**: Streamlined document review and approval workflow
- **👔 Advisor Portal**: "Silver platter" ready-to-meet client profiles
- **📧 Automated Notifications**: Email alerts for all stakeholders
- **🔒 FICA Compliance**: Built-in compliance checks and audit trails
- **📱 Responsive Design**: Works seamlessly on desktop and mobile

## 🏗️ Architecture

**Frontend:**
- Next.js 14 (App Router)
- React 18 with TypeScript
- Tailwind CSS (Custom design system)
- Framer Motion (Animations)

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Authentication + Storage)
- Row Level Security (RLS)

**Security:**
- Encrypted file storage
- JWT authentication
- Magic link passwordless auth
- Audit logging

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account (free tier works)
- An email service account (Resend or SendGrid)
- Git installed

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd concierge-lead-gen
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Set Up Supabase

#### 3.1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details and create

#### 3.2. Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the \`database-schema.sql\` file from this project
3. Copy and paste the entire content into the SQL editor
4. Click "Run"

This will create all tables, policies, and seed data.

#### 3.3. Set Up Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click "Create bucket"
3. Name it \`lead-documents\`
4. Make it **private** (not public)
5. Click "Save"

#### 3.4. Configure Storage Policies

In the SQL Editor, run:

\`\`\`sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Leads can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lead-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lead-documents' 
  AND auth.role() = 'authenticated'
);

-- Allow admins to delete documents
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lead-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
\`\`\`

### 4. Configure Environment Variables

Create a \`.env.local\` file in the root directory:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` with your credentials:

\`\`\`env
# Supabase (Get these from Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Service (Sign up at resend.com for free tier)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Optional: For production
ENCRYPTION_KEY=generate-32-char-random-string
\`\`\`

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📧 Email Setup

### Using Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their test domain)
3. Get your API key
4. Add to \`.env.local\`

### Using SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Update the email sending function in \`app/api/leads/create/route.ts\`

## 👥 Creating Admin and Advisor Accounts

After setting up, you'll need to create admin and advisor accounts:

### Option 1: Using Supabase Dashboard

1. Go to **Authentication > Users**
2. Click "Add user"
3. Enter email and password
4. Click "Create user"
5. Go to **Table Editor > users**
6. Find the new user
7. Change \`role\` to \`admin\` or \`advisor\`

### Option 2: Using SQL

\`\`\`sql
-- Create an admin user
INSERT INTO users (email, full_name, role)
VALUES ('admin@yourfirm.com', 'Admin User', 'admin');

-- Create an advisor
INSERT INTO users (email, full_name, role)
VALUES ('advisor@yourfirm.com', 'John Advisor', 'advisor');
\`\`\`

Then set up their auth credentials in Supabase Auth.

## 🧪 Testing the Application

### Test Lead Flow

1. Go to http://localhost:3000
2. Fill out the lead capture form
3. Check your terminal for the magic link (in development mode)
4. Copy the magic link and paste in browser
5. Upload test documents (use sample PDFs/images)
6. Verify the progress tracker updates

### Test Admin Flow

1. Create admin account (see above)
2. Build admin dashboard (create \`app/(admin)/dashboard/page.tsx\`)
3. Log in as admin
4. Review uploaded documents
5. Test approve/reject functionality

## 📁 Project Structure

\`\`\`
concierge-lead-gen/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (lead)/           # Lead-facing pages
│   │   └── upload/       # Document upload page
│   ├── (admin)/          # Admin dashboard
│   ├── (advisor)/        # Advisor portal
│   ├── api/              # API routes
│   │   ├── leads/        # Lead management
│   │   ├── documents/    # Document operations
│   │   └── auth/         # Authentication
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard components
│   ├── upload/           # Upload components
│   └── shared/           # Shared components
├── lib/
│   ├── supabase/         # Supabase client
│   └── utils/            # Utility functions
├── types/
│   └── index.ts          # TypeScript definitions
├── public/               # Static assets
├── database-schema.sql   # Database schema
└── PROJECT_BLUEPRINT.md  # Detailed architecture
\`\`\`

## 🎨 Customization

### Branding

1. Update colors in \`tailwind.config.js\`
2. Replace fonts in \`app/layout.tsx\`
3. Update company name and logo throughout
4. Modify email templates

### Document Requirements

Edit \`database-schema.sql\` to add/remove document types:

\`\`\`sql
INSERT INTO document_templates (goal_type, document_type, is_required, display_name, description, display_order)
VALUES ('new_client', 'your_new_doc_type', true, 'Your Document Name', 'Description here', 5);
\`\`\`

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables from \`.env.local\`
5. Deploy!

### Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import repository
4. Set build command: \`npm run build\`
5. Set publish directory: \`.next\`
6. Add environment variables
7. Deploy!

### Update Environment Variables

After deployment, update:

\`\`\`env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
\`\`\`

## 🔒 Security Checklist

- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS policies
- [ ] Implement rate limiting on API routes
- [ ] Add virus scanning for uploaded files
- [ ] Set up monitoring and error tracking
- [ ] Regular security audits
- [ ] Implement data backup strategy

## 📊 Monitoring & Analytics

### Recommended Tools

- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot
- **Analytics**: Plausible or PostHog
- **Performance**: Vercel Analytics

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Invalid API key"
- **Solution**: Double-check your Supabase keys in \`.env.local\`

**Issue**: "Cannot upload files"
- **Solution**: Verify storage bucket is created and policies are set

**Issue**: "Email not sending"
- **Solution**: Check Resend API key and from email domain verification

**Issue**: Database connection errors
- **Solution**: Ensure Supabase project is active and URL is correct

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature-name\`
3. Commit changes: \`git commit -am 'Add feature'\`
4. Push to branch: \`git push origin feature-name\`
5. Submit a Pull Request

## 📝 License

This project is proprietary and confidential.

## 💬 Support

For support, email support@yourfirm.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] AI-powered document verification
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] E-signature functionality
- [ ] Multi-language support
- [ ] Mobile native apps (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Chatbot for lead questions

## 👏 Acknowledgments

- Built with Next.js 14
- Powered by Supabase
- Styled with Tailwind CSS
- Icons by Lucide React

---

**Built with ❤️ for Financial Advisors**

For detailed architecture and implementation notes, see [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md)
