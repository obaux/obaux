import { DUMMY_MEMBERS, DUMMY_EVERYONE, DUMMY_INTERESTED } from '@pam/config/dummy-people';
import { dummyConversationsFor } from '@pam/config/dummy-conversations';
import { rankPeople, type RankedPerson } from '@pam/config/people-activity';
import type { RankedPersonRow } from './useRankedPeople';

/**
 * The example people, ranked by the real rule (D-198) on example data: an
 * unread message in `DUMMY_THREADS` (Keisha's, for a case manager) and a
 * recent `lastSavedAt` in `dummy-people` (Aaliyah's) light exactly the people
 * the real strip would. A preview has no "last looked", so the week-long
 * fallback applies; a super admin's preview of Everyone has no conversations
 * of its own (D-171), so only the save lights there. Shared by Home's preview
 * strip and the redesigned staff Homes' row.
 */
const PEOPLE = {
  admin: DUMMY_MEMBERS,
  super_admin: DUMMY_EVERYONE.slice(0, 6),
  provider: DUMMY_INTERESTED.map((interest) => interest.person),
} as const;

export function exampleRankedPeople(
  role: 'admin' | 'super_admin' | 'provider',
): readonly RankedPerson<RankedPersonRow & { readonly lastSavedAt: string | null }>[] {
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
}
