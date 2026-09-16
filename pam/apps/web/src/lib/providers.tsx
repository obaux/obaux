'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { pamTheme } from '../theme/pam.js';
import { MotionProvider } from '@pam/ui';
import { I18nProvider } from './i18n';
import { AlertBannerProvider } from './alertBanner';

/**
 * Astryx is applied by a provider, not by a stylesheet.
 *
 * Importing reset.css / astryx.css / theme.css is necessary but not sufficient:
 * `<Theme>` is what puts the theme class on the subtree, and without it every
 * component renders unstyled — which is exactly how the first build ended up in
 * browser-default serif despite all three stylesheets loading correctly.
 *
 * The built theme pairs with the precompiled `pam.css` imported in the layout
 * and skips runtime style injection, which is what makes this work under SSR
 * and static export. `pam` is the neutral theme wearing the logo's two greens —
 * see `src/theme/pam.ts`, which carries the measured contrast for every button
 * state.
 *
 * §2.2: default to the system colour scheme. A manual toggle lands in Settings
 * (§3.1 "Me"), and it sets this `mode` prop.
 */
export function Providers({ children }: { children: ReactNode }) {
  /*
   * `LocaleSync` calls `useSession`, and `Providers` wraps every route,
   * including several — `/help`, `/privacy`, `/terms` — that never called
   * `useSession` at all before this existed. A static import here put
   * `useSession`'s own code in Next's *root layout* chunk, which every route
   * loads regardless of whether that screen needs a session, and cost §12's
   * budget 1.1 kB nobody on those screens would ever use. A plain `import()`
   * after mount, the same technique `HeaderBell` and `useSavedPlaces` already
   * use for their own rarely-needed static-import-chain code, keeps it out of
   * the shared bundle; the sync itself still runs within the first render or
   * two, which is soon enough for something that only ever matters after a
   * sign-in redirect has already taken somebody to a new screen.
   */
  const [LocaleSync, setLocaleSync] = useState<ComponentType | null>(null);
  useEffect(() => {
    void import('./LocaleSync').then((mod) => setLocaleSync(() => mod.LocaleSync));
  }, []);

  return (
    <Theme theme={pamTheme} mode="system">
      {/*
        Motion is a provider too, and a lazy one: the animation features are a
        separate chunk that arrives after the page is usable, so a screen on a
        bad connection renders and works before anything moves (D-104).
      */}
      <MotionProvider>
        <I18nProvider>
          {LocaleSync ? <LocaleSync /> : null}
          <AlertBannerProvider>{children}</AlertBannerProvider>
        </I18nProvider>
      </MotionProvider>
    </Theme>
  );
}
