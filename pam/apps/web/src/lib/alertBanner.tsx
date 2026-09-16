'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import type { AlertBannerHostProps } from './AlertBannerHost';

/**
 * The one place PAM says something happened from outside a screen's own
 * layout (Will, 16 September) — a banner pinned above everything else,
 * dismissed by the person reading it, not a timer. "You are signed out" used
 * to be a sentence of plain text sitting in the sign-in screen's own column,
 * indistinguishable from the rest of the page; this is the same idea every
 * other screen can now reach for instead of inventing its own inline text.
 *
 * **This is not a replacement for `Notice`.** A `Notice` explains a state the
 * screen itself is currently *in* — a failed query, an empty list — inline,
 * in the spot where the explanation belongs and stays as long as the state
 * does. This is for something that already happened — signing out, an action
 * taken elsewhere — said once, then let go of. Moving every existing
 * `Notice` onto this is a separate, bigger change and not what this does.
 *
 * Manual dismiss only, for now — Will, 16 September: "For now let's let the
 * user dismiss manually." A timed variant is a later, deliberate addition,
 * not a default this reaches for on its own.
 *
 * The actual render (`AlertBannerHost`, which imports Astryx's `Banner`) is a
 * plain `import()`, requested the first time `show` is ever called —
 * `AlertBannerProvider` wraps every screen including Home, so `Banner`'s own
 * weight cannot sit in the static bundle for the common case of nothing ever
 * being shown. `next/dynamic` was tried first and cost 1.4 kB of its own
 * Suspense/lazy machinery on top of `Banner`'s own weight; a raw `import()`
 * held in state, the same technique `HeaderBell` and `useSavedPlaces` already
 * use for their own rarely-needed static-import-chain data, does not.
 */

export type AlertBannerStatus = 'info' | 'warning' | 'error' | 'success';

export interface AlertBannerInput {
  readonly status: AlertBannerStatus;
  /** Already translated — same convention as `Notice`'s `title`/`body`. */
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

interface AlertBannerContextValue {
  readonly show: (input: AlertBannerInput) => void;
  readonly dismiss: () => void;
}

const AlertBannerContext = createContext<AlertBannerContextValue | null>(null);

export function AlertBannerProvider({ children }: { children: ReactNode }) {
  const [banner, setBanner] = useState<AlertBannerInput | null>(null);
  const [Host, setHost] = useState<ComponentType<AlertBannerHostProps> | null>(null);

  const show = useCallback((input: AlertBannerInput) => {
    setBanner(input);
    setHost((current: ComponentType<AlertBannerHostProps> | null) => {
      if (!current) void import('./AlertBannerHost').then((mod) => setHost(() => mod.AlertBannerHost));
      return current;
    });
  }, []);
  const dismiss = useCallback(() => setBanner(null), []);
  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <AlertBannerContext.Provider value={value}>
      {banner && Host ? <Host banner={banner} onDismiss={dismiss} /> : null}
      {children}
    </AlertBannerContext.Provider>
  );
}

/** Throws outside `AlertBannerProvider` — the provider is mounted once, in `Providers`. */
export function useAlertBanner(): AlertBannerContextValue {
  const ctx = useContext(AlertBannerContext);
  if (!ctx) throw new Error('useAlertBanner must be used within AlertBannerProvider');
  return ctx;
}
