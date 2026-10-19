'use client';

import { useMemo } from 'react';
import * as stylex from '@stylexjs/stylex';
import type { FailureKind } from '@pam/config';
import type { NoticeToastSpec } from '@pam/ui/noticeSink';
import { MalfunctionBanner } from './MalfunctionBanner';
import { NoticeToast } from './NoticeToast';
import { useI18n } from './i18n';
import { navigate } from './navigate';
import { safeNext } from './signinNext';
import { failureKindOf } from './reportAppError';

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
  readonly error: unknown;
  readonly retry: (() => void) | undefined;
  readonly refresh: (() => void) | undefined;
  readonly again: boolean;
}

/**
 * The words and the way out for each kind of failure (D-618; Sage's signed words, mapped to keys at `docs/signed-english.md`). A kind with no
 * key yet says `notice.malfunction` and nothing else.
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
  server: 'retry',
};

const styles = stylex.create({
  stack: {
    width: '100%',
    maxWidth: '560px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    // The host takes no taps (the page under it stays usable); what is in the stack does.
    pointerEvents: 'auto',
  },
});

function FailureBanner({ failure, onClose }: { readonly failure: Failure; readonly onClose: () => void }) {
  const { t } = useI18n();
  const kind = failureKindOf(failure.error);
  const kindKey = KIND_KEY[kind];
  // A word is a key's, or the one line every failure said before the keys existed; a missing key comes back as itself.
  const said = (key: string, fallback?: string): string | undefined => {
    const text = t(key);
    if (text !== key) return text;
    return fallback ? t(fallback) : undefined;
  };
  const title = said(`notice.malfunction.${kindKey}.title`, 'notice.malfunction') ?? '';
  const body = failure.again
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
    if (failure.again) {
      const text = label('help', 'help.title');
      if (text)
        list.push({
          label: text,
          onPress: () => {
            onClose();
            navigate('/help/');
          },
        });
    }
    return list;
    // `t` changes with the language; the rest is fixed for this failure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, failure, t, onClose]);

  return <MalfunctionBanner title={title} body={body} actions={actions} onClose={onClose} />;
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
  return (
    <div {...stylex.props(styles.stack)}>
      {notices.map((notice) => (
        <NoticeToast key={notice.id} spec={notice.spec} onClose={() => onCloseNotice(notice.id)} />
      ))}
      {failure ? <FailureBanner key={failure.seq} failure={failure} onClose={onCloseBanner} /> : null}
    </div>
  );
}
