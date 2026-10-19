/**
 * What kind of failure it was, in a few kinds a person can act on (D-618, Will, 19 October: the error alert should "let users know how to
 * resolve it, analyze types of error, and troubleshoot solutions"). The words for each kind are Sage's and Lena's; the screen reads the kind
 * from `classifyFailure` and never the error itself. The kinds come from the codes the error log already captures (`appErrorCode`, and
 * `codeFromAnswer`, which names a failure with no SQLSTATE by its HTTP status), so the log and the alert say the same thing.
 *
 *   offline     no network: the phone says offline, or no answer came back at all (status 0).
 *   timeout     no answer in 15 seconds.
 *   signed-out  the sign-in is no longer good (401, PGRST301, an expired token): sign in again.
 *   not-allowed this account may not do it (403, 42501).
 *   too-many    too many tries in a short time (429, PAM_RATE_LIMITED): wait a little.
 *   changed     someone changed it first, or it is already done (409, 23505, 40001).
 *   gone        what it points at is not there any more (404, 406, PGRST116, 23503).
 *   wrong-time  the time is not right for it yet or any more: the visit's window (OUTSIDE_THE_VISIT_WINDOW) or a visit planned too late
 *               (PLANNED_TOO_LATE). Nothing to fix; it works near the time of the visit.
 *   refused     the database turned the request down with a reason of its own (a guard: 400, P0001, bad data). Only what no guard word names
 *               (below) lands here.
 *   server      Pam's side, or not known: a 5xx, and every code not listed (unknown). The kind to fall back to.
 *
 * Mapped from what the database really sends: a PostgREST `PGRST301` arrives with HTTP 401 and `PGRST116` with 406, and `codeFromAnswer`
 * turns both into the HTTP status; `PAM_RATE_LIMITED` is a raised message (SQLSTATE P0001, HTTP 400) and is recognised only where the
 * message is still in hand (the thread's send), not from a code.
 */
export const FAILURE_KINDS = ['offline', 'timeout', 'signed-out', 'not-allowed', 'too-many', 'changed', 'gone', 'wrong-time', 'refused', 'server'] as const;

export type FailureKind = (typeof FAILURE_KINDS)[number];

/** Every code that names a kind, as the log holds it. Anything not here is `server`. */
export const FAILURE_CODES: Readonly<Record<string, FailureKind>> = {
  '000': 'offline',
  offline: 'offline',
  timeout: 'timeout',
  '401': 'signed-out',
  PGRST301: 'signed-out',
  PGRST303: 'signed-out',
  'JWT expired': 'signed-out',
  '403': 'not-allowed',
  '42501': 'not-allowed',
  '429': 'too-many',
  PAM_RATE_LIMITED: 'too-many',
  '409': 'changed',
  '23505': 'changed',
  '40001': 'changed',
  '404': 'gone',
  '406': 'gone',
  PGRST116: 'gone',
  '23503': 'gone',
  '400': 'refused',
  P0001: 'refused',
  '23502': 'refused',
  '23514': 'refused',
};

/**
 * The kind of a failure from its code (as `appErrorCode` / `codeFromAnswer` give it) and whether the phone has a network. Offline wins
 * over any code: a failed call on a phone with no network is the network. Unknown, empty and unlisted codes are `server`.
 */
export function classifyFailure(code: unknown, online: boolean = true): FailureKind {
  if (!online) return 'offline';
  const text = typeof code === 'number' ? String(code) : typeof code === 'string' ? code.trim() : '';
  if (Object.hasOwn(FAILURE_CODES, text)) return FAILURE_CODES[text]!;
  // Class 22 of the SQLSTATEs is "bad data": the database turned the request down.
  return /^22[0-9A-Z]{3}$/.test(text) ? 'refused' : 'server';
}

/**
 * The kind a database guard's own words name, where the message is still in hand (the screen's error, before it is dropped). The guards
 * raise a word such as `VISIT_CANCELLED` with no SQLSTATE of their own, so every one of them arrives as P0001 / 400 and the code alone can
 * only say `refused`. Reads only these words (never anything else in the message); null when it names none, and the code decides.
 * `TRIP_NOT_FOUND` is `changed` (the visit was cancelled elsewhere), and the other not-found words are `gone`.
 */
export function classifyGuardMessage(message: unknown): FailureKind | null {
  const text = typeof message === 'string' ? message : '';
  if (/PAM_RATE_LIMITED/.test(text)) return 'too-many';
  if (/JWT expired|JWT (is )?(invalid|malformed)/i.test(text)) return 'signed-out';
  if (/VISIT_CANCELLED|REQUEST_ALREADY_DECIDED|ALREADY_DECIDED|TRIP_NOT_FOUND/.test(text)) return 'changed';
  if (/_NOT_FOUND|\bNOT_FOUND\b|No such (message|account)|nobody else in that conversation/i.test(text)) return 'gone';
  if (/ACCOUNT_NOT_ACTIVE|NOT_A_PROGRAM_LEAD|NO_LEAD_HERE|\bONLY_[A-Z_]+/.test(text)) return 'not-allowed';
  if (/OUTSIDE_THE_VISIT_WINDOW|PLANNED_TOO_LATE/.test(text)) return 'wrong-time';
  if (/ROLE_PAIR_NOT_ALLOWED|ACCOUNT_IN_OTHER_CITY|INVITE_NEEDS_PHONE/.test(text)) return 'refused';
  return null;
}

/** The kind as its locale key part (`notice.malfunction.<key>.title`): `signed-out` is `signedOut`, `wrong-time` is `wrongTime`. */
export function failureKindKey(kind: FailureKind): string {
  return kind.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}
