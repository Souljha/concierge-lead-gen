'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Users,
  HardDrive,
  Mail,
  HeadphonesIcon,
  Palette,
  Calendar,
  BarChart3,
  Building2,
  Phone,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionPlan, BillingCycle } from '@/types';

interface PricingTier {
  name: string;
  plan: SubscriptionPlan;
  price: string;
  annualPrice: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  icon: React.ReactNode;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    plan: 'starter',
    price: '$99',
    annualPrice: '$990',
    description: 'Perfect for solo financial advisors or small practices',
    icon: <Zap className="w-6 h-6" />,
    ctaText: 'Start Free Trial',
    features: [
      'Up to 25 leads per month',
      '1 advisor user account',
      '2 admin users',
      '5GB document storage',
      'Email notifications',
      'Basic FICA compliance checks',
      'Standard support (48-hour response)',
    ],
  },
  {
    name: 'Professional',
    plan: 'professional',
    price: '$249',
    annualPrice: '$2,490',
    description: 'Ideal for growing advisory firms with 2-5 advisors',
    icon: <Star className="w-6 h-6" />,
    highlighted: true,
    ctaText: 'Start Free Trial',
    features: [
      'Up to 100 leads per month',
      '5 advisor users',
      'Unlimited admin users',
      '50GB document storage',
      'Custom email templates',
      'Advanced compliance tracking',
      'White-label branding',
      'Priority support (24-hour response)',
      'Calendar integration',
      'Basic analytics dashboard',
    ],
  },
  {
    name: 'Enterprise',
    plan: 'enterprise',
    price: 'Custom',
    annualPrice: 'Custom',
    description: 'For large advisory firms and wealth management companies',
    icon: <Building2 className="w-6 h-6" />,
    ctaText: 'Contact Sales',
    features: [
      'Unlimited leads',
      'Unlimited users',
      'Unlimited storage',
      'Custom document workflows',
      'API access',
      'CRM integrations (Salesforce, HubSpot)',
      'Dedicated account manager',
      'White-glove onboarding',
      'Custom compliance rules',
      'Advanced analytics & reporting',
      'SLA guarantee (99.9% uptime)',
      'Phone support',
    ],
  },
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [loading, setLoading] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [email, setEmail] = useState('');
  const [firmId, setFirmId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fromSignup, setFromSignup] = useState(false);

  useEffect(() => {
    const paramFirmId = searchParams.get('firm_id');
    const paramEmail = searchParams.get('email');
    if (paramFirmId) { setFirmId(paramFirmId); setFromSignup(true); }
    if (paramEmail) setEmail(decodeURIComponent(paramEmail));
  }, [searchParams]);

  const handleStartCheckout = (plan: SubscriptionPlan) => {
    if (plan === 'enterprise') {
      // Redirect to contact page for enterprise
      window.location.href = '/contact';
      return;
    }
    setSelectedPlan(plan);
    setShowEmailModal(true);
    setError('');
  };

  const handlePayment = async () => {
    if (!email || !selectedPlan) return;

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(selectedPlan);
    setError('');

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle,
          email,
          ...(firmId && { firm_id: firmId }),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Redirect to Paystack checkout
      window.location.href = data.data.authorization_url;
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-white">
      {/* Header */}
      <header className="bg-navy-900 text-white">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Shield className="w-6 h-6 text-gold-400" />
            Ficavault
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-navy-200 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/login" className="text-navy-200 hover:text-white transition-colors">
              Login
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-gold-500 text-navy-900 rounded-lg font-medium hover:bg-gold-400 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Post-signup success banner */}
        {fromSignup && (
          <div className="bg-green-50 border-b border-green-200">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3 text-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium">
                Your firm vault has been created — your 14-day free trial has started.
                Choose a plan below to activate your subscription.
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <span className="inline-block px-4 py-2 bg-gold-100 text-gold-800 rounded-full text-sm font-medium mb-6">
              Simple, Transparent Pricing
            </span>
            <h1 className="text-5xl font-serif font-bold text-navy-900 mb-6">
              Choose the Plan That's Right for Your Practice
            </h1>
            <p className="text-xl text-navy-600 mb-8">
              Start with a 14-day free trial. No credit card required.
              <br />
              Save up to 17% with annual billing.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1.5 bg-navy-100 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-6 py-2.5 rounded-lg font-medium transition-all',
                  billingCycle === 'monthly'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-600 hover:text-navy-900'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={cn(
                  'px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2',
                  billingCycle === 'annual'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-600 hover:text-navy-900'
                )}
              >
                Annual
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
            <p className="text-sm text-navy-500 mt-4">
              Billed in USD. South African advisors pay via Paystack — no foreign transaction fees.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={cn(
                    'relative bg-white rounded-2xl overflow-hidden transition-all',
                    tier.highlighted
                      ? 'ring-2 ring-gold-500 shadow-elegant-lg scale-105 z-10'
                      : 'border border-gray-200 shadow-elegant hover:shadow-elegant-lg'
                  )}
                >
                  {/* Most Popular Badge */}
                  {tier.highlighted && (
                    <div className="absolute top-0 left-0 right-0 bg-gold-500 text-navy-900 text-center py-2 text-sm font-semibold">
                      Most Popular
                    </div>
                  )}

                  <div className={cn('p-8', tier.highlighted && 'pt-14')}>
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        'p-2 rounded-lg',
                        tier.highlighted ? 'bg-gold-100 text-gold-700' : 'bg-navy-100 text-navy-700'
                      )}>
                        {tier.icon}
                      </div>
                      <h3 className="text-xl font-bold text-navy-900">{tier.name}</h3>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-navy-900">
                          {tier.price === 'Custom'
                            ? 'Custom'
                            : billingCycle === 'annual'
                              ? tier.price
                              : tier.price
                          }
                        </span>
                        {tier.price !== 'Custom' && (
                          <span className="text-navy-500">/month</span>
                        )}
                      </div>
                      {tier.price !== 'Custom' && billingCycle === 'annual' && (
                        <p className="text-sm text-navy-500 mt-1">
                          Billed {tier.annualPrice}/year (2 months free)
                        </p>
                      )}
                    </div>

                    <p className="text-navy-600 mb-6">{tier.description}</p>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleStartCheckout(tier.plan)}
                      disabled={loading === tier.plan}
                      className={cn(
                        'w-full py-3 rounded-lg font-medium text-center transition-colors mb-8 flex items-center justify-center gap-2',
                        tier.highlighted
                          ? 'bg-navy-900 text-gold-400 hover:bg-navy-800'
                          : 'bg-navy-100 text-navy-900 hover:bg-navy-200',
                        loading === tier.plan && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {loading === tier.plan ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        tier.ctaText
                      )}
                    </button>

                    {/* Features */}
                    <div className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-navy-700 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-navy-50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-navy-900 text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <FAQItem
                question="Can I switch plans later?"
                answer="Yes! You can upgrade or downgrade your plan at any time. If you upgrade, you'll be prorated for the remainder of your billing cycle. If you downgrade, the change will take effect at the start of your next billing cycle."
              />
              <FAQItem
                question="What happens if I exceed my lead limit?"
                answer="You'll be notified when you reach 80% of your monthly limit. If you exceed your limit, you can either upgrade to a higher plan or pay $5 per additional lead."
              />
              <FAQItem
                question="Is my data secure?"
                answer="Absolutely. We use bank-grade encryption (256-bit SSL) for all data in transit and at rest. All documents are stored securely in compliance with FICA and GDPR regulations."
              />
              <FAQItem
                question="Do you offer discounts for non-profits?"
                answer="Yes! We offer a 25% discount for registered non-profit organizations. Contact our sales team for more information."
              />
              <FAQItem
                question="What's included in the free trial?"
                answer="The 14-day free trial includes all Professional plan features so you can fully experience the platform. No credit card required to start."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-navy-900">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif font-bold text-white mb-6">
              Ready to Transform Your Client Onboarding?
            </h2>
            <p className="text-xl text-navy-200 mb-8">
              Join hundreds of financial advisors who have streamlined their practice with Ficavault.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-8 py-4 bg-gold-500 text-navy-900 rounded-lg font-semibold hover:bg-gold-400 transition-colors flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 border-2 border-navy-500 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
              >
                Schedule a Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 Ficavault. All rights reserved.</p>
        </div>
      </footer>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-elegant-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-navy-900 mb-2">
              Start Your Free Trial
            </h3>
            <p className="text-navy-600 mb-6">
              Enter your email to continue with the{' '}
              <span className="font-semibold">
                {selectedPlan?.charAt(0).toUpperCase()}{selectedPlan?.slice(1)}
              </span>{' '}
              plan ({billingCycle === 'annual' ? 'Annual' : 'Monthly'} billing)
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="checkout-email" className="block text-sm font-medium text-navy-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="checkout-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handlePayment()}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmail('');
                    setError('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!email || loading !== null}
                  className={cn(
                    'flex-1 py-3 bg-navy-900 text-white rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2',
                    (!email || loading !== null) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-navy-500">
                You'll be redirected to Paystack for secure payment processing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-navy-900">{question}</span>
        <span className={cn(
          'transform transition-transform',
          isOpen && 'rotate-180'
        )}>
          <svg className="w-5 h-5 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-navy-600">
          {answer}
        </div>
      )}
    </div>
  );
}
