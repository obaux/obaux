import type { Metadata } from 'next';
import { APP_URL } from '@/lib/project';

/**
 * What the "Add your program" link looks like when it is pasted into a text
 * (Will, 10 October 2026, after the approval text arrived with a plain "Pam"
 * preview: "a social image with logo, and under 'Add your program' for this").
 *
 * The text that tells a newly approved program lead they are in carries this
 * page's address (D-496). The picture is `public/og/add-program.jpg` — the
 * invite's look (`signin/layout.tsx`), the white wordmark and "Add your
 * program" — made once by `scripts/og-add-program.mjs` and checked in. Its
 * address is absolute, from APP_URL, because a phone fetching the preview has
 * no page to resolve a relative one against.
 */
const TITLE = 'Add your program to Pam';
const DESCRIPTION = 'Tell us about your program so people can find it on Pam.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Pam',
    title: TITLE,
    description: DESCRIPTION,
    url: '/programs/new/',
    images: [{ url: '/og/add-program.jpg', width: 1200, height: 630, alt: 'Pam — Add your program' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og/add-program.jpg'],
  },
};

export default function AddProgramLayout({ children }: { readonly children: React.ReactNode }) {
  return children;
}
