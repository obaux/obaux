'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { AppHeader, Loading, Notice, Page, PageTitle, TextLink } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { DUMMY_INTERESTED } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { HeaderBell } from '../HeaderBell';
import { PersonRow } from '../PersonRow';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useViewedRole } from '@/lib/useViewedRole';
import { whenHappened } from '@/lib/when';

/**
 * People interested in your program.
 *
 * §6 always meant for a program to have a screen of its own — somewhere to
 * see who wants in, the way a case manager sees a caseload and a super admin
 * sees the directory. Nothing writes "interested" anywhere yet: there is no
 * button on a program listing for a member to press, because programs
 * themselves are not listed yet. This is a preview of the screen, not the
 * screen with nothing in it — see `@pam/config/dummy-people` for why it is
 * always the same example set today, and `USE_DUMMY_PEOPLE` for the flag
 * that turns it off.
 */

const styles = stylex.create({
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export default function InterestedPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const viewedRole = useViewedRole(trueRole);
  const isProvider = viewedRole === 'provider';

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <NotIn status={session.status} title={t('interested.signedOut.title')} body={t('interested.signedOut.body')} />
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
      </Page>
    );
  }

  if (!isProvider) {
    // A plain statement of what this screen is, and a way back — not a
    // scolding and not a blank page (§0). Reuses the exact wording every
    // other role-gated screen already uses for the same case.
    return (
      <Page gap={4}>
        <AppHeader
          roleLabel={viewedRole ? t(`role.${viewedRole}`) : undefined}
          trailing={<HeaderBell enabled={trueRole !== null} role={viewedRole} />}
        />
        <Notice
          notice="service_not_available"
          title={t('interested.notProvider.title')}
          body={t('admin.notAdmin.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <TextLink label={t('admin.back')} href="/" />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      <AppHeader roleLabel={t('role.provider')} trailing={<HeaderBell enabled={isProvider} role={viewedRole} />} />

      <PageTitle
        title={t('interested.title')}
        subtitle={
          USE_DUMMY_PEOPLE
            ? t('interested.subtitle', { count: DUMMY_INTERESTED.length })
            : undefined
        }
        backHref="/"
        backLabel={t('nav.back.home')}
      />

      {!USE_DUMMY_PEOPLE ? (
        // No real "who is interested" query exists yet (see the file comment),
        // so there is nothing to say about an empty one either — this state is
        // only reachable at all once somebody has already turned the example
        // set off ahead of the real feature landing.
        <Notice
          notice="no_caseload_members"
          title={t('admin.caseload.empty.title')}
          body={t('admin.caseload.empty.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : (
        <VStack gap={3}>
          {DUMMY_INTERESTED.map((interest) => (
            <PersonRow
              key={interest.person.id}
              firstName={interest.person.firstName}
              href={`/person/?id=${interest.person.id}`}
              meta={[
                interest.programLabel,
                t('interested.since', { when: whenHappened(interest.interestedAt, locale, t) }),
              ]}
            />
          ))}
          <Text type="supporting" xstyle={styles.note}>
            {t('example.people.note')}
          </Text>
        </VStack>
      )}
    </Page>
  );
}
