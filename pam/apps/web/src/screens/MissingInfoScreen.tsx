'use client';

import { useEffect, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Loading, Notice, OfflineIcon, Page } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { ChoiceChips } from '@pam/ui/ChoiceChips';
import { emptyState } from '@pam/ui/emptyState';
import { SearchField } from '@pam/ui/SearchPill';
import { SubPageHeader } from '@pam/ui/SubPage';
import { NOTICES, intlLocale } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import {
  GAP_DETAILS,
  PLACE_KINDS,
  filterGaps,
  useProgramGaps,
  type GapDetail,
  type GapFilter,
  type PlaceKind,
} from '@/lib/useProgramGaps';
import { NotIn } from '../app/NotIn';

/**
 * Missing information (D-623; Will, 31 October: "a list of programs missing info, clicking into it, opens a nested page with
 * list of missing details, filtered and searchable"). Every listed place that lacks a phone, a website, an address or real
 * hours, with what it lacks. Parks & Rec need only an address (D-622). Filters for what is missing and for the kind of place,
 * and a search over the name and the address; a row opens the place's own page, whose Back comes here. Nothing is edited
 * here. The filters and the search are kept for the visit, so coming back from a place finds the list as it was left.
 */
const KEPT = 'pam.missingInfo.filter';

const styles = stylex.create({
  name: { fontSize: '17px', lineHeight: 1.35, fontWeight: 600 },
  detail: { fontSize: '15px', lineHeight: 1.4, color: colorVars['--color-text-secondary'] },
  label: { fontSize: '15px', fontWeight: 700, color: colorVars['--color-text-secondary'] },
  shown: { fontSize: '15px' },
});

function keptFilter(): GapFilter {
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(KEPT) ?? 'null') as Partial<GapFilter> | null;
    return {
      missing: (GAP_DETAILS as readonly unknown[]).includes(raw?.missing) ? (raw!.missing as GapDetail) : null,
      kind: (PLACE_KINDS as readonly unknown[]).includes(raw?.kind) ? (raw!.kind as PlaceKind) : null,
      query: typeof raw?.query === 'string' ? raw.query : '',
    };
  } catch {
    return { missing: null, kind: null, query: '' };
  }
}

export function MissingInfoScreen() {
  const { t, tPlain, locale } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin' && trueRole === 'super_admin';
  const [refresh, setRefresh] = useState(0);
  const state = useProgramGaps(isSuperAdmin, true, refresh);

  const [filter, setFilter] = useState<GapFilter>({ missing: null, kind: null, query: '' });
  // Read after the first render: the page is exported statically, so the server cannot know what this visit kept.
  useEffect(() => setFilter(keptFilter()), []);
  const change = (patch: Partial<GapFilter>) =>
    setFilter((previous) => {
      const next = { ...previous, ...patch };
      try {
        window.sessionStorage.setItem(KEPT, JSON.stringify(next));
      } catch {
        /* A private window keeps nothing: the filters still work for this visit. */
      }
      return next;
    });

  // Reached from the super admin's Home (and back here from a place it opens).
  const back = { backHref: '/', backLabel: t('nav.back.home') };
  const subtitle = state.status === 'ready' ? t('missingInfo.count', { count: state.counts.missing }) : undefined;
  const header = <SubPageHeader title={t('missingInfo.title')} {...(subtitle ? { subtitle } : {})} {...back} />;

  const shown = useMemo(() => (state.status === 'ready' ? filterGaps(state.places, filter) : []), [state, filter]);
  const list = useMemo(() => new Intl.ListFormat(intlLocale(locale), { style: 'long', type: 'conjunction' }), [locale]);

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        {header}
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }
  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        {header}
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />
      </Page>
    );
  }
  if (!isSuperAdmin) {
    return (
      <Page gap={4}>
        {header}
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          contactLabel={t('help.contact.action')}
        />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      {header}

      {state.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {state.status === 'error' ? (
        // Try again, as the team's other lists have (Iris P5).
        <EmptyState
          headingLevel={2}
          icon={<OfflineIcon {...stylex.props(emptyState.icon)} aria-hidden />}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          description={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          actions={<Button label={t('explore.error.retry')} variant="primary" onClick={() => setRefresh((n) => n + 1)} />}
        />
      ) : null}

      {state.status === 'ready' && state.places.length === 0 ? <Text type="supporting">{t('missingInfo.empty')}</Text> : null}

      {state.status === 'ready' && state.places.length > 0 ? (
        <>
          <SearchField
            label={tPlain('missingInfo.search')}
            // The visible hint, already signed and in seven languages (Connect's search, D-623).
            placeholder={tPlain('person.connect.search.placeholder')}
            value={filter.query}
            onChange={(query) => change({ query })}
          />

          <VStack gap={2}>
            <Text xstyle={styles.label}>{t('missingInfo.filter.missing')}</Text>
            <ChoiceChips<'any' | GapDetail>
              label={tPlain('missingInfo.filter.missing')}
              options={[
                { value: 'any', label: tPlain('missingInfo.missing.any') },
                ...GAP_DETAILS.map((d) => ({ value: d, label: tPlain(`missingInfo.missing.${d}`) })),
              ]}
              value={filter.missing ?? 'any'}
              onChange={(value) => change({ missing: value === 'any' ? null : value })}
            />
          </VStack>

          <VStack gap={2}>
            <Text xstyle={styles.label}>{t('missingInfo.filter.kind')}</Text>
            <ChoiceChips<'all' | PlaceKind>
              label={tPlain('missingInfo.filter.kind')}
              options={[
                { value: 'all', label: tPlain('missingInfo.kind.all') },
                ...PLACE_KINDS.map((k) => ({ value: k, label: tPlain(`missingInfo.kind.${k}`) })),
              ]}
              value={filter.kind ?? 'all'}
              onChange={(value) => change({ kind: value === 'all' ? null : value })}
            />
          </VStack>

          {/* How many the filters keep, said as it changes. */}
          <Text role="status" type="supporting" xstyle={styles.shown}>
            {t('missingInfo.shown', { count: shown.length })}
          </Text>

          {shown.length === 0 ? (
            <Text type="supporting">{t('missingInfo.noMatch')}</Text>
          ) : (
            <List hasDividers density="spacious" aria-label={tPlain('missingInfo.title')}>
              {shown.map((place) => (
                <ListItem
                  key={place.id}
                  href={`/place/?id=${encodeURIComponent(place.id)}&from=missing`}
                  label={
                    // A place's name is data: it reads in its own direction (D-534).
                    <Text dir="auto" xstyle={styles.name}>
                      {place.name}
                    </Text>
                  }
                  description={
                    <VStack gap={0}>
                      <Text xstyle={styles.detail}>
                        {t(`missingInfo.kind.${place.kind}`)}
                        {' · '}
                        {place.address ? <bdi dir="auto">{place.address}</bdi> : t('missingInfo.row.noAddress')}
                      </Text>
                      <Text xstyle={styles.detail}>
                        {t('missingInfo.row.missing', {
                          list: list.format(place.missing.map((d) => tPlain(`missingInfo.missing.${d}`))),
                        })}
                      </Text>
                    </VStack>
                  }
                />
              ))}
            </List>
          )}
        </>
      ) : null}
    </Page>
  );
}
