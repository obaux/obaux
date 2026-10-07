'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Page } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { TripCard } from '@pam/ui/TripCard';
import { dummyTripsFor } from '@pam/config/dummy-trips';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { CategoryPicture } from './SavedView';
import { HeaderActions } from './HeaderActions';

/**
 * Already went (D-234): the visits a member has made, newest first, on their
 * own page — reached from "Places already went" under their coming-up trips,
 * so the member's page leads with what is ahead. Example trips until Pam
 * books visits (D-172, D-227).
 */

const styles = stylex.create({
  meta: { fontSize: '16px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export function PastTripsView({ personId, name }: { readonly personId: string; readonly name: string }) {
  const { t, locale } = useI18n();
  const { state: session } = useSession();
  const { viewedRole } = useRoleView(session.status === 'signed-in' ? session.session.role : null);
  // A member's past trips are the case manager's to see, not a program's
  // (D-242): a program lead who reaches this page by its address sees none.
  const isProgramView = viewedRole === 'provider';
  const now = Date.now();
  const past = (isProgramView ? [] : dummyTripsFor(personId))
    .filter((trip) => new Date(trip.startsAt).getTime() < now)
    .reverse();
  const when = (iso: string) =>
    `${new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(iso))} · ${new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))}`;

  return (
    <Page gap={4}>
      <SubPageHeader
        title={t('person.trips.past')}
        backHref={`/person/?id=${encodeURIComponent(personId)}`}
        backLabel={t('person.connect.back', { name })}
        actions={<HeaderActions hasHelp={false} />}
      />
      {past.length > 0 ? (
        <VStack gap={3}>
          {past.map((trip) => (
            <TripCard
              key={trip.id}
              placeName={trip.placeName}
              when={when(trip.startsAt)}
              href={`/place/?id=${encodeURIComponent(trip.placeId)}`}
              art={<CategoryPicture category={trip.category} />}
              label={`${trip.placeName}, ${when(trip.startsAt)}`}
            />
          ))}
        </VStack>
      ) : (
        <Text type="supporting" xstyle={styles.meta}>
          {t('person.trips.none')}
        </Text>
      )}
      <Text type="supporting" xstyle={styles.note}>
        {t('person.trips.example')}
      </Text>
    </Page>
  );
}
