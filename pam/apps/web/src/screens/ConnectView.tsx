'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, Page } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPageHeader } from '@pam/ui/SubPage';
import { CATEGORY_DEFINITIONS } from '@pam/config';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_ICONS } from './ExploreView';
import { HeaderActions } from './HeaderActions';

/**
 * Connect {name} to… (D-231): a case manager picks a program for a member on
 * their caseload, from the member's page.
 *
 * Example only for now, like Add a program (D-218): the list is the example
 * programs and the choice is kept on screen, not stored. When referrals are
 * built, the pick becomes one — the member sees the program on their Home
 * and says yes or no themselves; a case manager never enrols anybody.
 */
const styles = stylex.create({
  intro: { fontSize: '17px', lineHeight: 1.45 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  doneTitle: { fontSize: '22px', lineHeight: 1.3, fontWeight: 700 },
});

const PROGRAMS = Object.values(DUMMY_PLACES_BY_ID);

export function ConnectView({ personId, name }: { readonly personId: string; readonly name: string }) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<string | null>(null);
  const back = `/person/?id=${encodeURIComponent(personId)}`;
  const program = picked ? (DUMMY_PLACES_BY_ID[picked] ?? null) : null;

  return (
    <Page gap={4}>
      <SubPageHeader
        title={t('person.connect.title', { name })}
        backHref={back}
        backLabel={t('person.connect.back', { name })}
        actions={<HeaderActions hasHelp={false} />}
      />
      {program ? (
        <VStack gap={3}>
          <Text xstyle={styles.doneTitle} role="status">
            {t('person.connect.done.title', { name, program: program.name })}
          </Text>
          <Text type="supporting" xstyle={styles.intro}>
            {t('person.connect.done.body', { program: program.name })}
          </Text>
          <BigButton label={t('person.connect.back', { name })} href={back} />
        </VStack>
      ) : (
        <VStack gap={3}>
          <Text type="supporting" xstyle={styles.intro}>
            {t('person.connect.intro', { name })}
          </Text>
          <MenuList
            label={t('person.connect.list')}
            items={PROGRAMS.map((place) => ({
              id: place.id,
              label: place.name,
              description: t(CATEGORY_DEFINITIONS[place.category].labelKey),
              icon: CATEGORY_ICONS[place.category],
              onSelect: () => setPicked(place.id),
            }))}
          />
        </VStack>
      )}
      <Text type="supporting" xstyle={styles.note}>
        {t('person.connect.example')}
      </Text>
    </Page>
  );
}
