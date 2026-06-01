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
