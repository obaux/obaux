/**
 * Where PAM lives on the web.
 *
 * Every invite arrives as a link in a text message, so this is the first thing
 * a member ever taps — before there is an app on their phone, and possibly
 * before they have decided to install one. It has to resolve to a real page.
 *
 * Set `NEXT_PUBLIC_APP_URL` in the hosting environment. The fallback is the
 * origin the page was served from, which is right in a browser and wrong in the
 * Capacitor shell (where the origin is a local file server), so the shell build
 * must set it explicitly.
 */
export function appUrl(): string {
  const configured = process.env['NEXT_PUBLIC_APP_URL'];
  if (configured) return configured.replace(/\/+$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}

/**
 * The link that goes in an invite text.
 *
 * Short on purpose: it shares a 160-character message with the rest of the
 * copy, and a long link is the thing most likely to push a reminder onto a
 * second message (see the GSM-7 note in @pam/config/sms-templates).
 */
export function inviteLink(code: string): string {
  return `${appUrl()}/j/${encodeURIComponent(code)}`;
}
