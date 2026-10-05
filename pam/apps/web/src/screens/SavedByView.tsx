'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Page, PlaceCard } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { DUMMY_SAVED_BY_PERSON } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { HeaderActions } from './HeaderActions';

/**
 * Programs saved by {name} (D-243): the places a member saved, on their own
 * page — reached from a row on the member's page, like Programs attended in
 * the past. A case manager's to see (§4.1); a program lead who reaches this
 * by its address sees none (D-242). Example people only until a real
 * member's saves are readable by their case manager.
 */
const styles = stylex.create({
  meta: { fontSize: '16px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export function SavedByView({ personId, name }: { readonly personId: string; readonly name: string }) {
  const { t } = useI18n();
  const { state: session } = useSession();
  const { viewedRole } = useRoleView(session.status === 'signed-in' ? session.session.role : null);
  const places = viewedRole === 'provider' ? [] : (DUMMY_SAVED_BY_PERSON[personId] ?? []);

  return (
    <Page gap={4}>
      <SubPageHeader
        title={t('person.savedPlaces.link', { name })}
        backHref={`/person/?id=${encodeURIComponent(personId)}`}
        backLabel={t('person.connect.back', { name })}
        actions={<HeaderActions hasHelp={false} />}
      />
      {places.length > 0 ? (
        <VStack gap={3}>
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              name={place.name}
              category={place.category}
              artSeed={place.id}
              href={`/place/?id=${encodeURIComponent(place.id)}`}
              description={place.description}
              labels={{ save: t('action.save'), saved: t('places.saved') }}
            />
          ))}
        </VStack>
      ) : (
        <Text type="supporting" xstyle={styles.meta}>
          {t('person.savedPlaces.empty')}
        </Text>
      )}
      <Text type="supporting" xstyle={styles.note}>
        {t('example.people.note')}
      </Text>
    </Page>
  );
}
