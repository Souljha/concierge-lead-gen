import type { Metadata } from 'next';
import { Crimson_Pro, Outfit } from 'next/font/google';
import './globals.css';

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  weight: ['400', '600', '700'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Concierge Lead Generation | Financial Advisory',
  description: 'Streamlined client onboarding for financial advisors. Upload documents securely and start your financial journey.',
  keywords: 'financial advisory, client onboarding, FICA compliance, document management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${crimsonPro.variable} ${outfit.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
