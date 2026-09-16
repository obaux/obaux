'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from '@pam/config';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';

/**
 * i18n from day one (§2.3): English and Spanish at launch, every string through
 * this layer. A hard-coded English string in a screen is a bug, and the locale
 * parity test in @pam/config is what keeps the two bundles honest.
 *
 * **The active locale is a preference now, not a constant** (Will, 16
 * September, adding the language switcher). It starts at `DEFAULT_LOCALE` —
 * matching the prerendered static HTML, so there is no hydration mismatch —
 * and an effect reads `pam.locale` from `localStorage` right after mount, the
 * same "answer with the static default first, then correct from storage"
 * pattern `useAreaSearch` already uses for a saved origin. `setLocale` updates
 * both the active locale and that cache; `LocaleSync` (mounted once in
 * `Providers`) is what additionally pulls the *account's* `preferred_language`
 * in once somebody is signed in — see that file for why the account, not this
 * cache, is the source of truth once one exists.
 */

const STORAGE_KEY = 'pam.locale';
const BUNDLES: Record<Locale, Record<string, string>> = { en, es };

function readCachedLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && isSupportedLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeCachedLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Private mode, or storage off. The active locale for this visit still
    // works; it just will not be remembered for the next one.
  }
}

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
  /** Switches the active locale and remembers it in this browser. */
  setLocale: (next: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const cached = readCachedLocale();
    if (cached) setLocaleState(cached);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeCachedLocale(next);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const bundle = BUNDLES[locale];
    return {
      locale,
      setLocale,
      t: (key, vars) => {
        const template = bundle[key] ?? BUNDLES[DEFAULT_LOCALE][key] ?? key;
        if (!vars) return template;
        return Object.entries(vars).reduce(
          (out, [name, v]) => out.split(`{${name}}`).join(String(v)),
          template,
        );
      },
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
