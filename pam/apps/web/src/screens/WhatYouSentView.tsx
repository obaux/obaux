'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { HelpIcon, TrashIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { roundAction } from '@pam/ui/roundAction';
import { programSummary } from '../app/join/ProgramWizard';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';
import { readSentProgram, startOver, type SentProgram } from '@/lib/programSetup';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * What you sent (D-381): the program as it went to Pam, read-only — so a
 * lead waiting on review can check the address was right without wondering.
 * The same rows as the review step; changing it is what "needs changes"
 * opens, not this page.
 *
 * Top right, a ⋯ menu instead of Help (Will, 7 October, D-385): Delete and
 * start over — after an "Are you sure?" — and Get help, so help is still one
 * tap further (sop-amendments A20).
 */
const styles = stylex.create({
  when: { fontSize: '16px', lineHeight: 1.5 },
});

const ICON = { width: 22, height: 22, 'aria-hidden': true } as const;

function MoreMenu({ onStartOver }: { readonly onStartOver: () => void }) {
  const { t } = useI18n();
  return (
    <DropdownMenu
      button={{
        label: t('programs.sent.more'),
        isIconOnly: true,
        variant: 'ghost',
        icon: <Icon icon="moreHorizontal" size="md" />,
        xstyle: roundAction.button,
      }}
      hasChevron={false}
      placement="below"
      alignment="end"
      menuWidth={260}
      items={[
        { id: 'start-over', label: t('programs.sent.startOver'), icon: <TrashIcon {...ICON} />, variant: 'destructive', onClick: onStartOver },
        { type: 'divider' },
        { id: 'help', label: t('nav.help'), icon: <HelpIcon {...ICON} />, onClick: () => navigate('/help/') },
      ]}
    />
  );
}

export function WhatYouSentView({ sent: given }: { readonly sent?: SentProgram | null } = {}) {
  const { t, locale } = useI18n();
  const sent = given ?? readSentProgram();
  const [isAsking, setIsAsking] = useState(false);
  return (
    <SubPage
      title={t('programs.sent.title')}
      backHref="/program/"
      backLabel={t('nav.back.program')}
      actions={<MoreMenu onStartOver={() => setIsAsking(true)} />}
    >
      <ConfirmDialog
        isOpen={isAsking}
        title={t('programs.sent.startOver.title')}
        body={t('programs.sent.startOver.body')}
        confirmLabel={t('programs.sent.startOver')}
        onConfirm={() => {
          startOver();
          navigate('/program/');
        }}
        cancelLabel={t('programs.sent.startOver.keep')}
        onCancel={() => setIsAsking(false)}
      />
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
