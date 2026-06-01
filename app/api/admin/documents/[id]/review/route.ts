import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const { action, reason } = await req.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get document info
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*, lead_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
    };

    if (action === 'reject') {
      updateData.rejection_reason = reason;
    }

    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update document' },
        { status: 500 }
      );
    }

    // If rejected, update lead status back to pending
    if (action === 'reject') {
      await supabaseAdmin
        .from('leads')
        .update({ status: 'pending_documents' })
        .eq('id', document.lead_id);
    } else {
      // Check if all documents are now approved
      const { data: allDocs } = await supabaseAdmin
        .from('documents')
        .select('status')
        .eq('lead_id', document.lead_id);

      const allApproved = allDocs?.every(d => d.status === 'approved');

      if (allApproved) {
        await supabaseAdmin
          .from('leads')
          .update({ status: 'under_review' })
          .eq('id', document.lead_id);
      }
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      action: action === 'approve' ? 'document_approved' : 'document_rejected',
      entity_type: 'document',
      entity_id: documentId,
      metadata: {
        document_type: document.document_type,
        rejection_reason: reason || null,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Document ${action}d successfully`,
    });

  } catch (error) {
    console.error('Error reviewing document:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
