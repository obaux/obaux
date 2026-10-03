'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DUMMY_CONNECTIONS, dummyConnection, type DummyConnection } from '@pam/config/dummy-connections';
import { DUMMY_SELF_ID, dummyConversationIdBetween } from '@pam/config/dummy-conversations';
import { useI18n } from '@/lib/i18n';
import { ConnectionProfileView, ConnectionsView, type Connection } from './ConnectionsView';

/**
 * Connections, wired to the example set (D-213). There is no real query yet
 * for "the people on my side" with photos and facts; until there is, this is
 * the example cast, as every other example screen is (D-172).
 */
function toConnection(c: DummyConnection, locale: string): Connection {
  return {
    id: c.id,
    firstName: c.firstName,
    role: c.role,
    programName: c.programName,
    photoUrl: c.photoUrl,
    help: locale === 'es' ? c.help.es : c.help.en,
    yearsHelping: c.yearsHelping,
    peopleHelped: c.peopleHelped,
    languages: c.languages,
  };
}

export function ConnectionsScreen() {
  const { locale } = useI18n();
  return <ConnectionsView connections={DUMMY_CONNECTIONS.map((c) => toConnection(c, locale))} />;
}

function ConnectionProfile() {
  const { locale } = useI18n();
  const id = useSearchParams().get('id') ?? '';
  const found = dummyConnection(id) ?? DUMMY_CONNECTIONS[0]!;
  return (
    <ConnectionProfileView
      person={toConnection(found, locale)}
      // The example conversation between Jordan and this person (D-180).
      messageHref={`/messages/thread/?id=${encodeURIComponent(dummyConversationIdBetween(DUMMY_SELF_ID.member, found.id))}`}
    />
  );
}

export function ConnectionProfileScreen() {
  return (
    <Suspense fallback={null}>
      <ConnectionProfile />
    </Suspense>
  );
}
