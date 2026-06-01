'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-white to-cream-200 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-elegant-lg p-8 text-center border-t-4 border-forest-500">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-forest-600" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-serif font-bold text-navy-900 mb-4">
            Thank You!
          </h1>

          {/* Message */}
          <p className="text-lg text-navy-600 mb-6">
            Your information has been submitted successfully.
          </p>

          {/* Email Info */}
          <div className="bg-cream-100 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Mail className="w-6 h-6 text-gold-600" />
              <span className="font-medium text-navy-900">Check Your Inbox</span>
            </div>
            <p className="text-navy-600 text-sm">
              We've sent a secure magic link to:
            </p>
            <p className="font-semibold text-navy-900 mt-2">
              {decodeURIComponent(email)}
            </p>
          </div>

          {/* Instructions */}
          <div className="text-left bg-navy-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-navy-900 mb-3">What's Next?</h3>
            <ol className="space-y-3 text-sm text-navy-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-navy-900 text-gold-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <span>Open the email from us (check spam if you don't see it)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-navy-900 text-gold-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <span>Click the secure magic link</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-navy-900 text-gold-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <span>Upload your required documents</span>
              </li>
            </ol>
          </div>

          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Home
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-navy-500 mt-6">
          Didn't receive the email? Check your spam folder or{' '}
          <Link href="/" className="text-gold-600 hover:underline">
            try again
          </Link>
        </p>
      </div>
    </div>
  );
}
