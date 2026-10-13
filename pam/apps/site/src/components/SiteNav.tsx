'use client';

import * as stylex from '@stylexjs/stylex';
import { usePathname } from 'next/navigation';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { VStack } from '@astryxdesign/core/VStack';
import { HOME } from '../content/home-copy';
import { website } from '../lib/website.stylex';
import { SIGN_IN_URL } from '../lib/links';
import { tap } from '../lib/tap';
import { WebFrame } from './WebFrame';
import { Wordmark } from './Wordmark';

const styles = stylex.create({
  // 48px high on a phone, 78px from 900px (Figma).
  header: { minHeight: { default: '48px', '@media (min-width: 900px)': '78px' }, justifyContent: 'center', paddingBlock: { default: '0px', '@media (min-width: 900px)': '12px' } },
  row: { justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  right: { alignItems: 'center' },
  link: {
    color: website['--website-text-primary'],
    textDecorationLine: 'none',
    paddingInline: '12px',
    borderRadius: '10px',
    fontFamily: 'var(--font-family-body)',
    fontWeight: { default: 500, '@media (min-width: 900px)': 600 },
    fontSize: { default: '14px', '@media (min-width: 900px)': '17px' },
    lineHeight: { default: '20px', '@media (min-width: 900px)': '24px' },
    backgroundColor: { default: 'transparent', ':hover': website['--website-surface-tint'] },
    transitionProperty: 'background-color',
    transitionDuration: '125ms',
  },
  here: { backgroundColor: website['--website-surface-tint'] },
  // Sign in: a 48px tap box; the green button drawn in it is 32px high on a phone, as designed, 48px from 900px.
  signIn: { display: 'inline-flex', alignItems: 'center', minHeight: '48px', textDecorationLine: 'none', borderRadius: '12px' },
  signInFace: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    minHeight: { default: '32px', '@media (min-width: 900px)': '48px' },
    paddingInline: { default: '12px', '@media (min-width: 900px)': '20px' },
    borderRadius: '10px',
    backgroundColor: website['--website-brand-primary'],
    color: website['--website-brand-on-primary'],
    fontFamily: 'var(--font-family-body)',
    fontWeight: 500,
    fontSize: { default: '14px', '@media (min-width: 900px)': '17px' },
    lineHeight: { default: '20px', '@media (min-width: 900px)': '24px' },
    transitionProperty: 'transform',
    transitionDuration: '125ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    transform: { default: 'none', ':active': 'scale(0.97)' },
  },
});

/**
 * The header of the new site (Figma "Pam — Website": wordmark, Support, Sign in; 78px high, a 1200 column).
 * The language button in the design (a globe) is left out until a second language is signed off: with only English
 * live it would be a control that goes nowhere (`content/signed-off.json`, `LanguageSwitcher`).
 * `path` is Storybook's, where there is no router.
 */
export function SiteNav({ path: given }: { readonly path?: string }) {
  const real = usePathname();
  const path = given ?? real ?? '/';
  return (
    <VStack as="header" xstyle={styles.header}>
      <WebFrame edge="header">
        <HStack xstyle={styles.row} gap={4}>
          <a href="/" aria-label="Pam, home" {...stylex.props(tap.link)}>
            <Wordmark />
          </a>
          <HStack gap={1} xstyle={styles.right}>
            <nav aria-label="Pam">
              <Link href="/support/" xstyle={[styles.link, tap.link, path.startsWith('/support') && styles.here]}>
                {HOME.nav.support}
              </Link>
            </nav>
            <a href={SIGN_IN_URL} {...stylex.props(styles.signIn)}>
              <span {...stylex.props(styles.signInFace)}>{HOME.nav.signIn}</span>
            </a>
          </HStack>
        </HStack>
      </WebFrame>
    </VStack>
  );
}
