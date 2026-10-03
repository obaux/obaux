'use client';

import { useEffect, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Dialog } from '@astryxdesign/core/Dialog';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, Loading, Page } from '@pam/ui';
import { SearchField } from '@pam/ui/SearchPill';
import { SubPageHeader } from '@pam/ui/SubPage';
import { CATEGORY_DEFINITIONS, type Category } from '@pam/config';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { usePlaces } from '@/lib/usePlaces';
import { CITY_HALL } from '@/lib/useAreaSearch';
import { CATEGORY_ICONS } from './ExploreView';
import { HeaderActions } from './HeaderActions';

/**
 * Connect {name} to… (D-231, D-234): a case manager finds a program and
 * recommends it to a member on their caseload, from the member's page.
 *
 * - **Search first**, the same pill as Explore, over every program PAM lists
 *   (`usePlaces` → `services_search`, the call Explore makes). Until the
 *   words are typed it shows the nearest; if the database cannot be reached
 *   it falls back to the example programs, so the screen is never empty.
 * - **A check on each row.** Tapping it asks first, in a dialog: "Recommend {program} to {name}?" Nothing happens on one tap.
 * - **A recommendation, not an enrolment.** The member sees it on their Home
 *   and says yes themselves; a case manager never enrols anybody.
 *
 * Example only for now, like Add a program (D-218): the confirmation is kept
 * on screen, not stored or sent.
 */
interface Program {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly address: string | null;
}

const EXAMPLES: readonly Program[] = Object.values(DUMMY_PLACES_BY_ID).map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  address: p.address,
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
  intro: { fontSize: '17px', lineHeight: 1.45 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  none: { fontSize: '17px' },
  doneTitle: { fontSize: '22px', lineHeight: 1.3, fontWeight: 700 },
  rowIcon: { width: '26px', height: '26px' },
  // An empty circle that reads as "tick this": the check inside it shows
  // once a program has been recommended.
  check: {
    width: '40px',
    height: '40px',
    minHeight: '40px',
    borderRadius: '50%',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  checkOn: {
    borderColor: colorVars['--color-icon-accent'],
    backgroundColor: colorVars['--color-icon-accent'],
    color: colorVars['--color-background-body'],
  },
  dialogTitle: { fontSize: '22px', lineHeight: 1.3 },
  dialogBody: { fontSize: '17px', lineHeight: 1.45 },
});

export function ConnectView({ personId, name }: { readonly personId: string; readonly name: string }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const settled = useDebounced(query, 300);
  const [asking, setAsking] = useState<Program | null>(null);
  const [recommended, setRecommended] = useState<Program | null>(null);
  const back = `/person/?id=${encodeURIComponent(personId)}`;

  const state = usePlaces({ lat: CITY_HALL.lat, lon: CITY_HALL.lon, limit: 30, query: settled.trim() });

  const programs = useMemo<readonly Program[] | null>(() => {
    if (state.status === 'ready') {
      return state.places.map((p) => ({ id: p.id, name: p.name, category: p.category, address: p.address }));
    }
    if (state.status === 'empty') return [];
    if (state.status === 'error') {
      const q = fold(settled.trim());
      return q ? EXAMPLES.filter((p) => fold(`${p.name} ${p.address ?? ''}`).includes(q)) : EXAMPLES;
    }
    return null;
  }, [state, settled]);

  if (recommended) {
    return (
      <Page gap={4}>
        <SubPageHeader
          title={t('person.connect.title', { name })}
          backHref={back}
          backLabel={t('person.connect.back', { name })}
          actions={<HeaderActions hasHelp={false} />}
        />
        <VStack gap={3}>
          <Text xstyle={styles.doneTitle} role="status">
            {t('person.connect.done.title', { name, program: recommended.name })}
          </Text>
          <Text type="supporting" xstyle={styles.intro}>
            {t('person.connect.done.body', { name })}
          </Text>
          <BigButton label={t('person.connect.back', { name })} href={back} />
        </VStack>
        <Text type="supporting" xstyle={styles.note}>
          {t('person.connect.example')}
        </Text>
      </Page>
    );
  }

  return (
    <Page gap={4}>
      <SubPageHeader
        title={t('person.connect.title', { name })}
        backHref={back}
        backLabel={t('person.connect.back', { name })}
        actions={<HeaderActions hasHelp={false} />}
      />
      <SearchField
        label={t('person.connect.search.label')}
        placeholder={t('person.connect.search.placeholder')}
        value={query}
        onChange={setQuery}
      />
      <Text type="supporting" xstyle={styles.intro}>
        {t('person.connect.intro', { name })}
      </Text>

      {programs === null ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : programs.length === 0 ? (
        <Text type="supporting" xstyle={styles.none}>
          {t('person.connect.none')}
        </Text>
      ) : (
        <List hasDividers density="spacious" aria-label={t('person.connect.list')}>
          {programs.map((program) => {
            const category = CATEGORY_DEFINITIONS[program.category];
            const sub = [category ? t(category.labelKey) : null, program.address].filter(Boolean).join(' · ');
            return (
              <ListItem
                key={program.id}
                label={program.name}
                description={sub || undefined}
                startContent={<HStack xstyle={styles.rowIcon}>{CATEGORY_ICONS[program.category]}</HStack>}
                endContent={
                  <IconButton
                    label={t('person.connect.check', { program: program.name })}
                    icon={<Icon icon="check" size="md" />}
                    variant="ghost"
                    onClick={() => setAsking(program)}
                    xstyle={styles.check}
                  />
                }
              />
            );
          })}
        </List>
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
