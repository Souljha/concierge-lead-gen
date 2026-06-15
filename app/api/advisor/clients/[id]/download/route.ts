import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';
import { getSessionFromRequest } from '@/lib/auth/session';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'advisor' && session.role !== 'admin')) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const firmId = session.firm_id ?? '00000000-0000-0000-0000-000000000001';

  try {
    const leadId = params.id;

    // Verify the lead belongs to this firm and is assigned to this advisor (if advisor role)
    const leadQuery = supabaseAdmin
      .from('leads')
      .select('id, assigned_advisor_id, firm_id')
      .eq('id', leadId)
      .eq('firm_id', firmId)
      .eq('status', 'approved')
      .single();

    const { data: lead, error: leadError } = await leadQuery;

    if (leadError || !lead) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Advisors can only download their own assigned clients
    if (session.role === 'advisor' && lead.assigned_advisor_id !== session.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all approved documents for this lead
    const { data: documents, error: docsError } = await supabaseAdmin
      .from('documents')
      .select('file_path, file_name')
      .eq('lead_id', leadId)
      .eq('status', 'approved');

    if (docsError || !documents || documents.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No documents found' },
        { status: 404 }
      );
    }

    // Generate signed URLs for all documents
    const urls = await Promise.all(
      documents.map(async (doc) => {
        const { data } = await supabaseAdmin.storage
          .from('lead-documents')
          .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

        return data?.signedUrl;
      })
    );

    const validUrls = urls.filter(Boolean);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        urls: validUrls,
        count: validUrls.length,
      },
    });

  } catch (error) {
    console.error('Error downloading documents:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
