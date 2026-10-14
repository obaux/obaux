'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Page, PlacesIcon } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { MenuList, type MenuItem } from '@pam/ui/MenuList';
import { SearchField } from '@pam/ui/SearchPill';
import { distanceLabel } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useAreaSearch, type AreaOption } from '@/lib/useAreaSearch';
import { useStreetSearch } from '@/lib/useStreetSearch';
import { MIN_CHARS } from '@/lib/streetSearch';
import { METRES_PER_MILE, searchPlacesChecked, type NearbyPlace } from '@/lib/usePlaces';
import { PoweredByGoogle } from './PoweredByGoogle';
import { CATEGORY_ICONS } from './ExploreView';

/**
 * The one search box on Explore (D-573, Will 14 October 2026): programs, Pam's areas and addresses in ONE list as you type, no switch.
 *
 *   - before anything is typed: "Use my current location" (this search only);
 *   - then Programs (by name or address), Areas (ZIP codes, neighborhoods, City Hall) and Addresses (Google), in that order, or Areas
 *     first when only digits are typed, because a ZIP is an area and a program's address also contains it;
 *   - a program opens its page; an area or an address goes back to Explore and sets the "Near …" control, which stays as it was.
 *
 * Google is asked ONLY when the words read as an address or a corner and no program matches them, or when the person taps "Search
 * addresses" (`wantsGoogleFromBox`). Program words never go. The drawer behind the "Near …" control keeps its own rule.
 */
const styles = stylex.create({
  body: { width: '100%' },
  grow: { flexGrow: 1, minWidth: 0 },
  cancel: { flexShrink: 0, fontSize: '17px', fontWeight: 600 },
  section: { fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', paddingBlockStart: '8px' },
  hint: { fontSize: '15px', lineHeight: 1.5 },
  privacy: { fontSize: '14px', lineHeight: 1.5 },
  privacyCentered: { textAlign: 'center' },
});

const ICON = { width: 24, height: 24, 'aria-hidden': true } as const;

/** A pause after typing, so a slow phone is not searching on every letter. */
const PROGRAMS_PAUSE_MS = 200;

interface ProgramsAnswer {
  readonly text: string;
  readonly places: readonly NearbyPlace[];
  readonly ok: boolean;
}

export function ExploreSearch({
  area,
  onCancel,
  onPickProgram,
  onPickArea,
  isOpen = true,
}: {
  /** Where programs are measured from, for their distances. */
  readonly area: AreaOption;
  readonly onCancel: () => void;
  readonly onPickProgram: (place: NearbyPlace) => void;
  /** An area, an address or the phone's own position: back to Explore, measured from there. */
  readonly onPickArea: (option: AreaOption) => void;
  readonly isOpen?: boolean;
}) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const text = query.trim();
  const [locating, setLocating] = useState<'idle' | 'busy' | 'failed'>('idle');
  const [choosing, setChoosing] = useState(false);

  // Programs, by name or address, from any kind (the chips are on Explore, not here).
  const [programs, setPrograms] = useState<ProgramsAnswer>({ text: '', places: [], ok: true });
  const latest = useRef(0);
  useEffect(() => {
    if (text === '') {
      latest.current += 1;
      setPrograms({ text: '', places: [], ok: true });
      return;
    }
    const mine = (latest.current += 1);
    const timer = setTimeout(() => {
      void searchPlacesChecked(text, { lat: area.lat, lon: area.lon, limit: 6 }).then((answer) => {
        if (mine === latest.current) setPrograms({ text, places: answer.places, ok: answer.ok });
      });
    }, PROGRAMS_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [text, area.lat, area.lon]);
  const programsSettled = programs.text === text;

  const { options, isSearching: areasSearching, answered } = useAreaSearch(text);
  const areasSettled = !areasSearching && answered === text;

  const street = useStreetSearch(
    text,
    { box: true, programs: { matches: programs.places.length, settled: programsSettled && text !== '', ok: programs.ok } },
    isOpen,
  );

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocating('failed');
      return;
    }
    setLocating('busy');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating('idle');
        onPickArea({ id: 'here', kind: 'address', label: t('places.area.here'), lat: position.coords.latitude, lon: position.coords.longitude });
      },
      () => setLocating('failed'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const programItems: MenuItem[] = useMemo(
    () =>
      (programsSettled ? programs.places : []).map((place) => {
        const miles = distanceLabel(place.meters / METRES_PER_MILE, locale);
        const where = [place.address, miles ? t(miles.key, miles.vars) : null].filter(Boolean).join(' · ');
        return {
          id: `program:${place.id}`,
          label: place.name,
          ...(where ? { description: where } : {}),
          icon: CATEGORY_ICONS[place.category],
          onSelect: () => onPickProgram(place),
        };
      }),
    // `t` changes with the language only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programs, programsSettled, locale],
  );

  const areaItems: MenuItem[] = (text === '' ? [] : options).map((option) => ({
    id: `area:${option.id}`,
    label: option.label,
    description: t(`places.kind.${option.kind}`),
    icon: <PlacesIcon {...ICON} />,
    onSelect: () => onPickArea(option),
  }));

  const addressItems: MenuItem[] = street.suggestions.map((suggestion) => ({
    id: `suggest:${suggestion.placeId}`,
    label: suggestion.label,
    // Used for this search only, as "Use my current location" says (Sage, 13 October): a Google pick is never kept.
    description: t('places.area.hereNote'),
    icon: <PlacesIcon {...ICON} />,
    onSelect: () => {
      if (choosing) return;
      setChoosing(true);
      void street.choose(suggestion).then((option) => {
        setChoosing(false);
        if (option) onPickArea(option);
      });
    },
  }));

  const typed = text !== '';
  const onlyDigits = /^\d+$/.test(text);
  // The row that lets a person ask Google on purpose, when the words did not read as an address on their own.
  const canAskAddresses =
    street.enabled && text.length >= MIN_CHARS && !onlyDigits && !street.askedByTap && street.suggestions.length === 0 && !street.isSearching;
  const searching = typed && (!programsSettled || areasSearching || street.isSearching);
  const nothing =
    typed && !searching && areasSettled && programItems.length === 0 && areaItems.length === 0 && addressItems.length === 0 && !canAskAddresses;

  const programSection =
    programItems.length > 0 ? (
      <VStack key="programs" gap={1} xstyle={styles.body}>
        <Text type="supporting" xstyle={styles.section}>{t('explore.search.programs')}</Text>
        <MenuList label={t('explore.search.programs')} hasDividers items={programItems} />
      </VStack>
    ) : null;
  const areaSection =
    areaItems.length > 0 ? (
      <VStack key="areas" gap={1} xstyle={styles.body}>
        <Text type="supporting" xstyle={styles.section}>{t('explore.search.areas')}</Text>
        <MenuList label={t('places.areaResults')} hasDividers items={areaItems} />
      </VStack>
    ) : null;

  return (
    <Page gap={3}>
      <HStack gap={2} align="center" wrap="nowrap">
        <VStack xstyle={styles.grow}>
          <SearchField
            label={t('explore.search.boxLabel')}
            placeholder={t('explore.search.placeholder')}
            value={query}
            onChange={setQuery}
            hasAutoFocus
          />
        </VStack>
        <Button label={t('messages.search.cancel')} variant="ghost" onClick={onCancel} xstyle={styles.cancel} />
      </HStack>

      {!typed ? (
        <MenuList
          label={t('places.area.useHere')}
          hasDividers
          items={[
            {
              id: 'here-action',
              label: t('places.area.useHere'),
              description:
                locating === 'busy' ? t('places.area.finding') : locating === 'failed' ? t('places.area.hereFailed') : t('places.area.hereNote'),
              icon: <PlacesIcon {...ICON} />,
              onSelect: useCurrentLocation,
            },
          ]}
        />
      ) : null}

      {/* A ZIP is an area first; anything else, a program first. */}
      {onlyDigits ? [areaSection, programSection] : [programSection, areaSection]}

      {addressItems.length > 0 ? (
        <VStack gap={1} xstyle={styles.body}>
          <Text type="supporting" xstyle={styles.section}>{t('explore.search.addresses')}</Text>
          <MenuList label={t('explore.search.addresses')} hasDividers items={addressItems} />
          {/* Google's required mark, shown whenever its suggestions are (D-552). */}
          <PoweredByGoogle />
        </VStack>
      ) : null}

      {canAskAddresses ? (
        <MenuList
          label={t('explore.search.addresses')}
          hasDividers
          items={[
            {
              id: 'ask-addresses',
              label: t('explore.search.addressRow', { query: text }),
              description: t('explore.search.addressRow.note'),
              icon: <PlacesIcon {...ICON} />,
              onSelect: street.searchAddresses,
            },
          ]}
        />
      ) : null}

      {/* A live region, so a screen reader hears that results changed without the focus leaving the box. */}
      <div role="status" aria-live="polite">
        {searching && programItems.length === 0 && areaItems.length === 0 && addressItems.length === 0 ? (
          <Text type="supporting" xstyle={styles.hint}>{t('places.areaSearching')}</Text>
        ) : null}
        {nothing ? <Text type="supporting" xstyle={styles.hint}>{t('explore.search.nothing')}</Text> : null}
      </div>

      {/* Under the list, as the drawer says it: the area picked is remembered on this phone only (kept until Will says otherwise, 14 October). */}
      <Text type="supporting" xstyle={[styles.privacy, addressItems.length > 0 && styles.privacyCentered]}>
        {t('places.areaPrivacy')}
      </Text>
    </Page>
  );
}
