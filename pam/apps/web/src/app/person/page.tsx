'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { BigButton, BookmarkIcon, ConnectionsIcon, Loading, MessagesIcon, Notice, Page, SignIcon, TripsIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { signedBy, usePolicies } from '@/lib/usePolicies';
import { ProfileSummary } from '@pam/ui/ProfileCards';
import { TripCard } from '@pam/ui/TripCard';
import { useRouter } from 'next/navigation';
import { dummyTripsFor } from '@pam/config/dummy-trips';
import { useCaseload, type CaseloadMember } from '@/lib/useCaseload';
import { openConversation } from '@/lib/openConversation';
import { CategoryPicture } from '../../screens/SavedView';

import { SubPageHeader } from '@pam/ui/SubPage';
import { useStarredPeople } from '@/lib/useStarredPeople';
import { StarToggle } from '../../screens/PeopleHomeView';
import { VerifiedBadge } from '../../screens/VerifiedBadge';
import { HeaderActions } from '../../screens/HeaderActions';
import { useConversations } from '@/lib/useConversations';
import { PersonDetailSkeleton } from '@pam/ui/Skeletons';
import { NOTICES } from '@pam/config';
import { DUMMY_EVERYONE, type DummyPerson } from '@pam/config/dummy-people';
import { DUMMY_SAVED_BY_PERSON } from '@pam/config/dummy-places';
import { DUMMY_APPOINTMENTS } from '@pam/config/dummy-appointments';
import { List, ListItem } from '@astryxdesign/core/List';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';
import { DUMMY_SELF_ID, dummyConversationIdBetween, dummyConversationsFor } from '@pam/config/dummy-conversations';
import { ProgramBadge } from '../ProgramBadge';

/**
 * One person, for a case manager or a program to look at.
 *
 * The list a case manager, a program or a super admin already reads — the
 * caseload, "interested in your program", the directory — says five facts a
 * row at a time. This is the screen a row opens onto, with room for the one
 * thing none of those rows have space for: what a *member* saved, so a case
 * manager helping them plan a week can see it without asking.
 *
 * **Real people have no profile yet, on purpose.** Everything below the header
 * comes from `@pam/config/dummy-people` and only ever resolves for a dummy id.
 * A case manager reading a real member's real saved places is not on the
 * §4.1 `ADMIN_CAN_SEE` list — see `packages/config/transparency.ts` — and
 * widening that list is Will's call to make deliberately, with members told
 * first, not a side effect of this screen existing. Until that happens, a
 * real id here answers "we could not find that person", exactly as a mistyped
 * one does.
 *
 * **"Message {name}" opens the example conversation** between this dummy
 * member and the previewed staff person (D-183): Teresa for a case manager
 * preview, Sandra for a program preview — `/messages/thread/?id=dummy-conv-…`,
 * drawn with the real chat component and backed by a session-only store.
 * Nothing on this screen is a real account sending to a real person, the
 * same way nothing else on this dummy-only page is a real write, and D-171
 * is untouched. D-173's compose box used to live here; the thread is the one
 * place to demo-send now.
 */

const styles = stylex.create({
  subtitle: { fontSize: '17px', lineHeight: 1.4, textAlign: 'center' },
  cardText: { flexGrow: 1, minWidth: 0 },
  fact: { fontSize: '18px', fontWeight: 600 },
  subsection: { fontSize: '16px', fontWeight: 600 },
  card: { width: '100%', position: 'relative' },
  section: { fontSize: '20px' },
  name: { fontSize: '18px' },
  meta: { fontSize: '16px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  // Stretched-link pattern (same as `PersonRow`): the heading is a real
  // anchor, widened over the whole card with `::after`, so the card is one
  // tap target rather than a link buried inside otherwise-dead space.
  link: {
    color: 'inherit',
    textDecoration: 'none',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
});

/**
 * Who the page is about. An example person carries everything the example set
 * has. A real member comes from the case manager's own caseload and carries
 * only what that list already shows them — name, status, points, last active
 * and program (§4.1, `transparency.ts`); nothing more is fetched.
 */
interface ProfilePerson {
  readonly id: string;
  readonly firstName: string;
  readonly role: DummyPerson['role'];
  readonly regionName: string | null;
  readonly language: string | null;
  readonly accessStatus: 'active' | 'limited' | 'suspended';
  readonly points?: number;
  readonly lastActiveAt: string | null;
  readonly orgName?: string;
  readonly program?: { readonly name: string; readonly serviceId: string } | null;
  readonly isExample: boolean;
}

function lookup(id: string | null): ProfilePerson | null {
  if (!id) return null;
  const person = DUMMY_EVERYONE.find((p) => p.id === id);
  if (!person) return null;
  return {
    id: person.id,
    firstName: person.firstName,
    role: person.role,
    regionName: person.regionName,
    language: person.language,
    accessStatus: person.accessStatus,
    ...(person.points !== undefined ? { points: person.points } : {}),
    lastActiveAt: person.lastActiveAt,
    ...(person.orgName ? { orgName: person.orgName } : {}),
    program: person.program ?? null,
    isExample: true,
  };
}

function fromCaseload(member: CaseloadMember | null, regionName: string | null): ProfilePerson | null {
  if (!member) return null;
  return {
    id: member.id,
    firstName: member.firstName ?? '—',
    role: 'member',
    regionName,
    language: null,
    accessStatus: member.accessStatus,
    ...(member.points !== null ? { points: member.points } : {}),
    lastActiveAt: member.lastActiveAt,
    program: member.program,
    isExample: false,
  };
}

function whenLastActive(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function PersonScreen() {
  const { t, locale } = useI18n();
  const { policies } = usePolicies();
  const supportPhone = useSupportPhone();
  const params = useSearchParams();
  const router = useRouter();
  const { state: session } = useSession();

  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, setViewAs } = useRoleView(trueRole);
  // The same audience the three lists that link here already gate on.
  const canView = viewedRole === 'admin' || viewedRole === 'provider' || viewedRole === 'super_admin';

  // The nested-page template (D-213, D-217): back to Home, where every list
  // that links here lives; a super admin's role switch rides in the bar.
  const starred = useStarredPeople();
  // A real member on this case manager's own caseload opens too (D-227),
  // shown only what the caseload list already shows them — see `fromCaseload`.
  const { state: caseload } = useCaseload(viewedRole === 'admin');
  // Unread from this person, for the count on "Message {name}" (D-231).
  const { state: conversations } = useConversations(viewedRole === 'admin' || viewedRole === 'provider');
  const header = (title: string) => (
    <SubPageHeader
      title={title}
      backHref="/"
      backLabel={t('nav.back.home')}
      actions={
        <>
          {trueRole === 'super_admin' ? (
            <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
          ) : null}
          {/* Only the bell here (Will, 3 October): no Help on a member's page. */}
          <HeaderActions role={viewedRole} hasHelp={false} />
        </>
      }
    />
  );

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        {header(t('person.title'))}
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        {header(t('person.title'))}
        <NotIn status={session.status} title={t('person.signedOut.title')} body={t('person.signedOut.body')} />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        {header(t('person.title'))}
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

  if (!canView) {
    return (
      <Page gap={4}>
        {header(t('person.notAllowed.title'))}
        <Notice
          notice="service_not_available"
          title={t('person.notAllowed.title')}
          body={t('admin.notAdmin.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      </Page>
    );
  }

  const id = params.get('id');
  const person: ProfilePerson | null =
    lookup(id) ??
    (caseload.status === 'ready'
      ? fromCaseload(
          caseload.members.find((m) => m.id === id) ?? null,
          session.status === 'signed-in' ? session.session.regionName : null,
        )
      : null);

  if (!person && viewedRole === 'admin' && caseload.status === 'loading') {
    return (
      <Page gap={4}>
        {header(t('person.title'))}
        <PersonDetailSkeleton label={t('common.loading')} />
      </Page>
    );
  }

  if (!person) {
    return (
      <Page gap={4}>
        {header(t('person.notFound.title'))}
        <Notice
          notice="service_not_available"
          title={t('person.notFound.title')}
          body={t('person.notFound.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <BigButton label={t('nav.back.home')} href="/" />
      </Page>
    );
  }

  const when = whenLastActive(person.lastActiveAt, locale);
  const saved = person.isExample ? (DUMMY_SAVED_BY_PERSON[person.id] ?? []) : [];
  const isMember = person.role === 'member';
  const canMessage = isMember && (viewedRole === 'admin' || viewedRole === 'provider');
  // Trips (D-227): the visits they planned, coming up first, then the ones
  // already made. Example trips until something books one (D-172).
  const now = Date.now();
  const trips = isMember ? dummyTripsFor(person.id) : [];
  const upcoming = trips.filter((trip) => new Date(trip.startsAt).getTime() >= now);
  const past = trips.filter((trip) => new Date(trip.startsAt).getTime() < now).reverse();
  // A program lead sees only their own program's visits with this person
  // (Will, 3 October, D-242): never trips to other programs, places already
  // gone, saved places or points — those are the case manager's (§4.1).
  const isProgramView = viewedRole === 'provider';
  const visits = isProgramView && person.isExample
    ? DUMMY_APPOINTMENTS.filter((a) => a.personId === person.id).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    : [];
  const nextVisits = visits.filter((a) => new Date(a.startsAt).getTime() >= now);
  const pastVisits = visits.filter((a) => new Date(a.startsAt).getTime() < now);
  const shortDay = (iso: string) =>
    new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
  const visitWhen = (iso: string) =>
    `${new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso))} · ${new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))}`;
  const tripWhen = (iso: string) =>
    `${new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(iso))} · ${new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))}`;
  const tripCard = (trip: (typeof trips)[number]) => (
    <TripCard
      key={trip.id}
      placeName={trip.placeName}
      when={tripWhen(trip.startsAt)}
      href={`/place/?id=${encodeURIComponent(trip.placeId)}`}
      art={<CategoryPicture category={trip.category} />}
      label={`${trip.placeName}, ${tripWhen(trip.startsAt)}`}
    />
  );
  const exampleThread =
    person.isExample && (viewedRole === 'admin' || viewedRole === 'provider')
      ? `/messages/thread/?id=${encodeURIComponent(dummyConversationIdBetween(person.id, DUMMY_SELF_ID[viewedRole]))}`
      : null;
  // An example thread knows its count; a real one knows only that something
  // is waiting (`useConversations` reads the latest message), so it says
  // "New" rather than a number it does not have.
  const unreadCount =
    person.isExample && (viewedRole === 'admin' || viewedRole === 'provider')
      ? (dummyConversationsFor(viewedRole).find((c) => c.otherId === person.id)?.unreadCount ?? 0)
      : conversations.status === 'ready' &&
          conversations.conversations.some((c) => c.otherProfileId === person.id && c.unread)
        ? 1
        : 0;
  const unread =
    unreadCount === 0 ? null : person.isExample ? String(unreadCount) : t('notify.new');
  const message = () => {
    if (person.isExample && (viewedRole === 'admin' || viewedRole === 'provider')) {
      router.push(
        `/messages/thread/?id=${encodeURIComponent(dummyConversationIdBetween(person.id, DUMMY_SELF_ID[viewedRole]))}`,
      );
      return;
    }
    void openConversation(person.id).then((conversation) =>
      router.push(conversation ? `/messages/thread/?id=${encodeURIComponent(conversation)}` : '/messages/'),
    );
  };

  return (
    <Page gap={4}>
      {header(t('person.profile'))}

      {/*
        The profile card (D-231): the member profile's own card — face, name,
        who they are, and three facts down the side — with the case
        manager's star in its top-right corner (D-227).
      */}
      <ProfileSummary
        name={person.firstName}
        // A program sees whether a member has signed all its policies (D-261).
        {...(isProgramView && isMember
          ? { nameAddon: <VerifiedBadge personId={person.id} name={person.firstName ?? ''} /> }
          : {})}
        roleLabel={[t(`role.${person.role}`), person.regionName].filter(Boolean).join(' · ')}
        stats={
          isProgramView
            ? [
                // Only what concerns this program, plus when they last used Pam (D-242).
                {
                  // The day and the time (Will, 3 October): "Oct 6, 9:00 AM".
                  value: nextVisits[0]
                    ? // No-break spaces inside each part, so a narrow card breaks
                      // after the comma: "Oct 6," then "9:00 AM".
                      `${shortDay(nextVisits[0].startsAt).replace(/\s/g, '\u00a0')}, ${new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(nextVisits[0].startsAt)).replace(/\s/g, '\u00a0')}`
                    : t('person.stat.never'),
                  label: t('person.stat.nextVisit'),
                },
                { value: String(pastVisits.length), label: t('person.stat.visits') },
                { value: when ?? t('person.stat.never'), label: t('person.stat.lastUsed') },
              ]
            : [
                ...(person.points !== undefined
                  ? [{ value: String(person.points), label: t('person.stat.points') }]
                  : []),
                ...(isMember ? [{ value: String(upcoming.length), label: t('person.stat.trips') }] : []),
                { value: when ?? t('person.stat.never'), label: t('person.stat.lastUsed') },
              ]
        }
        corner={
          isMember && viewedRole === 'admin' ? (
            <StarToggle
              isOn={starred.ids.has(person.id)}
              label={t(starred.ids.has(person.id) ? 'people.unstar' : 'people.star', { name: person.firstName })}
              onToggle={() => starred.toggle(person.id)}
              name={person.firstName ?? ''}
            />
          ) : undefined
        }
      />

      {person.accessStatus !== 'active' || person.orgName || person.program ? (
        <HStack gap={2} wrap="wrap" align="center">
          {person.accessStatus === 'suspended' ? <Badge variant="error" label={t('admin.status.suspended')} /> : null}
          {person.accessStatus === 'limited' ? <Badge variant="warning" label={t('admin.status.limited')} /> : null}
          {person.orgName ? <Badge variant="neutral" label={person.orgName} /> : null}
          {person.program ? <ProgramBadge name={person.program.name} serviceId={person.program.serviceId} /> : null}
        </HStack>
      ) : null}

      {/*
        The two things a case manager does from here (D-231), as rows like
        Profile's: message them — with how many messages from them are
        waiting — and connect them to a program. A link for an example
        person (the example chat, D-183); a button for a real member, whose
        conversation has to be opened first.
      */}
      {canMessage ? (
        <MenuList
          label={t('person.actions.label', { name: person.firstName })}
          items={[
            // Which policies they have signed, in plain sight (Will, D-324):
            // the badge by the name says all or not; this says which.
            ...(isProgramView && isMember
              ? [
                  {
                    id: 'policies',
                    label: t('person.policies.title'),
                    description: t('person.policies.row', {
                      signed: signedBy(person.id, policies).length,
                      total: policies.length,
                    }),
                    icon: <SignIcon width={26} height={26} />,
                    href: `/person/policies/?${new URLSearchParams({ id: person.id, name: person.firstName ?? '' }).toString()}`,
                  },
                ]
              : []),
            ...(viewedRole === 'admin'
              ? [
                  {
                    id: 'connect',
                    label: t('person.connect.action', { name: person.firstName }),
                    icon: <ConnectionsIcon width={26} height={26} />,
                    href: `/person/connect/?id=${encodeURIComponent(person.id)}`,
                  },
                ]
              : []),
            {
              id: 'message',
              label: t('person.message.action', { name: person.firstName }),
              icon: <MessagesIcon width={26} height={26} />,
              ...(exampleThread ? { href: exampleThread } : { onSelect: message }),
              ...(unread ? { badge: unread, badgeLabel: t('person.message.unread', { count: unreadCount }) } : {}),
            },
          ]}
        />
      ) : null}

      {/*
        Coming up trips (Will, 3 October, D-234): one heading, the visits
        ahead, then a row to the ones already made on their own page.
      */}
      {isMember && isProgramView ? (
        <VStack gap={3}>
          <Heading level={2} xstyle={styles.section}>
            {t('person.visits.title')}
          </Heading>
          {nextVisits.length > 0 ? (
            <List hasDividers density="spacious" aria-label={t('person.visits.title')}>
              {nextVisits.map((a) => (
                <ListItem
                  key={a.id}
                  label={visitWhen(a.startsAt)}
                  description={`${t('schedule.minutes', { minutes: a.minutes })} · ${t(`schedule.kind.${a.kind}`)}`}
                />
              ))}
            </List>
          ) : (
            <Text type="supporting" xstyle={styles.meta}>
              {t('person.visits.none')}
            </Text>
          )}
        </VStack>
      ) : null}

      {isMember && !isProgramView ? (
        <VStack gap={3}>
          <Heading level={2} xstyle={styles.section}>
            {t('person.trips.title')}
          </Heading>
          {upcoming.length > 0 ? (
            <VStack gap={3}>{upcoming.map(tripCard)}</VStack>
          ) : (
            <Text type="supporting" xstyle={styles.meta}>
              {t('person.trips.none')}
            </Text>
          )}
          <MenuList
            label={t('person.trips.past')}
            items={[
              {
                id: 'past',
                label: t('person.trips.pastLink'),
                icon: <TripsIcon width={26} height={26} />,
                href: `/person/past/?id=${encodeURIComponent(person.id)}`,
                ...(past.length > 0 ? { value: String(past.length) } : {}),
              },
              // Their saved programs, on their own page like the past ones
              // (Will, 3 October, D-243). A case manager's to see only.
              ...(person.isExample
                ? [
                    {
                      id: 'saved',
                      label: t('person.savedPlaces.link', { name: person.firstName }),
                      icon: <BookmarkIcon width={26} height={26} />,
                      href: `/person/saved/?id=${encodeURIComponent(person.id)}`,
                      ...(saved.length > 0 ? { value: String(saved.length) } : {}),
                    },
                  ]
                : []),
            ]}
          />
        </VStack>
      ) : null}

      <Text type="supporting" xstyle={styles.note}>
        {t(person.isExample ? 'example.people.note' : 'person.trips.example')}
      </Text>
    </Page>
  );
}

/** `useSearchParams` needs a Suspense boundary in an exported app (see `/place/`). */
export default function PersonPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <Page gap={4}>
          <SubPageHeader title={t('person.title')} backHref="/" backLabel={t('nav.back.home')} />
          <PersonDetailSkeleton label="Loading" />
        </Page>
      }
    >
      <PersonScreen />
    </Suspense>
  );
}
