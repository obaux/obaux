import { appErrorCode, appErrorRoute, classifyFailure, isAppErrorAction, type FailureKind } from '@pam/config';

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
  const error = caught as { name?: unknown; code?: unknown; status?: unknown } | null | undefined;
  if (error?.name === 'AbortError') return 'timeout';
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
export function failureKindOf(caught: unknown, online: boolean = typeof navigator === 'undefined' || navigator.onLine !== false): FailureKind {
  if (String((caught as { message?: unknown } | null | undefined)?.message ?? '').includes('PAM_RATE_LIMITED')) return 'too-many';
  return classifyFailure(codeFromError(caught, online), online);
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
