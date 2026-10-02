'use client';

import { useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { NoResultsIcon, TripsIcon } from '@pam/ui';
import { MapDrawer } from '@pam/ui/MapDrawer';
import { SearchField } from '@pam/ui/SearchPill';
import { TripCard } from '@pam/ui/TripCard';
import { DUMMY_TRIPS } from '@pam/config/dummy-trips';
import { dummyConnection } from '@pam/config/dummy-connections';
import { useI18n } from '@/lib/i18n';
import { BigCategoryIcon } from './SavedView';
import { TripsMap } from './TripsMap';

/**
 * Trips — the visits somebody has agreed to make (D-210, D-213).
 *
 * From Will's references of 1 October: a map of the city with a pin for each
 * visit, and a drawer over it listing them — the place, the day and time, and
 * who they are meeting. The drawer opens halfway; drag it up to read the
 * list (90% of the screen, the search bar still on top), or down to a dock so
 * the map has the screen and the pins can be followed around the city.
 *
 * Search, at the top, narrows the pins and the list by the place's name.
 *
 * Nothing creates a trip yet; the trips here are the example set
 * (`@pam/config/dummy-trips`) until something does, and with none at all the
 * drawer says what will appear.
 */
export interface Trip {
  readonly id: string;
  readonly placeId: string;
  readonly placeName: string;
  readonly category: string;
  readonly lat: number;
  readonly lon: number;
  readonly startsAt: string;
  readonly withName?: string | null;
  readonly withPhotoUrl?: string | null;
}

export interface TripsViewProps {
  readonly trips: readonly Trip[];
  /** The bell and Help, beside the search bar. */
  readonly headerActions?: ReactNode;
}

/** The bottom tab bar's height, kept clear under the drawer. */
const TAB_BAR = 66;

const styles = stylex.create({
  screen: { position: 'fixed', insetInline: 0, top: 0, bottom: `${TAB_BAR}px` },
  top: {
    position: 'absolute',
    insetInline: 0,
    top: 0,
    zIndex: 7,
    paddingInline: '16px',
    paddingBlock: '12px',
    marginInline: 'auto',
    maxWidth: '560px',
  },
  search: { flexGrow: 1, minWidth: 0 },
  title: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  count: { fontSize: '15px', textAlign: 'center' },
  state: { paddingBlock: '24px' },
  stateIcon: { width: '56px', height: '56px' },
});

const ART = { width: 40, height: 40, 'aria-hidden': true } as const;
const PIN_ART = { width: 28, height: 28, 'aria-hidden': true } as const;

export function TripsView({ trips, headerActions }: TripsViewProps) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = trips.filter((trip) => !q || trip.placeName.toLowerCase().includes(q));

  const day = (iso: string) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));
  const when = (iso: string) =>
    `${new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(iso))} · ${new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))}`;
  const href = (trip: Trip) => `/place/?id=${encodeURIComponent(trip.placeId)}&from=trips`;

  return (
    <VStack xstyle={styles.screen}>
      <TripsMap
        pins={shown.map((trip) => ({
          id: trip.id,
          name: trip.placeName,
          when: day(trip.startsAt),
          lat: trip.lat,
          lon: trip.lon,
          href: href(trip),
          art: <BigCategoryIcon category={trip.category} size={PIN_ART} />,
        }))}
      />

      {trips.length > 0 ? (
        <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.top}>
          <VStack xstyle={styles.search}>
            <SearchField
              label={t('trips.search.label')}
              placeholder={t('trips.search.placeholder')}
              value={query}
              onChange={setQuery}
            />
          </VStack>
          {headerActions}
        </HStack>
      ) : null}

      <MapDrawer
        bottomOffset={TAB_BAR}
        topOffset={84}
        expandLabel={t('trips.drawer.expand')}
        collapseLabel={t('trips.drawer.collapse')}
        header={
          <VStack gap={0.5}>
            <Heading level={1} xstyle={styles.title}>
              {t('trips.title')}
            </Heading>
            {trips.length > 0 ? (
              <Text type="supporting" xstyle={styles.count}>
                {t('trips.count', { count: shown.length })}
              </Text>
            ) : null}
          </VStack>
        }
      >
        {trips.length === 0 ? (
          <EmptyState
            headingLevel={2}
            xstyle={styles.state}
            icon={<TripsIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
            title={t('trips.empty.title')}
            description={t('trips.empty.body')}
          />
        ) : shown.length === 0 ? (
          <EmptyState
            headingLevel={2}
            xstyle={styles.state}
            icon={<NoResultsIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
            title={t('trips.search.none.title', { query: query.trim() })}
            description={t('trips.search.none.body')}
          />
        ) : (
          <VStack gap={3}>
            {shown.map((trip) => (
              <TripCard
                key={trip.id}
                placeName={trip.placeName}
                when={when(trip.startsAt)}
                href={href(trip)}
                art={<BigCategoryIcon category={trip.category} size={ART} />}
                withName={trip.withName ?? null}
                withPhotoUrl={trip.withPhotoUrl ?? null}
                label={t('trips.card.label', {
                  place: trip.placeName,
                  when: when(trip.startsAt),
                  name: trip.withName ?? '',
                })}
              />
            ))}
          </VStack>
        )}
      </MapDrawer>
    </VStack>
  );
}

/** Trips, wired to the example set (D-213) — nothing writes a trip yet. */
export function TripsScreen({ headerActions }: { readonly headerActions?: ReactNode }) {
  return (
    <TripsView
      headerActions={headerActions}
      trips={DUMMY_TRIPS.map((trip) => {
        const person = dummyConnection(trip.withId);
        return {
          id: trip.id,
          placeId: trip.placeId,
          placeName: trip.placeName,
          category: trip.category,
          lat: trip.lat,
          lon: trip.lon,
          startsAt: trip.startsAt,
          withName: person?.firstName ?? null,
          withPhotoUrl: person?.photoUrl ?? null,
        };
      })}
    />
  );
}
