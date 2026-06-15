import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';
import { requireAdminSession } from '@/lib/auth/session';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = requireAdminSession(req);
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const firmId = session.firm_id ?? '00000000-0000-0000-0000-000000000001';

  try {
    const status = req.nextUrl.searchParams.get('status');

    let query = supabaseAdmin
      .from('leads')
      .select(`
        id,
        goal,
        status,
        progress_percentage,
        created_at,
        user:users!leads_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // Get document counts for each lead
    const leadsWithDocs = await Promise.all(
      (leads || []).map(async (lead) => {
        const { data: docs } = await supabaseAdmin
          .from('documents')
          .select('status')
          .eq('lead_id', lead.id);

        const total_documents = docs?.length || 0;
        const approved_documents = docs?.filter(d => d.status === 'approved').length || 0;
        const pending_documents = docs?.filter(d => d.status === 'uploaded' || d.status === 'reviewing').length || 0;

        return {
          ...lead,
          total_documents,
          approved_documents,
          pending_documents,
        };
      })
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total_leads: leads?.length || 0,
      pending_review: leads?.filter(l => l.status === 'documents_submitted' || l.status === 'under_review').length || 0,
      approved: leads?.filter(l => l.status === 'approved').length || 0,
      this_month: leads?.filter(l => new Date(l.created_at) >= startOfMonth).length || 0,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        leads: leadsWithDocs,
        stats,
      },
    });

  } catch (error) {
    console.error('Error in admin leads endpoint:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
