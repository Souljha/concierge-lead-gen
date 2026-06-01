import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get subscription by user email or ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email && !userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email or userId is required' },
        { status: 400 }
      );
    }

    let userIdToQuery = userId;

    // If email provided, get user ID first
    if (email && !userId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!user) {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: null,
          message: 'No subscription found',
        });
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
      return NextResponse.json<ApiResponse>({
        success: true,
        data: null,
        message: 'No subscription found',
      });
    }

    // Check if subscription is expired
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const isExpired = periodEnd < now && subscription.status === 'active';

    if (isExpired) {
      // Update status to expired
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);

      subscription.status = 'expired';
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: subscription,
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
