'use client';

import { useEffect, useMemo, useState } from 'react';
import { rankPeople, type RankedPerson } from '@pam/config/people-activity';
import { useConversations } from './useConversations';
import { useMessageableMembers } from './useMessageableMembers';
import { usePeopleActivity } from './usePeopleActivity';
import { readPeopleSeen, writePeopleSeen } from './peopleSeen';

/**
 * A real case manager's or program lead's people, ranked for the strip of
 * rings (D-198). Three sources, one ranking, the same ones the old Home's
 * `HomePeople` used (it now calls this):
 *
 *  - who: `messageable_people()` (0063), so a ring can only ever sit on
 *    somebody the viewer may talk to;
 *  - unread: `useConversations`, which knows each conversation's other
 *    person and whether its newest message is unread;
 *  - new saves: `people_activity()` (0067), a time per person, never a
 *    place (D-199), against when this account last looked (`peopleSeen`).
 *
 * "Last looked" is read once, before it is moved to now: the rings this
 * visit are judged against the previous visit. `null` while anything is
 * still loading; an empty array when there is nobody.
 */
export interface RankedPersonRow {
  readonly id: string;
  readonly firstName: string;
  /** The conversation with an unread message from them, when the ring says message. */
  readonly conversationId: string | null;
}

export function useRankedPeople(accountId: string): {
  readonly ranked: readonly RankedPerson<RankedPersonRow>[] | null;
  readonly unreadCount: number;
} {
  const { state: people } = useMessageableMembers(true);
  const { state: conversations } = useConversations(true);
  const activity = usePeopleActivity(true);

  const [lastSeen, setLastSeen] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setLastSeen(readPeopleSeen(accountId));
    writePeopleSeen(accountId);
  }, [accountId]);

  const unreadCount =
    conversations.status === 'ready' ? conversations.conversations.filter((c) => c.unread).length : 0;

  const ranked = useMemo(() => {
    if (people.status !== 'ready' || lastSeen === undefined) return null;
    const unreadBy = new Map<string, { at: string; conversationId: string }>();
    if (conversations.status === 'ready') {
      for (const c of conversations.conversations) {
        if (c.unread && c.otherProfileId && c.lastMessageAt && !unreadBy.has(c.otherProfileId)) {
          unreadBy.set(c.otherProfileId, { at: c.lastMessageAt, conversationId: c.id });
        }
      }
    }
    const savedBy = activity.status === 'ready' ? activity.lastSavedAt : new Map<string, string>();
    return rankPeople(
      people.people
        .filter((p) => p.role === 'member')
        .map((p) => ({
          id: p.profileId,
          firstName: p.firstName ?? '',
          conversationId: unreadBy.get(p.profileId)?.conversationId ?? null,
        })),
      (p) => ({ unreadAt: unreadBy.get(p.id)?.at ?? null, lastSavedAt: savedBy.get(p.id) ?? null }),
      lastSeen,
    );
  }, [people, conversations, activity, lastSeen]);

  return { ranked, unreadCount };
}
