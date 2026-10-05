'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useHideOnScroll } from '@/lib/useHideOnScroll';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import {
  AllPlacesIcon,
  EducationIcon,
  FamilyServicesIcon,
  NoResultsIcon,
  OfflineIcon,
  Page,
  WorkforceIcon,
} from '@pam/ui';
import { CategoryChips, type CategoryChip, type ChipTone } from '@pam/ui/CategoryChips';
import { PlaceCardSkeletonList } from '@pam/ui/Skeletons';
import { CATEGORY_LIST, NOTICES, type Category } from '@pam/config';
import type { NearbyPlace, PlacesState } from '@/lib/usePlaces';
import { useI18n } from '@/lib/i18n';

/**
 * Explore — the member's home since the redesign (D-210, D-212).
 *
 * Modelled on the reference Will gave (1 October): the search bar first and
 * largest, a row of category chips under it, then the places. The bar and
 * chips stay pinned at the top while the list scrolls under them.
 *
 * A view: what it shows comes in as props, so Storybook can draw every state
 * — ready, loading, nothing found, can't connect — without a database.
 * `ExploreScreen` is the same view wired to the app's data.
 *
 * **Never a dead end** (§0): the error state offers Try again (Help is in
 * the header — Will took the call button out of the error states, 1 October);
 * "nothing matches" offers Clear search; an empty category offers All. The
 * header's Help is on every state.
 */
export type ExploreCategory = Category | 'all';

export interface ExploreViewProps {
  /** The search bar — `SearchPill`, wired by the caller. */
  readonly search: ReactNode;
  /** Before the search bar — a round back on All programs (D-218). */
  readonly leading?: ReactNode;
  /** The bell and Help, beside the bar. */
  readonly actions?: ReactNode;
  readonly category: ExploreCategory;
  readonly onCategory: (category: ExploreCategory) => void;
  /** "Near City Hall ▾" — where the list is measured from, and how to change it. */
  readonly area?: ReactNode;
  /** Drawn under the chips when open: the area picker. */
  readonly areaPanel?: ReactNode;
  /** A member's next visit, above the list when nothing is searched (D-265). */
  readonly nextTrip?: ReactNode;
  /** A message that belongs above the list — "Couldn't save that". */
  readonly notice?: ReactNode;
  /** The words the list was searched for, once they settled; '' for none. */
  readonly query: string;
  readonly state: PlacesState;
  readonly renderPlace: (place: NearbyPlace, index: number) => ReactNode;
  readonly onRetry: () => void;
  readonly onClearSearch: () => void;
  /** E.164 support line, for the error state's call button. */
  readonly supportPhone?: string | null;
}

const ICON = { width: 22, height: 22, 'aria-hidden': true } as const;
// The chips' own, smaller (D-265).
const CHIP_ICON = { width: 18, height: 18, 'aria-hidden': true } as const;
const CHIP_ICONS: Readonly<Record<ExploreCategory, ReactNode>> = {
  all: <AllPlacesIcon {...CHIP_ICON} />,
  education: <EducationIcon {...CHIP_ICON} />,
  workforce: <WorkforceIcon {...CHIP_ICON} />,
  family_services: <FamilyServicesIcon {...CHIP_ICON} />,
};

export const CATEGORY_ICONS: Readonly<Record<ExploreCategory, ReactNode>> = {
  all: <AllPlacesIcon {...ICON} />,
  education: <EducationIcon {...ICON} />,
  workforce: <WorkforceIcon {...ICON} />,
  family_services: <FamilyServicesIcon {...ICON} />,
};

const styles = stylex.create({
  // The bar and chips stay put while the list scrolls under them.
  top: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    marginTop: '-12px',
    paddingTop: '12px',
    backgroundColor: colorVars['--color-background-body'],
    transitionProperty: 'top',
    transitionDuration: '220ms',
    transitionTimingFunction: 'ease-out',
  },
  // Scrolling down (D-222): the sticky block's top goes negative by the
  // height of the search row, so only the chips stay on screen. Nothing below
  // moves — the block keeps its place in the page, only where it sticks.
  topAt: (px: number) => ({ top: `${px}px` }),
  row: { transitionProperty: 'opacity', transitionDuration: '180ms' },
  rowHidden: { opacity: 0, pointerEvents: 'none' },
  search: { flexGrow: 1, minWidth: 0 },
  heading: { fontSize: '22px', lineHeight: 1.25, fontWeight: 700 },
  source: { fontSize: '15px', lineHeight: 1.5 },
  state: { paddingBlock: '32px' },
  stateIcon: { width: '72px', height: '72px', color: colorVars['--color-icon-accent'] },
});

export function ExploreView({
  search,
  leading,
  actions,
  category,
  onCategory,
  area,
  areaPanel,
  nextTrip,
  notice,
  query,
  state,
  renderPlace,
  onRetry,
  onClearSearch,
  supportPhone,
}: ExploreViewProps) {
  const { t } = useI18n();
  const searching = query.trim() !== '';
  // The search row hides scrolling down and comes back scrolling up (D-222,
  // Will, 2 October) — never while a search is typed or the area is open.
  const hidden = useHideOnScroll({ isDisabled: searching || Boolean(areaPanel) });
  const chipsRef = useRef<HTMLElement | null>(null);
  const [hideBy, setHideBy] = useState(0);
  useLayoutEffect(() => {
    const el = chipsRef.current;
    if (!el) return;
    // How far the chips sit below the block's top, less a little air.
    const measure = () => setHideBy(Math.max(0, el.offsetTop - 8));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chips: readonly CategoryChip<ExploreCategory>[] = [
    { key: 'all', label: t('places.all'), icon: CHIP_ICONS.all },
    ...CATEGORY_LIST.map((definition) => ({
      key: definition.key,
      label: t(definition.labelKey),
      icon: CHIP_ICONS[definition.key],
      tone: definition.colorToken as ChipTone,
    })),
  ];

  return (
    <Page gap={4}>
      <VStack gap={2} xstyle={[styles.top, hidden && styles.topAt(-hideBy)]}>
        <HStack gap={2} align="center" wrap="nowrap" xstyle={[styles.row, hidden && styles.rowHidden]}>
          {leading}
          <VStack xstyle={styles.search}>{search}</VStack>
          {actions}
        </HStack>
        <VStack ref={chipsRef as never}>
          <CategoryChips chips={chips} value={category} onChange={onCategory} label={t('explore.categories')} />
        </VStack>
      </VStack>

      {areaPanel}
      {notice}
      {searching ? null : nextTrip}

      <HStack gap={2} align="center" justify="between" wrap="wrap">
        {searching ? (
          <Heading level={1} xstyle={styles.heading}>
            {t('explore.results', { query: query.trim() })}
          </Heading>
        ) : (
          <Heading level={1} xstyle={styles.heading}>
            {/* "All programs" over the list though the chip says "All" — the
                heading gives the context the short chip cannot (Will, 1 October). */}
            {category === 'all'
              ? t('explore.heading.all')
              : (chips.find((chip) => chip.key === category)?.label ?? t('explore.heading.all'))}
          </Heading>
        )}
        {area}
      </HStack>

      {state.status === 'loading' ? <PlaceCardSkeletonList label={t('common.loading')} count={4} /> : null}

      {state.status === 'error' ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<OfflineIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          description={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          // Try again only (Will, 1 October): Help is in the header on every
          // screen; an error state does not need a second way to call.
          actions={<Button label={t('explore.error.retry')} variant="primary" onClick={onRetry} />}
        />
      ) : null}

      {state.status === 'empty' ? (
        searching ? (
          <EmptyState
            headingLevel={2}
            xstyle={styles.state}
            icon={<NoResultsIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
            title={t('explore.empty.search.title', { query: query.trim() })}
            description={t('explore.empty.search.body')}
            actions={<Button label={t('explore.search.clear')} variant="primary" onClick={onClearSearch} />}
          />
        ) : (
          <EmptyState
            headingLevel={2}
            xstyle={styles.state}
            icon={<NoResultsIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
            title={t(NOTICES.no_places_found.titleKey)}
            description={t('explore.empty.category.body')}
            actions={
              category !== 'all' ? (
                <Button label={t('explore.empty.showAll')} variant="primary" onClick={() => onCategory('all')} />
              ) : undefined
            }
          />
        )
      ) : null}

      {state.status === 'ready' ? (
        <>
          <VStack gap={3}>{state.places.map((place, index) => renderPlace(place, index))}</VStack>
          <Text type="supporting" xstyle={styles.source}>
            {t('places.source')}
          </Text>
        </>
      ) : null}
    </Page>
  );
}
