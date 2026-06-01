import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, SubscriptionPlan, BillingCycle, PLAN_PRICING } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const { plan, billingCycle, email, metadata } = await req.json() as {
      plan: SubscriptionPlan;
      billingCycle: BillingCycle;
      email: string;
      metadata?: Record<string, any>;
    };

    // Validate required fields
    if (!plan || !billingCycle || !email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Plan, billing cycle, and email are required' },
        { status: 400 }
      );
    }

    // Enterprise plan requires custom pricing - redirect to contact
    if (plan === 'enterprise') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Enterprise plan requires custom pricing. Please contact sales.' },
        { status: 400 }
      );
    }

    // Get plan pricing
    const planData = PLAN_PRICING.find(p => p.plan === plan);
    if (!planData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Calculate amount based on billing cycle (Paystack expects amount in kobo/cents)
    const amount = billingCycle === 'annual' ? planData.annualPrice : planData.monthlyPrice;

    // Generate unique reference
    const reference = `concierge_${plan}_${billingCycle}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Build callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${appUrl}/payment/callback`;

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount, // Amount in kobo (smallest currency unit)
        reference,
        callback_url: callbackUrl,
        metadata: {
          plan,
          billing_cycle: billingCycle,
          plan_name: planData.name,
          ...metadata,
        },
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization error:', paystackData);
      return NextResponse.json<ApiResponse>(
        { success: false, error: paystackData.message || 'Failed to initialize payment' },
        { status: 500 }
      );
    }

    // Store pending transaction in database
    const { error: dbError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        reference,
        email,
        amount,
        currency: 'ZAR',
        plan,
        billing_cycle: billingCycle,
        status: 'pending',
        paystack_access_code: paystackData.data.access_code,
      });

    if (dbError) {
      console.error('Database error storing transaction:', dbError);
      // Continue anyway - we can still process the payment
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference,
      },
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
