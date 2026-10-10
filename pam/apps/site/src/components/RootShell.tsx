import type { ReactNode } from 'react';
import { Providers } from './Providers';
import { SiteShell } from './SiteShell';

// Setup order is the app's (apps/web/src/app/layout.tsx): layers first, then the
// three Astryx sheets as JS imports, then Pam's theme, fonts and own styles.
import '../app/layers.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@pam/ui/theme/pam.css';
import '@pam/ui/fonts.css';
import '../app/globals.css';

/**
 * The whole document, for every root layout: `<html>` with the page's language and
 * direction, then the theme and the header and footer. A page in Arabic is
 * `lang="ar" dir="rtl"` from the first byte, not patched after load.
 */
export function RootShell({
  children,
  lang = 'en',
  dir = 'ltr',
}: {
  readonly children: ReactNode;
  readonly lang?: string;
  readonly dir?: 'ltr' | 'rtl';
}) {
  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
