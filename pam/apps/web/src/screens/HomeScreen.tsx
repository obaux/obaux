'use client';

import { useRouter } from 'next/navigation';
import { Loading, Notice, Page, PeopleIcon } from '@pam/ui';
import { FloatingAction } from '@pam/ui/FloatingAction';
import { useStarredPeople } from '@/lib/useStarredPeople';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { DUMMY_MEMBERS } from '@pam/config/dummy-people';
import { DUMMY_APPOINTMENTS } from '@pam/config/dummy-appointments';
import { ScheduleView, type Appointment } from './ScheduleView';
import { AddMenu } from './AddMenu';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useCaseload } from '@/lib/useCaseload';
import { dummyChip, statusChip, whenLastActive } from '@/lib/caseloadLabels';
import { ExploreScreen } from './ExploreScreen';
import { HeaderActions } from './HeaderActions';
import { PeopleHomeView, type HomePerson, type PeopleState } from './PeopleHomeView';

/**
 * The first tab, for whoever is signed in (D-212): a member explores places;
 * a case manager sees their caseload; a program sees who wants in. A super
 * admin previewing a role sees that role's home (D-108); on their own
 * account they get Explore — the catalogue is theirs to look after.
 */
export function HomeScreen() {
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <Loading label="" variant="screen" />
      </Page>
    );
  }
  if (viewedRole === 'admin') return <CaseloadHome />;
  if (viewedRole === 'provider') return <ProgramHome />;
  return <ExploreScreen />;
}

/** A case manager's home: the people on their caseload. */
export function CaseloadHome() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: caseload, refresh } = useCaseload(true);
  const starred = useStarredPeople();

  // The real list when there is one; the example people otherwise, as on
  // `/admin/` (Will, 16 September — and kept for investor demos, 1 October).
  const state: PeopleState =
    caseload.status === 'loading'
      ? { status: 'loading' }
      : caseload.status === 'error'
        ? { status: 'error', offline: caseload.offline }
        : caseload.status === 'ready'
          ? {
              status: 'ready',
              people: caseload.members.map((member): HomePerson => {
                const when = whenLastActive(member.lastActiveAt, locale);
                // No link: `/person/` only resolves example people today,
                // so a real row would open a dead end (as on `/admin/`).
                return {
                  id: member.id,
                  firstName: member.firstName,
                  chip: statusChip(member, t),
                  programBadge: member.program,
                  meta: [
                    ...(member.points !== null ? [t('admin.points', { count: member.points })] : []),
                    when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
                  ],
                };
              }),
            }
          : {
              status: 'ready',
              people: USE_DUMMY_PEOPLE
                ? DUMMY_MEMBERS.map((member): HomePerson => {
                    const when = whenLastActive(member.lastActiveAt, locale);
                    return {
                      id: member.id,
                      firstName: member.firstName,
                      href: `/person/?id=${member.id}`,
                      chip: dummyChip(member.accessStatus, t),
                      meta: [
                        ...(member.points !== undefined ? [t('admin.points', { count: member.points })] : []),
                        when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
                      ],
                    };
                  })
                : [],
            };
  const isExample = caseload.status === 'empty' && USE_DUMMY_PEOPLE;

  return (
    <PeopleHomeView
      title={t('home.caseload.title')}
      countLabel={(count) => t('home.caseload.count', { count })}
      search={{
        label: t('home.caseload.search.label'),
        placeholder: t('home.caseload.search.placeholder'),
        none: t('home.caseload.search.none'),
      }}
      state={state}
      note={isExample ? t('example.people.note') : null}
      actions={<HeaderActions role="admin" />}
      starred={{ ids: starred.ids, onToggle: (person) => starred.toggle(person.id) }}
      floating={<InviteFloating />}
      onRetry={refresh}
      onPick={(person) => person.href && router.push(person.href)}
      supportPhone={supportPhone}
      empty={
        <Notice
          notice="no_caseload_members"
          title={t('admin.caseload.empty.title')}
          body={t('admin.caseload.empty.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      }
    />
  );
}

/**
 * A program lead's Home (D-218): who is coming in, by day, week or month —
 * the example appointments until something books one (D-172), on the same
 * flag as every example set.
 */
export function ProgramHome() {
  const { t } = useI18n();
  const appointments: Appointment[] = USE_DUMMY_PEOPLE
    ? DUMMY_APPOINTMENTS.map((a) => ({
        id: a.id,
        personId: a.personId,
        firstName: a.firstName,
        startsAt: a.startsAt,
        minutes: a.minutes,
        kindLabel: t(`schedule.kind.${a.kind}`),
        href: `/person/?id=${a.personId}`,
      }))
    : [];
  return (
    <ScheduleView
      appointments={appointments}
      // Search, the bell and + (D-221): Invite someone lives in the + now.
      actions={
        <>
          <HeaderActions role="provider" hasHelp={false} />
          <AddMenu />
        </>
      }
      note={USE_DUMMY_PEOPLE ? t('example.people.note') : null}
    />
  );
}

/** "Invite someone", floating above the bar on a staff Home (D-218). */
export function InviteFloating() {
  const { t } = useI18n();
  return (
    <FloatingAction
      label={t('profile.menu.invite')}
      href="/invite/"
      icon={<PeopleIcon width={26} height={26} aria-hidden />}
    />
  );
}
