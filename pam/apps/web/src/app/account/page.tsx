'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { BigButton, Notice, SubPage } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession, signOut } from '@/lib/useSession';
import { ProfileLoading, ProfileScreen } from '../../screens/ProfileScreen';
import { HelpButton } from '../../screens/HelpButton';

/**
 * Your account — and the way out.
 *
 * **Profile is the signed-in view now (D-217, D-213)**: for somebody signed in
 * this address opens the Profile tab, which has everything this screen's
 * settings card had (Use Pam as, Reminders, Language, Privacy, Help) and the
 * sign-out. What stays here is for everybody else, and it must: `NotIn` sends
 * a paused account to `/account/` to sign out, and somebody half-way through
 * sign-up on a borrowed phone needs the same, so the loading, signed-out, error,
 * no-profile and paused answers below are this screen's still.
 *
 * What it was:
 *
 * Until the audit of the way in (14 September) the only sign-out in Pam was a
 * text link at the bottom of the case manager's screen. A member had none. On
 * a shared phone, or a phone handed to somebody else at a program, the person
 * who signed in stayed signed in for ninety days — which is §12's rule about
 * not timing people out doing exactly the wrong job.
 *
 * This is the one screen every signed-in person has, reached from the same
 * button in every header. It says who Pam thinks you are, in the words the
 * sign-up screen used, and it has one action: sign out. The account is not
 * editable here yet — a name or a city typed wrong at sign-up is a call to Pam
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
  intro: { fontSize: '18px', lineHeight: 1.5 },
});

export default function AccountPage() {
  const { t } = useI18n();
  const router = useRouter();
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

  // The hero card as pulses, not a spinner (Will, 11 October); an error below is the card's real empty state.
  if (session.status === 'loading') return <ProfileLoading />;

  if (session.status === 'signed-out') {
    return (
      // The new layout's bar (D-621): the round back and Help, not the old page's logo and Help block.
      <SubPage title={t('account.title')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
        <Text xstyle={styles.intro}>{t('account.signedOut')}</Text>
        <BigButton label={t('signin.title')} href="/signin/" />
      </SubPage>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <SubPage title={t('account.title')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
        <Notice
          notice={key}
          title={t(NOTICES[key].titleKey)}
          body={t(NOTICES[key].bodyKey)}
          contactLabel={t('help.contact.action')}
        />
      </SubPage>
    );
  }

  // Signed in: the Profile tab (D-217).
  if (session.status === 'signed-in') return <ProfileScreen />;

  /*
   * Two states that are still "you", with a way out. Somebody halfway through
   * sign-up on a borrowed phone needs sign-out more than anybody; somebody whose
   * account is paused is told so once, here, rather than by every screen.
   */
  return (
    <SubPage title={t('account.title')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
      {session.status === 'suspended' ? (
        <Notice
          notice="account_suspended"
          title={t(NOTICES.account_suspended.titleKey)}
          body={t(NOTICES.account_suspended.bodyKey)}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {session.status === 'no-profile' ? (
        <>
          <Text xstyle={styles.intro}>{t('account.unfinished')}</Text>
          <BigButton label={t('join.resume')} href="/join/" />
        </>
      ) : null}

      {/* No line under the button (D-608): nobody needs it to decide. */}
      <BigButton
        label={busy ? t('account.signingOut') : t('signin.signout')}
        variant="primary"
        onPress={() => void leave()}
        isDisabled={busy}
      />
    </SubPage>
  );
}
