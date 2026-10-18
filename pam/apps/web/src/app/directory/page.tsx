'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Switch } from '@astryxdesign/core/Switch';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Dropdown, Loading, MessagesIcon, Notice, Page, PeopleIcon, ScrollReveal, ShieldIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPageHeader } from '@pam/ui/SubPage';
import { HelpButton } from '../../screens/HelpButton';
import { PersonRowSkeletonList } from '@pam/ui/Skeletons';
import { NOTICES, ROLES, type Role, intlLocale } from '@pam/config';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { PersonRow } from '../PersonRow';
import { useSession } from '@/lib/useSession';
import { useDirectory, setDemoView } from '@/lib/useDirectory';
import { useRoleView } from '@/lib/useViewedRole';
import { useDemoView } from '@/lib/useDemoView';
import { usePamStatus } from '@/lib/pam';
import { navigate } from '@/lib/navigate';
import { StatusBadge } from '@pam/ui/StatusBadge';

/**
 * Everyone on Pam, for the person running it.
 *
 * The first screen a super admin has ever had. Until now the role existed in
 * the database — it decides flagged places (0032) and receives reports (A7) —
 * and had nowhere to go: opening the case manager screen said "this screen is
 * for case managers", which was true and useless.
 *
 * **The filter lives in the header** (Will, 13 September), not above the list.
 * What you are looking at is the same kind of fact as which area the Places
 * screen is measuring from: true of every row below it, and worth a corner of
 * the header rather than a row of the page. It is a Selector rather than a row
 * of chips because there are five choices and a 320px phone, and a wrapping
 * chip row would cost two lines before the first person.
 *
 * What this screen is not: a way into anybody. It shows the five facts the
 * caseload already shows — name, role, region, status, last active — and
 * nothing a member wrote, planned or was enrolled in. The database function
 * behind it returns those five columns and no others, and refuses everybody who
 * is not a super admin (0043). A member's own screen, when it exists, stays
 * bound by §4.1 the same way the case manager's is.
 */

const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  // The case manager Home's message button (D-227): 48px, the accent colour.
  message: { width: '48px', height: '48px', color: colorVars['--color-icon-accent'] },
});

/** "All", then one option per role, in the order somebody thinks of them. */
const FILTERS = ['all', ...ROLES] as const;
type Filter = (typeof FILTERS)[number];

function whenLastActive(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export default function DirectoryPage() {
  const { t, tPlain, locale } = useI18n();
  const { state: session } = useSession();

  // See admin/page.tsx: the same preview a super admin picks on Home now
  // follows them here, so "Viewing as Program" and then opening this screen
  // shows what a program actually sees (D-108, useViewedRole) — the same
  // door everyone else meets — rather than the full directory regardless.
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin';
  const isDemo = useDemoView(session);
  const [filter, setFilter] = useState<Filter>('all');
  const { state: directory, refresh: refreshDirectory } = useDirectory(isSuperAdmin, filter as Role | 'all');
  // Pam can write first to anyone here (card a100, Will's B), once Message Pam is on. The real account only.
  const pamLive = usePamStatus(isSuperAdmin && trueRole === 'super_admin').status === 'ready';
  // The filter is real: it asks the same question of the example set that it
  // asks the database, so switching it while the real directory is empty
  // still demonstrates what it does.
  const dummyPeople = filter === 'all' ? DUMMY_EVERYONE : DUMMY_EVERYONE.filter((p) => p.role === filter);

  const [demoBusyId, setDemoBusyId] = useState<string | null>(null);
  const toggleDemo = async (personId: string, next: boolean) => {
    setDemoBusyId(personId);
    await setDemoView(personId, next);
    setDemoBusyId(null);
    refreshDirectory();
  };

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <SubPageHeader
          title={t('directory.title')}
          backHref="/profile/"
          backLabel={t('nav.back.profile')}
          actions={
            <>
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
          title={t('directory.title')}
          backHref="/profile/"
          backLabel={t('nav.back.profile')}
          actions={
            <>
              <HelpButton />
            </>
          }
        />
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <SubPageHeader
          title={t('directory.title')}
          backHref="/profile/"
          backLabel={t('nav.back.profile')}
          actions={
            <>
              <HelpButton />
            </>
          }
        />
        <Notice
          notice={key}
          title={t(NOTICES[key].titleKey)}
          body={t(NOTICES[key].bodyKey)}
          contactLabel={t('help.contact.action')}
        />
      </Page>
    );
  }

  if (!isSuperAdmin) {
    // A plain statement of what this screen is, and a way back — not a scolding
    // and not a blank page (§0).
    return (
      <Page gap={4}>
        <SubPageHeader
          title={t('directory.title')}
          backHref="/profile/"
          backLabel={t('nav.back.profile')}
          actions={
            <>
              <HelpButton />
            </>
          }
        />
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          contactLabel={t('help.contact.action')}
        />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      <SubPageHeader
        title={t('directory.title')}
        subtitle={
          directory.status === 'ready' && !isDemo
            ? t('directory.count', { count: directory.people.length })
            : (directory.status === 'empty' || isDemo) && USE_DUMMY_PEOPLE
              ? t('directory.count', { count: dummyPeople.length })
              : undefined
        }
        backHref="/profile/"
        backLabel={t('nav.back.profile')}
        actions={
          <>
            <HelpButton />
          </>
        }
      />

      {/*
        Who the list is about — moved out of the old app header into the page
        when the screen joined the nested template (D-217).
      */}
      <Dropdown
        label={t('directory.filter')}
        value={filter}
        options={FILTERS.map((option) => ({
          value: option,
          label: t(`directory.filter.${option}`),
        }))}
        onChange={(next) => setFilter(next as Filter)}
      />

      {/*
        Bringing somebody in, and deciding who may come in as staff (0054),
        are pages of their own, the way Profile reaches them (D-444, Will, 10
        October: "use the nested page method"). The card of buttons that made
        invites here is gone. The notification that a claim arrived only ever
        points at the second row, it is never a button on the notification
        itself (D-080).
      */}
      <MenuList
        label={t('directory.title')}
        items={[
          { id: 'invite', label: t('profile.menu.invite'), href: '/invite/', icon: <PeopleIcon {...ICON} /> },
          { id: 'requests', label: t('requests.title'), href: '/requests/', icon: <ShieldIcon {...ICON} /> },
        ]}
      />

      {directory.status === 'loading' ? <PersonRowSkeletonList label={t('common.loading')} /> : null}

      {directory.status === 'empty' && !USE_DUMMY_PEOPLE ? (
        <Notice
          notice="no_caseload_members"
          title={t('directory.empty.title')}
          body={t('directory.empty.body')}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {directory.status === 'error' ? (
        <Notice
          notice={directory.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[directory.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[directory.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {directory.status === 'ready' && !isDemo ? (
        <VStack gap={3}>
          {directory.people.map((person, index) => {
            const when = whenLastActive(person.lastActiveAt, locale);
            return (
              <ScrollReveal key={person.id} index={index}>
                <PersonRow
                  firstName={person.firstName}
                  chip={
                    person.accessStatus === 'suspended'
                      ? { label: t('admin.status.suspended'), tone: 'error' }
                      : person.accessStatus === 'limited'
                        ? { label: t('admin.status.limited'), tone: 'warning' }
                        : null
                  }
                  meta={[
                    person.regionName ? `${t(`role.${person.role}`)} · ${person.regionName}` : t(`role.${person.role}`),
                    when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
                  ]}
                  trailing={
                    <HStack gap={1} align="center" wrap="nowrap">
                      {/* Not on the Pam team itself: Pam does not write to a super admin, and the database refuses it (Iris T3). */}
                      {pamLive && person.role !== 'super_admin' ? (
                        <IconButton
                          // Opens their Pam conversation, or starts one (Dot's b3, b5).
                          label={tPlain('pam.start.action', { name: person.firstName ?? '' })}
                          variant="ghost"
                          onClick={() =>
                            navigate(
                              `/pam/start/?${new URLSearchParams({ profile: person.id, name: person.firstName ?? '' }).toString()}`,
                            )
                          }
                          icon={
                            <HStack>
                              <MessagesIcon width={24} height={24} aria-hidden />
                            </HStack>
                          }
                          xstyle={styles.message}
                        />
                      ) : null}
                      <Switch
                        // Each switch says whose it is, or a screen reader hears the same name on every row (Iris, super admin P5).
                        label={tPlain('directory.demoView.for', { name: person.firstName ?? '' })}
                        isLabelHidden
                        value={person.isDemo}
                        isDisabled={demoBusyId === person.id}
                        onChange={(next) => void toggleDemo(person.id, next)}
                      />
                    </HStack>
                  }
                />
              </ScrollReveal>
            );
          })}
        </VStack>
      ) : null}

      {/*
        The real directory is empty — nobody has actually signed up yet — so
        this is the example set, filtered the same way the real one would be
        (Will, 16 September). Disappears the moment `useDirectory` stops
        returning `'empty'`; see `@pam/config/dummy-people`.
      */}
      {directory.status !== 'loading' && (directory.status === 'empty' || isDemo) && USE_DUMMY_PEOPLE ? (
        <VStack gap={3}>
          {dummyPeople.map((person, index) => {
            const when = whenLastActive(person.lastActiveAt, locale);
            return (
              <ScrollReveal key={person.id} index={index}>
                <PersonRow
                  firstName={person.firstName}
                  href={`/person/?id=${person.id}`}
                  chip={
                    person.accessStatus === 'suspended'
                      ? { label: t('admin.status.suspended'), tone: 'error' }
                      : person.accessStatus === 'limited'
                        ? { label: t('admin.status.limited'), tone: 'warning' }
                        : null
                  }
                  meta={[
                    `${t(`role.${person.role}`)} · ${person.regionName}`,
                    when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
                  ]}
                />
              </ScrollReveal>
            );
          })}
          <StatusBadge label={t('common.example')} />
        </VStack>
      ) : null}
    </Page>
  );
}
