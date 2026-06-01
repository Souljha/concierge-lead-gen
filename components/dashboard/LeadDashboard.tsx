'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  AlertCircle,
  Download,
  Trash2
} from 'lucide-react';
import { 
  LeadWithDocuments, 
  DocumentTemplate, 
  Document, 
  DocumentType,
  LEAD_STATUS_LABELS 
} from '@/types';
import {
  formatFileSize,
  validateFile,
  getDocumentStatusColor,
  getProgressBarColor,
  formatDate,
  cn
} from '@/lib/utils';
import ProgressTracker from '@/components/shared/ProgressTracker';

export default function LeadDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead');
  const token = searchParams.get('token');

  const [lead, setLead] = useState<LeadWithDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDocs, setUploadingDocs] = useState<Set<DocumentType>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (leadId && token) {
      loadLeadData();
    } else {
      setError('Invalid access link. Please check your email for the correct link.');
      setLoading(false);
    }
  }, [leadId, token]);

  const loadLeadData = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to load your information');
      }

      const data = await response.json();
      setLead(data.data);
    } catch (err) {
      setError('Unable to load your information. Please try again or contact support.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, documentType: DocumentType) => {
    if (!lead) return;

    setUploadingDocs(prev => new Set(prev).add(documentType));
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lead_id', lead.id);
      formData.append('document_type', documentType);
      formData.append('token', token || '');

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // Reload lead data to show updated documents
      await loadLeadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingDocs(prev => {
        const next = new Set(prev);
        next.delete(documentType);
        return next;
      });
    }
  };

  const handleRemove = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove this document?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}?token=${token}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove document');
      }

      await loadLeadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-center">
          <div className="spinner w-16 h-16 mx-auto mb-4"></div>
          <p className="text-navy-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-elegant p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">
            Access Error
          </h2>
          <p className="text-navy-600 mb-6">{error}</p>
          <a 
            href="mailto:support@yourfirm.com" 
            className="btn-primary inline-block"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const completedDocs = lead.documents.filter(d => d.status === 'approved').length;
  const totalRequiredDocs = lead.required_documents.filter(t => t.is_required).length;
  const isComplete = lead.progress_percentage === 100;

  return (
    <div className="min-h-screen bg-cream-100 bg-pattern-dots">
      {/* Header */}
      <header className="bg-white border-b border-navy-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-navy-900">
                Welcome, {lead.user.full_name}!
              </h1>
              <p className="text-navy-600 mt-1">
                Complete your profile to get started
              </p>
            </div>
            <div className="text-right">
              <span className={cn(
                'status-badge',
                getDocumentStatusColor(lead.status as any)
              )}>
                {LEAD_STATUS_LABELS[lead.status]}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slide-down">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Tracker */}
        <div className="mb-8 animate-fade-in">
          <ProgressTracker
            progress={lead.progress_percentage}
            completedDocs={completedDocs}
            totalDocs={totalRequiredDocs}
            status={lead.status}
          />
        </div>

        {/* Completion Message */}
        {isComplete && lead.status === 'documents_submitted' && (
          <div className="mb-8 p-6 bg-forest-50 border-2 border-forest-300 rounded-xl animate-scale-in">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-forest-600 mt-1 mr-4 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-serif font-semibold text-forest-900 mb-2">
                  All Documents Submitted! 🎉
                </h3>
                <p className="text-forest-700">
                  Your documents are now under review. We'll notify you via email once they've been verified. 
                  This typically takes 1-2 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-8 p-6 bg-white rounded-xl shadow-elegant border-l-4 border-gold-500 animate-slide-up">
          <h2 className="text-xl font-serif font-semibold text-navy-900 mb-3">
            📋 What You Need to Do
          </h2>
          <ul className="space-y-2 text-navy-700">
            <li className="flex items-start">
              <span className="text-gold-500 mr-2">1.</span>
              <span>Upload the required documents below (marked with a red asterisk *)</span>
            </li>
            <li className="flex items-start">
              <span className="text-gold-500 mr-2">2.</span>
              <span>Ensure all documents are clear and legible (PDF or image format)</span>
            </li>
            <li className="flex items-start">
              <span className="text-gold-500 mr-2">3.</span>
              <span>Once complete, we'll review your documents and be in touch</span>
            </li>
          </ul>
        </div>

        {/* Document Upload Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-bold text-navy-900">
            Required Documents
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {lead.required_documents
              .sort((a, b) => a.display_order - b.display_order)
              .map((template, index) => {
                const existingDoc = lead.documents.find(
                  d => d.document_type === template.document_type
                );
                const isUploading = uploadingDocs.has(template.document_type);

                return (
                  <div
                    key={template.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <DocumentCard
                      template={template}
                      document={existingDoc}
                      isUploading={isUploading}
                      onUpload={handleUpload}
                      onRemove={handleRemove}
                    />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow-elegant">
          <h3 className="text-lg font-serif font-semibold text-navy-900 mb-3">
            Need Help?
          </h3>
          <p className="text-navy-600 mb-4">
            If you're having trouble uploading documents or have questions about what's required, 
            we're here to help!
          </p>
          <a 
            href="mailto:support@yourfirm.com" 
            className="btn-outline inline-block"
          >
            Contact Support
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-navy-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-navy-600">
          <p>🔒 Your documents are encrypted and securely stored</p>
          <p className="mt-2">© 2024 Your Financial Advisory Firm. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// =====================================================
// DOCUMENT CARD COMPONENT
// =====================================================

interface DocumentCardProps {
  template: DocumentTemplate;
  document?: Document;
  isUploading: boolean;
  onUpload: (file: File, documentType: DocumentType) => Promise<void>;
  onRemove: (documentId: string) => Promise<void>;
}

function DocumentCard({ 
  template, 
  document, 
  isUploading, 
  onUpload, 
  onRemove 
}: DocumentCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    await onUpload(file, template.document_type);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    await onUpload(file, template.document_type);
  };

  const statusIcon = document ? (
    document.status === 'approved' ? (
      <CheckCircle className="w-5 h-5 text-forest-600" />
    ) : document.status === 'rejected' ? (
      <XCircle className="w-5 h-5 text-red-600" />
    ) : (
      <Clock className="w-5 h-5 text-gold-600" />
    )
  ) : null;

  return (
    <div className={cn(
      'document-card',
      isDragging && 'border-gold-500 bg-gold-50/30',
      document?.status === 'approved' && 'border-forest-300 bg-forest-50/20'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
            {template.display_name}
            {template.is_required && <span className="text-red-500">*</span>}
          </h3>
          <p className="text-sm text-navy-600 mt-1">{template.description}</p>
        </div>
        {statusIcon && <div className="ml-4">{statusIcon}</div>}
      </div>

      {/* Upload Zone or Document Info */}
      {!document && !isUploading && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="upload-zone"
        >
          <Upload className="w-8 h-8 text-navy-400 mx-auto mb-3" />
          <p className="text-sm text-navy-700 font-medium mb-1">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-navy-500">
            PDF, JPG, PNG up to 10MB
          </p>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
            id={`file-${template.document_type}`}
          />
          <label
            htmlFor={`file-${template.document_type}`}
            className="mt-4 btn-secondary inline-block cursor-pointer"
          >
            Choose File
          </label>
        </div>
      )}

      {isUploading && (
        <div className="text-center py-8">
          <div className="spinner w-8 h-8 mx-auto mb-3"></div>
          <p className="text-sm text-navy-600">Uploading...</p>
        </div>
      )}

      {document && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-lg">
            <FileText className="w-5 h-5 text-navy-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-900 truncate">
                {document.file_name}
              </p>
              <p className="text-xs text-navy-600">
                {formatFileSize(document.file_size)} • Uploaded {formatDate(document.uploaded_at, 'relative')}
              </p>
            </div>
          </div>

          <div className={cn(
            'p-3 rounded-lg text-sm',
            document.status === 'approved' && 'bg-forest-50 text-forest-800',
            document.status === 'rejected' && 'bg-red-50 text-red-800',
            document.status === 'uploaded' && 'bg-blue-50 text-blue-800'
          )}>
            {document.status === 'approved' && '✓ Verified and approved'}
            {document.status === 'rejected' && (
              <>
                <strong>⚠ Needs attention:</strong> {document.rejection_reason || 'Please re-upload'}
              </>
            )}
            {document.status === 'uploaded' && '👀 Under review'}
          </div>

          {document.status !== 'approved' && (
            <div className="flex gap-2">
              <label
                htmlFor={`reupload-${template.document_type}`}
                className="btn-ghost flex-1 cursor-pointer text-center"
              >
                Replace File
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
                id={`reupload-${template.document_type}`}
              />
              <button
                onClick={() => onRemove(document.id)}
                className="btn-ghost text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
