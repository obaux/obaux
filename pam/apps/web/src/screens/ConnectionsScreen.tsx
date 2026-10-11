'use client';

import type { Locale } from '@pam/config';
import { DUMMY_CONNECTIONS, dummyConnection, type DummyConnection } from '@pam/config/dummy-connections';
import { DUMMY_SELF_ID, dummyConversationIdBetween } from '@pam/config/dummy-conversations';
import { useI18n } from '@/lib/i18n';
import { useExamplesOn } from '@/lib/useExamplesOn';
import { ConnectionsView, type Connection } from './ConnectionsView';

/**
 * Connections, wired to the example set (D-213). There is no real query yet
 * for "the people on my side" with photos and facts; until there is, a demo
 * account and Storybook show the example cast (D-172) and a real account sees
 * the empty state.
 *
 * The profile page behind each card is gone (D-272): the card carries the
 * message button, the program link and who connected you.
 */
function toConnection(c: DummyConnection, locale: Locale): Connection {
  const by = c.connectedById ? dummyConnection(c.connectedById) : null;
  return {
    id: c.id,
    firstName: c.firstName,
    role: c.role,
    programName: c.programName,
    photoUrl: c.photoUrl,
    help: c.help[locale],
    yearsHelping: c.yearsHelping,
    peopleHelped: c.peopleHelped,
    languages: c.languages,
    placeId: c.placeId,
    // The example conversation between Jordan and this person (D-180).
    messageHref: `/messages/thread/?id=${encodeURIComponent(dummyConversationIdBetween(DUMMY_SELF_ID.member, c.id))}`,
    connectedBy: by ? { firstName: by.firstName, photoUrl: by.photoUrl } : null,
  };
}

export function ConnectionsScreen() {
  const { locale } = useI18n();
  // Example people are for Storybook and demo accounts only; there is no real list of people who
  // offered help yet, so a real account gets the screen's own short empty state (lib/examples.ts).
  const examplesOn = useExamplesOn();
  return <ConnectionsView connections={examplesOn ? DUMMY_CONNECTIONS.map((c) => toConnection(c, locale)) : []} />;
}
