/**
 * Where the member app lives. The public site never signs anybody in; it sends
 * them to the app. Same default and same override as
 * `apps/web/src/lib/project.ts` (`APP_URL`) — change both together, or set
 * `NEXT_PUBLIC_APP_URL` for the build (docs/changing-the-domain.md).
 */
export const APP_URL = (
  process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://app.joinpam.org'
).replace(/\/$/, '');

export const SIGN_IN_URL = `${APP_URL}/signin/`;
export const PRIVACY_URL = `${APP_URL}/privacy/`;
export const TERMS_URL = `${APP_URL}/terms/`;

/**
 * Privacy or Terms in the app, carrying the page of this site the reader came from, so the app's Back goes
 * back to it (D-508; Will, 11 October: "the app needs to know which page it came from"). `return` is a path
 * on this site, as the browser gives it (`/support/start-here/`); the app accepts only such a path
 * (`apps/web/src/lib/siteReturn.ts`) and falls back to its own Back for anything else.
 */
export function legalUrl(kind: 'privacy' | 'terms', returnPath: string): string {
  return `${APP_URL}/${kind}/?from=site&return=${encodeURIComponent(returnPath)}`;
}

/**
 * Where the public site itself lives, for the absolute address of its social
 * preview (a link-unfurling bot needs a full URL, not `/og/social.png`).
 * `joinpam.org` is Pam's domain (10 October; the site is the bare domain, the app is
 * `app.joinpam.org`). Set `NEXT_PUBLIC_SITE_URL` at build time to point somewhere
 * else, such as a Vercel preview.
 */
export const SITE_URL = (
  process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://joinpam.org'
).replace(/\/$/, '');

/**
 * The help desk's address (A28, Will, 11 October: no phone calls; people write to us). The one place it is
 * written: StillStuck and the post "Your safety" read it here. The form that replaces the plain address is
 * later, behind a switch that is off.
 */
export const HELP_EMAIL = 'hello@joinpam.org';

/**
 * The help desk's form posts here (`help-request`, D-521; the contract is `docs/help-request-contract.md`). It answers
 * 503 `{"live": false}` until Will switches it on, and every failure shows `HELP_EMAIL` instead.
 */
export const HELP_REQUEST_URL = `${(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 'https://shobqzuhicoiymtumiaz.supabase.co'
).replace(/\/$/, '')}/functions/v1/help-request`;

/** The only places the help-request function answers (its ALLOWED_ORIGINS). The form never asks it from anywhere else. */
export const HELP_REQUEST_ORIGINS: readonly string[] = ['https://joinpam.org', 'https://www.joinpam.org'];
