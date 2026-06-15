import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { ApiResponse } from '@/types';
import { requireAdminSession } from '@/lib/auth/session';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(
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
    const { advisor_id } = await req.json();

    if (!advisor_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Advisor ID is required' },
        { status: 400 }
      );
    }

    // Get lead and user info (scoped to firm)
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select(`
        *,
        user:users!leads_user_id_fkey (
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

    // Get advisor info (must belong to same firm)
    const { data: advisor, error: advisorError } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('id', advisor_id)
      .eq('firm_id', firmId)
      .single();

    if (advisorError || !advisor) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Advisor not found' },
        { status: 404 }
      );
    }

    // Update lead status and assign advisor
    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        status: 'approved',
        assigned_advisor_id: advisor_id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to approve lead' },
        { status: 500 }
      );
    }

    // Create notification for advisor
    await supabaseAdmin.from('notifications').insert({
      user_id: advisor_id,
      firm_id: firmId,
      type: 'lead_assigned',
      title: 'New Client Assigned',
      message: `${lead.user.full_name} has been assigned to you.`,
      related_entity_type: 'lead',
      related_entity_id: leadId,
    });

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      action: 'lead_approved',
      entity_type: 'lead',
      entity_id: leadId,
      firm_id: firmId,
      metadata: {
        advisor_id,
        advisor_name: advisor.full_name,
      },
    });

    // Send notification email to advisor
    if (resend && process.env.RESEND_FROM_EMAIL) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: advisor.email,
          subject: 'New Client Assigned - Ready for Meeting',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1A2332;">New Client Assigned</h1>
              <p>A new client has been approved and assigned to you:</p>
              <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${lead.user.full_name}</p>
                <p><strong>Email:</strong> ${lead.user.email}</p>
                <p><strong>Goal:</strong> ${lead.goal}</p>
              </div>
              <p>All documents have been verified and the client is ready for an initial meeting.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/advisor/clients"
                 style="display: inline-block; padding: 14px 32px; background-color: #1A2332; color: #C9A227; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Client Details
              </a>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send advisor notification email:', emailError);
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Lead approved and assigned to advisor',
    });

  } catch (error) {
    console.error('Error approving lead:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
