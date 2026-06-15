import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';
import { requireAdminSession } from '@/lib/auth/session';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = requireAdminSession(req);
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const firmId = session.firm_id ?? '00000000-0000-0000-0000-000000000001';

  try {
    const leadId = params.id;

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select(`
        *,
        user:users!leads_user_id_fkey (
          id,
          full_name,
          email,
          phone
        ),
        assigned_advisor:users!leads_assigned_advisor_id_fkey (
          full_name,
          email
        )
      `)
      .eq('id', leadId)
      .eq('firm_id', firmId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const { data: documents, error: docsError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...lead,
        documents: documents || [],
      },
    });

  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
