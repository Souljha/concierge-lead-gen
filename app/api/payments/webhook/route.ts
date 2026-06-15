import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { SubscriptionPlan, BillingCycle } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

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

// =====================================================
// Resolve firm from a Paystack customer code.
// Checks the subscriptions table first (fastest path),
// then falls back to looking up the user by email.
// =====================================================
async function resolveFirmId(customerCode: string, email: string): Promise<string | null> {
  // Try subscriptions table — already has paystack_customer_code + firm_id
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('firm_id')
    .eq('paystack_customer_code', customerCode)
    .maybeSingle();
  if (sub?.firm_id) return sub.firm_id;

  // Fall back to the user record
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('firm_id')
    .eq('email', email)
    .maybeSingle();
  return user?.firm_id ?? null;
}

async function handleChargeSuccess(data: any) {
  const { reference, customer, metadata, amount, paid_at, authorization } = data;
  console.log('Processing successful charge:', reference);

  // Mark transaction as paid
  await supabaseAdmin
    .from('payment_transactions')
    .update({
      status: 'success',
      paid_at,
      paystack_customer_code: customer.customer_code,
      paystack_authorization_code: authorization?.authorization_code,
    })
    .eq('reference', reference);

  // Resolve or create the user
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id, firm_id')
    .eq('email', customer.email)
    .maybeSingle();

  let userId = existingUser?.id;
  let firmId = existingUser?.firm_id ?? null;

  if (!userId) {
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: customer.email,
        full_name: customer.email.split('@')[0],
        role: 'admin',
      })
      .select('id, firm_id')
      .single();

    if (error || !newUser) {
      console.error('Error creating user:', error);
      return;
    }
    userId = newUser.id;
    firmId = newUser.firm_id;
  }

  const plan = metadata?.plan as SubscriptionPlan;
  const billingCycle = metadata?.billing_cycle as BillingCycle;
  const startDate = new Date(paid_at);
  const endDate = new Date(paid_at);
  if (billingCycle === 'annual') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // Upsert the per-user subscription record
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingSub) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        plan,
        billing_cycle: billingCycle,
        status: 'active',
        firm_id: firmId,
        paystack_customer_code: customer.customer_code,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSub.id);
  } else {
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        firm_id: firmId,
        plan,
        billing_cycle: billingCycle,
        status: 'active',
        paystack_customer_code: customer.customer_code,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
      });
  }

  // Sync the firm's subscription status
  if (firmId) {
    await supabaseAdmin
      .from('firms')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        paystack_customer_code: customer.customer_code,
        subscribed_at: paid_at,
      })
      .eq('id', firmId);
  }

  // Record in payment history
  await supabaseAdmin.from('payment_history').insert({
    user_id: userId,
    firm_id: firmId,
    amount,
    currency: 'ZAR',
    status: 'success',
    paystack_reference: reference,
    plan,
    billing_cycle: billingCycle,
    paid_at,
  });

  console.log('Subscription activated for user:', userId, 'firm:', firmId);
}

async function handleSubscriptionCreate(data: any) {
  const { subscription_code, customer } = data;
  console.log('Subscription created:', subscription_code);

  // Update the subscription record with the recurring code
  await supabaseAdmin
    .from('subscriptions')
    .update({ paystack_subscription_code: subscription_code })
    .eq('paystack_customer_code', customer.customer_code);

  // Mirror onto the firm record
  const firmId = await resolveFirmId(customer.customer_code, customer.email);
  if (firmId) {
    await supabaseAdmin
      .from('firms')
      .update({ paystack_subscription_code: subscription_code })
      .eq('id', firmId);
  }
}

async function handleSubscriptionDisable(data: any) {
  const { subscription_code, customer } = data;
  console.log('Subscription disabled:', subscription_code);

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('paystack_subscription_code', subscription_code);

  const firmId = await resolveFirmId(customer?.customer_code ?? '', customer?.email ?? '');
  if (firmId) {
    await supabaseAdmin
      .from('firms')
      .update({
        subscription_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', firmId);
  }
}

async function handlePaymentFailed(data: any) {
  const { subscription, customer } = data;
  console.log('Payment failed for subscription:', subscription?.subscription_code);

  if (subscription?.subscription_code) {
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('paystack_subscription_code', subscription.subscription_code);
  }

  const firmId = await resolveFirmId(
    customer?.customer_code ?? '',
    customer?.email ?? ''
  );
  if (firmId) {
    await supabaseAdmin
      .from('firms')
      .update({ subscription_status: 'past_due' })
      .eq('id', firmId);
  }
}
