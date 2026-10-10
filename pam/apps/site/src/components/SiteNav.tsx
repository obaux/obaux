'use client';

import * as stylex from '@stylexjs/stylex';
import { usePathname } from 'next/navigation';
import { TopNav, TopNavItem } from '@astryxdesign/core/TopNav';
import { Button } from '@pam/ui/Button';
import { SIGN_IN_URL } from '../lib/links';
import { Frame } from './Frame';
import { Wordmark } from './Wordmark';

const styles = stylex.create({
  // On a very narrow phone the wordmark (which goes home) and Support and Sign in
  // are all the header holds: "Home" is dropped below 400px, or Sign in lands on
  // top of Support at 320px.
  homeLink: { display: { default: 'flex', '@media (max-width: 400px)': 'none' } },
});

/**
 * The header: the wordmark, two places to go, and the way into the app.
 * Sign in is the one action, so it is the only filled button.
 */
/**
 * `path` is for Storybook's website journey, which walks the site without a
 * router; on the real site the address bar decides.
 */
export function SiteNav({ path: given }: { readonly path?: string }) {
  const real = usePathname();
  const path = given ?? real ?? '/';
  return (
    <Frame gap={2}>
    <TopNav
      label="Pam"
      heading={
        <a href="/" aria-label="Pam, home">
          <Wordmark />
        </a>
      }
      startContent={
        <>
          <TopNavItem label="Home" href="/" isSelected={path === '/'} xstyle={styles.homeLink} />
          <TopNavItem label="Support" href="/support/" isSelected={path.startsWith('/support')} />
        </>
      }
      endContent={<Button label="Sign in" variant="primary" href={SIGN_IN_URL} />}
    />
    </Frame>
  );
}
