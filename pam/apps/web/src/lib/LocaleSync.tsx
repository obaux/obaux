'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from './i18n';
import { useSession } from './useSession';

/**
 * Pulls the signed-in account's own language preference into the active
 * locale, once it is known (Will, 16 September: "everytime they login...
 * show the language they chose").
 *
 * `I18nProvider` starts from `localStorage`, because that is all anybody
 * knows before a session exists — a visitor switching languages on the
 * sign-in screen before typing a phone number. The moment an account is
 * known, its own `preferred_language` is the more authoritative answer: it is
 * what the account holder chose the last time they set it deliberately
 * (during sign-up, or from Settings), on whatever device that was. Mounted
 * once in `Providers`, not per-screen, so this runs the same way whichever
 * screen somebody happens to land on signed in.
 *
 * One-way and one-shot per sign-in: this only ever reads the account *into*
 * the active locale. A deliberate switch made while signed in (via
 * `LanguageSwitcher`) writes the account directly and is not something this
 * effect should immediately overwrite — `synced` tracks the signed-in user id
 * this already ran for, so a later locale change (its own or an unrelated
 * render) does not re-fire it.
 */
export function LocaleSync() {
  const { state: session } = useSession();
  const { setLocale } = useI18n();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (session.status !== 'signed-in') return;
    if (synced.current === session.session.userId) return;
    synced.current = session.session.userId;
    setLocale(session.session.locale);
  }, [session, setLocale]);

  return null;
}
