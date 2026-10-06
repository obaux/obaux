import { APP_URL } from './project';

/**
 * Where Pam lives on the web.
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

/** Who an invite is for, as the database names the role. */
export type InviteRole = 'member' | 'provider' | 'admin';

/** The same, as the link says it — words a person could read in a text. */
const ROLE_IN_LINK: Record<InviteRole, string> = {
  member: 'member',
  provider: 'program',
  admin: 'case-manager',
};

/**
 * The link that goes in an invite text (D-254, Will, 3 October: "instead of
 * a special code, a unique url to a sign in page").
 *
 * Sign in itself, with the code and who it is for: the screen says "You were
 * invited to be a case manager…" and the code rides along to joining, so
 * nobody types it. The role in the link is for the words on the screen only
 * — `redeem_invite` decides the real role from the code, so editing the link
 * changes a sentence, never what somebody can do.
 *
 * Short on purpose: it shares a 160-character message with the rest of the
 * copy (see the GSM-7 note in @pam/config/sms-templates). It replaces the
 * `/j/{code}` form, which no page ever answered — a static export cannot
 * serve a path per code.
 */
export function inviteLink(code: string, role: InviteRole, trip?: string | null): string {
  // A visit booked for them before they had Pam rides along (D-322), so
  // their first screen can be that visit.
  const extra = trip ? `&trip=${encodeURIComponent(trip)}` : '';
  return `${appUrl()}/signin/?invite=${encodeURIComponent(code)}&as=${ROLE_IN_LINK[role]}${extra}`;
}

/** An invite read back out of a link's query, or null if it carries none. */
export interface Invite {
  readonly code: string;
  readonly role: InviteRole;
  /** A trip a program booked for this person before they joined (D-322). */
  readonly trip?: string | null;
}

export function readInvite(params: { get(name: string): string | null } | null | undefined): Invite | null {
  const code = params?.get('invite')?.trim().toUpperCase();
  if (!code) return null;
  const as = params?.get('as');
  const role: InviteRole = as === 'program' ? 'provider' : as === 'case-manager' ? 'admin' : 'member';
  const trip = params?.get('trip')?.trim() || null;
  return trip ? { code, role, trip } : { code, role };
}

/** Who a page is for, from `?as=` alone — no invite needed (D-259). */
export function readAudience(params: { get(name: string): string | null } | null | undefined): InviteRole | null {
  const as = params?.get('as');
  return as === 'program' ? 'provider' : as === 'case-manager' ? 'admin' : as === 'member' ? 'member' : null;
}

/*
 * Kept for the step after the phone is verified. Sign in hands a person with
 * no account to /join/, a different page, and the code has to arrive with
 * them. Session storage, not local: it belongs to this visit, and a shared
 * phone should not hand somebody else's invite to the next person who opens
 * Pam. Every access is guarded — private windows throw.
 */
const KEY = 'pam.invite';

export function rememberInvite(invite: Invite): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(invite));
  } catch {
    // Without storage the join form still takes the code by hand.
  }
}

export function recallInvite(): Invite | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Invite>;
    if (typeof parsed.code !== 'string' || !parsed.code) return null;
    const role: InviteRole = parsed.role === 'provider' || parsed.role === 'admin' ? parsed.role : 'member';
    return typeof parsed.trip === 'string' && parsed.trip ? { code: parsed.code, role, trip: parsed.trip } : { code: parsed.code, role };
  } catch {
    return null;
  }
}

export function forgetInvite(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to forget.
  }
}
