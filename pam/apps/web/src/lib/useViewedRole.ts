'use client';

import type { Role } from '@pam/config';
import { useViewAs } from './useViewAs';

/**
 * Which role's screen to draw, on any page — not only Home.
 *
 * The switcher that sets this lives on Home, but `useViewAs` reads its choice
 * out of `sessionStorage`, so any screen can ask the same question and get the
 * same answer without the switcher being on it. Before this, every screen but
 * Home asked `session.session.role` directly, so a super admin who chose
 * "Viewing as Program" and then tapped Places, Saved, or the case manager
 * screen fell straight back to their own role the moment they left Home — the
 * header said one thing and the next screen said another (Will, 16 September:
 * "on the top of alerts, it seems like I can't view it from the view of
 * different users").
 *
 * Still a rendering choice, not an identity (see `useViewAs`): a page that
 * gates a query on the viewed role — `admin`'s caseload, `directory`'s people
 * list — is deciding what to *draw* for a super admin previewing that role,
 * never who the query runs as. The database still knows only the real
 * `auth.uid()`, so a super admin previewing "Case manager" sees the case
 * manager screen with *their own* (typically empty) caseload, not anybody
 * else's — the same principle Home already used for its tiles, applied
 * everywhere a screen decides what it is allowed to show by role.
 */
export function useViewedRole(trueRole: Role | null): Role | null {
  const { viewAs } = useViewAs(trueRole);
  return viewAs ?? trueRole;
}
