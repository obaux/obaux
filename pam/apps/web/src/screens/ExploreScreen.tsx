'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EducationIcon, FamilyServicesIcon, Notice, PlaceCard, PlusIcon, ScrollReveal, WorkforceIcon, textLinkLook } from '@pam/ui';
import { SearchLauncher, SearchPill, type SearchPillItem } from '@pam/ui/SearchPill';
import { NextTripCard } from '@pam/ui/NextTripCard';
import { DUMMY_TRIPS } from '@pam/config/dummy-trips';
import { readMoves } from '@/lib/addedTrips';
import { useNextVisits, visitTagLabel } from '@/lib/useNextVisits';
import { CategoryPicture } from './CategoryPicture';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { categoryLabelKey, distanceLabel, intlLocale } from '@pam/config';
import type { SearchSource } from '@astryxdesign/core/Typeahead';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { usePlaces, searchPlaces, METRES_PER_MILE, type NearbyPlace } from '@/lib/usePlaces';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { placeStatus, useNow } from '@/lib/usePlaceStatus';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { CITY_HALL, loadOrigin, saveOrigin, type AreaOption } from '@/lib/useAreaSearch';
import { AreaSearch, AreaTrigger } from '../app/places/AreaPicker';
import { CATEGORY_ICONS, ExploreView, type ExploreCategory } from './ExploreView';
import { HeaderActions } from './HeaderActions';
import { HelpButton } from './HelpButton';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Button } from '@pam/ui/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BackButton } from '@pam/ui/SubPage';

const styles = stylex.create({
  // The same white disc with a grey edge as Help (D-216).
  cancel: { flexShrink: 0, fontSize: '17px', fontWeight: 600 },
  add: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    color: colorVars['--color-text-primary'],
  },
});

/**
 * Explore, wired (D-212): `ExploreView` with the catalogue behind it — the
 * same RPCs, saved places and area choice as today's Places (D-054, D-102,
 * D-188), so nothing a member already relies on is lost in the move.
 */
interface PlaceSuggestion extends SearchPillItem {
  readonly auxiliaryData: NearbyPlace;
}

/** A pause after typing, so a slow phone is not searching on every letter. */
function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(handle);
  }, [value, ms]);
  return debounced;
}

/** The soonest example visit still ahead — what a member's Explore shows (D-265). */
function upcomingTrip(moves: Readonly<Record<string, string>>) {
  const now = Date.now();
  return DUMMY_TRIPS.map((trip) => (moves[trip.id] ? { ...trip, startsAt: moves[trip.id]! } : trip))
    .filter((trip) => new Date(trip.startsAt).getTime() > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;
}

/** "Tue, Oct 7 · 10:00 AM". */
function tripWhen(iso: string, locale: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit' }).format(d);
  return `${day} · ${time}`;
}

const TRIP_ICON = { width: 20, height: 20, 'aria-hidden': true } as const;
const TRIP_ICONS = {
  education: <EducationIcon {...TRIP_ICON} />,
  workforce: <WorkforceIcon {...TRIP_ICON} />,
  family_services: <FamilyServicesIcon {...TRIP_ICON} />,
} as const;

/**
 * `programs` (D-218): the same catalogue as a staff member's secondary path —
 * reached from Profile's "All programs", with a round back to Profile and,
 * top right, Add a program (case managers and program leads both can).
 */
export function ExploreScreen({ mode = 'tab' }: { readonly mode?: 'tab' | 'programs' } = {}) {
  const { t, tPlain, locale } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole } = useRoleView(trueRole);

  const from = mode === 'programs' ? 'programs' : 'explore';
  // A program lead has no Saved (D-218), so no Save on a card (Will, 3 October, D-237).
  const canSave = (demoRole ?? trueRole) !== 'provider';
  const [category, setCategory] = useState<ExploreCategory>('all');
  const [query, setQuery] = useState('');
  const settled = useDebounced(query, 300);
  const [clearSignal, setClearSignal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [reload, setReload] = useState(0);

  const [area, setArea] = useState<AreaOption>(CITY_HALL);
  useEffect(() => setArea(loadOrigin()), []);
  const [isPickingArea, setIsPickingArea] = useState(false);

  const now = useNow();
  const { isSaved, save, unsave, failed: saveFailed } = useSavedPlaces(session.status === 'signed-in', demoRole);

  const state = usePlaces({
    lat: area.lat,
    lon: area.lon,
    ...(category === 'all' ? {} : { category }),
    limit: 20,
    query: settled,
    reload,
  });

  const searchSource = useMemo<SearchSource<PlaceSuggestion>>(
    () => ({
      search: async (text) =>
        (
          await searchPlaces(text, {
            lat: area.lat,
            lon: area.lon,
            ...(category === 'all' ? {} : { category }),
          })
        ).map((place) => ({
          id: place.id,
          label: place.name,
          ...(place.address ? { description: place.address } : {}),
          auxiliaryData: place,
        })),
      bootstrap: () => [],
    }),
    [area.lat, area.lon, category],
  );

  // Programs in Pam (D-238): search is a round button there, like a
  // program's Home; tapping it swaps the top row for the pill and Cancel.
  const pill = (
        <SearchPill<PlaceSuggestion>
          label={t('explore.search.label')}
          placeholder={t('explore.search.placeholder')}
          searchSource={searchSource}
          onPick={(item) => router.push(`/place/?id=${encodeURIComponent(item.id)}&from=${from}`)}
          onQuery={setQuery}
          emptyText={t('explore.search.none')}
          clearLabel={t('explore.search.clear')}
          itemIcon={(item) => CATEGORY_ICONS[item.auxiliaryData.category]}
          clearSignal={clearSignal}
          hasAutoFocus={isSearching}
        />
  );
  const programsSearching = mode === 'programs' && isSearching;
  // A member's Explore (Will, 5 October, D-265): no bell or Help up top (both
  // are on Profile), the search bar at rest is a centred launcher, and the
  // next visit sits above the list. Staff reach this screen as All programs.
  const isMember = mode === 'tab' && (demoRole ?? trueRole) === 'member';
  // A visit moved with "Change appointment" (D-281), read after mount.
  const [moves, setMoves] = useState<Readonly<Record<string, string>>>({});
  useEffect(() => setMoves(readMoves()), []);
  const nextTrip = isMember && USE_DUMMY_PEOPLE ? upcomingTrip(moves) : null;
  // A member's visits, so a place with one carries Saved's chip and opens as
  // the Visit profile (D-305) — the same wherever the place appears.
  const visits = useNextVisits(isMember && USE_DUMMY_PEOPLE);

  return (
    <ExploreView
      search={
        mode === 'programs' && !isSearching
          ? null
          : isMember && !isSearching
            ? <SearchLauncher label={t('explore.search.placeholder')} onOpen={() => setIsSearching(true)} />
            : pill
      }
      leading={
        mode === 'programs' && !isSearching ? (
          <BackButton href="/profile/" label={t('nav.back.profile')} />
        ) : undefined
      }
      actions={
        programsSearching || (isMember && isSearching) ? (
          <Button
            label={t('messages.search.cancel')}
            variant="ghost"
            onClick={() => {
              setIsSearching(false);
              setClearSignal((n) => n + 1);
            }}
            xstyle={[styles.cancel, textLinkLook.link]}
          />
        ) : mode === 'programs' ? (
          <>
            <IconButton
              label={t('explore.search.label')}
              variant="ghost"
              icon={<Icon icon="search" size="md" />}
              onClick={() => setIsSearching(true)}
              xstyle={styles.add}
            />
            <IconButton
              label={t('programs.add')}
              href="/programs/new/"
              variant="ghost"
              icon={
                <HStack>
                  <PlusIcon width={24} height={24} aria-hidden />
                </HStack>
              }
              xstyle={styles.add}
            />
            <HelpButton />
          </>
        ) : isMember ? undefined : (
          <HeaderActions role={demoRole ?? trueRole} enabled={session.status === 'signed-in'} />
        )
      }
      nextTrip={
        nextTrip ? (
          <NextTripCard
            categoryLabel={t(categoryLabelKey(nextTrip.category))}
            categoryIcon={TRIP_ICONS[nextTrip.category]}
            art={<CategoryPicture category={nextTrip.category} />}
            title={t('explore.nextTrip.title')}
            when={tripWhen(nextTrip.startsAt, locale)}
            href="/trips/"
            label={tPlain('explore.nextTrip.label', {
              kind: t(categoryLabelKey(nextTrip.category)),
              when: tripWhen(nextTrip.startsAt, locale),
            })}
          />
        ) : null
      }
      category={category}
      onCategory={setCategory}
      area={<AreaTrigger area={area} onOpen={() => setIsPickingArea(true)} />}
      areaPanel={
        // A drawer now (D-275), kept mounted so it slides away as it came.
        <AreaSearch
          isOpen={isPickingArea}
          current={area}
          onChange={(next) => {
            setArea(next);
            saveOrigin(next);
          }}
          onClose={() => setIsPickingArea(false)}
        />
      }
      notice={
        saveFailed ? (
          <Notice
            notice="something_went_wrong"
            title={t('saved.failed.title')}
            body={t('saved.failed.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        ) : null
      }
      query={settled}
      state={state}
      onRetry={() => setReload((n) => n + 1)}
      onClearSearch={() => setClearSignal((n) => n + 1)}
      supportPhone={supportPhone}
      renderPlace={(place, index) => {
        const miles = distanceLabel(place.meters / METRES_PER_MILE, locale);
        const saved = isSaved(place.id);
        return (
          <ScrollReveal key={place.id} index={index}>
            <PlaceCard
              name={place.name}
              category={place.category}
              artSeed={place.id}
              href={`/place/?${new URLSearchParams({
                id: place.id,
                from,
                ...(visits[place.id] ? { trip: visits[place.id]!.id } : {}),
              }).toString()}`}
              visitTag={visits[place.id] ? visitTagLabel(visits[place.id]!.startsAt, locale) : null}
              description={place.description}
              {...(miles ? { distanceLabel: t(miles.key, miles.vars) } : {})}
              status={placeStatus(place.id, place.hours, now, t, locale)}
              audienceLabel={place.audience ? t(`place.audience.${place.audience}`) : null}
              isSaved={saved}
              onSave={canSave ? () => {
                if (saved) {
                  void unsave(place.id);
                  return;
                }
                void save({
                  id: place.id,
                  name: place.name,
                  lookupName: place.lookupName,
                  category: place.category,
                  address: place.address ?? null,
                  phone: place.phone ?? null,
                  placeId: place.placeId ?? null,
                  lat: place.lat ?? null,
                  lon: place.lon ?? null,
                });
              } : undefined}
              labels={{ save: t('action.save'), saved: t('places.saved') }}
            />
          </ScrollReveal>
        );
      }}
    />
  );
}
