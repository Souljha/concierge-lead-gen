import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { SubscriptionPlan, BillingCycle } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

// Verify Paystack webhook signature
function verifyPaystackSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (!signature || !verifyPaystackSignature(payload, signature)) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);

    console.log('Paystack webhook event:', event.event);

    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;

      case 'subscription.create':
        await handleSubscriptionCreate(event.data);
        break;

      case 'subscription.disable':
        await handleSubscriptionDisable(event.data);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data);
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleChargeSuccess(data: any) {
  const { reference, customer, metadata, amount, paid_at, authorization } = data;

  console.log('Processing successful charge:', reference);

  // Update transaction status
  await supabaseAdmin
    .from('payment_transactions')
    .update({
      status: 'success',
      paid_at,
      paystack_customer_code: customer.customer_code,
      paystack_authorization_code: authorization?.authorization_code,
    })
    .eq('reference', reference);

  // Get or create user by email
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', customer.email)
    .single();

  let userId = existingUser?.id;

  if (!userId) {
    // Create user if doesn't exist
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: customer.email,
        full_name: customer.email.split('@')[0],
        role: 'admin', // Paying customers are admins
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return;
    }
    userId = newUser.id;
  }

  // Calculate subscription period
  const plan = metadata?.plan as SubscriptionPlan;
  const billingCycle = metadata?.billing_cycle as BillingCycle;

  const startDate = new Date(paid_at);
  const endDate = new Date(paid_at);

  if (billingCycle === 'annual') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // Create or update subscription
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingSub) {
    // Update existing subscription
    await supabaseAdmin
      .from('subscriptions')
      .update({
        plan,
        billing_cycle: billingCycle,
        status: 'active',
        paystack_customer_code: customer.customer_code,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSub.id);
  } else {
    // Create new subscription
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan,
        billing_cycle: billingCycle,
        status: 'active',
        paystack_customer_code: customer.customer_code,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
      });
  }

  // Record payment in history
  await supabaseAdmin
    .from('payment_history')
    .insert({
      user_id: userId,
      amount,
      currency: 'ZAR',
      status: 'success',
      paystack_reference: reference,
      plan,
      billing_cycle: billingCycle,
      paid_at,
    });

  console.log('Subscription activated for user:', userId);
}

async function handleSubscriptionCreate(data: any) {
  const { subscription_code, customer, plan } = data;

  console.log('Subscription created:', subscription_code);

  // Update user's subscription with Paystack subscription code
  await supabaseAdmin
    .from('subscriptions')
    .update({
      paystack_subscription_code: subscription_code,
    })
    .eq('paystack_customer_code', customer.customer_code);
}

async function handleSubscriptionDisable(data: any) {
  const { subscription_code } = data;

  console.log('Subscription disabled:', subscription_code);

  // Mark subscription as cancelled
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('paystack_subscription_code', subscription_code);
}

async function handlePaymentFailed(data: any) {
  const { subscription, customer } = data;

  console.log('Payment failed for subscription:', subscription?.subscription_code);

  // Update subscription status to past_due
  if (subscription?.subscription_code) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('paystack_subscription_code', subscription.subscription_code);
  }
}
