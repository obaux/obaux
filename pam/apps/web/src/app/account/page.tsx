'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import {
  AppHeader,
  BigButton,
  HelpBar,
  Loading,
  Notice,
  Page,
  PageTitle,
  TextLink,
} from '@pam/ui';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession, signOut } from '@/lib/useSession';

/**
 * Your account — and the way out.
 *
 * Until the audit of the way in (14 September) the only sign-out in PAM was a
 * text link at the bottom of the case manager's screen. A member had none. On
 * a shared phone, or a phone handed to somebody else at a program, the person
 * who signed in stayed signed in for ninety days — which is §12's rule about
 * not timing people out doing exactly the wrong job.
 *
 * This is the one screen every signed-in person has, reached from the same
 * button in every header. It says who PAM thinks you are, in the words the
 * sign-up screen used, and it has one action: sign out. The account is not
 * editable here yet — a name or a city typed wrong at sign-up is a call to PAM
 * for now, and that is said rather than hidden.
 *
 * Sign out goes to the sign-in screen, which says so. A sign-out that reloads
 * the page the person was on shows them a signed-out version of it and leaves
 * them wondering whether anything happened.
 */

const styles = stylex.create({
  card: { width: '100%' },
  label: { fontSize: '15px' },
  value: { fontSize: '18px', lineHeight: 1.4 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  intro: { fontSize: '18px', lineHeight: 1.5 },
});

export default function AccountPage() {
  const { t } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const [busy, setBusy] = useState(false);

  const leave = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      router.replace('/signin/?out=1');
    }
  };

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader accountHref={null} />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out') {
    return (
      <Page gap={4}>
        <AppHeader accountHref={null} />
        <PageTitle title={t('account.title')} backHref="/" backLabel={t('nav.back.home')} />
        <Text xstyle={styles.intro}>{t('account.signedOut')}</Text>
        <BigButton label={t('signin.title')} href="/signin/" />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <AppHeader accountHref={null} />
        <PageTitle title={t('account.title')} backHref="/" backLabel={t('nav.back.home')} />
        <Notice
          notice={key}
          title={t(NOTICES[key].titleKey)}
          body={t(NOTICES[key].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  /*
   * Two states that are still "you", with a way out. Somebody halfway through
   * sign-up on a borrowed phone needs sign-out more than anybody; somebody whose
   * account is paused is told so once, here, rather than by every screen.
   */
  const partial = session.status === 'no-profile' || session.status === 'suspended';

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={session.status === 'signed-in' ? t(`role.${session.session.role}`) : undefined}
        accountHref={null}
      />
      <PageTitle title={t('account.title')} backHref="/" backLabel={t('nav.back.home')} />

      {session.status === 'suspended' ? (
        <Notice
          notice="account_suspended"
          title={t(NOTICES.account_suspended.titleKey)}
          body={t(NOTICES.account_suspended.bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {session.status === 'no-profile' ? (
        <>
          <Text xstyle={styles.intro}>{t('account.unfinished')}</Text>
          <BigButton label={t('join.resume')} href="/join/" />
        </>
      ) : null}

      {session.status === 'signed-in' ? (
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={3}>
            <VStack gap={0.5}>
              <Text type="supporting" xstyle={styles.label}>
                {t('account.name')}
              </Text>
              <Text xstyle={styles.value}>{session.session.firstName ?? '—'}</Text>
            </VStack>
            <VStack gap={0.5}>
              <Text type="supporting" xstyle={styles.label}>
                {t('account.kind')}
              </Text>
              <HStack gap={2} align="center">
                <Badge variant="neutral" label={t(`role.${session.session.role}`)} />
              </HStack>
            </VStack>
            {session.session.regionName ? (
              <VStack gap={0.5}>
                <Text type="supporting" xstyle={styles.label}>
                  {t('account.city')}
                </Text>
                <Text xstyle={styles.value}>{session.session.regionName}</Text>
              </VStack>
            ) : null}
            <Text type="supporting" xstyle={styles.note}>
              {t('account.change')}
            </Text>
          </VStack>
        </Card>
      ) : null}

      {session.status === 'signed-in' ? (
        <VStack gap={2}>
          <Heading level={2} xstyle={styles.value}>
            {t('account.settings')}
          </Heading>
          <TextLink label={t('reminders.settings')} href="/reminders/" />
          <TextLink label={t('legal.privacy')} href="/privacy/" />
        </VStack>
      ) : null}

      <VStack gap={2}>
        <BigButton
          label={busy ? t('account.signingOut') : t('signin.signout')}
          variant={partial ? 'primary' : 'secondary'}
          onPress={() => void leave()}
          isDisabled={busy}
        />
        <Text type="supporting" xstyle={styles.note}>
          {t('account.signout.body')}
        </Text>
      </VStack>

      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}
