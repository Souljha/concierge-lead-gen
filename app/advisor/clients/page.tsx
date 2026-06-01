'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  User,
  Mail,
  Phone,
  Target,
  Calendar,
  FileText,
  CheckCircle,
  Download,
  Eye,
  Clock,
  ChevronRight,
  Briefcase,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  goal: string;
  status: string;
  approved_at: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
    phone: string;
  };
  documents: {
    id: string;
    document_type: string;
    file_name: string;
    status: string;
  }[];
}

const GOAL_LABELS: Record<string, string> = {
  retirement: 'Retirement Planning',
  investment: 'Investment',
  tax_planning: 'Tax Planning',
  estate_planning: 'Estate Planning',
  new_client: 'New Client',
};

export default function AdvisorClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [downloadingClient, setDownloadingClient] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/advisor/clients');
      const data = await response.json();

      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocuments = async (clientId: string) => {
    setDownloadingClient(clientId);
    try {
      const response = await fetch(`/api/advisor/clients/${clientId}/download`);
      const data = await response.json();

      if (data.success && data.data.urls) {
        // Open each document in a new tab
        data.data.urls.forEach((url: string, index: number) => {
          setTimeout(() => window.open(url, '_blank'), index * 500);
        });
      }
    } catch (error) {
      console.error('Failed to download documents:', error);
    } finally {
      setDownloadingClient(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Advisor Portal</h1>
              <p className="text-navy-200 text-sm mt-1">Your approved clients ready for meetings</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg text-sm transition-colors"
              >
                Admin Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-red-700 rounded-lg text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-lg text-white">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-lg text-white">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ready for Meeting</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-lg text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => {
                    const approved = new Date(c.approved_at);
                    const now = new Date();
                    return approved.getMonth() === now.getMonth() &&
                           approved.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Clients Yet</h2>
            <p className="text-gray-500">
              Approved clients will appear here once assigned to you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Client Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-navy-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {client.user.full_name}
                        </h3>
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${client.user.email}`} className="hover:text-navy-600">
                        {client.user.email}
                      </a>
                    </div>
                    {client.user.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{client.user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>{GOAL_LABELS[client.goal] || client.goal}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Approved {new Date(client.approved_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Documents Summary */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Documents ({client.documents.length})
                    </span>
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      All Verified
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {client.documents.slice(0, 3).map((doc) => (
                      <span
                        key={doc.id}
                        className="px-2 py-1 bg-white text-xs text-gray-600 rounded border border-gray-200"
                      >
                        {doc.document_type.replace('_', ' ')}
                      </span>
                    ))}
                    {client.documents.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{client.documents.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="flex-1 px-4 py-2 bg-navy-900 text-white text-sm rounded-lg hover:bg-navy-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </button>
                    <button
                      onClick={() => handleDownloadDocuments(client.id)}
                      disabled={downloadingClient === client.id}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      {downloadingClient === client.id ? (
                        <div className="spinner w-4 h-4" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Client Profile</h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <span className="sr-only">Close</span>
                &times;
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
              {/* Client Info */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-navy-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedClient.user.full_name}
                    </h3>
                    <p className="text-gray-500">{selectedClient.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedClient.user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Goal</p>
                    <p className="font-medium">{GOAL_LABELS[selectedClient.goal]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted</p>
                    <p className="font-medium">
                      {new Date(selectedClient.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Approved</p>
                    <p className="font-medium">
                      {new Date(selectedClient.approved_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Verified Documents</h4>
                <div className="space-y-3">
                  {selectedClient.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {doc.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-500">{doc.file_name}</p>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <a
                href={`mailto:${selectedClient.user.email}`}
                className="flex-1 px-4 py-3 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors text-center font-medium"
              >
                Send Email
              </a>
              <button
                onClick={() => {
                  handleDownloadDocuments(selectedClient.id);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
