// =====================================================
// TYPE DEFINITIONS
// =====================================================

export type UserRole = 'lead' | 'admin' | 'advisor';

export type LeadGoal = 
  | 'retirement' 
  | 'investment' 
  | 'tax_planning' 
  | 'estate_planning' 
  | 'new_client';

export type LeadStatus = 
  | 'pending_documents'
  | 'documents_submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected';

export type DocumentType = 
  | 'id_copy'
  | 'utility_bill'
  | 'pension_statement'
  | 'bank_statement'
  | 'tax_return'
  | 'investment_portfolio'
  | 'proof_of_address'
  | 'marriage_certificate'
  | 'other';

export type DocumentStatus = 
  | 'pending'
  | 'uploaded'
  | 'reviewing'
  | 'approved'
  | 'rejected';

export type NotificationType = 
  | 'document_uploaded'
  | 'document_rejected'
  | 'lead_approved'
  | 'meeting_scheduled'
  | 'lead_assigned';

// =====================================================
// DATABASE MODELS
// =====================================================

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  goal: LeadGoal;
  phone?: string;
  status: LeadStatus;
  progress_percentage: number;
  assigned_advisor_id?: string;
  notes?: string;
  meeting_scheduled_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  lead_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  uploaded_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: string;
  goal_type: LeadGoal;
  document_type: DocumentType;
  is_required: boolean;
  display_name: string;
  description?: string;
  display_order: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// =====================================================
// VIEW MODELS (Enriched data)
// =====================================================

export interface LeadSummary extends Lead {
  user: User;
  advisor?: User;
  total_documents: number;
  approved_documents: number;
  rejected_documents: number;
  pending_required_documents: number;
}

export interface LeadWithDocuments extends Lead {
  user: User;
  advisor?: User;
  documents: Document[];
  required_documents: DocumentTemplate[];
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadDocumentRequest {
  lead_id: string;
  document_type: DocumentType;
  file: File;
}

export interface ReviewDocumentRequest {
  document_id: string;
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

export interface CreateLeadRequest {
  email: string;
  full_name: string;
  phone?: string;
  goal: LeadGoal;
}

// =====================================================
// UI COMPONENT PROPS
// =====================================================

export interface DocumentCardProps {
  template: DocumentTemplate;
  document?: Document;
  onUpload: (file: File, documentType: DocumentType) => Promise<void>;
  onRemove?: (documentId: string) => Promise<void>;
  disabled?: boolean;
}

export interface ProgressTrackerProps {
  progress: number;
  status: LeadStatus;
  totalDocuments: number;
  completedDocuments: number;
}

export interface AdminDocumentReviewProps {
  document: Document;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface SelectOption {
  value: string;
  label: string;
}

export const LEAD_GOAL_OPTIONS: SelectOption[] = [
  { value: 'new_client', label: 'New Client Onboarding' },
  { value: 'retirement', label: 'Retirement Planning' },
  { value: 'investment', label: 'Investment Management' },
  { value: 'tax_planning', label: 'Tax Planning' },
  { value: 'estate_planning', label: 'Estate Planning' },
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  pending_documents: 'Pending Documents',
  documents_submitted: 'Documents Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id_copy: 'Photo ID',
  utility_bill: 'Proof of Address',
  pension_statement: 'Pension Statement',
  bank_statement: 'Bank Statement',
  tax_return: 'Tax Return',
  investment_portfolio: 'Investment Portfolio',
  proof_of_address: 'Proof of Address',
  marriage_certificate: 'Marriage Certificate',
  other: 'Other Document',
};

// =====================================================
// VALIDATION TYPES
// =====================================================

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// =====================================================
// SUBSCRIPTION & PAYMENT TYPES
// =====================================================

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'expired';
export type BillingCycle = 'monthly' | 'annual';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  paystack_customer_code?: string;
  paystack_subscription_code?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  paystack_reference: string;
  paid_at?: string;
  created_at: string;
}

export interface PlanPricing {
  plan: SubscriptionPlan;
  name: string;
  monthlyPrice: number; // in cents
  annualPrice: number; // in cents (full year)
  features: string[];
  limits: {
    leadsPerMonth: number;
    advisorUsers: number;
    adminUsers: number;
    storageGB: number;
  };
}

export const PLAN_PRICING: PlanPricing[] = [
  {
    plan: 'starter',
    name: 'Starter',
    monthlyPrice: 9900, // $99 in cents
    annualPrice: 99000, // $990 in cents
    features: [
      'Up to 25 leads per month',
      '1 advisor user account',
      '2 admin users',
      '5GB document storage',
      'Email notifications',
      'Basic FICA compliance checks',
      'Standard support (48-hour response)',
    ],
    limits: {
      leadsPerMonth: 25,
      advisorUsers: 1,
      adminUsers: 2,
      storageGB: 5,
    },
  },
  {
    plan: 'professional',
    name: 'Professional',
    monthlyPrice: 24900, // $249 in cents
    annualPrice: 249000, // $2,490 in cents
    features: [
      'Up to 100 leads per month',
      '5 advisor users',
      'Unlimited admin users',
      '50GB document storage',
      'Custom email templates',
      'Advanced compliance tracking',
      'White-label branding',
      'Priority support (24-hour response)',
      'Calendar integration',
      'Basic analytics dashboard',
    ],
    limits: {
      leadsPerMonth: 100,
      advisorUsers: 5,
      adminUsers: -1, // -1 means unlimited
      storageGB: 50,
    },
  },
  {
    plan: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0, // Custom pricing
    annualPrice: 0, // Custom pricing
    features: [
      'Unlimited leads',
      'Unlimited users',
      'Unlimited storage',
      'Custom document workflows',
      'API access',
      'CRM integrations (Salesforce, HubSpot)',
      'Dedicated account manager',
      'White-glove onboarding',
      'Custom compliance rules',
      'Advanced analytics & reporting',
      'SLA guarantee (99.9% uptime)',
      'Phone support',
    ],
    limits: {
      leadsPerMonth: -1,
      advisorUsers: -1,
      adminUsers: -1,
      storageGB: -1,
    },
  },
];

export interface InitializePaymentRequest {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  email: string;
  callbackUrl?: string;
}

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}
