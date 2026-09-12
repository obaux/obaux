import type { Metadata, Viewport } from 'next';
import { I18nProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'PAM',
  description: 'PAM helps you find people and places that can help.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'PAM', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // §12: text must scale to 200%. Never set maximumScale or userScalable=no —
  // that is the single most common way an app becomes unusable for someone who
  // needs larger text.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101012' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // lang is overwritten client-side once the member's language is known.
    // §2.2: default to system colour scheme, with a manual toggle in Settings.
    <html lang="en" suppressHydrationWarning>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
