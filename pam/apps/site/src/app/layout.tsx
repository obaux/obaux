import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import { SiteNav } from '@/components/SiteNav';
import { Frame } from '@/components/Frame';
import { SiteFooter } from '@/components/SiteFooter';

// Setup order is the app's (apps/web/src/app/layout.tsx): layers first, then the
// three Astryx sheets as JS imports, then Pam's theme, fonts and own styles.
import './layers.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@pam/ui/theme/pam.css';
import '@pam/ui/fonts.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Pam', template: '%s — Pam' },
  description: 'Pam helps you find people and places that can help.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101012' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <SiteNav />
          <main>{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
