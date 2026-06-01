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
    const documentId = params.id;

    // Get document info
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('file_path, file_name, mime_type')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Generate signed URL for temporary access
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('lead-documents')
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (urlError || !signedUrl) {
      console.error('Error generating signed URL:', urlError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to generate preview URL' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        url: signedUrl.signedUrl,
        file_name: document.file_name,
        mime_type: document.mime_type,
      },
    });

  } catch (error) {
    console.error('Error getting document preview:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
