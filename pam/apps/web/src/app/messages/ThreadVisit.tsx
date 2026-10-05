'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';
import { StatusCard } from '@pam/ui/PolicyStatusCard';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { DUMMY_TRIPS } from '@pam/config/dummy-trips';
import { useI18n } from '@/lib/i18n';
import { readAddedTrips } from '@/lib/addedTrips';

/**
 * A booked visit, at the top of a conversation with the program it is at
 * (D-276, Will, 5 October): "if an appointment was made, please show the
 * appointment item used in place profile from trip, but this time it has a
 * chevron and it opens the profile when clicked, and if going back it should
 * return to message."
 *
 * The same green card as the place page's (D-273) — calendar, the day, the
 * time — with a chevron here, because here it goes somewhere: the place,
 * which shows the visit too, and whose Back returns to this conversation.
 *
 * Example trips only, as Trips itself is (D-213): the program is matched to
 * an example place by name, and the soonest visit there is shown. Nothing
 * when there is no visit, or no program.
 */
const styles = stylex.create({
  // Pinned with the header above the messages, never scrolled away.
  wrap: { width: '100%', flexShrink: 0, paddingBlockEnd: '8px' },
});

export function ThreadVisit({
  programName,
  threadId,
}: {
  readonly programName: string | null;
  readonly threadId: string;
}) {
  const { t, locale } = useI18n();
  const [visit, setVisit] = useState<{ id: string; placeId: string; startsAt: string } | null>(null);

  // After mount: added trips live in this browser's storage.
  useEffect(() => {
    const place = programName ? Object.values(DUMMY_PLACES_BY_ID).find((p) => p.name === programName) : undefined;
    if (!place) {
      setVisit(null);
      return;
    }
    const now = Date.now();
    const next = [...DUMMY_TRIPS, ...readAddedTrips()]
      .filter((trip) => trip.placeId === place.id && new Date(trip.startsAt).getTime() >= now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
    setVisit(next ? { id: next.id, placeId: next.placeId, startsAt: next.startsAt } : null);
  }, [programName]);

  if (!visit) return null;
  const at = new Date(visit.startsAt);
  const day = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(at);
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(at);
  const href = `/place/?${new URLSearchParams({
    id: visit.placeId,
    from: 'thread',
    thread: threadId,
    trip: visit.id,
  }).toString()}`;

  return (
    <VStack xstyle={styles.wrap}>
      <StatusCard
        tone="green"
        icon={<Icon icon="calendar" size="md" />}
        title={day}
        body={t('place.visit.body', { time })}
        href={href}
        label={t('messages.visit.label', { day, time })}
      />
    </VStack>
  );
}
