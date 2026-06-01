import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const token = req.nextUrl.searchParams.get('token');

    if (!leadId || !token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing lead ID or token' },
        { status: 400 }
      );
    }

    // Get the lead with user info
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select(`
        *,
        user:users!leads_user_id_fkey (
          id,
          email,
          full_name,
          phone
        )
      `)
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('Lead fetch error:', leadError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Verify token matches
    let storedToken = null;
    try {
      const notes = JSON.parse(lead.notes || '{}');
      storedToken = notes.magic_token;
    } catch (e) {
      // Notes might not be valid JSON
    }

    if (storedToken !== token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid access token' },
        { status: 403 }
      );
    }

    // Get documents for this lead
    const { data: documents, error: docsError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('Documents fetch error:', docsError);
    }

    // Get required document templates for the lead's goal
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from('document_templates')
      .select('*')
      .eq('goal_type', lead.goal)
      .order('display_order', { ascending: true });

    if (templatesError) {
      console.error('Templates fetch error:', templatesError);
    }

    // Combine the data
    const responseData = {
      ...lead,
      documents: documents || [],
      required_documents: templates || [],
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
