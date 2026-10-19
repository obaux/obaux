'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { CompactNotice } from '@pam/ui';
import { useI18n } from './i18n';
import type { AppErrorAction } from '@pam/config';
import { codeFromError, reportAppError } from './reportAppError';

/**
 * When Pam fails (D-616, Will, 18 October: "Let's use the smaller alert banner. Overlaid below at bottom of page. Let's
 * set this as an alert pattern for malfunctions").
 *
 * A malfunction is Pam failing, not the person: a save, a switch or a send that did not go through. It is drawn here and
 * nowhere else: one small alert (`CompactNotice`, D-509), fixed at the bottom of the screen above the tab bar, the keyboard
 * and the safe area, saying one line (`notice.malfunction`) with no reason. It never covers the control that failed (the
 * control is scrolled clear of it), takes no taps (the page under it stays usable), is `role="alert"` and said once for
 * each failure, and stays until the person's next tap or key, a successful retry (`clear`), or leaving the screen: never
 * on a timer (WCAG 2.2.1). Showing it and logging the failure are one call, `show`, which also reports it (`reportAppError`).
 *
 * What stays where it was: a reason the person can act on (a wrong code, a file too big, a field to fix) is an inline
 * `CompactNotice` by the control, as before; a page that cannot load keeps its `Notice` card (there is nothing else on
 * the screen); a failed message send keeps "Not sent" on the bubble (it is logged, with no overlay).
 */

import { SAVE_TIMEOUT_MS, settleWithin, type Settled } from './settle';
export { SAVE_TIMEOUT_MS, settleWithin };
export type { Settled };

interface MalfunctionApi {
  /**
   * Draws the alert and logs the failure. `source` is the control that failed: it is scrolled clear of the alert.
   * `action` is a key on the closed list in `@pam/config` (`APP_ERROR_ACTIONS`), never built from what a person typed.
   */
  readonly show: (action: AppErrorAction, error: unknown, source?: Element | null) => void;
  /** A successful retry: the alert goes. */
  readonly clear: () => void;
}

const MalfunctionContext = createContext<MalfunctionApi | null>(null);

const styles = stylex.create({
  // Over the page, under nothing that matters: above sticky headers and the tab bar, taking no taps itself.
  host: {
    position: 'fixed',
    insetInline: 0,
    zIndex: 60,
    display: 'flex',
    justifyContent: 'center',
    paddingInline: '16px',
    pointerEvents: 'none',
  },
  // How far up it sits: measured (see `useBottomInset`), so a dynamic style, not an inline one.
  raisedBy: (inset: number) => ({ bottom: `calc(${inset}px + 12px + env(safe-area-inset-bottom, 0px))` }),
  inner: { width: '100%', maxWidth: '560px', boxShadow: '0 4px 16px oklch(0 0 0 / 25%)' },
});

/** How far up the alert sits: above the tab bar when there is one, and above the keyboard when it is up. */
function useBottomInset(active: boolean): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (!active) return;
    const measure = () => {
      const bar = document.querySelector('[data-pam-tabbar]');
      const barTop = bar ? bar.getBoundingClientRect().top : window.innerHeight;
      const fromBar = Math.max(0, window.innerHeight - barTop);
      const vv = window.visualViewport;
      const fromKeyboard = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
      setInset(Math.max(fromBar, fromKeyboard));
    };
    measure();
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  }, [active]);
  return inset;
}

export function MalfunctionProvider({ children }: { readonly children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  // `seq` makes each failure its own alert, so a screen reader says it once for each one (and two in a row are one alert, replaced).
  const [seq, setSeq] = useState(0);
  const [shown, setShown] = useState(false);
  const source = useRef<Element | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const show = useCallback<MalfunctionApi['show']>((action, error, from) => {
    reportAppError({ action, code: codeFromError(error) });
    source.current = from ?? null;
    setSeq((n) => n + 1);
    setShown(true);
  }, []);
  const clear = useCallback(() => setShown(false), []);

  // Gone with the next tap or key, a successful retry, or leaving the screen: never on a timer.
  useEffect(() => {
    if (!shown) return;
    const dismiss = () => setShown(false);
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('keydown', dismiss, true);
    return () => {
      document.removeEventListener('pointerdown', dismiss, true);
      document.removeEventListener('keydown', dismiss, true);
    };
  }, [shown, seq]);
  useEffect(() => setShown(false), [pathname]);

  const inset = useBottomInset(shown);

  // The control that failed is never under the alert: scroll it clear.
  useEffect(() => {
    if (!shown || !source.current || !hostRef.current) return;
    const alertTop = hostRef.current.getBoundingClientRect().top;
    const control = source.current.getBoundingClientRect();
    if (control.bottom > alertTop - 8) window.scrollBy({ top: control.bottom - alertTop + 16, behavior: 'auto' });
  }, [shown, seq, inset]);

  const api = useMemo(() => ({ show, clear }), [show, clear]);

  return (
    <MalfunctionContext.Provider value={api}>
      {children}
      {shown ? (
        <div ref={hostRef} {...stylex.props(styles.host, styles.raisedBy(inset))}>
          <div key={seq} {...stylex.props(styles.inner)}>
            <CompactNotice status="error" text={t('notice.malfunction')} />
          </div>
        </div>
      ) : null}
    </MalfunctionContext.Provider>
  );
}

const NO_HOST: MalfunctionApi = { show: () => undefined, clear: () => undefined };

/** `useMalfunction().show(action, error, control)` when a save, a switch or a send did not go through. */
export function useMalfunction(): MalfunctionApi {
  return useContext(MalfunctionContext) ?? NO_HOST;
}
