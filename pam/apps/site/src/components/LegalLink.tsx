'use client';

import { usePathname } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { TextLink } from '@pam/ui/TextLink';
import { tap } from '../lib/tap';
import { SoftButton } from './SoftButton';
import { footerLink } from '../lib/footer-link';
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
  readonly variant?: 'quiet' | 'read-more' | 'footer' | 'soft';
}) {
  const href = legalUrl(kind, usePathname() || '/');
  if (variant === 'soft') return <SoftButton label={label} href={href} compact />;
  if (variant === 'footer') return <a href={href} {...stylex.props(footerLink.link, tap.link)}>{label}</a>;
  return variant === 'quiet' ? <TextLink label={label} href={href} size="quiet" /> : <ReadMore label={label} href={href} />;
}
