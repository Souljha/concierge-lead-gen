'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, FileCheck, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { LeadGoal, LEAD_GOAL_OPTIONS } from '@/types';
import { isValidEmail, isValidPhone, cn } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    goal: 'new_client' as LeadGoal,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.full_name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.phone && !isValidPhone(formData.phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      // Redirect to thank you page
      router.push(`/thank-you?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-white to-cream-200">
      {/* Navigation Header */}
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
              Staff Login
            </Link>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gold-500 text-navy-900 rounded-lg font-medium hover:bg-gold-400 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Hero Content */}
            <div className="animate-fade-in">
              <div className="inline-block px-4 py-2 bg-gold-100 rounded-full text-gold-800 text-sm font-medium mb-6">
                ✨ Secure & Professional Onboarding
              </div>
              
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-navy-900 mb-6 leading-tight">
                Welcome to Your
                <span className="text-gradient-gold block">Financial Journey</span>
              </h1>
              
              <p className="text-xl text-navy-600 mb-8 leading-relaxed">
                Get started with our streamlined onboarding process. Upload your documents 
                securely, and we'll take care of the rest.
              </p>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-gold-400" />
                  </div>
                  <p className="text-sm font-medium text-navy-900">Bank-Grade</p>
                  <p className="text-xs text-navy-600">Security</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-gold-400" />
                  </div>
                  <p className="text-sm font-medium text-navy-900">1-2 Days</p>
                  <p className="text-xs text-navy-600">Processing</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileCheck className="w-6 h-6 text-gold-400" />
                  </div>
                  <p className="text-sm font-medium text-navy-900">FICA</p>
                  <p className="text-xs text-navy-600">Compliant</p>
                </div>
              </div>
            </div>

            {/* Right Column - Lead Capture Form */}
            <div className="animate-slide-up animation-delay-200">
              <div className="bg-white rounded-2xl shadow-elegant-lg p-8 border-t-4 border-gold-500">
                <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">
                  Get Started in Minutes
                </h2>
                <p className="text-navy-600 mb-6">
                  Fill out this quick form and we'll send you a secure link to upload your documents.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-navy-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="input-elegant"
                      placeholder="John Smith"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-elegant"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-navy-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-elegant"
                      placeholder="+27 12 345 6789"
                    />
                  </div>

                  {/* Goal */}
                  <div>
                    <label htmlFor="goal" className="block text-sm font-medium text-navy-700 mb-2">
                      What brings you here? <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="goal"
                      required
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value as LeadGoal })}
                      className="input-elegant"
                    >
                      {LEAD_GOAL_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      'btn-primary w-full flex items-center justify-center gap-2',
                      loading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {loading ? (
                      <>
                        <div className="spinner w-5 h-5"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Privacy Notice */}
                <p className="mt-6 text-xs text-center text-navy-500">
                  🔒 Your information is encrypted and secure. 
                  We'll never share your data with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-navy-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-navy-600 max-w-2xl mx-auto">
              A simple, secure three-step process to get you started
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center animate-fade-in animation-delay-100">
              <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gold-400">1</span>
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy-900 mb-3">
                Submit Your Info
              </h3>
              <p className="text-navy-600">
                Fill out the simple form above with your basic information. 
                We'll send you a secure magic link via email.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center animate-fade-in animation-delay-200">
              <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gold-400">2</span>
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy-900 mb-3">
                Upload Documents
              </h3>
              <p className="text-navy-600">
                Click the link in your email to access your personal document vault. 
                Upload required documents with drag-and-drop ease.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center animate-fade-in animation-delay-300">
              <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gold-400">3</span>
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy-900 mb-3">
                We'll Take It From Here
              </h3>
              <p className="text-navy-600">
                Our team reviews your documents for compliance. 
                Once approved, your advisor will reach out to schedule a meeting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 text-gold-400 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-bold text-white mb-4">
              Your Security is Our Priority
            </h2>
            <p className="text-xl text-cream-200 mb-8">
              We use bank-grade encryption to protect your sensitive information. 
              All documents are stored securely and accessible only to authorized personnel.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-cream-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gold-400" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gold-400" />
                <span>FICA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gold-400" />
                <span>GDPR Protected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-navy-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-navy-600">
            <p className="text-sm">
              © 2026 Ficavault. All rights reserved.
            </p>
            <p className="text-xs mt-2">
              Questions? Contact us at <a href="mailto:support@ficavault.co.za" className="text-gold-600 hover:underline">support@ficavault.co.za</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
