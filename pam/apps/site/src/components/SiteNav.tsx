'use client';

import * as stylex from '@stylexjs/stylex';
import { usePathname } from 'next/navigation';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@pam/ui/Button';
import { HOME } from '../content/home-copy';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';
import { SIGN_IN_URL } from '../lib/links';
import { tap } from '../lib/tap';
import { WebFrame } from './WebFrame';
import { Wordmark } from './Wordmark';

const styles = stylex.create({
  header: { minHeight: '78px', justifyContent: 'center', paddingBlock: '12px' },
  row: { justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  right: { alignItems: 'center' },
  link: {
    color: website['--website-text-primary'],
    textDecorationLine: 'none',
    paddingInline: '12px',
    borderRadius: '10px',
    backgroundColor: { default: 'transparent', ':hover': website['--website-surface-tint'] },
    transitionProperty: 'background-color',
    transitionDuration: '125ms',
  },
  here: { backgroundColor: website['--website-surface-tint'] },
});

/**
 * The header of the new site (Figma "Pam — Website": wordmark, Get help, Sign in; 78px high, a 1200 column).
 * The language button in the design (a globe) is left out until a second language is signed off: with only English
 * live it would be a control that goes nowhere (`content/signed-off.json`, `LanguageSwitcher`).
 * `path` is Storybook's, where there is no router.
 */
export function SiteNav({ path: given }: { readonly path?: string }) {
  const real = usePathname();
  const path = given ?? real ?? '/';
  return (
    <VStack as="header" xstyle={styles.header}>
      <WebFrame>
        <HStack xstyle={styles.row} gap={4}>
          <a href="/" aria-label="Pam, home" {...stylex.props(tap.link)}>
            <Wordmark />
          </a>
          <HStack gap={4} xstyle={styles.right}>
            <nav aria-label="Pam">
              <Link href="/support/" xstyle={[type.label_strong17, styles.link, tap.link, path.startsWith('/support') && styles.here]}>
                {HOME.nav.support}
              </Link>
            </nav>
            <Button label={HOME.nav.signIn} variant="primary" size="lg" href={SIGN_IN_URL} xstyle={tap.target} />
          </HStack>
        </HStack>
      </WebFrame>
    </VStack>
  );
}
