import { appErrorCode, appErrorRoute, classifyFailure, classifyGuardMessage, isAppErrorAction, type FailureKind } from '@pam/config';

/**
 * Tells the team that something a person did did not work (D-616; Will: "if something breaks, create an error log so the team can
 * be notified and fix the issue"). A screen that shows a failed-action alert also calls this, with two things and nothing else:
 *
 *   - `action`: a key from the closed list in `@pam/config` (`messages.send`, `alerts.switch.closed`, ...). Anything off the list is
 *     dropped here, and again by the database.
 *   - `code`: what the failure was, as a number or a short code: an HTTP status, a Postgres SQLSTATE, `offline`, `timeout` or
 *     `unknown`. NEVER an error's message: it carries the value that broke it (a phone number, a name). `appErrorCode` keeps only
 *     the closed shapes and turns everything else into `unknown`, so a caller that passes `error.message` by mistake sends `unknown`.
 *
 * What goes with it is only where and on what: the screen's path (the database cuts it to a pattern), the build, the platform
 * and the language. Never who: the database reads the person's role from their sign-in and the log keeps no account.
 *
 * It never throws and never makes the caller wait. With the switch off (`app_errors_live`) the database takes nothing and
 * answers `false`; the app does not read the switch first, so a failure costs one quiet call, not two. A report that cannot go
 * because the phone is offline waits in memory (ten at most, the oldest dropped first) and goes when the network is back. It is
 * not written to the phone's storage: a report lost with the app closed is a smaller harm than a new thing kept on the device.
 */
export interface AppErrorReport {
  readonly action: string;
  readonly code?: string | number | null;
}

interface Wire {
  readonly p_area: string;
  readonly p_action: string;
  readonly p_code: string;
  readonly p_build: string | null;
  readonly p_platform: string;
  readonly p_locale: string | null;
}

/** What the reporter needs from its surroundings; the tests give it fakes. */
export interface ReporterDeps {
  /** Resolves true when the database was reached (even if it declined), false when the network failed. */
  readonly send: (wire: Wire) => Promise<boolean>;
  readonly online: () => boolean;
  /** Calls `fn` once, the next time the network comes back. */
  readonly whenOnline: (fn: () => void) => void;
  readonly describe: () => Pick<Wire, 'p_area' | 'p_build' | 'p_platform' | 'p_locale'>;
}

export const APP_ERROR_QUEUE_MAX = 10;

export function createReporter(deps: ReporterDeps): (report: AppErrorReport) => void {
  const queue: Wire[] = [];
  let flushing = false;
  let waiting = false;

  async function flush(): Promise<void> {
    if (flushing) return;
    flushing = true;
    try {
      while (queue.length > 0) {
        if (!deps.online()) {
          if (!waiting) {
            waiting = true;
            deps.whenOnline(() => {
              waiting = false;
              void flush();
            });
          }
          return;
        }
        const next = queue[0]!;
        let reached = false;
        try {
          reached = await deps.send(next);
        } catch {
          reached = false;
        }
        if (!reached) {
          // The network failed under us: keep it, and try again when the network says it is back.
          if (!waiting) {
            waiting = true;
            deps.whenOnline(() => {
              waiting = false;
              void flush();
            });
          }
          return;
        }
        queue.shift();
      }
    } finally {
      flushing = false;
    }
  }

  return (report) => {
    try {
      if (!isAppErrorAction(report.action)) return;
      const code = appErrorCode(report.code);
      queue.push({ ...deps.describe(), p_action: report.action, p_code: code });
      while (queue.length > APP_ERROR_QUEUE_MAX) queue.shift();
      void flush();
    } catch {
      /* a report must never break the screen that sent it */
    }
  };
}

/** What an action answers when the screen draws the failure itself (`useMalfunction().show`): the code is already a closed shape. */
export type ActionResult = { readonly ok: true } | { readonly ok: false; readonly code: string };

/**
 * The code for a caught failure: `offline` when the phone has no network, `timeout` for an abort, else the error's own status or
 * SQLSTATE if it has one of the closed shapes (anything else becomes `unknown` when it is reported). Never its message.
 */
export function codeFromError(caught: unknown, online: boolean = typeof navigator === 'undefined' || navigator.onLine !== false): string {
  if (!online) return 'offline';
  // A caller that has only a word to give (`'timeout'`) gives it as the error itself.
  if (typeof caught === 'string') return appErrorCode(caught);
  const error = caught as { name?: unknown; message?: unknown; code?: unknown; status?: unknown } | null | undefined;
  // supabase-js reports an abort as an error with no name, only a message that begins with it; a fetch abort has the name.
  if (error?.name === 'AbortError' || (typeof error?.message === 'string' && /^AbortError\b/.test(error.message))) return 'timeout';
  // A SQLSTATE is the most exact thing the database says; a PostgREST error with none (a 500, a gateway) is named by the HTTP status
  // of the answer instead (Iris D2).
  const own = appErrorCode(typeof error?.code === 'string' || typeof error?.code === 'number' ? error.code : null);
  if (own !== 'unknown') return own;
  return appErrorCode(typeof error?.status === 'number' || typeof error?.status === 'string' ? error.status : null);
}

/**
 * The kind of a caught failure, for the alert's words (D-618): the same code the log holds, put through `classifyFailure`. Takes the error
 * (or the `{ code }` a screen hands `useMalfunction().show`); the one case a code cannot say, a send refused for sending too fast, is read
 * from its message here, where the message is still in hand, and the message goes no further.
 */
export function failureKindOf(caught: unknown, options: boolean | FailureOptions = {}): FailureKind {
  const { online = typeof navigator === 'undefined' || navigator.onLine !== false, signedIn } = typeof options === 'boolean' ? { online: options } : options;
  if (!online) return 'offline';
  const error = caught as { message?: unknown; code?: unknown } | string | null | undefined;
  // The whole error is read before `appErrorCode` narrows it: an expired sign-in (PGRST301) or a missing row (PGRST116) is told apart here,
  // where the log would only hold "unknown". A guard's own word, where the message is still in hand, says more than the code (every guard is
  // P0001 / 400); none of the message goes further.
  const named = classifyGuardMessage(typeof error === 'object' && error !== null ? error.message : undefined);
  if (named) return named;
  const raw = typeof error === 'object' && error !== null && typeof error.code === 'string' ? error.code : null;
  // With no sign-in the client falls back to the anonymous key, and a refusal for that is 42501, the same code as "this account may not".
  if (signedIn === false && raw === '42501') return 'signed-out';
  if (raw && classifyFailure(raw, true) !== 'server') return classifyFailure(raw, true);
  const code = codeFromError(caught, online);
  if (signedIn === false && code === '42501') return 'signed-out';
  return classifyFailure(code, online);
}

export interface FailureOptions {
  /** Whether the phone has a network (read from the browser when left out). */
  readonly online?: boolean;
  /** Whether there is a signed-in session. Left out when it is not known; `false` turns a 42501 (the anonymous key's refusal) into signed-out. */
  readonly signedIn?: boolean;
}

/**
 * What the alert should do about a failed action: `'done'` when the outcome the person wanted has in fact already happened, so nothing is
 * shown (saving a place that is already saved, cancelling a visit that is already cancelled, deciding a request somebody else decided),
 * else the kind. A send whose 30-second abort landed is not decided here: Try again looks for the first copy before it sends another.
 */
export function failureFor(action: string, caught: unknown, options: boolean | FailureOptions = {}): FailureKind | 'done' {
  const message = String((caught as { message?: unknown } | null | undefined)?.message ?? '');
  const code = String((caught as { code?: unknown } | null | undefined)?.code ?? '');
  if (action === 'places.save' && code === '23505') return 'done';
  if (action === 'trips.cancel' && /TRIP_NOT_FOUND|VISIT_CANCELLED/.test(message)) return 'done';
  if (action === 'requests.review' && /ALREADY_DECIDED/.test(message)) return 'done';
  return failureKindOf(caught, options);
}

/** Whether the phone says it has no network. A save checks this first and says so at once instead of waiting for a request to fail (Iris L7). */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** The code for a failed call whose answer carries a status: `const { error, status } = await ...; codeFromAnswer(error, status)`. */
export function codeFromAnswer(error: unknown, status: unknown): string {
  const base = (error ?? {}) as { name?: unknown; code?: unknown };
  return codeFromError({ name: base.name, code: base.code, status });
}

/** Whether the database answered at all: any HTTP status means it did (even a 5xx with nothing in it); only a network failure (status 0) did not. */
export function databaseAnswered(answer: { readonly status?: number }): boolean {
  return typeof answer.status === 'number' && answer.status > 0;
}

function platform(): string {
  const cap = (globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const p = cap?.getPlatform?.();
  return p === 'ios' || p === 'android' ? p : 'web';
}

export const reportAppError = createReporter({
  send: async (wire) => {
    // Loaded when a report goes, not with the page: every route's Providers import this file (through the malfunction alert),
    // and a static import put the whole Supabase client in the root layout's chunk, 84 kB over §12's budget (b76).
    const { createClient } = await import('./supabase');
    // Any answer is an answer (a refusal, a 5xx with nothing in it): it is dropped, not sent again with every later failure (Iris D3).
    // Only a network failure stays queued.
    return databaseAnswered(await createClient().rpc('report_app_error', wire));
  },
  online: () => typeof navigator === 'undefined' || navigator.onLine !== false,
  whenOnline: (fn) => {
    if (typeof window !== 'undefined') window.addEventListener('online', fn, { once: true });
  },
  describe: () => {
    let locale: string | null = null;
    try {
      locale = typeof document !== 'undefined' ? document.documentElement.lang || null : null;
    } catch {
      locale = null;
    }
    return {
      p_area: typeof location !== 'undefined' ? appErrorRoute(location.pathname) : '/',
      p_build: process.env['NEXT_PUBLIC_PAM_BUILD'] ?? null,
      p_platform: platform(),
      p_locale: locale,
    };
  },
});
