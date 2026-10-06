'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { BigButton, Loading, Notice, Page, TextLink } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { HelpButton } from '../../screens/HelpButton';
import { InviteReady } from '../../screens/InviteReady';
import { PersonRowSkeletonList } from '@pam/ui/Skeletons';
import { NOTICES } from '@pam/config';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { DUMMY_MEMBERS, DUMMY_PROGRAM_LEADS } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { PersonRow } from '../PersonRow';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useCaseload, createInvite, type CreatedInvite } from '@/lib/useCaseload';
import { dummyChip, statusChip, whenLastActive } from '@/lib/caseloadLabels';
import { useRoleView } from '@/lib/useViewedRole';
import { useDemoView } from '@/lib/useDemoView';
import { RoleSwitchControl } from '../RoleSwitchControl';

/**
 * The case manager's screen (§4.1).
 *
 * Two jobs, in this order: see the people you are responsible for, and bring
 * somebody new in. Everything else an admin can do — turning a feature off,
 * pausing an account, making an introduction — hangs off a member and belongs
 * on a member's own screen, which is the next piece.
 *
 * What is deliberately on this page and easy to miss: a standing statement of
 * what an admin can and cannot see. Members are shown that same list at
 * onboarding and asked to trust it. An admin should be looking at it too, so
 * that the promise is visible from both sides rather than only the side that
 * has to take it on faith.
 *
 * **A caseload member's row now names which program they are genuinely
 * enrolled in, when there is one** (D-175) — a case manager's caseload can
 * span members in several different programs, unlike a program admin's own
 * screen, which is always their own org and would have gained nothing from
 * repeating it. Not shown on the dummy caseload rows below: `/person/`
 * already carries the demo version of this badge (D-175), and every dummy
 * `PersonRow` here has its own full-card `href` to `/person/`, which a
 * second, nested link inside the same card would fight for the tap.
 */

const styles = stylex.create({
  title: { fontSize: '28px', lineHeight: 1.2 },
  // A secondary button, which is a button and not a link: it keeps the 48px
  // floor but reads as an action.
  secondary: { minHeight: '48px', fontSize: '17px' },
  region: { fontSize: '17px' },
  card: { width: '100%' },
  name: { fontSize: '20px', lineHeight: 1.3 },
  meta: { fontSize: '16px' },
  // The code is read aloud down a phone line. It is the largest thing here.
  code: {
    fontSize: '40px',
    lineHeight: 1.1,
    letterSpacing: '0.12em',
    fontVariantNumeric: 'tabular-nums',
  },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export default function AdminPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  // A super admin previewing "Case manager" from Home sees this screen too —
  // their own account, drawn as a case manager's (D-108, useViewedRole) — not
  // just Home's tiles. Before this, every screen but Home asked the real role
  // directly, so leaving Home reset the preview (Will, 16 September).
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, setViewAs } = useRoleView(trueRole);
  const isAdmin = viewedRole === 'admin';
  const isDemo = useDemoView(session);
  const { state: caseload, refresh } = useCaseload(isAdmin);

  const [invite, setInvite] = useState<CreatedInvite | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteFailed, setInviteFailed] = useState(false);

  const makeInvite = async (role: 'member' | 'provider') => {
    setInviteBusy(true);
    setInviteFailed(false);
    const created = await createInvite(role);
    setInviteBusy(false);
    if (created) {
      setInvite(created);
      refresh();
    } else {
      setInviteFailed(true);
    }
  };

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <SubPageHeader
          title={t('profile.menu.invite')}
          backHref="/profile/"
          backLabel={t('nav.back.profile')}
          actions={
            <>
              {trueRole === 'super_admin' ? (
                <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
              ) : null}
              <HelpButton />
            </>
          }
        />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <SubPageHeader
          title={t('profile.menu.invite')}
          backHref="/profile/"
          backLabel={t('nav.back.profile')}
          actions={
            <>
              {trueRole === 'super_admin' ? (
                <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
              ) : null}
              <HelpButton />
            </>
          }
        />
        <NotIn status={session.status} title={t('admin.signedOut.title')} body={t('admin.signedOut.body')} />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <SubPageHeader
          title={t('profile.menu.invite')}
          backHref="/profile/"
          backLabel={t('nav.back.profile')}
          actions={
            <>
              {trueRole === 'super_admin' ? (
                <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
              ) : null}
              <HelpButton />
            </>
          }
        />
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

  if (!isAdmin) {
    // Not a permission error to scold somebody with — a plain statement of what
    // this screen is, and a way to get it fixed if it is wrong (§0).
    return (
      <Page gap={4}>
        <SubPageHeader
          title={t('profile.menu.invite')}
          backHref="/profile/"
          backLabel={t('nav.back.profile')}
          actions={
            <>
              {trueRole === 'super_admin' ? (
                <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
              ) : null}
              <HelpButton />
            </>
          }
        />
        <Notice
          notice="service_not_available"
          title={t('admin.notAdmin.title')}
          body={t('admin.notAdmin.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        {/*
            A super admin lands here from habit, not by mistake: this is the
            staff screen they knew about. Say where their own list is rather
            than leaving them at a closed door (§0). Their *real* account, not
            the previewed one — a super admin previewing "Member" still has a
            people list of their own to get to.
          */}
        {trueRole === 'super_admin' ? <TextLink label={t('directory.title')} href="/directory/" /> : null}
      </Page>
    );
  }

  const { session: me } = session;

  return (
    <Page gap={4}>
      {/*
          The bell says how many things need this case manager; the list is a
          screen of its own. A glance belongs in the header, the work does not
          (D-084). What reaches it: a place one of their people saved was
          flagged, or a message in their caseload was reported. Nothing else,
          and no row carries anybody's words (A7 / D-080).
        */}
      <SubPageHeader
        title={t('profile.menu.invite')}
        subtitle={me.regionName ? t('admin.subtitle', { region: me.regionName }) : undefined}
        backHref="/profile/"
        backLabel={t('nav.back.profile')}
        actions={
          <>
            {trueRole === 'super_admin' ? (
              <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
            ) : null}
            <HelpButton />
          </>
        }
      />

      {invite ? (
        <InviteReady invite={invite} onAnother={() => setInvite(null)} />
      ) : (
        <VStack gap={2}>
          <BigButton
            label={inviteBusy ? t('admin.invite.creating') : t('admin.invite.member')}
            onPress={() => void makeInvite('member')}
            isDisabled={inviteBusy}
          />
          {/* The same size and type as the button above it (D-239). */}
          <BigButton
            label={t('admin.invite.provider')}
            variant="secondary"
            onPress={() => void makeInvite('provider')}
            isDisabled={inviteBusy}
          />
        </VStack>
      )}

      {inviteFailed ? (
        <Notice
          notice="something_went_wrong"
          title={t('admin.invite.failed.title')}
          body={t('admin.invite.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      <Heading level={2} xstyle={styles.name}>
        {t('admin.members.title')}
      </Heading>

      {caseload.status === 'loading' ? <PersonRowSkeletonList label={t('common.loading')} /> : null}

      {caseload.status === 'empty' && !USE_DUMMY_PEOPLE && !isDemo ? (
        <Notice
          notice="no_caseload_members"
          title={t('admin.caseload.empty.title')}
          body={t('admin.caseload.empty.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {caseload.status === 'error' ? (
        <Notice
          notice={caseload.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[caseload.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[caseload.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {caseload.status === 'ready' && !isDemo ? (
        <VStack gap={3}>
          {caseload.members.map((member) => {
            const when = whenLastActive(member.lastActiveAt, locale);
            const chip = statusChip(member, t);
            return (
              <PersonRow
                key={member.id}
                firstName={member.firstName}
                chip={chip}
                programBadge={member.program}
                meta={[
                  ...(member.points !== null ? [t('admin.points', { count: member.points })] : []),
                  when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
                ]}
              />
            );
          })}
        </VStack>
      ) : null}

      {/*
          Real caseload is empty — every case manager's, until invites go out —
          so this is what the screen shows instead: the same list, made of
          people who do not exist, so a first look at Pam has something to look
          at (Will, 16 September). The moment `useCaseload` stops returning
          `'empty'`, this disappears on its own; see `@pam/config/dummy-people`.
        */}
      {(caseload.status === 'empty' || isDemo) && USE_DUMMY_PEOPLE ? (
        <VStack gap={3}>
          {DUMMY_MEMBERS.map((member) => {
            const when = whenLastActive(member.lastActiveAt, locale);
            return (
              <PersonRow
                key={member.id}
                firstName={member.firstName}
                href={`/person/?id=${member.id}`}
                chip={dummyChip(member.accessStatus, t)}
                meta={[
                  ...(member.points !== undefined ? [t('admin.points', { count: member.points })] : []),
                  when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
                ]}
              />
            );
          })}
          <Text type="supporting" xstyle={styles.note}>
            {t('example.people.note')}
          </Text>
        </VStack>
      ) : null}

      {/*
          "Program leads" — the providers a case manager works with, which Pam
          has no relationship to query yet (Will, 16 September). Always the
          same example set until that exists; see `@pam/config/dummy-people`.
        */}
      {USE_DUMMY_PEOPLE ? (
        <VStack gap={3}>
          <Heading level={2} xstyle={styles.name}>
            {t('admin.programLeads.title')}
          </Heading>
          {DUMMY_PROGRAM_LEADS.map((lead) => {
            const when = whenLastActive(lead.lastActiveAt, locale);
            return (
              <PersonRow
                key={lead.id}
                firstName={lead.firstName}
                href={`/person/?id=${lead.id}`}
                meta={[
                  ...(lead.orgName ? [lead.orgName] : []),
                  when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
                ]}
              />
            );
          })}
          <Text type="supporting" xstyle={styles.note}>
            {t('example.people.note')}
          </Text>
        </VStack>
      ) : null}

      {/*
          The transparency contract, on the admin's side of it. Members agree to
          this list at onboarding; an admin should see the same words.
        */}
      <Card xstyle={styles.card}>
        <VStack gap={2}>
          <Heading level={2} xstyle={styles.name}>
            {t('admin.seeing.title')}
          </Heading>
          <Text type="supporting" xstyle={styles.note}>
            {t('admin.seeing.body')}
          </Text>
        </VStack>
      </Card>
    </Page>
  );
}
