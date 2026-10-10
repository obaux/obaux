'use client';

import { useEffect, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@pam/ui/Button';
import { Dialog } from '@astryxdesign/core/Dialog';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, Loading, Page, PlaceCard, textLinkLook } from '@pam/ui';
import { CategoryChips, type CategoryChip, type ChipTone } from '@pam/ui/CategoryChips';
import { SearchField } from '@pam/ui/SearchPill';
import { SubPageHeader } from '@pam/ui/SubPage';
import { SuccessScreen } from '@pam/ui/SuccessScreen';
import { CATEGORY_LIST, distanceLabel, type Category } from '@pam/config';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { usePlaces, METRES_PER_MILE } from '@/lib/usePlaces';
import { placeStatus, useNow } from '@/lib/usePlaceStatus';
import { CITY_HALL } from '@/lib/useAreaSearch';
import { CATEGORY_ICONS, type ExploreCategory } from './ExploreView';
import { HeaderActions } from './HeaderActions';

/**
 * Connect {name} to… (D-231, D-234, D-236): a case manager finds a program
 * and recommends it to a member on their caseload, from the member's page.
 *
 * Laid out like a member's Explore (Will, 3 October, D-236):
 *
 * - **Search lives in the bar**, a round button beside the bell. Tapping it
 *   replaces the top with the search pill and Cancel, by name or address —
 *   the same swap as a program's Home. No bar taking the room otherwise.
 * - **Category chips** (All, School and training, …) under the title, and
 *   the place cards a member sees on Explore, each with a round check
 *   where Save would be.
 * - **The cards scroll under the header**: the chips row is sticky beneath
 *   the bar, with a white fade under it.
 * - **The check asks first**, in a dialog — "Recommend {program} to
 *   {name}?" — with 32px corners over a page washed to 80% white.
 *
 * Every program Pam lists (`usePlaces`, the calls Explore makes). If the
 * database cannot be reached it falls back to the example programs, so the
 * screen is never empty. A recommendation is an example for now: nothing is
 * stored or sent, and the member still says yes themselves.
 */
interface Program {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly description: string | null;
  readonly meters: number | null;
  readonly hours: unknown;
}

const EXAMPLES: readonly Program[] = Object.values(DUMMY_PLACES_BY_ID).map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  description: p.description,
  meters: null,
  hours: null,
}));

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

const styles = stylex.create({
  // The search swap: the pill and Cancel across the top, sticky.
  top: {
    position: 'sticky',
    top: 0,
    zIndex: 6,
    marginTop: '-12px',
    paddingBlock: '12px 4px',
    backgroundColor: colorVars['--color-background-body'],
  },
  search: { flexGrow: 1, minWidth: 0 },
  cancel: { flexShrink: 0, fontSize: '17px', fontWeight: 600 },
  // The chips stay put under the bar while the cards scroll beneath them.
  chips: {
    position: 'sticky',
    top: '64px',
    zIndex: 4,
    marginInline: '-16px',
    paddingInline: '16px',
    backgroundColor: colorVars['--color-background-body'],
  },
  chipsSearching: { top: '76px' },
  // The white fade under the sticky top, so cards dissolve as they pass.
  fade: {
    position: 'absolute',
    insetInline: 0,
    top: '100%',
    height: '24px',
    pointerEvents: 'none',
    backgroundImage: `linear-gradient(to bottom, ${colorVars['--color-background-body']}, transparent)`,
  },
  chipsFrame: { position: 'relative', width: '100%' },
  // White with a thin grey edge, like the bell (D-216). Exactly round: the
  // global 48px touch floor would otherwise stretch a 40px circle tall.
  round: {
    width: '48px',
    height: '48px',
    minHeight: '48px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  note: { fontSize: '15px', lineHeight: 1.5 },
  none: { fontSize: '17px' },
  // Secondary and sized to its words, at the shared button height (D-239).
  home: { minHeight: '56px', fontSize: '17px', paddingInline: '28px', borderRadius: '999px' },
  dialogTitle: { fontSize: '22px', lineHeight: 1.3 },
  dialogBody: { fontSize: '17px', lineHeight: 1.45 },
});

export function ConnectView({ personId, name }: { readonly personId: string; readonly name: string }) {
  const { t, tPlain, locale } = useI18n();
  const now = useNow();
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const settled = useDebounced(query, 300);
  const [category, setCategory] = useState<ExploreCategory>('all');
  const [asking, setAsking] = useState<Program | null>(null);
  const [recommended, setRecommended] = useState<Program | null>(null);
  const back = `/person/?id=${encodeURIComponent(personId)}`;

  const state = usePlaces({
    lat: CITY_HALL.lat,
    lon: CITY_HALL.lon,
    ...(category === 'all' ? {} : { category }),
    limit: 30,
    query: settled.trim(),
  });

  const programs = useMemo<readonly Program[] | null>(() => {
    if (state.status === 'ready') {
      return state.places.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        meters: p.meters,
        hours: p.hours,
      }));
    }
    if (state.status === 'empty') return [];
    if (state.status === 'error') {
      const q = fold(settled.trim());
      return EXAMPLES.filter(
        (p) => (category === 'all' || p.category === category) && (!q || fold(p.name).includes(q)),
      );
    }
    return null;
  }, [state, settled, category]);

  const chips: readonly CategoryChip<ExploreCategory>[] = [
    { key: 'all', label: t('places.all'), icon: CATEGORY_ICONS.all },
    ...CATEGORY_LIST.map((definition) => ({
      key: definition.key,
      label: t(definition.labelKey),
      icon: CATEGORY_ICONS[definition.key],
      tone: definition.colorToken as ChipTone,
    })),
  ];

  const header = (withSearch: boolean) => (
    <SubPageHeader
      title={t('person.connect.title', { name })}
      backHref={back}
      backLabel={tPlain('person.connect.back', { name })}
      actions={
        <>
          {withSearch ? (
            <IconButton
              label={t('person.connect.search.label')}
              variant="ghost"
              icon={<Icon icon="search" size="md" />}
              onClick={() => setIsSearching(true)}
              xstyle={styles.round}
            />
          ) : null}
          <HeaderActions hasHelp={false} />
        </>
      }
    />
  );

  // Done (D-240): the success template — no bar, centred, confetti — and
  // one quiet way on, home.
  if (recommended) {
    return (
      <SuccessScreen
        title={t('person.connect.done.title', { name })}
        body={t('person.connect.done.body', { name, program: recommended.name })}
        action={
          <Button label={t('person.connect.done.home')} variant="secondary" href="/" xstyle={styles.home} />
        }
        note={t('person.connect.example')}
      />
    );
  }

  return (
    <Page gap={4}>
      {isSearching ? (
        <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.top}>
          <VStack xstyle={styles.search}>
            <SearchField
              label={t('person.connect.search.label')}
              placeholder={t('person.connect.search.placeholder')}
              value={query}
              onChange={setQuery}
              hasAutoFocus
            />
          </VStack>
          <Button
            label={t('messages.search.cancel')}
            variant="ghost"
            onClick={() => {
              setIsSearching(false);
              setQuery('');
            }}
            xstyle={[styles.cancel, textLinkLook.link]}
          />
        </HStack>
      ) : (
        header(true)
      )}

      <VStack xstyle={[styles.chips, isSearching && styles.chipsSearching]}>
        <VStack xstyle={styles.chipsFrame}>
          <CategoryChips chips={chips} value={category} onChange={setCategory} label={t('explore.categories')} />
          <VStack aria-hidden xstyle={styles.fade} />
        </VStack>
      </VStack>

      {programs === null ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : programs.length === 0 ? (
        <Text type="supporting" xstyle={styles.none}>
          {t('person.connect.none')}
        </Text>
      ) : (
        <VStack gap={3}>
          {programs.map((program) => {
            const miles = program.meters === null ? null : distanceLabel(program.meters / METRES_PER_MILE, locale);
            return (
              <PlaceCard
                key={program.id}
                name={program.name}
                category={program.category}
                artSeed={program.id}
                href={`/place/?id=${encodeURIComponent(program.id)}`}
                description={program.description}
                {...(miles ? { distanceLabel: t(miles.key, miles.vars) } : {})}
                status={placeStatus(program.id, program.hours, now, t, locale)}
                action={
                  <IconButton
                    label={tPlain('person.connect.check', { program: program.name })}
                    icon={<Icon icon="check" size="md" />}
                    variant="ghost"
                    onClick={() => setAsking(program)}
                    xstyle={styles.round}
                  />
                }
                labels={{ save: t('action.save'), saved: t('places.saved') }}
              />
            );
          })}
        </VStack>
      )}

      <Text type="supporting" xstyle={styles.note}>
        {t('person.connect.example')}
      </Text>

      {/*
        Asks before anything happens (D-234). 32px corners, and the page
        behind washed to 80% white rather than darkened — set in globals.css
        on `data-pam-dialog="recommend"`.
      */}
      <Dialog
        isOpen={asking !== null}
        onOpenChange={(open) => {
          if (!open) setAsking(null);
        }}
        width={360}
        padding={6}
        data-pam-dialog="recommend"
      >
        {asking ? (
          <VStack gap={4}>
            <Heading level={2} xstyle={styles.dialogTitle}>
              {t('person.connect.confirm.title', { program: asking.name, name })}
            </Heading>
            <Text type="supporting" xstyle={styles.dialogBody}>
              {t('person.connect.confirm.body', { name })}
            </Text>
            <VStack gap={2}>
              <BigButton
                label={t('person.connect.confirm.yes')}
                onPress={() => {
                  setRecommended(asking);
                  setAsking(null);
                }}
              />
              <Button label={t('person.connect.confirm.no')} variant="ghost" onClick={() => setAsking(null)} />
            </VStack>
          </VStack>
        ) : null}
      </Dialog>
    </Page>
  );
}
