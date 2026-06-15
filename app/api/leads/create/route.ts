import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { CreateLeadRequest, ApiResponse } from '@/types';
import { generateSecureToken, generateMagicLink, isValidEmail } from '@/lib/utils';

// Initialize Resend for email sending
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Initialize Supabase with service role (for admin operations)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Deployment-level firm: set NEXT_PUBLIC_FIRM_ID in Vercel env vars per firm deployment.
// Falls back to the seed default firm so single-firm deploys keep working.
const DEFAULT_FIRM_ID =
  process.env.NEXT_PUBLIC_FIRM_ID ?? '00000000-0000-0000-0000-000000000001';

export async function POST(req: NextRequest) {
  try {
    const body: CreateLeadRequest = await req.json();
    const { email, full_name, phone, goal, firm_id = DEFAULT_FIRM_ID } = body;

    // Validation
    if (!email || !full_name || !goal) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          full_name,
          phone,
          role: 'lead',
          firm_id,
        })
        .select()
        .single();

      if (userError || !newUser) {
        console.error('Error creating user:', userError);
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Failed to create user: ${userError?.message} (code: ${userError?.code})` },
          { status: 500 }
        );
      }

      userId = newUser.id;
    }

    // Create lead record
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert({
        user_id: userId,
        firm_id,
        goal,
        phone,
        status: 'pending_documents',
        progress_percentage: 0,
      })
      .select()
      .single();

    if (leadError || !lead) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create lead record' },
        { status: 500 }
      );
    }

    // Generate secure token for magic link
    const token = generateSecureToken();
    const magicLink = generateMagicLink(
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      token,
      lead.id
    );

    // Store token in database (you'd create a magic_links table for this)
    // For now, we'll use metadata in the lead record
    await supabaseAdmin
      .from('leads')
      .update({
        notes: JSON.stringify({ magic_token: token, token_created_at: new Date().toISOString() }),
      })
      .eq('id', lead.id);

    // Send email with magic link
    // This would integrate with Resend or your email service
    await sendWelcomeEmail({
      to: email,
      name: full_name,
      magicLink,
    });

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      firm_id,
      user_id: userId,
      action: 'lead_created',
      entity_type: 'lead',
      entity_id: lead.id,
      metadata: { goal, source: 'landing_page' },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Lead created successfully. Please check your email for the next steps.',
      data: { lead_id: lead.id },
    });

  } catch (error) {
    console.error('Error in lead creation:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// EMAIL SENDING FUNCTION
// =====================================================

async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  magicLink: string;
}) {
  const { to, name, magicLink } = params;

  // Always log for debugging
  console.log('='.repeat(80));
  console.log('WELCOME EMAIL');
  console.log('='.repeat(80));
  console.log(`To: ${to}`);
  console.log(`Name: ${name}`);
  console.log(`Magic Link: ${magicLink}`);
  console.log('='.repeat(80));

  // Send actual email if Resend is configured
  if (resend && process.env.RESEND_FROM_EMAIL) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to,
        subject: 'Welcome! Complete Your Profile - Secure Document Upload',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1A2332; margin-bottom: 10px;">Welcome, ${name}!</h1>
              <p style="color: #C9A227; font-size: 14px; margin: 0;">Your Financial Journey Begins Here</p>
            </div>

            <p style="color: #333; line-height: 1.6;">
              Thank you for choosing our financial advisory services. We're excited to help you achieve your financial goals.
            </p>

            <p style="color: #333; line-height: 1.6;">
              To continue, please upload your required documents using the secure link below:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background-color: #1A2332; color: #C9A227; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Access Your Document Vault
              </a>
            </div>

            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>This link is secure and unique to you.</strong> It will expire in 7 days.
              </p>
            </div>

            <p style="color: #333; line-height: 1.6;">
              If you have any questions, please don't hesitate to contact us.
            </p>

            <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;" />

            <p style="font-size: 12px; color: #666; text-align: center;">
              This email was sent because you started the onboarding process with us.
              If you didn't initiate this request, please ignore this email.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return false;
      }

      console.log('Email sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  return true;
}
