import type { Metadata, Viewport } from 'next';
import { Providers } from '@/lib/providers';

/*
 * Setup order matters and is prescribed by Astryx's own agent docs
 * (.claude/CLAUDE.md): "without these, components render unstyled."
 *
 * These are JS imports, not CSS `@import`s. Next's CSS pipeline mangles
 * `@import ... layer(x)` into an invalid `@media layer(x)` block, which silently
 * dropped the entire Astryx reset on the first build.
 *
 * layers.css is first so the cascade order is fixed before any layer is used.
 */
import './layers.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '../theme/pam.css';
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
    // lang is set from the member's language once onboarding has run.
    // §2.2: default to system colour scheme, with a manual toggle in Settings.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
