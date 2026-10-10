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
 * Where the public site itself lives, for the absolute address of its social
 * preview (a link-unfurling bot needs a full URL, not `/og/social.png`).
 * `joinpam.org` is Pam's domain (10 October; the site is the bare domain, the app is
 * `app.joinpam.org`). Set `NEXT_PUBLIC_SITE_URL` at build time to point somewhere
 * else, such as a Vercel preview.
 */
export const SITE_URL = (
  process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://joinpam.org'
).replace(/\/$/, '');
