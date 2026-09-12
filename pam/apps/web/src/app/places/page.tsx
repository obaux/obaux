'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Notice, PlaceCard } from '@pam/ui';
import {
  CATEGORY_DEFINITIONS,
  CATEGORY_LIST,
  NOTICES,
  distanceLabel,
  type Category,
} from '@pam/config';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { usePlaces, METRES_PER_MILE } from '@/lib/usePlaces';

/**
 * The first screen in PAM that shows real data.
 *
 * Everything on it comes from the catalogue in Supabase through one RPC. There
 * is no fixture and no fallback list: if the query fails, the screen says so in
 * words and offers the phone, because a blank list that looks like "there is
 * nothing near you" is a lie that sends someone home (§0).
 *
 * What it deliberately does not do:
 *
 *   - claim a place is open. PAM holds no opening hours for any imported
 *     provider, so the first action is Hours, which opens the place's Google
 *     listing (D-032, D-044).
 *   - name a condition. The card shows the provider's own name and PAM's
 *     neutral category, never a subcategory the source implied (0020).
 *
 * The origin is City Hall until onboarding asks where someone is staying. That
 * is stated on the screen rather than implied: "near you" when we do not know
 * where "you" is would be the same kind of quiet lie.
 */

const PHILADELPHIA_CITY_HALL = { lat: 39.9526, lon: -75.1652 };

const styles = stylex.create({
  page: {
    maxWidth: '520px',
    marginInline: 'auto',
    paddingInline: '16px',
    paddingBlock: '24px',
  },
  title: { fontSize: '28px', lineHeight: 1.2 },
  // §2.5 — a filter is a control, so it clears the 48px floor like every other.
  filter: { minHeight: '48px', fontSize: '17px' },
  area: { fontSize: '17px' },
  source: { fontSize: '15px', lineHeight: 1.5 },
  back: { minHeight: '48px', fontSize: '17px' },
});

export default function PlacesPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const state = usePlaces({ ...PHILADELPHIA_CITY_HALL, ...(category ? { category } : {}), limit: 20 });

  return (
    <main {...stylex.props(styles.page)}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={1} xstyle={styles.title}>
            {t('places.title')}
          </Heading>
          <Text type="supporting" xstyle={styles.area}>
            {t('places.defaultArea')}
          </Text>
        </VStack>

        {/*
          The three categories are fixed (§2.5) and always all shown, even when
          one is empty: a filter that appears and disappears teaches a member
          nothing, and an empty result explains itself (§0). Workforce has no
          places yet and will say so rather than vanish.
        */}
        <HStack gap={2} wrap="wrap" role="group" aria-label={t('places.filterLabel')}>
          <Button
            label={t('places.all')}
            variant={category === undefined ? 'primary' : 'secondary'}
            aria-pressed={category === undefined}
            onClick={() => setCategory(undefined)}
            xstyle={styles.filter}
          />
          {CATEGORY_LIST.map((definition) => (
            <Button
              key={definition.key}
              label={t(definition.labelKey)}
              variant={category === definition.key ? 'primary' : 'secondary'}
              aria-pressed={category === definition.key}
              onClick={() => setCategory(definition.key)}
              xstyle={styles.filter}
            />
          ))}
        </HStack>

        {state.status === 'loading' ? (
          <Text type="supporting" xstyle={styles.area}>
            {t('places.loading')}
          </Text>
        ) : null}

        {state.status === 'empty' ? (
          <Notice
            notice="no_places_found"
            title={t(NOTICES.no_places_found.titleKey)}
            body={t(NOTICES.no_places_found.bodyKey)}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        ) : null}

        {state.status === 'error' ? (
          <Notice
            notice={state.offline ? 'offline' : 'something_went_wrong'}
            title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
            body={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        ) : null}

        {state.status === 'ready' ? (
          <>
            <VStack gap={3}>
              {state.places.map((place) => {
                const miles = distanceLabel(place.meters / METRES_PER_MILE, locale);
                return (
                  <PlaceCard
                    key={place.id}
                    name={place.name}
                    lookupName={place.lookupName}
                    category={place.category}
                    categoryLabel={t(CATEGORY_DEFINITIONS[place.category].labelKey)}
                    {...(miles ? { distanceLabel: t(miles.key, miles.vars) } : {})}
                    phone={place.phone}
                    address={place.address}
                    lat={place.lat}
                    lon={place.lon}
                    placeId={place.placeId}
                    labels={{
                      call: t('action.call'),
                      go: t('action.go'),
                      save: t('action.save'),
                      saved: t('places.saved'),
                      hours: t('action.hours'),
                    }}
                  />
                );
              })}
            </VStack>
            <Text type="supporting" xstyle={styles.source}>
              {t('places.source')}
            </Text>
          </>
        ) : null}

        <Button label={t('places.back')} variant="secondary" href="/" xstyle={styles.back} />
      </VStack>
    </main>
  );
}
