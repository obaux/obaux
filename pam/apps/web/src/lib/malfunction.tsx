'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { useI18n } from './i18n';
import type { AppErrorAction } from '@pam/config';
import { navigate } from './navigate';
import { HELP_DESK_URL } from './helpDesk';
import { safeNext } from './signinNext';
import type { FailureKind } from '@pam/config';
import type { MalfunctionBannerProps } from './MalfunctionBanner';

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

/** A save, a switch or a tap that has not been answered in this long counts as failed; a send keeps its 30 (D-616). */
export const SAVE_TIMEOUT_MS = 15_000;

export type Settled<T> =
  | { readonly status: 'ok'; readonly value: T }
  | { readonly status: 'failed'; readonly error: unknown }
  /** No answer in time. `late` settles when the save finally answers, success or failure: read the truth again then. */
  | { readonly status: 'timeout'; readonly late: Promise<void> };

/** Waits for a save for `ms`; after that it is called failed, and the late answer is handed back to be re-read (Iris's A6). */
export function settleWithin<T>(save: Promise<T>, ms = SAVE_TIMEOUT_MS): Promise<Settled<T>> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ status: 'timeout', late: save.then(() => undefined, () => undefined) });
    }, ms);
    save.then(
      (value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ status: 'ok', value });
      },
      (error: unknown) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ status: 'failed', error });
      },
    );
  });
}

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

/**
 * The words and the way out for each kind of failure (D-618; Sage's signed words, mapped to keys at `docs/signed-english.md`). A kind with no
 * key yet says `notice.malfunction` and nothing else, so the banner is right before Lena's keys land and better after.
 *   retry   Try again, when the caller can run the action again (`options.retry`).
 *   signIn  Sign in, back to this screen where Sign in can take the person back to it.
 *   reload  Show the latest, re-reading the screen.
 * The second failure of the same action adds Get help, and says that Help has more ways to sort it out.
 */
const KIND_KEY: Record<FailureKind, string> = {
  offline: 'offline',
  timeout: 'timeout',
  'signed-out': 'signedOut',
  'not-allowed': 'notAllowed',
  'too-many': 'tooMany',
  changed: 'changed',
  gone: 'gone',
  'wrong-time': 'wrongTime',
  refused: 'refused',
  server: 'server',
};
const WAY_OUT: Record<FailureKind, 'retry' | 'signIn' | 'reload' | null> = {
  offline: 'retry',
  timeout: 'retry',
  'signed-out': 'signIn',
  'not-allowed': null,
  'too-many': null,
  changed: 'reload',
  gone: null,
  'wrong-time': null,
  refused: null,
  server: 'retry',
};

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
  // The banner's stand-in when it could not be fetched: the same ground and words, no buttons.
  lost: {
    width: '100%',
    maxWidth: '560px',
    boxSizing: 'border-box',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.35,
    backgroundColor: colorVars['--color-error'],
    color: colorVars['--color-on-error'],
    pointerEvents: 'auto',
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
  const [shown, setShown] = useState<{ readonly kind: FailureKind; readonly retry: (() => void) | undefined; readonly refresh: (() => void) | undefined; readonly again: boolean } | null>(null);
  const [Banner, setBanner] = useState<ComponentType<MalfunctionBannerProps> | null>(null);
  // The banner could not be fetched (a failure shown while the phone is offline): a plain line of words stands in for it.
  const [bannerLost, setBannerLost] = useState(false);
  const source = useRef<Element | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  // The action that last failed and has not since succeeded, left, or been cleared: its next failure is the second.
  const lastFailed = useRef<string | null>(null);

  const loadBanner = useCallback(() => {
    setBanner((current: ComponentType<MalfunctionBannerProps> | null) => {
      if (!current) {
        import('./MalfunctionBanner').then(
          (mod) => setBanner(() => mod.MalfunctionBanner),
          () => setBannerLost(true),
        );
      }
      return current;
    });
  }, []);
  // Fetched when the page is idle, not when it fails: a failure is most often the network, and a banner that has to be fetched then would not come.
  useEffect(() => {
    const idle = (window as { requestIdleCallback?: (fn: () => void) => number }).requestIdleCallback;
    const load = () => {
      loadBanner();
      // The classifier and the log are fetched at idle too: a failure with the phone offline would not be able to fetch them.
      void import('./reportAppError');
      void import('./supabase');
    };
    const id = idle ? idle(load) : window.setTimeout(load, 1_500);
    return () => {
      if (!idle) window.clearTimeout(id);
    };
  }, [loadBanner]);

  const show = useCallback<MalfunctionApi['show']>((action, error, from, options) => {
    source.current = from ?? null;
    // The classifier and the log are in a module fetched at idle (not in the root bundle), so the failure is looked at once it is here. An
    // outcome that has in fact already happened (a place already saved, a visit already cancelled) shows nothing and is not logged. Whether
    // there is a signed-in session turns the database's refusal of the anonymous key into "signed out". If the module could not be fetched
    // (offline from the start) the banner still comes, saying the one line.
    const present = (kind: FailureKind) => {
      const again = lastFailed.current === action;
      lastFailed.current = action;
      setSeq((n) => n + 1);
      setShown({ kind, retry: options?.retry, refresh: options?.refresh, again });
      loadBanner();
    };
    void (async () => {
      try {
        const [mod, supabase] = await Promise.all([import('./reportAppError'), import('./supabase')]);
        let signedIn: boolean | undefined;
        try {
          signedIn = Boolean((await supabase.createClient().auth.getSession()).data.session);
        } catch {
          signedIn = undefined;
        }
        const kind = mod.failureFor(action, error, signedIn === undefined ? {} : { signedIn });
        if (kind === 'done') return;
        mod.reportAppError({ action, code: mod.codeFromError(error) });
        present(kind);
      } catch {
        present('server');
      }
    })();
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

  const inset = useBottomInset(open);

  // The control that failed is never under the alert: scroll it clear.
  useEffect(() => {
    if (!open || !Banner || !source.current || !hostRef.current) return;
    const alertTop = hostRef.current.getBoundingClientRect().top;
    const control = source.current.getBoundingClientRect();
    if (control.bottom > alertTop - 8) window.scrollBy({ top: control.bottom - alertTop + 16, behavior: 'auto' });
  }, [open, Banner, seq, inset]);

  const api = useMemo(() => ({ show, clear }), [show, clear]);

  // A word is a key's, or the one line every failure said before the keys existed; a missing key comes back as itself.
  const said = (key: string, fallback?: string): string | undefined => {
    const text = t(key);
    if (text !== key) return text;
    return fallback ? t(fallback) : undefined;
  };

  const kindKey = shown ? KIND_KEY[shown.kind] : 'server';
  const title = (shown?.again ? said('notice.malfunction.again.title') : undefined) ?? said(`notice.malfunction.${kindKey}.title`, 'notice.malfunction') ?? '';
  const body = shown?.again
    ? (said('notice.malfunction.again.body') ?? said(`notice.malfunction.${kindKey}.body`))
    : said(`notice.malfunction.${kindKey}.body`);

  const actions = useMemo(() => {
    if (!shown) return [];
    const list: { label: string; onPress: () => void }[] = [];
    const way = WAY_OUT[shown.kind];
    const label = (key: string, fallback?: string) => {
      const text = t(`notice.malfunction.action.${key}`);
      return text !== `notice.malfunction.action.${key}` ? text : fallback ? t(fallback) : null;
    };
    if (way === 'signIn') {
      const text = label('signIn', 'signin.title');
      if (text)
        list.push({
          label: text,
          onPress: () => {
            setShown(null);
            // Back to this screen afterwards where Sign in can take the person back to it (its short list of screens); Home otherwise.
            const next = safeNext(window.location.pathname);
            navigate(next ? `/signin/?next=${next}` : '/signin/');
          },
        });
    }
    if (way === 'retry' && shown.retry) {
      const retry = shown.retry;
      const text = label('retry', 'messages.thread.tryAgain');
      if (text)
        list.push({
          label: text,
          onPress: () => {
            setShown(null);
            retry();
          },
        });
    }
    if (way === 'reload') {
      const refresh = shown.refresh;
      const text = label('reload');
      if (text)
        list.push({
          label: text,
          onPress: () => {
            setShown(null);
            if (refresh) refresh();
            else window.location.reload();
          },
        });
    }
    // Get help: when the same action fails a second time, and always for "Pam couldn't do that" (Try again would send the same thing). It opens the
    // help desk's page for this (Wren), and never says "contact Pam".
    if (shown.again || shown.kind === 'refused') {
      const text = label('help', 'help.title');
      if (text)
        list.push({
          label: text,
          onPress: () => {
            setShown(null);
            navigate(`${HELP_DESK_URL}something-didnt-go-through/`);
          },
        });
    }
    return list;
  }, [shown, t]);

  return (
    <MalfunctionContext.Provider value={api}>
      {children}
      {shown && !Banner && bannerLost ? (
        <div ref={hostRef} {...stylex.props(styles.host, styles.raisedBy(inset))}>
          <div role="alert" {...stylex.props(styles.lost)}>
            {title}
          </div>
        </div>
      ) : null}
      {shown && Banner ? (
        <div ref={hostRef} {...stylex.props(styles.host, styles.raisedBy(inset))}>
          <Banner
            key={seq}
            title={title}
            body={body}
            actions={actions}
            onClose={() => setShown(null)}
          />
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
