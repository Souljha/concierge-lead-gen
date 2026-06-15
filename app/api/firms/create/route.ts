import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, CreateFirmRequest } from '@/types';
import { isValidEmail } from '@/lib/utils';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function POST(req: NextRequest) {
  try {
    const body: CreateFirmRequest = await req.json();
    const { name, slug, owner_email, owner_name, plan = 'starter' } = body;

    if (!name || !slug || !owner_email || !owner_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'name, slug, owner_email, and owner_name are required' },
        { status: 400 }
      );
    }

    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    if (!isValidEmail(owner_email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Reject reserved slugs
    const RESERVED = ['default', 'admin', 'api', 'app', 'www', 'mail', 'ficavault'];
    if (RESERVED.includes(slug)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'That firm URL is reserved. Please choose another.' },
        { status: 400 }
      );
    }

    // Slug uniqueness check
    const { data: existingFirm } = await supabaseAdmin
      .from('firms')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingFirm) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'That firm URL is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // Create the firm (14-day trial starts automatically via DB default)
    const { data: firm, error: firmError } = await supabaseAdmin
      .from('firms')
      .insert({
        name,
        slug,
        owner_email,
        subscription_status: 'trial',
        subscription_plan: plan,
      })
      .select()
      .single();

    if (firmError || !firm) {
      console.error('Error creating firm:', firmError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create firm' },
        { status: 500 }
      );
    }

    // Create or link the owner user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, firm_id')
      .eq('email', owner_email)
      .maybeSingle();

    let userId: string;

    if (existingUser) {
      if (existingUser.firm_id && existingUser.firm_id !== firm.id) {
        // User already belongs to a different firm — roll back
        await supabaseAdmin.from('firms').delete().eq('id', firm.id);
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'This email is already associated with another firm' },
          { status: 409 }
        );
      }
      await supabaseAdmin
        .from('users')
        .update({ firm_id: firm.id, role: 'admin' })
        .eq('id', existingUser.id);
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email: owner_email,
          full_name: owner_name,
          role: 'admin',
          firm_id: firm.id,
        })
        .select('id')
        .single();

      if (userError || !newUser) {
        console.error('Error creating owner user:', userError);
        await supabaseAdmin.from('firms').delete().eq('id', firm.id);
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Failed to create owner account' },
          { status: 500 }
        );
      }
      userId = newUser.id;
    }

    await supabaseAdmin.from('audit_logs').insert({
      firm_id: firm.id,
      user_id: userId,
      action: 'firm_created',
      entity_type: 'firm',
      entity_id: firm.id,
      metadata: { name, slug, plan },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Firm created. Your 14-day trial has started.',
      data: {
        firm_id: firm.id,
        slug: firm.slug,
        trial_ends_at: firm.trial_ends_at,
      },
    });

  } catch (error) {
    console.error('Error creating firm:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
