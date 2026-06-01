import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const token = req.nextUrl.searchParams.get('token');

    if (!documentId || !token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing document ID or token' },
        { status: 400 }
      );
    }

    // Get the document with lead info
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        lead:leads!documents_lead_id_fkey (
          id,
          notes
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify token
    let storedToken = null;
    try {
      const notes = JSON.parse(document.lead?.notes || '{}');
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

    // Don't allow deletion of approved documents
    if (document.status === 'approved') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot delete approved documents' },
        { status: 400 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('lead-documents')
      .remove([document.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Document delete error:', deleteError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      action: 'document_deleted',
      entity_type: 'document',
      entity_id: documentId,
      metadata: {
        document_type: document.document_type,
        file_name: document.file_name,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
