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
  return MEMBER_TABS;
}

/** Staff read Home on the first tab, not Explore (D-212). */
export function firstTabIsHome(role: Role | null | undefined): boolean {
  return role === 'admin' || role === 'provider';
}
