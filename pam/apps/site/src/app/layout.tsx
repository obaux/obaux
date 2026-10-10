import type { Metadata, Viewport } from 'next';
import { Providers } from '../components/Providers';
import { SiteShell } from '../components/SiteShell';
import { SITE_URL } from '../lib/links';

// Setup order is the app's (apps/web/src/app/layout.tsx): layers first, then the
// three Astryx sheets as JS imports, then Pam's theme, fonts and own styles.
import './layers.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@pam/ui/theme/pam.css';
import '@pam/ui/fonts.css';
import './globals.css';

const TAGLINE = 'City services in your pocket';
const SHARE = {
  url: '/og/social.png',
  width: 1200,
  height: 630,
  alt: `Pam — ${TAGLINE}`,
};

// The icons (`icon.svg`, `apple-icon.png`, `favicon.ico`) are picked up from this
// folder by Next; the social preview is drawn from `social/preview.html`.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `Pam — ${TAGLINE}`, template: '%s — Pam' },
  description: 'Pam helps you find people and places that can help.',
  openGraph: {
    type: 'website',
    siteName: 'Pam',
    title: `Pam — ${TAGLINE}`,
    description: 'Pam helps you find people and places that can help.',
    images: [SHARE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Pam — ${TAGLINE}`,
    description: 'Pam helps you find people and places that can help.',
    images: [SHARE],
  },
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
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
