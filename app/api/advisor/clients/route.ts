import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // For now, get all approved leads
    // In production, filter by the logged-in advisor's ID
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select(`
        id,
        goal,
        status,
        approved_at,
        created_at,
        user:users!leads_user_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (leadsError) {
      console.error('Error fetching clients:', leadsError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    // Get documents for each lead
    const clientsWithDocs = await Promise.all(
      (leads || []).map(async (lead) => {
        const { data: docs } = await supabaseAdmin
          .from('documents')
          .select('id, document_type, file_name, status')
          .eq('lead_id', lead.id)
          .eq('status', 'approved');

        return {
          ...lead,
          documents: docs || [],
        };
      })
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: clientsWithDocs,
    });

  } catch (error) {
    console.error('Error in advisor clients endpoint:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
