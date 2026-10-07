'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, Notice, TextLink } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';
import { addRoleFromInvite } from '@/lib/useRoles';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { HelpButton } from './HelpButton';

/**
 * A member's number, invited to a program in their city (D-374): add the
 * program to the account they already have, rather than a second account.
 *
 * Said before they say yes: what changes (they can switch between their own
 * Pam and their program, on Profile) and what stays private (people at the
 * program will not see their member side — the database keeps them out of
 * that program's lists, and they cannot book it as a member). "Not now"
 * leaves everything as it is.
 */
const styles = stylex.create({
  body: { fontSize: '18px', lineHeight: 1.5 },
  point: { fontSize: '17px', lineHeight: 1.45 },
});

export function InviteAddScreen({
  code,
  from,
  preview = false,
}: {
  readonly code: string;
  readonly from: string | null;
  readonly preview?: boolean;
}) {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const name = from ?? t('invite.inUse.someone');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const add = async () => {
    setBusy(true);
    setFailed(false);
    const ok = preview ? true : await addRoleFromInvite(code);
    setBusy(false);
    if (ok) navigate('/');
    else setFailed(true);
  };

  return (
    <SubPage title={t('invite.add.title')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
      <Banner status="success" title={t('invite.inUse.invited.program', { name })} />
      <Text xstyle={styles.body}>{t('invite.add.body')}</Text>
      <VStack gap={3} role="list">
        {[1, 2, 3].map((n) => (
          <Text key={n} role="listitem" xstyle={styles.point}>
            {t(`invite.add.point.${n}`)}
          </Text>
        ))}
      </VStack>
      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('invite.add.failed')}
          body={t('admin.invite.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}
      <BigButton label={busy ? t('join.saving') : t('invite.add.yes')} isDisabled={busy} onPress={() => void add()} />
      <TextLink label={t('invite.add.no')} href="/" />
    </SubPage>
  );
}
