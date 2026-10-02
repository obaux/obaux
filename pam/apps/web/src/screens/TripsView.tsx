'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { PlusIcon, TripsIcon } from '@pam/ui';
import { IconButton } from '@astryxdesign/core/IconButton';
import { readAddedTrips } from '@/lib/addedTrips';
import { MapDrawer } from '@pam/ui/MapDrawer';
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
 * Top right is the + that starts a new trip (D-225); nothing else sits over
 * the map.
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
  /**
   * Top right, alone (D-225, Will, 2 October): the dark green + that starts a
   * new trip. No search, no bell, no Help on this screen — the map has the room.
   */
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
  // Only the + sits here now, so it lets taps through to the map around it.
  newTrip: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    boxShadow: '0 4px 14px oklch(0 0 0 / 22%)',
  },
  title: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  count: { fontSize: '15px', textAlign: 'center' },
  state: { paddingBlock: '24px' },
  stateIcon: { width: '56px', height: '56px' },
});

const ART = { width: 40, height: 40, 'aria-hidden': true } as const;
const PIN_ART = { width: 28, height: 28, 'aria-hidden': true } as const;

export function TripsView({ trips, headerActions }: TripsViewProps) {
  const { t, locale } = useI18n();
  const shown = trips;

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

      {headerActions ? (
        <HStack gap={2} align="center" justify="end" wrap="nowrap" xstyle={styles.top}>
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
  // Trips added in this visit (D-225), read after mount: storage is the
  // browser's, and the first render has to match the server's.
  const [added, setAdded] = useState<readonly Trip[]>([]);
  useEffect(() => {
    setAdded(
      readAddedTrips().map((trip) => ({
        id: trip.id,
        placeId: trip.placeId,
        placeName: trip.placeName,
        category: trip.category,
        lat: trip.lat,
        lon: trip.lon,
        startsAt: trip.startsAt,
      })),
    );
  }, []);
  const examples: Trip[] = DUMMY_TRIPS.map((trip) => {
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
  });
  return (
    <TripsView
      headerActions={headerActions ?? <NewTripButton />}
      trips={[...examples, ...added].sort((a, b) => a.startsAt.localeCompare(b.startsAt))}
    />
  );
}

/** The dark green + (D-225): a new trip, in the booking flow. */
export function NewTripButton() {
  const { t } = useI18n();
  return (
    <IconButton
      label={t('trips.new')}
      variant="primary"
      href="/trips/new/"
      icon={
        <HStack>
          <PlusIcon width={24} height={24} aria-hidden />
        </HStack>
      }
      xstyle={styles.newTrip}
    />
  );
}
