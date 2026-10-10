'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Notice, Page, PeopleIcon, TripsIcon } from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { MenuList } from '@pam/ui/MenuList';
import { DashedRule } from '@pam/ui/DashedRule';
import { SetupCard, type SetupCardProps } from '@pam/ui/SetupCard';
import { SubPage } from '@pam/ui/SubPage';
import { useProgramSetup, type ProgramSetup } from '@/lib/programSetup';
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
import { useCaseload } from '@/lib/useCaseload';
import { dummyChip, statusChip } from '@/lib/caseloadLabels';
import { HeaderActions } from './HeaderActions';
import { PeopleHomeView, type HomePerson, type PeopleState } from './PeopleHomeView';

/** A case manager's home: the people on their caseload. */
export function CaseloadHome() {
  const { t, tPlain } = useI18n();
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
        label: (person) => tPlain('person.message.action', { name: person.firstName ?? '' }),
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
 * A program lead's Home (D-218), modular since D-352 (Will, 7 October: "the
 * calendar is only one aspect of the app").
 *
 * - **Nobody booked yet** — getting started: a card for each thing still to
 *   do (add your program, add your photo) and one that opens a preview of
 *   the calendar, then the things a lead can do from here as plain rows.
 *   No search and no + — there is nothing to search, and the rows are the +.
 * - **Somebody booked** — the calendar, with search past ten visits and the
 *   + (Book a visit, Invite someone, Add a program). While a card is still
 *   to do, the calendar opens folded and the cards sit under it.
 *
 * The example appointments (D-172) are a demo's and a story's; an account
 * that has just signed up has none (`useProgramSetup`), so it opens on
 * getting started.
 */
export function ProgramHome() {
  const { t } = useI18n();
  const { state: session } = useSession();
  const setup = useProgramSetup(session);
  const booked = useBookedForMembers();
  const appointments: Appointment[] = [
    ...(setup.isExample ? exampleAppointments(t) : []),
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
  ];
  const cards = setupCards(setup, t);

  if (appointments.length === 0) {
    return (
      <Page gap={4}>
        <LargeTitleHeader title={t('home.setup.title')} actions={<HeaderActions role="provider" hasHelp={false} />} />
        <SetupCardList cards={[...cards, CALENDAR_CARD(t)]} />
        <ProgramActions canBook={setup.isLive} />
      </Page>
    );
  }
  return (
    <ScheduleView
      appointments={appointments}
      canCheckIn
      // The bell and + (D-221); Search is in the + past ten visits (D-358).
      actions={(openSearch) => (
        <>
          <HeaderActions role="provider" hasHelp={false} />
          <AddMenu onSearch={openSearch} />
        </>
      )}
      isCollapsed={cards.length > 0}
      below={
        cards.length > 0 ? (
          <VStack gap={3}>
            <Heading level={2} xstyle={homeStyles.section}>
              {t('home.setup.left')}
            </Heading>
            <SetupCardList cards={cards} />
          </VStack>
        ) : null
      }
    />
  );
}

/** The example appointments (D-172), in words. */
export function exampleAppointments(t: (key: string) => string): Appointment[] {
  return DUMMY_APPOINTMENTS.map((a) => ({
    id: a.id,
    personId: a.personId,
    firstName: a.firstName,
    startsAt: a.startsAt,
    minutes: a.minutes,
    kindLabel: t(`schedule.kind.${a.kind}`),
    href: `/person/?id=${a.personId}`,
  }));
}

type Card = SetupCardProps & { readonly id: string };

/** The cards still to do, in Will's order: program first, then the photo. */
function setupCards(setup: ProgramSetup, t: (key: string) => string): Card[] {
  return [
    // Sent and being checked (D-381): where it stands, opening the review
    // page, instead of the card simply going away.
    ...(setup.isUnderReview
      ? [
          {
            id: 'review',
            kind: 'review' as const,
            title: t(`home.setup.review.title.${setup.reviewStatus}`),
            body: t(`home.setup.review.body.${setup.reviewStatus}`),
            href: '/program/',
            // Being worked on: the picture shimmers (D-384). Not when it's
            // waiting on the lead's own changes.
            ...(setup.reviewStatus === 'changes' ? {} : { loading: 'processing' as const }),
          },
        ]
      : setup.hasProgram
      ? []
      : [
          {
            id: 'program',
            kind: 'program' as const,
            title: t('home.setup.program.title'),
            body: t('home.setup.program.body'),
            href: '/programs/new/?from=home',
          },
        ]),
    ...(setup.hasPhoto
      ? []
      : [
          {
            id: 'photo',
            kind: 'photo' as const,
            title: t('home.setup.photo.title'),
            body: t('home.setup.photo.body'),
            href: '/profile/',
          },
        ]),
  ];
}

/** The third card: what the calendar will be, opened as its own page. */
const CALENDAR_CARD = (t: (key: string) => string): Card => ({
  id: 'calendar',
  kind: 'calendar',
  title: t('home.setup.calendar.title'),
  body: t('home.setup.calendar.body'),
  href: '/home/calendar/',
});

function SetupCardList({ cards }: { readonly cards: readonly Card[] }) {
  return (
    <VStack gap={3}>
      {cards.map(({ id, ...card }) => (
        <SetupCard key={id} {...card} />
      ))}
    </VStack>
  );
}

const ROW_ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const homeStyles = stylex.create({
  section: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
  // Room above the rows (Will: "plenty of breathing room around them").
  actions: { paddingBlock: '24px 16px' },
  intro: { fontSize: '16px', lineHeight: 1.5 },
  explainer: { paddingBlockEnd: '16px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

/**
 * What a new lead can do from Home, as plain rows (D-352) — the + menu's
 * items, less Add a program, which has its card. The booked-visit screen's
 * rows (D-338), with as much room around them.
 */
/**
 * "You can also" under Get started. Create new booking only once the program
 * is approved: before that there is nothing to book into (Will, 7 October,
 * D-384). Invite someone works from day one.
 */
function ProgramActions({ canBook }: { readonly canBook: boolean }) {
  const { t } = useI18n();
  return (
    <VStack gap={2} xstyle={homeStyles.actions}>
      <Heading level={2} xstyle={homeStyles.section}>
        {t('home.setup.more')}
      </Heading>
      <MenuList
        label={t('home.setup.more')}
        hasDividers
        items={[
          ...(canBook
            ? [{ id: 'book', label: t('home.book'), icon: <TripsIcon {...ROW_ICON} />, href: '/program/book/' }]
            : []),
          {
            id: 'invite',
            label: t('home.invite'),
            icon: <PeopleIcon {...ROW_ICON} />,
            href: '/invite/',
          },
        ]}
      />
    </VStack>
  );
}

/**
 * What the calendar will be (D-352): the example week, on a page of its own
 * — opened from Home's third card, so Back is Home again.
 */
export function CalendarPreviewView() {
  const { t } = useI18n();
  return (
    <SubPage title={t('home.calendar.preview.title')} backHref="/" backLabel={t('nav.back.home')}>
      {/* Smaller and fainter, a dashed rule under it, room before the
          calendar (Will, 7 October, D-356). */}
      <VStack gap={5} xstyle={homeStyles.explainer}>
        <Text type="supporting" xstyle={homeStyles.intro}>
          {t('home.calendar.preview.intro')}
        </Text>
        <DashedRule />
      </VStack>
      <ScheduleView appointments={exampleAppointments(t)} canCheckIn isEmbedded />
      <Text type="supporting" xstyle={homeStyles.note}>
        {t('home.calendar.preview.note')}
      </Text>
    </SubPage>
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
