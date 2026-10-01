'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Notice, PlaceCard, ScrollReveal } from '@pam/ui';
import { SearchPill, type SearchPillItem } from '@pam/ui/SearchPill';
import { distanceLabel } from '@pam/config';
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

export function ExploreScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole } = useRoleView(trueRole);

  const [category, setCategory] = useState<ExploreCategory>('all');
  const [query, setQuery] = useState('');
  const settled = useDebounced(query, 300);
  const [clearSignal, setClearSignal] = useState(0);
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

  return (
    <ExploreView
      search={
        <SearchPill<PlaceSuggestion>
          label={t('explore.search.label')}
          placeholder={t('explore.search.placeholder')}
          searchSource={searchSource}
          onPick={(item) => router.push(`/place/?id=${encodeURIComponent(item.id)}&from=explore`)}
          onQuery={setQuery}
          emptyText={t('explore.search.none')}
          clearLabel={t('explore.search.clear')}
          itemIcon={(item) => CATEGORY_ICONS[item.auxiliaryData.category]}
          clearSignal={clearSignal}
        />
      }
      actions={<HeaderActions role={demoRole ?? trueRole} enabled={session.status === 'signed-in'} />}
      category={category}
      onCategory={setCategory}
      area={
        <AreaTrigger
          area={area}
          onOpen={() => setIsPickingArea(true)}
        />
      }
      areaPanel={
        isPickingArea ? (
          <AreaSearch
            onChange={(next) => {
              setArea(next);
              saveOrigin(next);
            }}
            onClose={() => setIsPickingArea(false)}
          />
        ) : null
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
              href={`/place/?id=${encodeURIComponent(place.id)}&from=explore`}
              description={place.description}
              {...(miles ? { distanceLabel: t(miles.key, miles.vars) } : {})}
              status={placeStatus(place.id, place.hours, now, t, locale)}
              audienceLabel={place.audience ? t(`place.audience.${place.audience}`) : null}
              isSaved={saved}
              onSave={() => {
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
              }}
              labels={{ save: t('action.save'), saved: t('places.saved') }}
            />
          </ScrollReveal>
        );
      }}
    />
  );
}
