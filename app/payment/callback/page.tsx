'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ArrowRight, Home } from 'lucide-react';

interface PaymentResult {
  status: 'success' | 'failed' | 'pending';
  reference?: string;
  plan?: string;
  billing_cycle?: string;
  amount?: number;
  error?: string;
}

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference') || searchParams.get('trxref');

      if (!reference) {
        setResult({ status: 'failed', error: 'No payment reference found' });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payments/verify?reference=${reference}`);
        const data = await response.json();

        if (data.success) {
          setResult({
            status: 'success',
            reference: data.data.reference,
            plan: data.data.plan,
            billing_cycle: data.data.billing_cycle,
            amount: data.data.amount,
          });
        } else {
          setResult({
            status: 'failed',
            error: data.error || 'Payment verification failed',
          });
        }
      } catch (error) {
        setResult({
          status: 'failed',
          error: 'Unable to verify payment. Please contact support.',
        });
      }

      setLoading(false);
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-gold-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  const formatPlanName = (plan?: string) => {
    if (!plan) return 'Unknown';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const formatBillingCycle = (cycle?: string) => {
    if (!cycle) return '';
    return cycle === 'annual' ? 'Annual' : 'Monthly';
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {result?.status === 'success' ? (
          <div className="bg-white rounded-2xl shadow-elegant-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-serif font-bold text-navy-900 mb-2">
              Payment Successful!
            </h1>

            <p className="text-navy-600 mb-6">
              Welcome to Ficavault! Your subscription is now active.
            </p>

            <div className="bg-navy-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-navy-600">Plan:</span>
                  <span className="font-semibold text-navy-900">
                    {formatPlanName(result.plan)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-600">Billing:</span>
                  <span className="font-semibold text-navy-900">
                    {formatBillingCycle(result.billing_cycle)}
                  </span>
                </div>
                {result.amount && (
                  <div className="flex justify-between">
                    <span className="text-navy-600">Amount:</span>
                    <span className="font-semibold text-navy-900">
                      {formatAmount(result.amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-navy-600">Reference:</span>
                  <span className="font-mono text-xs text-navy-700">
                    {result.reference?.slice(0, 20)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/admin/dashboard"
                className="w-full py-3 bg-navy-900 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-sm text-navy-500">
                A confirmation email has been sent to your inbox.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-elegant-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-3xl font-serif font-bold text-navy-900 mb-2">
              Payment Failed
            </h1>

            <p className="text-navy-600 mb-6">
              {result?.error || 'Something went wrong with your payment.'}
            </p>

            <div className="space-y-3">
              <Link
                href="/pricing"
                className="w-full py-3 bg-navy-900 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors"
              >
                Try Again
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/"
                className="w-full py-3 bg-navy-100 text-navy-900 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-navy-200 transition-colors"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>

              <p className="text-sm text-navy-500">
                Need help? Contact{' '}
                <a href="mailto:support@ficavault.co.za" className="text-gold-600 hover:underline">
                  support@ficavault.co.za
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
