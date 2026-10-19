'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from './i18n';
import type { AppErrorAction, FailureKind } from '@pam/config';
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
  /** Runs the same action again. Without it, "Try again" presses the control that failed (`source`) again, then `refresh`; with none of these there is no button. */
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

const PRESS = 'button, a[href], [role="button"], [role="switch"], [role="checkbox"], input[type="checkbox"]';

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
  // The control a person pressed last (not one in an alert): what "Try again" presses when a screen passed no retry, and where the page scrolls to keep
  // clear of the alert. A save that is running often disables its button, so the focused element has moved by the time it fails.
  const lastPressed = useRef<{ readonly element: Element; readonly at: number } | null>(null);
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
  useEffect(() => {
    const note = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest(PRESS) : null;
      if (target && !target.closest('[role="alert"]')) lastPressed.current = { element: target, at: Date.now() };
    };
    document.addEventListener('click', note, true);
    return () => document.removeEventListener('click', note, true);
  }, []);
  // Fetched when the page is idle, not when it fails: a failure is most often the network, and the stack that has to be fetched then would not come.
  useEffect(() => {
    const idle = (window as { requestIdleCallback?: (fn: () => void) => number }).requestIdleCallback;
    const load = () => {
      loadBanner();
      // The classifier and the log are fetched at idle too: a failure with the phone offline would not be able to fetch them.
      void import('./classifyFailure');
    };
    const id = idle ? idle(load) : window.setTimeout(load, 1_500);
    return () => {
      if (!idle) window.clearTimeout(id);
    };
  }, [loadBanner]);

  const show = useCallback<MalfunctionApi['show']>((action, error, from, options) => {
    // The classifier, the log and the session check are in a module fetched at idle (not in the root bundle), so the failure is looked at once it
    // is here. An outcome that has in fact already happened (a place already saved) shows nothing. If the module could not be fetched (offline
    // from the start) the banner still comes, saying the one line.
    const present = (kind: FailureKind, source: Element | null) => {
      const again = lastFailed.current === action;
      lastFailed.current = action;
      setSeq((n) => n + 1);
      setShown({ kind, action, retry: options?.retry, refresh: options?.refresh, again, source });
      loadBanner();
    };
    const pressed = lastPressed.current;
    import('./classifyFailure').then(
      (mod) => {
        const source = mod.sourceOf(from, pressed);
        return mod.classifyAndLog(action, error).then((kind) => (kind === 'done' ? options?.refresh?.() : present(kind, source)), () => present('server', source));
      },
      () => present('server', from ?? null),
    );
  }, [loadBanner]);
  const clear = useCallback(() => {
    lastFailed.current = null;
    setShown(null);
  }, []);

  useEffect(() => {
    lastFailed.current = null;
    setShown(null);
  }, [pathname]);

  // The stack is open for a failure (the banner) and for any status `Notice` on screen that has not been closed.
  const visibleNotices = useMemo(() => notices.filter((n) => !closed.has(n.id)), [notices, closed]);
  const stackOpen = shown !== null || visibleNotices.length > 0;

  const api = useMemo(() => ({ show, clear }), [show, clear]);

  // What a status `Notice` hands over (packages/ui `NoticeSink`). Drawn by the stack once it has loaded, and by the plain stand-in until
  // then (and if it never does), so nothing is ever unsaid.
  const register = useCallback((id: string, spec: NoticeToastSpec) => {
    setNotices((previous) => [...previous.filter((n) => n.id !== id), { id, spec }]);
  }, []);
  // An id is unique to one `Notice` mount, so a closed id never needs forgetting.
  const unregister = useCallback((id: string) => setNotices((previous) => previous.filter((n) => n.id !== id)), []);
  const sink = useMemo<NoticeSink>(() => ({ register, unregister }), [register, unregister]);
  const closeNotice = useCallback((id: string) => setClosed((previous) => new Set(previous).add(id)), []);

  return (
    <MalfunctionContext.Provider value={api}>
      <NoticeSinkContext.Provider value={sink}>
        {children}
        {stackOpen ? (
          Stack ? (
            <Stack
              notices={visibleNotices}
              failure={shown ? { seq, ...shown } : null}
              onCloseBanner={() => setShown(null)}
              onCloseNotice={closeNotice}
            />
          ) : (
            <PlainStack notices={visibleNotices} lostBanner={shown ? t('notice.malfunction') : null} />
          )
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
