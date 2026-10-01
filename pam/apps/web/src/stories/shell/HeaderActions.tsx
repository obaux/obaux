'use client';

import * as stylex from '@stylexjs/stylex';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HelpIcon } from '@pam/ui';
import { HeaderBell } from '../../app/HeaderBell';
import { useI18n } from '../../lib/i18n';

const styles = stylex.create({ help: { width: '48px', height: '48px', borderRadius: '50%' } });

/** The redesign's header actions: the notifications bell, then Help (D-210). */
export function HeaderActions() {
  const { t } = useI18n();
  return (
    <>
      <HeaderBell enabled role="member" appearance="round" />
      <IconButton
        label={t('nav.help')}
        icon={<HelpIcon width={24} height={24} aria-hidden />}
        variant="secondary"
        href="/help/"
        xstyle={styles.help}
      />
    </>
  );
}
