'use client';

import { useEffect, useId, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { PamSheet } from '@pam/ui/PamSheet';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { AreaChip, PlacesIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SearchField } from '@pam/ui/SearchPill';
import { useI18n } from '@/lib/i18n';
import { useAreaSearch, type AreaOption } from '@/lib/useAreaSearch';
import { useStreetSearch } from '@/lib/useStreetSearch';
import { PoweredByGoogle } from '@/screens/PoweredByGoogle';

/**
 * Where the list is measured from, and how a member changes it.
 *
 * Closed, it is the area link beside the list's heading — the area and a
 * pencil. Open, it is a drawer (D-275, Will, 5 October: "This screen
 * doesn't look like industry standard behavior for looking up a location"),
 * shaped like the location lookups people already know:
 *
 *   - a title and **Cancel** at the top; a pick closes the drawer at once and
 *     sets the area (14 October: no Done to press); Cancel, a swipe down or the
 *     scrim leaves the area as it was;
 *   - **our search bar**, already focused, "ZIP code or address";
 *   - **Use my current location** first — the phone's own position, kept on
 *     this device like any other choice and never sent to Pam;
 *   - **the results as rows**: a pin, the place, and what it is (ZIP code,
 *     neighbourhood, address). The one chosen is bold and green with a
 *     tick, as every chosen row in Pam is.
 *
 * Suggestions arrive before anything is typed — the ZIP list comes back on an
 * empty query — so somebody who does not know what to type still sees
 * options. The rows are real buttons in a list, each 64px.
 */

const styles = stylex.create({
  // The notch, the title and the link are PamSheet's (17 October, a93).
  body: { width: '100%', paddingInline: '16px', paddingBlockStart: spacingVars['--spacing-2'], paddingBlockEnd: '24px' },
  hint: { fontSize: '15px', lineHeight: 1.5 },
    privacy: { fontSize: '14px', lineHeight: 1.5 },
  privacyCentered: { textAlign: 'center', width: '100%' },
  list: { width: '100%' },
});

const ICON = { width: 24, height: 24, 'aria-hidden': true } as const;

/** The header piece: where we are measuring from, and the way to change it. */
export function AreaTrigger({ area, onOpen }: { area: AreaOption; onOpen: () => void }) {
  const { t, tPlain } = useI18n();

  return (
    <AreaChip
      label={t('places.near', { area: area.label })}
      // The same formatted string the visible text uses ("Near City Hall"),
      // not the bare area name — so the accessible name actually contains
      // what a sighted person reads on the chip, word for word. Built from
      // the plain form all the way down: a sentence taken from `t` would carry
      // its isolates into what a screen reader is given (D-435).
      changeLabel={tPlain('places.changeArea', { area: tPlain('places.near', { area: area.label }) })}
      onChange={onOpen}
    />
  );
}

/** What a result is, under its name. */
function kindKey(option: AreaOption): string {
  return `places.kind.${option.kind}`;
}

/**
 * The drawer: search, pick (D-275; since 14 October a pick closes it, no Done). Nothing moves behind it until a pick,
 * so looking around never moves the list behind it.
 */
export function AreaSearch({
  isOpen,
  current,
  onChange,
  onClose,
}: {
  readonly isOpen: boolean;
  readonly current: AreaOption;
  readonly onChange: (next: AreaOption) => void;
  readonly onClose: () => void;
}) {
  const { t } = useI18n();
  const hintId = useId();
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState<'idle' | 'busy' | 'failed'>('idle');
  const { options, isSearching, answered } = useAreaSearch(query);
  // Street addresses and corners from Google, through Pam's server, once Pam's own list has answered (D-552).
  const street = useStreetSearch(query, { matches: options.length, settled: !isSearching && answered === query }, isOpen);
  const [choosing, setChoosing] = useState(false);

  const body = useRef<HTMLDivElement | null>(null);

  // Each time it opens: the area as it stands, an empty search, and the
  // cursor in it — the sheet itself would focus its first button (Cancel).
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setLocating('idle');
    const frame = requestAnimationFrame(() => body.current?.querySelector('input')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen, current]);

  // A pick is the answer (Will, 14 October): the drawer closes at once and the area is the one chosen. No Done to press.
  const pick = (option: AreaOption) => {
    onChange(option);
    onClose();
  };

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocating('failed');
      return;
    }
    setLocating('busy');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating('idle');
        pick({
          id: 'here',
          kind: 'address',
          label: t('places.area.here'),
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => setLocating('failed'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  // The area now in use stays in the list while it is searched past, so the
  // tick is never lost off the bottom of a result set.
  const shown = [current, ...options.filter((o) => o.id !== current.id)];

  return (
    <PamSheet
      isOpen={isOpen}
      onOpenChange={(open) => (open ? undefined : onClose())}
      label={t('places.area.title')}
      kind="review"
      actionLabel={t('places.area.done')}
      height="tall"
      isTyping
    >
      {isOpen ? (
        <VStack ref={body} gap={3} xstyle={styles.body}>
          <SearchField
            label={t(street.enabled ? 'places.areaLabel.street' : 'places.areaLabel')}
            describedBy={hintId}
            value={query}
            onChange={setQuery}
            hasAutoFocus
            isSubtle
          />
          {/* The search finds ZIP codes (and City Hall), so say what to type (D-536). */}
          <Text id={hintId} type="supporting" xstyle={styles.hint}>
            {t(street.enabled ? 'places.areaHint.street' : 'places.areaHint')}
          </Text>

          <MenuList
            label={t('places.areaResults')}
            hasDividers
            items={[
              {
                id: 'here-action',
                label: t('places.area.useHere'),
                description:
                  locating === 'busy'
                    ? t('places.area.finding')
                    : locating === 'failed'
                      ? t('places.area.hereFailed')
                      : t('places.area.hereNote'),
                icon: <PlacesIcon {...ICON} />,
                onSelect: useCurrentLocation,
              },
              ...shown.map((option) => ({
                id: option.id,
                label: option.id === 'here' ? t('places.area.hereRow') : option.label,
                description: option.id === 'here' ? t('places.area.hereNote') : t(kindKey(option)),
                icon: <PlacesIcon {...ICON} />,
                onSelect: () => pick(option),
                isSelected: option.id === current.id,
              })),
              // What Google found, below Pam's own: tapping one asks for where it is, then it is picked like any other.
              ...street.suggestions.map((suggestion) => ({
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
                    if (option) pick(option);
                  });
                },
              })),
            ]}
          />

          {/* Google's required mark, shown whenever its suggestions are (D-552). */}
          {street.suggestions.length > 0 ? <PoweredByGoogle /> : null}

          {/*
            A live region, so a screen reader hears that results changed
            without the focus leaving the search somebody is still typing in.
          */}
          <div role="status" aria-live="polite">
            {(isSearching || street.isSearching) && options.length === 0 && street.suggestions.length === 0 ? (
              <Text type="supporting" xstyle={styles.hint}>
                {t('places.areaSearching')}
              </Text>
            ) : null}
            {!isSearching && !street.isSearching && query.trim() !== '' && options.length === 0 && street.suggestions.length === 0 ? (
              <Text type="supporting" xstyle={styles.hint}>
                {t('places.areaNone')}
              </Text>
            ) : null}
          </div>

          <Text type="supporting" xstyle={[styles.privacy, street.suggestions.length > 0 && styles.privacyCentered]}>
            {t('places.areaPrivacy')}
          </Text>
        </VStack>
      ) : null}
    </PamSheet>
  );
}
