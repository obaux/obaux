'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader, HelpBar, Loading, Notice, Page } from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { HeaderActions } from '@/screens/HeaderActions';
import { NotIn } from './NotIn';

/**
 * What every tab screen stands on: somebody who is in.
 *
 * The old pages each answered the other cases themselves. The redesigned tab
 * screens (`screens/*`) were drawn for somebody signed in and said nothing
 * else, so routed in the app on their own they would show a signed-out visitor
 * the example people, and a paused account a screen as if nothing were wrong.
 * (`/trips/`, `/program/` and `/programs/` were already routed that way.) One gate, so the four answers are the same on every tab
 * and a sixth tab cannot forget one:
 *
 * - **Loading**: the screen's frame and the way to get help, never a bare
 *   "loading" (§0: a dying connection, or no JavaScript at all, shows this
 *   state, and it must not be a dead end). Every state here that is not the
 *   screen carries the Help bar, as the old Home did; the first version of
 *   this gate left it out and `e2e/a11y.spec.ts` caught it.
 * - **Signed out**: straight to Sign in, as the old Home did (Will, 17
 *   September: "kill this screen... just go straight to login screen").
 * - **No profile / paused**: what `NotIn` says for each, never a redirect.
 * - **Could not load**: offline, or something went wrong, and who to call.
 */
export function TabGate({ children }: { readonly children: ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  useEffect(() => {
    if (session.status === 'signed-out') router.replace('/signin/');
  }, [session.status, router]);

  if (session.status === 'loading' || session.status === 'signed-out') {
    return (
      // The new layout's own bar, not the old page's logo and Help block (D-492; Will, 10
      // October: "the loading screen shows the old page behind the new layout"): Help is
      // the round button every screen has, so this is still never a dead end (§0).
      <Page gap={3}>
        <LargeTitleHeader title={t('common.loading')} isTitleHidden actions={<HeaderActions enabled={false} />} />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('reminders.signedOut')} />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <AppHeader />
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

  return <>{children}</>;
}
