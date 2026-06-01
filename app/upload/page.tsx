'use client';

import { Suspense } from 'react';
import LeadDashboard from '@/components/dashboard/LeadDashboard';

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <div className="text-center">
        <div className="spinner w-16 h-16 mx-auto mb-4"></div>
        <p className="text-navy-600">Loading your document vault...</p>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LeadDashboard />
    </Suspense>
  );
}
