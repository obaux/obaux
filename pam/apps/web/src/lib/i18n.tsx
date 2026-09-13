'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from '@pam/config';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';

/**
 * i18n from day one (§2.3): English and Spanish at launch, every string through
 * this layer. A hard-coded English string in a screen is a bug, and the locale
 * parity test in @pam/config is what keeps the two bundles honest.
 */

const BUNDLES: Record<Locale, Record<string, string>> = { en, es };

interface I18nValue {
  locale: Locale;
  /**
   * Looks up `key` and fills `{named}` placeholders.
   *
   * A missing key returns the key itself rather than an empty string: on a
   * screen a member is trying to get through, a visible `onboarding.name.title`
   * is a bug report, while a blank space is a dead end.
   */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale = DEFAULT_LOCALE,
  children,
}: {
  locale?: Locale;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(() => {
    const active = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
    const bundle = BUNDLES[active];

    return {
      locale: active,
      t: (key, vars) => {
        const template = bundle[key] ?? BUNDLES[DEFAULT_LOCALE][key] ?? key;
        if (!vars) return template;
        return Object.entries(vars).reduce(
          (out, [name, v]) => out.split(`{${name}}`).join(String(v)),
          template,
        );
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
