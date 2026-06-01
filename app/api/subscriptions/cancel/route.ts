import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const { userId, email, cancelImmediately = false } = await req.json();

    if (!userId && !email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    // Get user ID if only email provided
    let userIdToQuery = userId;
    if (email && !userId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!user) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      userIdToQuery = user.id;
    }

    // Get subscription
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userIdToQuery)
      .single();

    if (error || !subscription) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // If there's a Paystack subscription code, disable it on Paystack
    if (subscription.paystack_subscription_code) {
      try {
        const paystackResponse = await fetch(
          `https://api.paystack.co/subscription/disable`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: subscription.paystack_subscription_code,
              token: subscription.paystack_email_token,
            }),
          }
        );

        const paystackData = await paystackResponse.json();

        if (!paystackResponse.ok) {
          console.error('Paystack disable error:', paystackData);
        }
      } catch (paystackError) {
        console.error('Error disabling Paystack subscription:', paystackError);
      }
    }

    // Update subscription in database
    const updateData = cancelImmediately
      ? {
          status: 'cancelled',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        }
      : {
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        };

    await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: cancelImmediately
          ? 'Subscription cancelled immediately'
          : 'Subscription will be cancelled at the end of the billing period',
        cancelAtPeriodEnd: !cancelImmediately,
        periodEnd: subscription.current_period_end,
      },
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
