import type { Role } from '@pam/config';
import { MEMBER_TABS, type TabKey } from '@pam/ui/TabBar';

/**
 * The bottom bar for each kind of account (D-218, Will, 2 October).
 *
 * - A member: Explore, Saved, Trips, Messages, Profile.
 * - A case manager: Home (their caseload), Saved (the people they starred),
 *   Messages, Profile — no Trips; they do not plan visits.
 * - A program lead: Home (who is coming in, by day, week or month), Program
 *   (their own listing), Messages, Profile — no Saved, no Trips.
 * - A super admin on their own account has the member's bar; previewing a
 *   role (D-108), the bar is that role's.
 */
export function tabsFor(role: Role | null | undefined): readonly TabKey[] {
  if (role === 'admin') return ['explore', 'saved', 'messages', 'profile'];
  if (role === 'provider') return ['explore', 'program', 'messages', 'profile'];
  // A super admin's first tab is Home — the staff requests (D-257) — and
  // nothing a member keeps: no Saved, no Trips.
  if (role === 'super_admin') return ['explore', 'messages', 'profile'];
  return MEMBER_TABS;
}

/** Staff read Home on the first tab, not Explore (D-212). */
export function firstTabIsHome(role: Role | null | undefined): boolean {
  return role === 'admin' || role === 'provider' || role === 'super_admin';
}

/**
 * Which bottom-bar tab a path belongs to; `null` hides the bar.
 *
 * Only the five tab screens draw it (D-213): anything you tap into — a place,
 * a person, a conversation, Legal, Get help — is a nested screen on the
 * template, with its own way back and no bar, as in Will's references. The
 * old addresses of a tab (`/places/`, `/interested/`, `/account/`) are the same
 * tab. The path may or may not end in a slash (the app is exported with one).
 */
export function tabFor(pathname: string): TabKey | null {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  switch (path) {
    case '/':
    case '/places/':
    case '/interested/':
      return 'explore';
    case '/saved/':
      return 'saved';
    case '/trips/':
      return 'trips';
    case '/program/':
      return 'program';
    case '/messages/':
      return 'messages';
    case '/profile/':
    case '/account/':
      return 'profile';
    default:
      return null;
  }
}
