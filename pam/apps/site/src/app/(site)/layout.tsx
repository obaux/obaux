import type { Metadata, Viewport } from 'next';
import { RootShell } from '../../components/RootShell';
import { SITE_URL } from '../../lib/links';
import { SHARE_DESCRIPTION, SHARE_IMAGE, SHARE_TITLE } from '../../lib/share';

// The icons (`icon.svg`, `apple-icon.png`, `favicon.ico`) are picked up from this
// folder by Next; the social preview is drawn from `social/preview.html`. The
// words and the image are in `lib/share.ts`, which Storybook previews.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SHARE_TITLE, template: '%s — Pam' },
  description: SHARE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Pam',
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_IMAGE],
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
  return <RootShell>{children}</RootShell>;
}
