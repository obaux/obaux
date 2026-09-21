'use client';

import { useMemo } from 'react';
import { DUMMY_MEMBERS, DUMMY_EVERYONE, DUMMY_INTERESTED } from '@pam/config/dummy-people';
import { dummyConversationsFor } from '@pam/config/dummy-conversations';
import { rankPeople } from '@pam/config/people-activity';
import { HomePeopleSection } from './HomePeopleSection';

/**
 * A taste of the example people, on Home itself, while a super admin is
 * previewing a role (Will, 16 September: "let's pull in the dummy names for
 * viewing modes into the dashboard home page"). `/admin/`, `/directory/` and
 * `/interested/` already show the full example roster — this is a preview of
 * the same set, so Home itself looks like an app with people in it during a
 * preview rather than only the menu underneath it, and "see all" goes to the
 * real screen for the rest.
 *
 * **A horizontal strip of circles, not a stack of rows** (Will, 16 September:
 * "copying a similar layout to IG stories... free up vertical real estate").
 * A row per person was most of a phone screen for six members before the
 * menu underneath it was even reached; a strip answers "who's here" in the
 * height of one row, and leaves room to grow to more people later without
 * growing the screen with it.
 *
 * The rings are the real rule on example data (D-198), not the every-other-
 * person mock this file carried until 21 September: an unread message in
 * `DUMMY_THREADS` (Keisha's, for a case manager) and a recent `lastSavedAt`
 * in `dummy-people` (Aaliyah's) light exactly the people the real strip
 * would, ranked by the same `rankPeople`. A preview has no "last looked", so
 * the week-long fallback applies; a super admin's preview of Everyone has no
 * conversations of its own (D-171), so only the save lights there.
 *
 * Loaded lazily (see `HomePeoplePreviewLazy`) for the same reason
 * `RoleSwitchLazy` is: this renders for exactly the one role — a super admin
 * actively previewing something other than their own account — that can ever
 * see it, so nobody else's first load should carry its weight.
 */

const PEOPLE = {
  admin: DUMMY_MEMBERS,
  super_admin: DUMMY_EVERYONE.slice(0, 6),
  provider: DUMMY_INTERESTED.map((interest) => interest.person),
} as const;

export function HomePeoplePreview({ role }: { readonly role: 'admin' | 'super_admin' | 'provider' }) {
  const ranked = useMemo(() => {
    const unreadBy = new Map<string, { at: string; conversationId: string }>();
    if (role !== 'super_admin') {
      for (const c of dummyConversationsFor(role)) {
        if (c.unread && c.lastMessageAt) unreadBy.set(c.otherId, { at: c.lastMessageAt, conversationId: c.id });
      }
    }
    return rankPeople(
      PEOPLE[role].map((person) => ({
        id: person.id,
        firstName: person.firstName,
        conversationId: unreadBy.get(person.id)?.conversationId ?? null,
        lastSavedAt: person.lastSavedAt ?? null,
      })),
      (p) => ({ unreadAt: unreadBy.get(p.id)?.at ?? null, lastSavedAt: p.lastSavedAt }),
      null,
    );
  }, [role]);

  return <HomePeopleSection role={role} ranked={ranked} isExample />;
}
