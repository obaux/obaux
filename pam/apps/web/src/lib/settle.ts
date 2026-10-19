/**
 * Waiting for a save that may not answer (D-616). Kept apart from the alert (`malfunction.tsx`) so a module that only waits on a save, and the
 * tests of it, need neither React nor the router.
 */

/** A save, a switch or a tap that has not been answered in this long counts as failed; a send keeps its 30 (D-616). */
export const SAVE_TIMEOUT_MS = 15_000;

export type Settled<T> =
  | { readonly status: 'ok'; readonly value: T }
  | { readonly status: 'failed'; readonly error: unknown }
  /** No answer in time. `late` settles when the save finally answers, success or failure: read the truth again then. */
  | { readonly status: 'timeout'; readonly error: unknown; readonly late: Promise<void> };

/** What a save with no answer in time is, to the log: an abort, which `codeFromError` names `timeout` (Iris, D-618). */
export function timeoutError(): Error {
  return Object.assign(new Error('timeout'), { name: 'AbortError' });
}

/**
 * A failed answer with the HTTP status it came with. A 500 from the gateway has no SQLSTATE, so the status is what names it; without it
 * the log says `unknown` (Iris L5). The message stays in hand for the alert's kind (a guard's own words, D-618); the log never sends it.
 */
export function withStatus(error: unknown, status: unknown): unknown {
  if (!error || typeof error !== 'object') return error;
  const { name, code, message } = error as { name?: unknown; code?: unknown; message?: unknown };
  return { name, code, message, status };
}

/** Waits for a save for `ms`; after that it is called failed, and the late answer is handed back to be re-read (Iris's A6). */
export function settleWithin<T>(save: Promise<T>, ms = SAVE_TIMEOUT_MS): Promise<Settled<T>> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ status: 'timeout', error: timeoutError(), late: save.then(() => undefined, () => undefined) });
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
