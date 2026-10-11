'use client';

import { usePathname } from 'next/navigation';
import { TextLink } from '@pam/ui/TextLink';
import { legalUrl } from '../lib/links';
import { ReadMore } from './Prose';

/**
 * A link to Privacy or Terms in the app that remembers which page of this site it was tapped on (D-508), so the app's
 * "Back to the website" lands the reader where they were. A client component only because the page path is read
 * in the browser; the site itself is static. `quiet` is the footer's small link; `read-more` is the underlined line a post
 * ends with.
 */
export function LegalLink({
  kind,
  label,
  variant = 'quiet',
}: {
  readonly kind: 'privacy' | 'terms';
  readonly label: string;
  readonly variant?: 'quiet' | 'read-more';
}) {
  const href = legalUrl(kind, usePathname() || '/');
  return variant === 'quiet' ? <TextLink label={label} href={href} size="quiet" /> : <ReadMore label={label} href={href} />;
}
