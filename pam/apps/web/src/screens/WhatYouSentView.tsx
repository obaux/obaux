'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { programSummary } from '../app/join/ProgramWizard';
import { useI18n } from '@/lib/i18n';
import { readSentProgram, type SentProgram } from '@/lib/programSetup';
import { HelpButton } from './HelpButton';

/**
 * What you sent (D-381): the program as it went to Pam, read-only — so a
 * lead waiting on review can check the address was right without wondering.
 * The same rows as the review step; changing it is what "needs changes"
 * opens, not this page.
 */
const styles = stylex.create({
  when: { fontSize: '16px', lineHeight: 1.5 },
});

export function WhatYouSentView({ sent: given }: { readonly sent?: SentProgram | null } = {}) {
  const { t, locale } = useI18n();
  const sent = given ?? readSentProgram();
  return (
    <SubPage title={t('programs.sent.title')} backHref="/program/" backLabel={t('nav.back.program')} actions={<HelpButton />}>
      {sent ? (
        <>
          <Text type="supporting" xstyle={styles.when}>
            {t('programs.sent.when', {
              date: new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(new Date(sent.sentAt)),
            })}
          </Text>
          <MenuList
            label={t('programs.sent.title')}
            hasDividers
            items={programSummary(sent.details, t).map((row) => ({
              id: row.id,
              label: row.label,
              description: row.value || t('join.program.review.empty'),
              icon: null,
            }))}
          />
        </>
      ) : (
        <Text xstyle={styles.when}>{t('programs.sent.none')}</Text>
      )}
    </SubPage>
  );
}
