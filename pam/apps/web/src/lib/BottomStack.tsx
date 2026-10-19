'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { failureKindKey, type FailureKind } from '@pam/config';
import type { NoticeToastSpec } from '@pam/ui/noticeSink';
import { MalfunctionBanner } from './MalfunctionBanner';
import { NoticeToast } from './NoticeToast';
import { useI18n } from './i18n';
import { navigate } from './navigate';
import { safeNext } from './signinNext';
import { HELP_DESK_URL } from './helpDesk';

/**
 * The one stack at the bottom of the screen (D-618, D-619): the toasts for the states a screen is in (a status `Notice`) above, and the banner
 * for what just failed (`useMalfunction`) at the bottom edge, nearest the thumb. One column, so nothing in it can cover another thing in it;
 * the host that holds it sits above the tab bar, the keyboard and the safe area. Loaded once, with the page idle, so it is not in the root
 * bundle and is there when the network is not. Everything about what to say and what to offer for a failure is here, and not in the provider,
 * for the same reason: the kinds, the words and the actions are only needed once there is something to show.
 */
export interface StackNotice {
  readonly id: string;
  readonly spec: NoticeToastSpec;
}

/** What failed: the error (only its code is read), what to run again, how to re-read the screen, and whether this is the second time in a row. */
export interface Failure {
  readonly seq: number;
  readonly kind: FailureKind;
  readonly retry: (() => void) | undefined;
  readonly refresh: (() => void) | undefined;
  readonly again: boolean;
  /** The control that failed: it is scrolled clear of the banner. */
  readonly source: Element | null;
}

/**
 * The words and the way out for each kind of failure (D-618; Sage's signed words, mapped to keys at `docs/signed-english.md`). A kind with no
 * key yet says `notice.malfunction` and nothing else.
 *   retry   Try again, when the caller can run the action again (`options.retry`).
 *   signIn  Sign in, back to this screen where Sign in can take the person back to it.
 *   reload  Show the latest, re-reading the screen.
 * The second failure of the same action adds Get help, and says that Help has more ways to sort it out.
 */
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
    paddingInline: spacingVars['--spacing-4'],
    pointerEvents: 'none',
  },
  // How far up it sits: measured (see `useBottomInset`), so a dynamic style, not an inline one.
  raisedBy: (inset: number) => ({ bottom: `calc(${inset}px + var(--spacing-3) + env(safe-area-inset-bottom, 0px))` }),
  stack: {
    width: '100%',
    maxWidth: '560px',
    display: 'flex',
    flexDirection: 'column',
    gap: spacingVars['--spacing-2'],
    // The host takes no taps (the page under it stays usable); what is in the stack does.
    pointerEvents: 'auto',
  },
});

/** How far up the stack sits: above the tab bar when there is one, and above the keyboard when it is up. */
function useBottomInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
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
  }, []);
  return inset;
}

function FailureBanner({ failure, onClose }: { readonly failure: Failure; readonly onClose: () => void }) {
  const { t } = useI18n();
  const kind = failure.kind;
  const kindKey = failureKindKey(kind);
  // The second failure of the same action says Help has more, and offers Get help; offline it does not: the help desk is on the website, and
  // a phone with no network cannot reach it, so offline keeps its own words and Try again (D-618, Mira 19 October).
  const second = failure.again && kind !== 'offline';
  // A word is a key's, or the one line every failure said before the keys existed; a missing key comes back as itself.
  const said = (key: string, fallback?: string): string | undefined => {
    const text = t(key);
    if (text !== key) return text;
    return fallback ? t(fallback) : undefined;
  };
  const title = (second ? said('notice.malfunction.again.title') : undefined) ?? said(`notice.malfunction.${kindKey}.title`, 'notice.malfunction') ?? '';
  const body = second
    ? (said('notice.malfunction.again.body') ?? said(`notice.malfunction.${kindKey}.body`))
    : said(`notice.malfunction.${kindKey}.body`);

  const actions = useMemo(() => {
    const list: { label: string; onPress: () => void }[] = [];
    const way = WAY_OUT[kind];
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
            onClose();
            // Back to this screen afterwards where Sign in can take the person back to it (its short list of screens); Home otherwise.
            const next = safeNext(window.location.pathname);
            navigate(next ? `/signin/?next=${next}` : '/signin/');
          },
        });
    }
    if (way === 'retry' && failure.retry) {
      const retry = failure.retry;
      const text = label('retry', 'messages.thread.tryAgain');
      if (text)
        list.push({
          label: text,
          onPress: () => {
            onClose();
            retry();
          },
        });
    }
    if (way === 'reload') {
      const refresh = failure.refresh;
      const text = label('reload');
      if (text)
        list.push({
          label: text,
          onPress: () => {
            onClose();
            if (refresh) refresh();
            else window.location.reload();
          },
        });
    }
    // Get help: when the same action fails a second time, and always for "Pam couldn't do that" (Try again would send the same thing). It opens the
    // help desk's page for this (Wren), and never says "contact Pam".
    if (kind === 'refused' || second) {
      const text = label('help', 'help.title');
      if (text)
        list.push({
          label: text,
          onPress: () => {
            onClose();
            navigate(`${HELP_DESK_URL}something-didnt-go-through/`);
          },
        });
    }
    return list;
    // `t` changes with the language; the rest is fixed for this failure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, failure, t, onClose]);

  return <MalfunctionBanner title={title} body={body} actions={actions} tone={kind === 'server' || kind === 'timeout' ? 'fault' : 'calm'} onClose={onClose} />;
}

export function BottomStack({
  notices,
  failure,
  onCloseBanner,
  onCloseNotice,
}: {
  readonly notices: readonly StackNotice[];
  readonly failure: Failure | null;
  readonly onCloseBanner: () => void;
  readonly onCloseNotice: (id: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const inset = useBottomInset();

  // A failure is gone with the next tap or key, a successful retry, or leaving the screen: never on a timer. A tap inside the stack is its own
  // (its buttons do their work), and Tab only moves toward them.
  const seq = failure?.seq;
  useEffect(() => {
    if (seq === undefined) return;
    const inside = (target: EventTarget | null) => target instanceof Node && !!hostRef.current?.contains(target);
    const onPointer = (event: Event) => {
      if (!inside(event.target)) onCloseBanner();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key === 'Shift' || inside(event.target)) return;
      onCloseBanner();
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [seq, onCloseBanner]);

  // The control that failed is never under the banner: scroll it clear.
  const source = failure?.source ?? null;
  useEffect(() => {
    if (seq === undefined || !source || !hostRef.current) return;
    const top = hostRef.current.getBoundingClientRect().top;
    const control = source.getBoundingClientRect();
    if (control.bottom > top - 8) window.scrollBy({ top: control.bottom - top + 16, behavior: 'auto' });
  }, [seq, source, inset]);

  return (
    <div ref={hostRef} {...stylex.props(styles.host, styles.raisedBy(inset))}>
      <div {...stylex.props(styles.stack)}>
        {notices.map((notice) => (
          <NoticeToast key={notice.id} spec={notice.spec} onClose={() => onCloseNotice(notice.id)} />
        ))}
        {failure ? <FailureBanner key={failure.seq} failure={failure} onClose={onCloseBanner} /> : null}
      </div>
    </div>
  );
}
