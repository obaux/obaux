'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { useI18n } from './i18n';
import type { AppErrorAction } from '@pam/config';
import type { BottomStack as BottomStackType, Failure, StackNotice } from './BottomStack';
import { NoticeSinkContext, type NoticeSink, type NoticeToastSpec } from '@pam/ui/noticeSink';
import { PlainStack } from './PlainStack';

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

export interface MalfunctionOptions {
  /** Runs the same action again. With it the banner offers "Try again"; without it, no button (callers from before D-618 are unchanged). */
  readonly retry?: () => void;
  /** Re-reads the screen, for "Show the latest" when someone changed it first. Left out, the page is reloaded. */
  readonly refresh?: () => void;
}

interface MalfunctionApi {
  /**
   * Draws the alert and logs the failure. `source` is the control that failed: it is scrolled clear of the alert.
   * `action` is a key on the closed list in `@pam/config` (`APP_ERROR_ACTIONS`), never built from what a person typed.
   * What the banner offers depends on what failed (D-618): "Try again" when `options.retry` is given, "Sign in" when the person is
   * signed out, and "Get help" when the same action fails a second time in a row (nothing says "contact Pam").
   */
  readonly show: (action: AppErrorAction, error: unknown, source?: Element | null, options?: MalfunctionOptions) => void;
  /** A successful retry: the alert goes, and the action is no longer counted as having failed. */
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
  const [shown, setShown] = useState<Omit<Failure, 'seq'> | null>(null);
  const [Stack, setStack] = useState<typeof BottomStackType | null>(null);
  // The status `Notice`s on screen, as toasts (D-619), and the ones a person closed.
  const [notices, setNotices] = useState<readonly StackNotice[]>([]);
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  const source = useRef<Element | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  // The action that last failed and has not since succeeded, left, or been cleared: its next failure is the second.
  const lastFailed = useRef<string | null>(null);

  const loadBanner = useCallback(() => {
    setStack((current: typeof BottomStackType | null) => {
      if (!current) {
        import('./BottomStack').then(
          (mod) => setStack(() => mod.BottomStack),
          // Not fetched (offline): the plain stand-in stays, with the same words.
          () => undefined,
        );
      }
      return current;
    });
  }, []);
  // Fetched when the page is idle, not when it fails: a failure is most often the network, and the stack that has to be fetched then would not come.
  useEffect(() => {
    const idle = (window as { requestIdleCallback?: (fn: () => void) => number }).requestIdleCallback;
    const load = () => {
      loadBanner();
      // The log is written by a module fetched at idle too: a failure with the phone offline would not be able to fetch it.
      void import('./reportAppError');
    };
    const id = idle ? idle(load) : window.setTimeout(load, 1_500);
    return () => {
      if (!idle) window.clearTimeout(id);
    };
  }, [loadBanner]);

  const show = useCallback<MalfunctionApi['show']>((action, error, from, options) => {
    // The log is written after the fact and nothing waits for it, so the reporter (and the classifier it carries) is not in the root bundle.
    void import('./reportAppError').then((mod) => mod.reportAppError({ action, code: mod.codeFromError(error) }));
    source.current = from ?? null;
    const again = lastFailed.current === action;
    lastFailed.current = action;
    setSeq((n) => n + 1);
    setShown({ error, retry: options?.retry, refresh: options?.refresh, again });
    // The banner's own weight is not in the root bundle: it loads the first time a failure is shown.
    loadBanner();
  }, [loadBanner]);
  const clear = useCallback(() => {
    lastFailed.current = null;
    setShown(null);
  }, []);

  // Gone with the next tap or key, a successful retry, or leaving the screen: never on a timer. A tap inside the banner is its own
  // (its buttons do their work), and Tab only moves toward them.
  const open = shown !== null;
  useEffect(() => {
    if (!open) return;
    const inside = (target: EventTarget | null) => target instanceof Node && !!hostRef.current?.contains(target);
    const onPointer = (event: Event) => {
      if (!inside(event.target)) setShown(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key === 'Shift' || inside(event.target)) return;
      setShown(null);
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, seq]);
  useEffect(() => {
    lastFailed.current = null;
    setShown(null);
  }, [pathname]);

  // The stack is open for a failure (the banner) and for any status `Notice` on screen that has not been closed.
  const visibleNotices = useMemo(() => notices.filter((n) => !closed.has(n.id)), [notices, closed]);
  const stackOpen = open || visibleNotices.length > 0;
  const inset = useBottomInset(stackOpen);

  // The control that failed is never under the alert: scroll it clear.
  useEffect(() => {
    if (!open || !Stack || !source.current || !hostRef.current) return;
    const alertTop = hostRef.current.getBoundingClientRect().top;
    const control = source.current.getBoundingClientRect();
    if (control.bottom > alertTop - 8) window.scrollBy({ top: control.bottom - alertTop + 16, behavior: 'auto' });
  }, [open, Stack, seq, inset]);

  const api = useMemo(() => ({ show, clear }), [show, clear]);

  // What a status `Notice` hands over (packages/ui `NoticeSink`). Drawn by the stack once it has loaded, and by the plain stand-in until
  // then (and if it never does), so nothing is ever unsaid.
  const register = useCallback((id: string, spec: NoticeToastSpec) => {
    setNotices((previous) => [...previous.filter((n) => n.id !== id), { id, spec }]);
  }, []);
  const unregister = useCallback((id: string) => {
    setNotices((previous) => previous.filter((n) => n.id !== id));
    setClosed((previous) => {
      if (!previous.has(id)) return previous;
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  }, []);
  const sink = useMemo<NoticeSink>(() => ({ register, unregister }), [register, unregister]);
  const closeNotice = useCallback((id: string) => setClosed((previous) => new Set(previous).add(id)), []);

  return (
    <MalfunctionContext.Provider value={api}>
      <NoticeSinkContext.Provider value={sink}>
        {children}
        {stackOpen ? (
          <div ref={hostRef} {...stylex.props(styles.host, styles.raisedBy(inset))}>
            {Stack ? (
              <Stack
                notices={visibleNotices}
                failure={shown ? { seq, ...shown } : null}
                onCloseBanner={() => setShown(null)}
                onCloseNotice={closeNotice}
              />
            ) : (
              <PlainStack notices={visibleNotices} lostBanner={shown ? t('notice.malfunction') : null} />
            )}
          </div>
        ) : null}
      </NoticeSinkContext.Provider>
    </MalfunctionContext.Provider>
  );
}

const NO_HOST: MalfunctionApi = { show: () => undefined, clear: () => undefined };

/** `useMalfunction().show(action, error, control)` when a save, a switch or a send did not go through. */
export function useMalfunction(): MalfunctionApi {
  return useContext(MalfunctionContext) ?? NO_HOST;
}
