'use client';

import { Notice } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';

/**
 * "Some things are turned off" — what a limited member meets where Messages
 * would let them send or start something (terms.s.limits.p3: "Pam tells you
 * it is off and who to call", D-427).
 *
 * A limited account can still read (0031): the messages stay on the screen and
 * this stands where the composer or the New message button would be. It says
 * what is off and carries the call button, the way every notice does.
 */
export function LimitedNotice({ supportPhone }: { readonly supportPhone: string }) {
  const { t } = useI18n();
  return (
    <Notice
      notice="account_limited"
      title={t(NOTICES.account_limited.titleKey)}
      body={t(NOTICES.account_limited.bodyKey)}
      supportPhone={supportPhone}
      callLabel={t('help.callSupport')}
    />
  );
}
