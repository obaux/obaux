'use client';

import { useRouter } from 'next/navigation';
import { Loading, Notice, Page } from '@pam/ui';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { DUMMY_INTERESTED, DUMMY_MEMBERS } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useCaseload } from '@/lib/useCaseload';
import { dummyChip, statusChip, whenLastActive } from '@/lib/caseloadLabels';
import { whenHappened } from '@/lib/when';
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
 * A program's home: the members interested in it. No query writes
 * "interested" yet (see `/interested/`), so this is the example set until
 * one does — the same set, on the same flag.
 */
export function ProgramHome() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();

  const state: PeopleState = {
    status: 'ready',
    people: USE_DUMMY_PEOPLE
      ? DUMMY_INTERESTED.map(
          (interest): HomePerson => ({
            id: interest.person.id,
            firstName: interest.person.firstName,
            href: `/person/?id=${interest.person.id}`,
            meta: [
              interest.programLabel,
              t('interested.since', { when: whenHappened(interest.interestedAt, locale, t) }),
            ],
          }),
        )
      : [],
  };

  return (
    <PeopleHomeView
      title={t('home.interested.title')}
      countLabel={(count) => t('home.interested.count', { count })}
      search={{
        label: t('home.interested.search.label'),
        placeholder: t('home.interested.search.placeholder'),
        none: t('home.interested.search.none'),
      }}
      state={state}
      note={USE_DUMMY_PEOPLE ? t('example.people.note') : null}
      actions={<HeaderActions role="provider" />}
      onRetry={() => {}}
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
