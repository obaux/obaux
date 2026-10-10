'use client';

import { useState } from 'react';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';
import { Loading, PlacesIcon, PlusIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';
import { useSession } from '@/lib/useSession';
import { pickOwnProgram, useOwnProgram } from '@/lib/useOwnProgram';
import { HelpButton } from './HelpButton';

/**
 * Your programs (D-318): a program lead can run more than one. Each is a row,
 * the one shown now is ticked, and tapping another shows it on the Program tab.
 * Add another program is the last row; Pam checks a program at a time, so it
 * waits while one is being checked.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;
const styles = stylex.create({
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export function ProgramSwitchView() {
  const { t } = useI18n();
  const { state: session } = useSession();
  const own = useOwnProgram(session);
  const [leaving, setLeaving] = useState(false);
  const back = { backHref: '/program/', backLabel: t('nav.back.program') };

  if (own.status !== 'ready') {
    return (
      <SubPage title={t('program.switch.title')} {...back} actions={<HelpButton />}>
        {own.status === 'loading' || own.status === 'idle' ? (
          <Loading label={t('common.loading')} variant="screen" />
        ) : (
          <Text xstyle={styles.note}>{t('program.switch.none')}</Text>
        )}
      </SubPage>
    );
  }

  const waiting = own.programs.find((program) => !program.isLive) ?? null;

  return (
    <SubPage title={t('program.switch.title')} {...back} actions={<HelpButton />}>
      <MenuList
        label={t('program.switch.title')}
        hasDividers
        items={own.programs.map((program) => ({
          id: program.id,
          label: program.details.name,
          ...(program.isLive ? {} : { description: t('program.switch.checking') }),
          isSelected: program.id === own.program.id,
          icon: <PlacesIcon {...ICON} />,
          onSelect: () => {
            if (leaving) return;
            setLeaving(true);
            pickOwnProgram(program.id);
            navigate('/program/');
          },
        }))}
      />
      {waiting ? (
        <Text type="supporting" xstyle={styles.note}>
          {t('program.switch.wait', { name: waiting.details.name })}
        </Text>
      ) : (
        <MenuList
          label={t('program.switch.add')}
          items={[
            {
              id: 'add',
              label: t('program.switch.add'),
              description: t('program.switch.add.body'),
              icon: <PlusIcon {...ICON} />,
              href: '/programs/new/',
            },
          ]}
        />
      )}
    </SubPage>
  );
}
