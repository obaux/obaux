'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { BigButton, Notice, TextLink } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';

/**
 * What a screen shows somebody who is not (fully) in.
 *
 * Three different people used to get the same "Sign in" button:
 *
 * - somebody signed out, for whom it is right;
 * - somebody with a verified phone and no account yet, for whom it led to a
 *   phone field they had already filled in — the audit of the way in (14
 *   September) found this loop on six screens;
 * - somebody whose account a case manager paused, for whom every screen said
 *   "something went wrong" and offered a call about a thing that was not
 *   broken.
 *
 * One component, so the three answers are the same on every screen and a
 * seventh screen cannot forget one of them.
 */
export interface NotInProps {
  readonly status: 'signed-out' | 'no-profile' | 'suspended';
  /** What this screen is, for the signed-out case. Already translated. */
  readonly title: string;
  readonly body: string;
}

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
});

export function NotIn({ status, title, body }: NotInProps) {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();

  if (status === 'no-profile') {
    return (
      <>
        <Text xstyle={styles.intro}>{t('account.unfinished')}</Text>
        <BigButton label={t('join.resume')} href="/join/" />
      </>
    );
  }

  if (status === 'suspended') {
    return (
      <>
        <Notice
          notice="account_suspended"
          title={t(NOTICES.account_suspended.titleKey)}
          body={t(NOTICES.account_suspended.bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <TextLink label={t('signin.signout')} href="/account/" />
      </>
    );
  }

  return (
    <>
      <Notice
        notice="service_not_available"
        title={title}
        body={body}
        supportPhone={supportPhone}
        callLabel={t('help.callSupport')}
      />
      <BigButton label={t('signin.title')} href="/signin/" />
    </>
  );
}
