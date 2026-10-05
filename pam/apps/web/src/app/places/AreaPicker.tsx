'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { AreaChip, PlacesIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SearchField } from '@pam/ui/SearchPill';
import { useI18n } from '@/lib/i18n';
import { useAreaSearch, type AreaOption } from '@/lib/useAreaSearch';

/**
 * Where the list is measured from, and how a member changes it.
 *
 * Closed, it is the area link beside the list's heading — the area and a
 * pencil. Open, it is a drawer (D-275, Will, 5 October: "This screen
 * doesn't look like industry standard behavior for looking up a location"),
 * shaped like the location lookups people already know:
 *
 *   - a title and **Done** at the top; Done keeps the choice, a swipe down
 *     or the scrim leaves the area as it was;
 *   - **our search bar**, already focused, "ZIP code or address";
 *   - **Use my current location** first — the phone's own position, kept on
 *     this device like any other choice and never sent to PAM;
 *   - **the results as rows**: a pin, the place, and what it is (ZIP code,
 *     neighbourhood, address). The one chosen is bold and green with a
 *     tick, as every chosen row in PAM is.
 *
 * Suggestions arrive before anything is typed — the ZIP list comes back on an
 * empty query — so somebody who does not know what to type still sees
 * options. The rows are real buttons in a list, each 64px.
 */

const styles = stylex.create({
  // Clear of the grab handle, as the New message sheet is.
  body: { width: '100%', paddingInline: '16px', paddingBlockStart: spacingVars['--spacing-6'], paddingBlockEnd: '24px' },
  top: { width: '100%' },
  title: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700 },
  // "Done" — a word at the top right, in the accent, as on every phone.
  done: {
    minHeight: '48px',
    paddingInline: '4px',
    fontSize: '17px',
    fontWeight: 700,
    color: colorVars['--color-text-accent'],
    backgroundImage: { default: 'none', ':hover': 'none', ':active': 'none' },
  },
  hint: { fontSize: '15px', lineHeight: 1.5 },
  privacy: { fontSize: '14px', lineHeight: 1.5 },
  list: { width: '100%' },
});

const ICON = { width: 24, height: 24, 'aria-hidden': true } as const;

/** The header piece: where we are measuring from, and the way to change it. */
export function AreaTrigger({ area, onOpen }: { area: AreaOption; onOpen: () => void }) {
  const { t } = useI18n();
  const near = t('places.near', { area: area.label });

  return (
    <AreaChip
      label={near}
      // The same formatted string the visible text uses ("Near City Hall"),
      // not the bare area name — so the accessible name actually contains
      // what a sighted person reads on the chip, word for word.
      changeLabel={t('places.changeArea', { area: near })}
      onChange={onOpen}
    />
  );
}

/** What a result is, under its name. */
function kindKey(option: AreaOption): string {
  return `places.kind.${option.kind}`;
}

/**
 * The drawer: search, pick, Done (D-275). The choice is held here until Done,
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
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<AreaOption>(current);
  const [locating, setLocating] = useState<'idle' | 'busy' | 'failed'>('idle');
  const { options, isSearching } = useAreaSearch(query);

  const body = useRef<HTMLDivElement | null>(null);

  // Each time it opens: the area as it stands, an empty search, and the
  // cursor in it — the sheet itself would focus its first button (Done).
  useEffect(() => {
    if (!isOpen) return;
    setPicked(current);
    setQuery('');
    setLocating('idle');
    const frame = requestAnimationFrame(() => body.current?.querySelector('input')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen, current]);

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocating('failed');
      return;
    }
    setLocating('busy');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating('idle');
        setPicked({
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

  // The chosen area stays in the list while it is searched past, so the
  // tick is never lost off the bottom of a result set.
  const shown = [picked, ...options.filter((o) => o.id !== picked.id)];

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => (open ? undefined : onClose())}
      label={t('places.area.title')}
      height="tall"
    >
      {isOpen ? (
        <VStack ref={body} gap={3} xstyle={styles.body}>
          <HStack gap={3} align="center" justify="between" wrap="nowrap" xstyle={styles.top}>
            <Heading level={2} xstyle={styles.title}>
              {t('places.area.title')}
            </Heading>
            <Button
              label={t('places.area.done')}
              variant="ghost"
              onClick={() => {
                onChange(picked);
                onClose();
              }}
              xstyle={styles.done}
            />
          </HStack>

          <SearchField
            label={t('places.areaLabel')}
            placeholder={t('places.areaLabel')}
            value={query}
            onChange={setQuery}
            hasAutoFocus
            isSubtle
          />

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
                onSelect: () => setPicked(option),
                isSelected: option.id === picked.id,
              })),
            ]}
          />

          {/*
            A live region, so a screen reader hears that results changed
            without the focus leaving the search somebody is still typing in.
          */}
          <div role="status" aria-live="polite">
            {isSearching && options.length === 0 ? (
              <Text type="supporting" xstyle={styles.hint}>
                {t('places.areaSearching')}
              </Text>
            ) : null}
            {!isSearching && query.trim() !== '' && options.length === 0 ? (
              <Text type="supporting" xstyle={styles.hint}>
                {t('places.areaNone')}
              </Text>
            ) : null}
          </div>

          <Text type="supporting" xstyle={styles.privacy}>
            {t('places.areaPrivacy')}
          </Text>
        </VStack>
      ) : null}
    </BottomSheet>
  );
}
