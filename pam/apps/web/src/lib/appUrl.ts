import { APP_URL } from './project';

/**
 * Where PAM lives on the web.
 *
 * Every invite arrives as a link in a text message, so this is the first thing
 * a member ever taps — before there is an app on their phone, and possibly
 * before they have decided to install one. It has to resolve to a real page.
 *
 * The address is checked in (see ./project), so a link is correct in a browser,
 * in the Capacitor shell and in a preview build without anybody setting
 * anything. It was briefly the origin the page was served from, which is right
 * in a browser and wrong in the shell, where the origin is a local file server —
 * and a text message saying `capacitor://localhost` is a dead end for whoever
 * receives it.
 */
export function appUrl(): string {
  return APP_URL;
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
