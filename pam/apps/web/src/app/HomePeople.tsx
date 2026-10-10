'use client';

import { useEffect } from 'react';
import { useRankedPeople } from '@/lib/useRankedPeople';
import { HomePeopleSection } from './HomePeopleSection';

/**
 * A real case manager's or program admin's people, on Home, with a ring on
 * whoever has something new (D-198). Three sources, one ranking:
 *
 *  - who: `messageable_people()` (0063) — the same list the messenger
 *    offers, so a ring can only ever sit on somebody the viewer may talk to;
 *  - unread: `useConversations`, which already knows each conversation's
 *    other person and whether its newest message is unread. This component
 *    owns that hook for Home while it is mounted, and reports the unread
 *    count upward exactly as `UnreadMessages` does, so the Messages tile
 *    and the rings come from one query rather than two;
 *  - new saves: `people_activity()` (0067) — a time per person, never a
 *    place (D-199) — compared with when this account last looked
 *    (`peopleSeen`).
 *
 * "Last looked" is read once, before it is moved to now: the rings this
 * visit are judged against the previous visit, and the next visit against
 * this one. Real accounts only (the caller gates on `trueRole`, D-172); a
 * preview renders `HomePeoplePreview` instead. An empty real list renders
 * nothing — Home does not invent people, and the full screen behind "see
 * all" already shows the example set when there is nobody yet.
 */
export function HomePeople({
  role,
  accountId,
  onUnreadCount,
}: {
  readonly role: 'admin' | 'provider';
  readonly accountId: string;
  readonly onUnreadCount: (count: number) => void;
}) {
  const { ranked, unreadCount } = useRankedPeople(accountId);
  useEffect(() => {
    onUnreadCount(unreadCount);
  }, [unreadCount, onUnreadCount]);

  if (!ranked || ranked.length === 0) return null;
  return <HomePeopleSection role={role} ranked={ranked} isExample={false} />;
}
