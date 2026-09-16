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
import { Button } from '@astryxdesign/core/Button';
import {
  AppHeader,
  BellIcon,
  BigButton,
  HelpBar,
  Loading,
  Notice,
  Page,
  PageTitle,
  ShieldIcon,
} from '@pam/ui';
import { NOTICES } from '@pam/config';
import { DUMMY_SELF } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession, signOut } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { RoleSwitchControl } from '../RoleSwitchControl';

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
 *
 * **A super admin previewing a role sees an example account, not their own**
 * (Will, 16 September: "the Profile screen should also populate with an
 * example program, case manager, and member. Not just super admin profile.")
 * Before this, "Viewing as Program" showed Will's own real name and city
 * under a "Program" badge — his own account, mislabelled, rather than a
 * demonstration of what a program's account looks like. While a preview is
 * active this screen shows the matching example from `@pam/config/dummy-people`
 * instead; signing out here still signs the real, signed-in account out.
 * Previewing "Super admin" shows the real thing, because that is the one role
 * `DUMMY_SELF` deliberately has no entry for — a super admin looking at their
 * own screen needs no stand-in.
 */

const styles = stylex.create({
  card: { width: '100%' },
  label: { fontSize: '15px' },
  value: { fontSize: '18px', lineHeight: 1.4 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  intro: { fontSize: '18px', lineHeight: 1.5 },
  /*
   * One size, one alignment, for every row in Settings (Will, 16 September:
   * "ensure all items in button areas are using a consistent font size...
   * add icons... left align for easier readability"). The Language row used
   * to be its own dropdown-menu button, sized and centred by Astryx's own
   * default rather than by this file — that mismatch was the thing that made
   * it read as inconsistent, not a difference in wording.
   */
  row: {
    width: '100%',
    minHeight: '48px',
    fontSize: '17px',
    justifyContent: 'flex-start',
    textAlign: 'left',
  },
});

export default function AccountPage() {
  const { t } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const [busy, setBusy] = useState(false);
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole, setViewAs } = useRoleView(trueRole);
  const dummySelf = demoRole ? DUMMY_SELF[demoRole] : undefined;

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
        roleLabel={session.status === 'signed-in' ? t(`role.${demoRole ?? session.session.role}`) : undefined}
        roleControl={
          trueRole === 'super_admin' ? (
            <RoleSwitchControl trueRole={trueRole} viewedRole={demoRole ?? trueRole} onChange={setViewAs} />
          ) : undefined
        }
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
              <Text xstyle={styles.value}>{dummySelf?.firstName ?? session.session.firstName ?? '—'}</Text>
            </VStack>
            <VStack gap={0.5}>
              <Text type="supporting" xstyle={styles.label}>
                {t('account.kind')}
              </Text>
              <HStack gap={2} align="center">
                <Badge variant="neutral" label={t(`role.${demoRole ?? session.session.role}`)} />
                {dummySelf?.orgName ? <Badge variant="neutral" label={dummySelf.orgName} /> : null}
              </HStack>
            </VStack>
            {(dummySelf?.regionName ?? session.session.regionName) ? (
              <VStack gap={0.5}>
                <Text type="supporting" xstyle={styles.label}>
                  {t('account.city')}
                </Text>
                <Text xstyle={styles.value}>{dummySelf?.regionName ?? session.session.regionName}</Text>
              </VStack>
            ) : null}
            <Text type="supporting" xstyle={styles.note}>
              {dummySelf ? t('example.people.note') : t('account.change')}
            </Text>
          </VStack>
        </Card>
      ) : null}

      {session.status === 'signed-in' ? (
        <VStack gap={2}>
          <Heading level={2} xstyle={styles.value}>
            {t('account.settings')}
          </Heading>
          <Button
            label={t('reminders.settings')}
            variant="ghost"
            icon={<BellIcon />}
            href="/reminders/"
            xstyle={styles.row}
          />
          <Button
            label={t('legal.privacy')}
            variant="ghost"
            icon={<ShieldIcon />}
            href="/privacy/"
            xstyle={styles.row}
          />
          <LanguageSwitcher variant="row" rowStyle={styles.row} />
        </VStack>
      ) : null}

      {/*
        Help sits among the other settings, and Sign Out is the last thing on
        the screen (Will, 16 September) — it used to be the other way round,
        which put the way out of the account above the way to get help with
        it.
      */}
      <HelpBar label={t('nav.help')} variant="block" />

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
    </Page>
  );
}
