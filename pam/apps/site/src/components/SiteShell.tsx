import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';
import { SiteNav } from './SiteNav';

/** The header, the page, the footer: what every page of the site sits in. */
export function SiteShell({ children, path }: { readonly children: ReactNode; readonly path?: string }) {
  return (
    <>
      <SiteNav path={path} />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
