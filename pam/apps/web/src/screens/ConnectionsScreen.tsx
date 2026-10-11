'use client';

import type { Locale } from '@pam/config';
import { DUMMY_CONNECTIONS, dummyConnection, type DummyConnection } from '@pam/config/dummy-connections';
import { DUMMY_SELF_ID, dummyConversationIdBetween } from '@pam/config/dummy-conversations';
import { useI18n } from '@/lib/i18n';
import { showsExamples } from '@/lib/exampleMode';
import { ConnectionsView, type Connection } from './ConnectionsView';

/**
 * Connections (D-213). There is no real query yet for "the people on my side"
 * with photos and facts. Until there is, a real account sees its short empty
 * state ("No connections yet") and only an example (a super admin's preview, a
 * demo account, Storybook) sees the example cast (D-172, D-518).
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
  const cast = showsExamples() ? DUMMY_CONNECTIONS : [];
  return <ConnectionsView connections={cast.map((c) => toConnection(c, locale))} />;
}
