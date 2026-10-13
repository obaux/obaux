import type { ReactNode } from 'react';
import { SkipLink } from './SkipLink';
import { SiteFooter } from './SiteFooter';
import { SiteNav } from './SiteNav';

/** The header, the page, the footer: what every page of the site sits in. */
export function SiteShell({ children, path }: { readonly children: ReactNode; readonly path?: string }) {
  return (
    <>
      <SkipLink />
      <SiteNav path={path} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
