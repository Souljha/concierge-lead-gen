import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('lead_id') as string;
    const documentType = formData.get('document_type') as string;
    const token = formData.get('token') as string;

    // Validation
    if (!file || !leadId || !documentType || !token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the lead and token
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('id, notes, goal, firm_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Verify token
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

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid file type. Please upload PDF, JPG, PNG, or WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Generate unique file path scoped to firm for isolation
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const firmPrefix = lead.firm_id ?? 'default';
    const filePath = `${firmPrefix}/${leadId}/${documentType}_${timestamp}_${sanitizedFileName}`;

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('lead-documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Check if there's an existing document of this type and delete it
    const { data: existingDocs } = await supabaseAdmin
      .from('documents')
      .select('id, file_path')
      .eq('lead_id', leadId)
      .eq('document_type', documentType);

    if (existingDocs && existingDocs.length > 0) {
      // Delete old files from storage and database
      for (const doc of existingDocs) {
        await supabaseAdmin.storage.from('lead-documents').remove([doc.file_path]);
        await supabaseAdmin.from('documents').delete().eq('id', doc.id);
      }
    }

    // Get template info to determine if required
    const { data: template } = await supabaseAdmin
      .from('document_templates')
      .select('is_required')
      .eq('goal_type', lead.goal)
      .eq('document_type', documentType)
      .single();

    // Create document record in database
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        lead_id: leadId,
        firm_id: lead.firm_id,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        status: 'uploaded',
        is_required: template?.is_required ?? true,
      })
      .select()
      .single();

    if (docError) {
      console.error('Document record error:', docError);
      // Try to clean up the uploaded file
      await supabaseAdmin.storage.from('lead-documents').remove([filePath]);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to save document record' },
        { status: 500 }
      );
    }

    // Update lead status if needed
    await supabaseAdmin
      .from('leads')
      .update({ status: 'documents_submitted' })
      .eq('id', leadId)
      .eq('status', 'pending_documents');

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      action: 'document_uploaded',
      entity_type: 'document',
      entity_id: document.id,
      metadata: {
        document_type: documentType,
        file_name: file.name,
        file_size: file.size
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
