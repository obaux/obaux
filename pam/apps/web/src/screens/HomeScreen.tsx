'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loading, Notice, Page, PeopleIcon } from '@pam/ui';
import { FloatingAction } from '@pam/ui/FloatingAction';
import { openConversation } from '@/lib/openConversation';
import { DUMMY_SELF_ID, dummyConversationIdBetween } from '@pam/config/dummy-conversations';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { DUMMY_MEMBERS } from '@pam/config/dummy-people';
import { DUMMY_APPOINTMENTS } from '@pam/config/dummy-appointments';
import { ScheduleView, type Appointment } from './ScheduleView';
import { readAddedTrips, TRIPS_CHANGED, withMoves, type AddedTrip } from '@/lib/addedTrips';
import { AddMenu } from './AddMenu';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useCaseload } from '@/lib/useCaseload';
import { dummyChip, statusChip } from '@/lib/caseloadLabels';
import { ExploreScreen } from './ExploreScreen';
import { RequestsScreen } from './RequestsScreen';
import { HeaderActions } from './HeaderActions';
import { PeopleHomeView, type HomePerson, type PeopleState } from './PeopleHomeView';

/**
 * The first tab, for whoever is signed in (D-212): a member explores places;
 * a case manager sees their caseload; a program sees who wants in. A super
 * admin previewing a role sees that role's home (D-108); on their own
 * account, the staff requests waiting for a yes or no (D-257) — Explore is
 * a member's, and the catalogue is a row away on Profile (All programs).
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
  if (viewedRole === 'super_admin') return <RequestsScreen isHome />;
  return <ExploreScreen />;
}

/** A case manager's home: the people on their caseload. */
export function CaseloadHome() {
  const { t } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: caseload, refresh } = useCaseload(true);

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
              // Each opens the member's page (D-227), which shows a real
              // member only what this list already does — see `/person/`.
              // The line under the name is the points; when they last used
              // Pam is on their page now (Will, 2 October).
              people: caseload.members.map(
                (member): HomePerson => ({
                  id: member.id,
                  firstName: member.firstName,
                  href: `/person/?id=${encodeURIComponent(member.id)}`,
                  chip: statusChip(member, t),
                  programBadge: member.program,
                  meta: member.points !== null ? [t('admin.points', { count: member.points })] : [],
                }),
              ),
            }
          : {
              status: 'ready',
              people: USE_DUMMY_PEOPLE
                ? DUMMY_MEMBERS.map(
                    (member): HomePerson => ({
                      id: member.id,
                      firstName: member.firstName,
                      href: `/person/?id=${member.id}`,
                      chip: dummyChip(member.accessStatus, t),
                      meta: member.points !== undefined ? [t('admin.points', { count: member.points })] : [],
                    }),
                  )
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
      // Message, the shortcut on each card (D-227): the example conversation
      // for an example person, a real one opened for a real member.
      message={{
        label: (person) => t('person.message.action', { name: person.firstName ?? '' }),
        onMessage: (person) => {
          if (person.id.startsWith('dummy-')) {
            router.push(
              `/messages/thread/?id=${encodeURIComponent(dummyConversationIdBetween(person.id, DUMMY_SELF_ID.admin))}`,
            );
            return;
          }
          void openConversation(person.id).then((id) => {
            router.push(id ? `/messages/thread/?id=${encodeURIComponent(id)}` : '/messages/');
          });
        },
      }}
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
  const booked = useBookedForMembers();
  const appointments: Appointment[] = USE_DUMMY_PEOPLE
    ? [
        ...DUMMY_APPOINTMENTS.map((a) => ({
          id: a.id,
          personId: a.personId,
          firstName: a.firstName,
          startsAt: a.startsAt,
          minutes: a.minutes,
          kindLabel: t(`schedule.kind.${a.kind}`),
          href: `/person/?id=${a.personId}`,
        })),
        // Visits the program booked for people (D-316), on its own schedule too.
        ...booked.map((b) => ({
          id: b.id,
          personId: b.forMemberId!,
          firstName: b.forName ?? '',
          startsAt: b.startsAt,
          minutes: 60,
          kindLabel: t('schedule.kind.intake'),
          href: `/person/?id=${b.forMemberId}`,
        })),
      ]
    : [];
  return (
    <ScheduleView
      appointments={appointments}
      canCheckIn
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

/** Trips this program booked for members this visit (D-316), re-read when one is added. */
function useBookedForMembers(): AddedTrip[] {
  const [trips, setTrips] = useState<AddedTrip[]>([]);
  useEffect(() => {
    const read = () => setTrips(withMoves(readAddedTrips()).filter((trip) => Boolean(trip.forMemberId)));
    read();
    window.addEventListener(TRIPS_CHANGED, read);
    return () => window.removeEventListener(TRIPS_CHANGED, read);
  }, []);
  return trips;
}
