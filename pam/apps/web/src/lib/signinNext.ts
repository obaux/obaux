/**
 * A way on after Sign in: `/signin/?next=/profile/add-program/` (S1, Iris's b25 re-test; Mira, 13 October).
 *
 * The website's "Add your program" lands here, where a new person signs up as a member and would otherwise have to find
 * Profile › Add my program themselves (D-525). The value comes out of a URL anybody can write, so it is trusted for nothing but
 * being one of the few Pam screens listed below: an exact match, never an address, a scheme, a host, a `//`, or anything else. Anything
 * not on the list is `null` and Sign in behaves as if it had not been there. It is kept for the length of the sign-up (the tab's
 * session storage) and used once, after the person is in; an account that already runs a program (a program lead) ignores it.
 */
export const NEXT_ALLOWED: readonly string[] = ['/profile/add-program/'];

const KEY = 'pam.signin-next';

export function safeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  // Written without its closing slash is the same screen.
  const path = value.endsWith('/') ? value : `${value}/`;
  return NEXT_ALLOWED.includes(path) ? path : null;
}

export function rememberNext(value: string | null | undefined): void {
  const next = safeNext(value);
  if (!next) return;
  try {
    window.sessionStorage.setItem(KEY, next);
  } catch {
    // Without storage the person lands Home, as before.
  }
}

/**
 * The remembered way on, once: it is forgotten as it is read, whether or not it is taken, so it can never fire on a later visit to Sign in.
 * Only a member is taken there (Add my program is offered to members alone: a program lead, a case manager and a super admin get `null`).
 * `role` left out is a brand-new account in the join flow, which is a member's.
 */
export function takeNext(role?: string | null): string | null {
  try {
    const stored = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    if (role !== undefined && role !== 'member') return null;
    return safeNext(stored);
  } catch {
    return null;
  }
}
