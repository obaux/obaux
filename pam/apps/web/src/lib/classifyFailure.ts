import type { FailureKind } from '@pam/config';
import { codeFromError, failureFor, reportAppError } from './reportAppError';
import { createClient } from './supabase';

/**
 * What kind of failure this is, and the log of it (D-618). Its own module so that the classifier, the reporter and the session check are not in
 * the root bundle: they are fetched at idle, and a failure only waits for them if the page has not been idle yet.
 *
 * `'done'` means the outcome the person wanted has in fact already happened (a place already saved, a visit already cancelled, a request
 * already decided): nothing is shown and nothing is logged. Otherwise the failure is logged (a code only) and its kind returned. Whether
 * there is a signed-in session turns the database's refusal of the anonymous key into "signed out".
 */
export async function classifyAndLog(action: string, error: unknown): Promise<FailureKind | 'done'> {
  let signedIn: boolean | undefined;
  try {
    signedIn = Boolean((await createClient().auth.getSession()).data.session);
  } catch {
    signedIn = undefined;
  }
  const kind = failureFor(action, error, signedIn === undefined ? {} : { signedIn });
  if (kind === 'done') return 'done';
  reportAppError({ action, code: codeFromError(error) });
  return kind;
}

/**
 * The control a failure came from, for "Try again" and the scroll-clear: the one the caller named (the pressable around it), else the one pressed last
 * if that was in the last 20 seconds (a save gives up after 15, settle.ts), else whatever the caller named. A button the save disabled has lost focus
 * by the time it fails, so the caller's `document.activeElement` is often the page itself.
 */
const PRESS = 'button, a[href], [role="button"], [role="switch"], [role="checkbox"], input[type="checkbox"]';
export function sourceOf(from: Element | null | undefined, pressed: { readonly element: Element; readonly at: number } | null): Element | null {
  const there = (element: Element | null | undefined): element is Element => !!element && element.isConnected && element !== document.body && element !== document.documentElement;
  const named = there(from) ? from : null;
  return named?.closest(PRESS) ?? (pressed && Date.now() - pressed.at < 20_000 && there(pressed.element) ? pressed.element : null) ?? named;
}
