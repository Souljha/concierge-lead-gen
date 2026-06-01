'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  Eye,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadSummary {
  id: string;
  user: {
    full_name: string;
    email: string;
  };
  goal: string;
  status: string;
  progress_percentage: number;
  created_at: string;
  total_documents: number;
  approved_documents: number;
  pending_documents: number;
}

interface DashboardStats {
  total_leads: number;
  pending_review: number;
  approved: number;
  this_month: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending_documents: 'bg-yellow-100 text-yellow-800',
  documents_submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending_documents: 'Pending Documents',
  documents_submitted: 'Documents Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const GOAL_LABELS: Record<string, string> = {
  retirement: 'Retirement Planning',
  investment: 'Investment',
  tax_planning: 'Tax Planning',
  estate_planning: 'Estate Planning',
  new_client: 'New Client',
};

export default function AdminDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  useEffect(() => {
    loadDashboardData();
  }, [filter]);

  const loadDashboardData = async () => {
    try {
      const url = filter === 'all'
        ? '/api/admin/leads'
        : `/api/admin/leads?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setLeads(data.data.leads);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.user.full_name.toLowerCase().includes(searchLower) ||
      lead.user.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-navy-200 text-sm mt-1">Manage leads and review documents</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/advisor/clients"
                className="px-4 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg text-sm transition-colors"
              >
                Advisor Portal
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Leads"
            value={stats?.total_leads || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label="Pending Review"
            value={stats?.pending_review || 0}
            color="bg-yellow-500"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Approved"
            value={stats?.approved || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="This Month"
            value={stats?.this_month || 0}
            color="bg-purple-500"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending_documents">Pending Documents</option>
                <option value="documents_submitted">Documents Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Leads ({filteredLeads.length})
            </h2>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No leads found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Goal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {GOAL_LABELS[lead.goal] || lead.goal}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-800'
                        )}>
                          {STATUS_LABELS[lead.status] || lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${lead.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {lead.progress_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          <span className="text-green-600">{lead.approved_documents}</span>
                          {' / '}
                          <span>{lead.total_documents}</span>
                          {lead.pending_documents > 0 && (
                            <span className="ml-2 text-yellow-600">
                              ({lead.pending_documents} pending)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/admin/review/${lead.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-900 text-white text-sm rounded-lg hover:bg-navy-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-lg text-white', color)}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
