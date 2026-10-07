'use client';

import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { Text } from '@astryxdesign/core/Text';
import { BigButton } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { HelpButton } from './HelpButton';

/**
 * A staff invite made for a number that already has a Pam account (D-373).
 *
 * Until one account can hold both roles (member and program — the next
 * phase), a number is one account, one role. Pam does not tell the person
 * who made the invite that the number is already in Pam (that would let
 * anyone test whether somebody uses it, D-373); it tells the person signing
 * in, who can ask for the invite to go to another number. They keep their
 * own account and go on into it.
 */
const styles = stylex.create({
  body: { fontSize: '18px', lineHeight: 1.5 },
});

export function InviteInUseScreen({
  as,
  from,
}: {
  readonly as: 'program' | 'case-manager';
  readonly from: string | null;
}) {
  const { t } = useI18n();
  const name = from ?? t('invite.inUse.someone');
  return (
    <SubPage title={t('invite.inUse.title')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
      <Banner status="info" title={t(`invite.inUse.invited.${as}`, { name })} />
      <Text xstyle={styles.body}>{t('invite.inUse.body', { name })}</Text>
      <Text type="supporting" xstyle={styles.body}>
        {t('invite.inUse.soon')}
      </Text>
      <BigButton label={t('invite.inUse.go')} href="/" />
    </SubPage>
  );
}
