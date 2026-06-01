import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: paystackData.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    const { data } = paystackData;

    // Check if payment was successful
    if (data.status !== 'success') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Payment ${data.status}`,
        data: {
          status: data.status,
          reference: data.reference,
        },
      });
    }

    // Update local transaction record
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'success',
        paid_at: data.paid_at,
        paystack_customer_code: data.customer.customer_code,
      })
      .eq('reference', reference);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        status: data.status,
        reference: data.reference,
        amount: data.amount,
        paid_at: data.paid_at,
        customer_email: data.customer.email,
        plan: data.metadata?.plan,
        billing_cycle: data.metadata?.billing_cycle,
      },
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
