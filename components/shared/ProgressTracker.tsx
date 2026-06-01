'use client';

import { CheckCircle, Circle, Clock } from 'lucide-react';
import { LeadStatus, LEAD_STATUS_LABELS } from '@/types';
import { getProgressBarColor, cn } from '@/lib/utils';

interface ProgressTrackerProps {
  progress: number;
  completedDocs: number;
  totalDocs: number;
  status: LeadStatus;
}

export default function ProgressTracker({
  progress,
  completedDocs,
  totalDocs,
  status
}: ProgressTrackerProps) {
  const steps = [
    {
      label: 'Start Upload',
      complete: progress > 0,
      active: progress === 0 && status === 'pending_documents',
    },
    {
      label: 'Upload Documents',
      complete: progress === 100,
      active: progress > 0 && progress < 100,
    },
    {
      label: 'Under Review',
      complete: status === 'approved',
      active: status === 'under_review' || status === 'documents_submitted',
    },
    {
      label: 'Approved',
      complete: status === 'approved',
      active: false,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-elegant p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">
          Your Progress
        </h2>
        <p className="text-navy-600">
          {completedDocs} of {totalDocs} required documents completed
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-navy-700">
            {progress}% Complete
          </span>
          <span className={cn(
            'text-sm font-bold',
            progress === 100 ? 'text-forest-600' : 'text-gold-600'
          )}>
            {progress === 100 ? '✓ Complete' : `${totalDocs - completedDocs} remaining`}
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className={cn(
              'progress-bar-fill',
              getProgressBarColor(progress)
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-navy-200" 
             style={{ left: '20px', right: '20px' }} 
        />

        {/* Steps Grid */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center"
            >
              {/* Circle Icon */}
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-300 relative z-10',
                step.complete && 'bg-forest-500 shadow-glow-gold',
                step.active && 'bg-gold-500 shadow-glow-gold',
                !step.complete && !step.active && 'bg-navy-200'
              )}>
                {step.complete ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : step.active ? (
                  <Clock className="w-5 h-5 text-white animate-pulse" />
                ) : (
                  <Circle className="w-5 h-5 text-navy-400" />
                )}
              </div>

              {/* Label */}
              <span className={cn(
                'text-xs md:text-sm font-medium',
                step.complete && 'text-forest-700',
                step.active && 'text-gold-700',
                !step.complete && !step.active && 'text-navy-400'
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-6 pt-6 border-t border-navy-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-navy-600">Current Status:</span>
          <span className={cn(
            'badge border',
            status === 'approved' && 'bg-forest-100 text-forest-700 border-forest-300',
            status === 'under_review' && 'bg-purple-100 text-purple-700 border-purple-300',
            status === 'documents_submitted' && 'bg-blue-100 text-blue-700 border-blue-300',
            status === 'pending_documents' && 'bg-gold-100 text-gold-700 border-gold-300'
          )}>
            {LEAD_STATUS_LABELS[status]}
          </span>
        </div>
      </div>
    </div>
  );
}
