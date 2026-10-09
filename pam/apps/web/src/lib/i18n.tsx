'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  directionOf,
  fillTemplate,
  isSupportedLocale,
  matchLocale,
  pickTemplate,
  SWITCHING_LANGUAGE,
  type Locale,
  type TextBundle,
  type TextDirection,
} from '@pam/config';
import { InternationalizationProvider, type Catalog } from '@astryxdesign/core/i18n';
import { LanguageSwitching } from '@pam/ui';
import en from '@pam/config/locales/en.json';

/**
 * i18n from day one (§2.3): every string through this layer. A hard-coded
 * English string in a screen is a bug, and the locale parity test in
 * @pam/config is what keeps every bundle honest.
 *
 * **The active locale is a preference, not a constant** (Will, 16 September,
 * adding the language switcher). It starts at `DEFAULT_LOCALE` — matching the
 * prerendered static HTML, so there is no hydration mismatch — and an effect
 * reads `pam.locale` from `localStorage` right after mount, the same "answer
 * with the static default first, then correct from storage" pattern
 * `useAreaSearch` already uses for a saved origin. `setLocale` updates both the
 * active locale and that cache; `LocaleSync` (mounted once in `Providers`) is
 * what additionally pulls the *account's* `preferred_language` in once
 * somebody is signed in — see that file for why the account, not this cache,
 * is the source of truth once one exists.
 *
 * **Only English is in the first load** (9 October 2026, D-404, when the
 * languages went from two to seven). English is what the static HTML is
 * written in and the fallback for any key a bundle lacks; every other bundle
 * is its own chunk, fetched when somebody chooses that language, because each
 * costs about 25 kB gzipped and §12's budget had 43 kB to spare. So switching
 * is asynchronous: `locale` changes only once the chunk has arrived (a screen
 * never shows half of one language), and `pendingLocale` says which one is on
 * its way so a picker can show the choice at once. If the chunk cannot be
 * fetched the language stays as it was and nothing is remembered.
 *
 * Astryx has words of its own too (screen-reader labels like "Close"; about 250
 * of them), and a translation of them for each of our languages. Each is
 * fetched beside Pam's own bundle (a slim copy, 3.5 kB gzipped — see
 * `scripts/build-astryx-catalogs.mjs`) and handed to Astryx's provider, which
 * also tells every Astryx component which way the page reads so it mirrors
 * itself: layout, chevrons, arrow keys, menus.
 *
 * **Where it starts.** A saved choice; otherwise the language the person's own
 * device is set to (`navigator.languages`, via `matchLocale`) — a phone set to
 * Arabic should not open on a screen in English — and otherwise English. That
 * device guess is never saved as though it were a choice. Language is a
 * person's own, not where they are: nothing here looks at a city or a region.
 *
 * **While it waits** (Will, 9 October, D-404) the screen is covered by a spinner
 * and one line, in the language being switched to, saying what is happening
 * (`LanguageSwitching`, `SWITCHING_LANGUAGE`). It appears only if the wait runs
 * past `SHOW_AFTER_MS` — a language already fetched, or one the browser has
 * cached, switches with no flash — and once it has appeared it stays for
 * `MIN_VISIBLE_MS`, so it never blinks.
 *
 * It also keeps `<html lang>` and `<html dir>` true to the language: the page
 * ships as `lang="en"`, which would make a screen reader read Spanish with an
 * English voice and let a browser pick the wrong Chinese glyph forms, and
 * Arabic reads right to left.
 */

const STORAGE_KEY = 'pam.locale';

/** A switch that finishes inside this is not worth a loader. */
const SHOW_AFTER_MS = 150;
/** Once shown, the loader stays at least this long, so it never flashes. */
const MIN_VISIBLE_MS = 500;

const LOADERS: Record<Exclude<Locale, 'en'>, () => Promise<{ default: TextBundle }>> = {
  es: () => import('@pam/config/locales/es.json'),
  'pt-BR': () => import('@pam/config/locales/pt-BR.json'),
  'zh-CN': () => import('@pam/config/locales/zh-CN.json'),
  'zh-HK': () => import('@pam/config/locales/zh-HK.json'),
  ru: () => import('@pam/config/locales/ru.json'),
  ar: () => import('@pam/config/locales/ar.json'),
};

/** Astryx's own strings in each language, fetched with the matching bundle. English is built in. */
const ASTRYX_LOADERS: Record<Exclude<Locale, 'en'>, () => Promise<{ default: Catalog }>> = {
  es: () => import('./astryx/es.json'),
  'pt-BR': () => import('./astryx/pt-BR.json'),
  'zh-CN': () => import('./astryx/zh-CN.json'),
  'zh-HK': () => import('./astryx/zh-HK.json'),
  ru: () => import('./astryx/ru.json'),
  ar: () => import('./astryx/ar.json'),
};

interface Active {
  readonly locale: Locale;
  readonly bundle: TextBundle;
  readonly astryx: Catalog | undefined;
}

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
  /** The language whose bundle is still arriving, or null. */
  pendingLocale: Locale | null;
  /** Which way the page reads in the active language. */
  dir: TextDirection;
  /**
   * Looks up `key` and fills `{named}` placeholders. Pass a number as `count`
   * (or `plural`, when `count` is already formatted text) and a language that
   * has plural forms picks the right one.
   *
   * A missing key falls back to English, then to the key itself: on a screen a
   * member is trying to get through, a visible `onboarding.name.title` is a
   * bug report, while a blank space is a dead end.
   */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Switches the active locale and remembers it in this browser. */
  setLocale: (next: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

interface I18nProviderProps {
  readonly children: ReactNode;
  /**
   * Bundles already in hand — Storybook and tests, where there is no network
   * to wait for and a switch should be instant. The app passes none.
   */
  readonly bundles?: Partial<Record<Locale, TextBundle>>;
  readonly initialLocale?: Locale;
}

export function I18nProvider({ children, bundles, initialLocale }: I18nProviderProps) {
  const loaded = useRef<Partial<Record<Locale, TextBundle>>>({ en, ...bundles });
  const loadedAstryx = useRef<Partial<Record<Locale, Catalog>>>({});
  const start = initialLocale && loaded.current[initialLocale] ? initialLocale : DEFAULT_LOCALE;
  const [active, setActive] = useState<Active>({
    locale: start,
    bundle: loaded.current[start] ?? en,
    astryx: undefined,
  });
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  // Which language the loader is announcing, once the wait has run long enough to show one.
  const [switching, setSwitching] = useState<Locale | null>(null);
  const shownAt = useRef(0);
  // Each request takes a ticket; only the newest may land. A fast second tap
  // must not be undone by a slower first one arriving late.
  const ticket = useRef(0);

  // `remember` is false for a guess from the device: only a choice is saved.
  const apply = useCallback((next: Locale, remember: boolean) => {
    const mine = ++ticket.current;
    const ready = loaded.current[next];
    const readyAstryx = next === 'en' || loadedAstryx.current[next];
    if (ready && readyAstryx) {
      setPendingLocale(null);
      setActive({ locale: next, bundle: ready, astryx: loadedAstryx.current[next] });
      if (remember) writeCachedLocale(next);
      return;
    }
    setPendingLocale(next);
    const key = next as Exclude<Locale, 'en'>;
    // Pam's words are what matter; if only Astryx's labels fail to arrive, go on without them.
    Promise.all([
      ready ? Promise.resolve({ default: ready }) : LOADERS[key](),
      next === 'en' ? Promise.resolve(undefined) : ASTRYX_LOADERS[key]().catch(() => undefined),
    ])
      .then(([module, astryx]) => {
        loaded.current[next] = module.default;
        if (astryx) loadedAstryx.current[next] = astryx.default;
        if (ticket.current !== mine) return;
        setPendingLocale(null);
        setActive({ locale: next, bundle: module.default, astryx: astryx?.default });
        if (remember) writeCachedLocale(next);
      })
      .catch(() => {
        if (ticket.current === mine) setPendingLocale(null);
      });
  }, []);

  const setLocale = useCallback((next: Locale) => apply(next, true), [apply]);

  useEffect(() => {
    // Storybook and tests name their language outright.
    if (initialLocale) return;
    const cached = readCachedLocale();
    if (cached) {
      if (cached !== start) apply(cached, true);
      return;
    }
    const guess = matchLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
    if (guess && guess !== start) apply(guess, false);
    // Once, on mount: nothing it reads changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pendingLocale) {
      if (switching) {
        setSwitching(pendingLocale); // already showing: just change what it says
        return;
      }
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setSwitching(pendingLocale);
      }, SHOW_AFTER_MS);
      return () => clearTimeout(timer);
    }
    if (!switching) return;
    const timer = setTimeout(() => setSwitching(null), Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current)));
    return () => clearTimeout(timer);
    // `switching` is read, not watched: only a change of the pending language restarts this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLocale]);

  useEffect(() => {
    document.documentElement.lang = active.locale;
    document.documentElement.dir = directionOf(active.locale);
  }, [active.locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale: active.locale,
      pendingLocale,
      dir: directionOf(active.locale),
      setLocale,
      t: (key, vars) => fillTemplate(pickTemplate(active.locale, active.bundle, en, key, vars), vars),
    }),
    [active, pendingLocale, setLocale],
  );

  const astryxMessages = useMemo(
    () => (active.astryx ? { [active.locale]: active.astryx } : {}),
    [active.astryx, active.locale],
  );

  return (
    <I18nContext.Provider value={value}>
      <InternationalizationProvider locale={active.locale} dir={directionOf(active.locale)} messages={astryxMessages}>
        {children}
        {switching ? (
          <LanguageSwitching label={SWITCHING_LANGUAGE[switching]} lang={switching} dir={directionOf(switching)} />
        ) : null}
      </InternationalizationProvider>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
