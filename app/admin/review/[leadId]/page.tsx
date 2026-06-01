'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Target,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadDetails {
  id: string;
  goal: string;
  status: string;
  progress_percentage: number;
  created_at: string;
  notes: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  documents: Document[];
  assigned_advisor?: {
    full_name: string;
    email: string;
  };
}

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: string;
  uploaded_at: string;
  rejection_reason?: string;
}

interface Advisor {
  id: string;
  full_name: string;
  email: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  uploaded: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
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

const GOAL_LABELS: Record<string, string> = {
  retirement: 'Retirement Planning',
  investment: 'Investment',
  tax_planning: 'Tax Planning',
  estate_planning: 'Estate Planning',
  new_client: 'New Client',
};

export default function ReviewLeadPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;

  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadLeadDetails();
    loadAdvisors();
  }, [leadId]);

  const loadLeadDetails = async () => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`);
      const data = await response.json();

      if (data.success) {
        setLead(data.data);
      }
    } catch (error) {
      console.error('Failed to load lead details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdvisors = async () => {
    try {
      const response = await fetch('/api/admin/advisors');
      const data = await response.json();

      if (data.success) {
        setAdvisors(data.data);
      }
    } catch (error) {
      console.error('Failed to load advisors:', error);
    }
  };

  const handleApproveDocument = async (documentId: string) => {
    setActionLoading(documentId);
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        await loadLeadDetails();
      }
    } catch (error) {
      console.error('Failed to approve document:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDocument = async (documentId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(documentId);
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        setRejectingDoc(null);
        setRejectionReason('');
        await loadLeadDetails();
      }
    } catch (error) {
      console.error('Failed to reject document:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveLead = async () => {
    if (!selectedAdvisor) {
      alert('Please select an advisor to assign');
      return;
    }

    setActionLoading('lead');
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisor_id: selectedAdvisor }),
      });

      if (response.ok) {
        await loadLeadDetails();
        alert('Lead approved and assigned to advisor!');
      }
    } catch (error) {
      console.error('Failed to approve lead:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreviewDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/preview`);
      const data = await response.json();

      if (data.success && data.data.url) {
        setPreviewUrl(data.data.url);
      }
    } catch (error) {
      console.error('Failed to get document preview:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Lead not found</p>
          <Link href="/admin/dashboard" className="mt-4 text-navy-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const allDocsApproved = lead.documents.length > 0 &&
    lead.documents.every(d => d.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="p-2 hover:bg-navy-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Review Lead</h1>
              <p className="text-navy-200 text-sm mt-1">{lead.user.full_name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{lead.user.full_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${lead.user.email}`} className="text-navy-600 hover:underline">
                    {lead.user.email}
                  </a>
                </div>
                {lead.user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{lead.user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{GOAL_LABELS[lead.goal] || lead.goal}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress</h2>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Document Completion</span>
                  <span className="font-medium text-gray-900">{lead.progress_percentage}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${lead.progress_percentage}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {lead.documents.filter(d => d.status === 'approved').length} of {lead.documents.length} documents approved
              </div>
            </div>

            {/* Approve Lead */}
            {allDocsApproved && lead.status !== 'approved' && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Ready for Approval
                </h2>
                <p className="text-green-700 text-sm mb-4">
                  All documents have been approved. Assign an advisor to complete the process.
                </p>
                <select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="w-full px-4 py-2 border border-green-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select an Advisor</option>
                  {advisors.map(advisor => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.full_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleApproveLead}
                  disabled={actionLoading === 'lead' || !selectedAdvisor}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'lead' ? (
                    <div className="spinner w-5 h-5" />
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      Approve & Assign
                    </>
                  )}
                </button>
              </div>
            )}

            {lead.status === 'approved' && lead.assigned_advisor && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Lead Approved
                </h2>
                <p className="text-green-700 text-sm">
                  Assigned to: <strong>{lead.assigned_advisor.full_name}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Documents ({lead.documents.length})
                </h2>
              </div>

              {lead.documents.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {lead.documents.map((doc) => (
                    <div key={doc.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <h3 className="font-medium text-gray-900">
                              {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                            </h3>
                            <span className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded-full',
                              STATUS_COLORS[doc.status]
                            )}>
                              {doc.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">{doc.file_name}</p>
                          <p className="text-xs text-gray-400">
                            Uploaded {new Date(doc.uploaded_at).toLocaleString()}
                          </p>

                          {doc.rejection_reason && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-700">
                                <strong>Rejection reason:</strong> {doc.rejection_reason}
                              </p>
                            </div>
                          )}

                          {rejectingDoc === doc.id && (
                            <div className="mt-4 space-y-3">
                              <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectDocument(doc.id)}
                                  disabled={actionLoading === doc.id}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                  {actionLoading === doc.id ? 'Rejecting...' : 'Confirm Reject'}
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingDoc(null);
                                    setRejectionReason('');
                                  }}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {doc.status !== 'approved' && rejectingDoc !== doc.id && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePreviewDocument(doc.id)}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                              title="Preview"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleApproveDocument(doc.id)}
                              disabled={actionLoading === doc.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                              title="Approve"
                            >
                              {actionLoading === doc.id ? (
                                <div className="spinner w-5 h-5" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => setRejectingDoc(doc.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}

                        {doc.status === 'approved' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Approved</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Document Preview</h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <iframe
                src={previewUrl}
                className="w-full h-[600px] border rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
