'use client';

import type { ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { I18nProvider } from './i18n';
import type { Locale } from '@pam/config';

/**
 * Astryx is applied by a provider, not by a stylesheet.
 *
 * Importing reset.css / astryx.css / theme.css is necessary but not sufficient:
 * `<Theme>` is what puts the theme class on the subtree, and without it every
 * component renders unstyled — which is exactly how the first build ended up in
 * browser-default serif despite all three stylesheets loading correctly.
 *
 * The `/built` import pairs with the precompiled `theme.css` and skips runtime
 * style injection, which is what makes this work under SSR and static export.
 *
 * §2.2: default to the system colour scheme. A manual toggle lands in Settings
 * (§3.1 "Me"), and it sets this `mode` prop.
 */
export function Providers({
  locale,
  children,
}: {
  locale?: Locale;
  children: ReactNode;
}) {
  return (
    <Theme theme={neutralTheme} mode="system">
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </Theme>
  );
}
