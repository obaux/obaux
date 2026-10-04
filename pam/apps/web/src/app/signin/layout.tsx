import type { Metadata } from 'next';
import { APP_URL } from '@/lib/project';

/**
 * What an invite link looks like when it is pasted into a text (Will,
 * 4 October, D-263): "a cover image like image 2 of carousel and the PAM logo
 * in center. With text saying: you're invited."
 *
 * Every invite is a link to Sign in (D-254), so the preview is Sign in's.
 * The picture is `public/og/invite.jpg` — the second carousel picture,
 * darkened, the white wordmark and "You're invited" — made once and checked
 * in. Its address is absolute, from APP_URL, because a phone fetching the
 * preview has no page to resolve a relative one against; changing the domain
 * changes this with everything else (docs/changing-the-domain.md).
 */
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'You’re invited to PAM',
  description: 'Sign in to PAM to get started.',
  openGraph: {
    type: 'website',
    siteName: 'PAM',
    title: 'You’re invited to PAM',
    description: 'Sign in to PAM to get started.',
    url: '/signin/',
    images: [{ url: '/og/invite.jpg', width: 1200, height: 630, alt: 'PAM — You’re invited' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'You’re invited to PAM',
    images: ['/og/invite.jpg'],
  },
};

export default function SignInLayout({ children }: { readonly children: React.ReactNode }) {
  return children;
}
