'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Building2, User, Mail, Link2, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidEmail } from '@/lib/utils';

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    owner_name: '',
    owner_email: '',
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      name: value,
      slug: slugEdited ? prev.slug : toSlug(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setForm(prev => ({ ...prev, slug: toSlug(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Please enter your firm name'); return; }
    if (!form.slug.trim()) { setError('Please enter a firm URL'); return; }
    if (!form.owner_name.trim()) { setError('Please enter your full name'); return; }
    if (!isValidEmail(form.owner_email)) { setError('Please enter a valid email address'); return; }

    setLoading(true);

    try {
      const res = await fetch('/api/firms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug,
          owner_name: form.owner_name.trim(),
          owner_email: form.owner_email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Pass firm_id and email to pricing so payment can be linked
      router.push(
        `/pricing?firm_id=${data.data.firm_id}&email=${encodeURIComponent(form.owner_email)}`
      );
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-white to-cream-200">
      {/* Header */}
      <header className="bg-navy-900/95 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <Shield className="w-6 h-6 text-gold-400" />
            Ficavault
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-navy-200 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-navy-200 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-lg mx-auto px-4 py-16">
        {/* Page heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-navy-900 rounded-2xl mb-6">
            <Building2 className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-navy-900 mb-3">
            Set Up Your Vault
          </h1>
          <p className="text-navy-600 text-lg">
            Create your firm's FICA compliance portal in under a minute.
            Your 14-day free trial starts immediately.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-elegant-lg p-8 border-t-4 border-gold-500">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Firm name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-navy-700 mb-2">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Firm Name <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                className="input-elegant"
                placeholder="Smith Wealth Advisors"
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-navy-700 mb-2">
                <span className="flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Firm URL <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="flex items-center rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-navy-500 focus-within:border-transparent overflow-hidden">
                <span className="px-3 py-3 bg-gray-50 text-navy-500 text-sm border-r border-gray-200 whitespace-nowrap select-none">
                  ficavault.co.za/
                </span>
                <input
                  id="slug"
                  type="text"
                  required
                  value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  className="flex-1 px-3 py-3 text-sm text-navy-900 outline-none bg-white"
                  placeholder="smith-wealth-advisors"
                />
              </div>
              <p className="mt-1.5 text-xs text-navy-400">
                Lowercase letters, numbers and hyphens only.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-4">
                Your details (firm owner)
              </p>

              {/* Owner name */}
              <div className="mb-4">
                <label htmlFor="owner_name" className="block text-sm font-medium text-navy-700 mb-2">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Full Name <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  id="owner_name"
                  type="text"
                  required
                  value={form.owner_name}
                  onChange={e => setForm(prev => ({ ...prev, owner_name: e.target.value }))}
                  className="input-elegant"
                  placeholder="Jane Smith"
                />
              </div>

              {/* Owner email */}
              <div>
                <label htmlFor="owner_email" className="block text-sm font-medium text-navy-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Work Email <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  id="owner_email"
                  type="email"
                  required
                  value={form.owner_email}
                  onChange={e => setForm(prev => ({ ...prev, owner_email: e.target.value }))}
                  className="input-elegant"
                  placeholder="jane@smithwealth.co.za"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'btn-primary w-full flex items-center justify-center gap-2 mt-2',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating your vault…
                </>
              ) : (
                <>
                  Create Firm & Choose Plan
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-navy-500">
            By signing up you agree to our Terms of Service and Privacy Policy.
            No credit card required to start your trial.
          </p>
        </div>

        {/* Trust bullets */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: CheckCircle, label: '14-day free trial' },
            { icon: Shield, label: 'Bank-grade security' },
            { icon: CheckCircle, label: 'FICA compliant' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="w-5 h-5 text-gold-500" />
              <span className="text-xs text-navy-600">{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-navy-500">
          Already have an account?{' '}
          <Link href="/login" className="text-gold-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </main>

      <footer className="py-8 text-center text-xs text-navy-400">
        © 2026 Ficavault. All rights reserved. &nbsp;·&nbsp;{' '}
        <a href="mailto:support@ficavault.co.za" className="hover:underline">
          support@ficavault.co.za
        </a>
      </footer>
    </div>
  );
}
