/**
 * Where the member app lives. The public site never signs anybody in; it sends
 * them to the app. Same default and same override as
 * `apps/web/src/lib/project.ts` (`APP_URL`) — change both together, or set
 * `NEXT_PUBLIC_APP_URL` for the build (docs/changing-the-domain.md).
 */
export const APP_URL = (
  process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://web-ten-umber-88.vercel.app'
).replace(/\/$/, '');

export const SIGN_IN_URL = `${APP_URL}/signin/`;
export const PRIVACY_URL = `${APP_URL}/privacy/`;
export const TERMS_URL = `${APP_URL}/terms/`;
