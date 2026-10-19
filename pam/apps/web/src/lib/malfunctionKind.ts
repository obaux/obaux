/**
 * What kind of failure a code is, so the alert can say what to do (D-618). Only a code arrives here (D-616: never the error itself),
 * the same closed shapes `reportAppError` takes: an HTTP status, a Postgres SQLSTATE, `offline`, `timeout` or `unknown`.
 * A stand-in for Nico's `classifyFailure` when it lands: one function, one place to swap.
 */
export type FailureKind = 'offline' | 'signedOut' | 'server' | 'other';

export function failureKindOf(code: string | number): FailureKind {
  if (code === 'offline' || code === 'timeout') return 'offline';
  // 42501 is what the database answers a call from someone not signed in (or not allowed); PGRST301, an expired sign-in, reaches the log as
  // `unknown` (only the closed shapes do), so it cannot be told from here: Nico's `classifyFailure` sees the whole error.
  if (code === 401 || code === '401' || code === '42501') return 'signedOut';
  if (typeof code === 'number' ? code >= 500 && code <= 599 : /^5\d\d$/.test(code)) return 'server';
  return 'other';
}
