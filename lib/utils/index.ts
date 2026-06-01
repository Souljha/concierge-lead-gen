import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  ALLOWED_FILE_TYPES, 
  MAX_FILE_SIZE, 
  FileValidationResult,
  LeadStatus,
  DocumentStatus 
} from '@/types';

// =====================================================
// STYLING UTILITIES
// =====================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =====================================================
// FILE VALIDATION
// =====================================================

export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Please upload PDF or image files (JPG, PNG, WebP)',
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

// =====================================================
// DATE FORMATTING
// =====================================================

export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    return getRelativeTime(d);
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date, 'short');
}

// =====================================================
// STATUS HELPERS
// =====================================================

export function getLeadStatusColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    pending_documents: 'bg-gold-100 text-gold-700 border-gold-300',
    documents_submitted: 'bg-blue-100 text-blue-700 border-blue-300',
    under_review: 'bg-purple-100 text-purple-700 border-purple-300',
    approved: 'bg-forest-100 text-forest-700 border-forest-300',
    rejected: 'bg-red-100 text-red-700 border-red-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
}

export function getDocumentStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    pending: 'bg-gray-100 text-gray-700',
    uploaded: 'bg-blue-100 text-blue-700',
    reviewing: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-forest-100 text-forest-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getDocumentStatusIcon(status: DocumentStatus): string {
  const icons: Record<DocumentStatus, string> = {
    pending: '⏳',
    uploaded: '📤',
    reviewing: '👀',
    approved: '✅',
    rejected: '❌',
  };
  return icons[status] || '📄';
}

// =====================================================
// PROGRESS CALCULATION
// =====================================================

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getProgressColor(percentage: number): string {
  if (percentage === 100) return 'text-forest-600';
  if (percentage >= 75) return 'text-blue-600';
  if (percentage >= 50) return 'text-gold-600';
  return 'text-orange-600';
}

export function getProgressBarColor(percentage: number): string {
  if (percentage === 100) return 'bg-forest-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-gold-500';
  return 'bg-orange-500';
}

// =====================================================
// STRING UTILITIES
// =====================================================

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// =====================================================
// VALIDATION
// =====================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// =====================================================
// SECURE LINK GENERATION
// =====================================================

export function generateSecureToken(): string {
  // Generate a random secure token for magic links
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function generateMagicLink(baseUrl: string, token: string, leadId: string): string {
  return `${baseUrl}/upload?token=${token}&lead=${leadId}`;
}

// =====================================================
// ERROR HANDLING
// =====================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export function logError(error: unknown, context?: string) {
  console.error(context ? `[${context}]` : '[Error]', error);
  
  // In production, you would send this to an error tracking service
  // like Sentry, LogRocket, etc.
}

// =====================================================
// ARRAY UTILITIES
// =====================================================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// =====================================================
// DEBOUNCE
// =====================================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// =====================================================
// LOCAL STORAGE
// =====================================================

export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setInLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logError(error, 'LocalStorage');
  }
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    logError(error, 'LocalStorage');
  }
}
