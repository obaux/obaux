'use client';

import { usePathname } from 'next/navigation';
import { TopNav, TopNavItem } from '@astryxdesign/core/TopNav';
import { Button } from '@pam/ui/Button';
import { SIGN_IN_URL } from '@/lib/links';
import { Frame } from './Frame';
import { Wordmark } from './Wordmark';

/**
 * The header: the wordmark, two places to go, and the way into the app.
 * Sign in is the one action, so it is the only filled button.
 */
export function SiteNav() {
  const path = usePathname() ?? '/';
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
          <TopNavItem label="Home" href="/" isSelected={path === '/'} />
          <TopNavItem label="Support" href="/support/" isSelected={path.startsWith('/support')} />
        </>
      }
      endContent={<Button label="Sign in" variant="primary" href={SIGN_IN_URL} />}
    />
    </Frame>
  );
}
