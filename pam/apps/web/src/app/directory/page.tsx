'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Selector } from '@astryxdesign/core/Selector';
import { AppHeader, BigButton, Notice, NotificationBell, Page, PageTitle, ScrollReveal, TextLink } from '@pam/ui';
import { NOTICES, ROLES, type Role } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useDirectory } from '@/lib/useDirectory';
import { useNotifications } from '@/lib/useNotifications';

/**
 * Everyone on PAM, for the person running it.
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

const styles = stylex.create({
  title: { fontSize: '28px', lineHeight: 1.2 },
  count: { fontSize: '17px' },
  meta: { fontSize: '15px' },
  name: { fontSize: '18px' },
  card: { width: '100%' },
  // The header is a tight row: the filter gives way before the mark does.
  filter: { maxWidth: '48vw' },
});

/** "All", then one option per role, in the order somebody thinks of them. */
const FILTERS = ['all', ...ROLES] as const;
type Filter = (typeof FILTERS)[number];

function whenLastActive(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export default function DirectoryPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const isSuperAdmin = session.status === 'signed-in' && session.session.role === 'super_admin';
  const [filter, setFilter] = useState<Filter>('all');
  const { state: directory } = useDirectory(isSuperAdmin, filter as Role | 'all');
  const { state: notifications } = useNotifications(isSuperAdmin);

  const unread =
    notifications.status === 'ready'
      ? notifications.items.filter((item) => !item.isRead).length
      : 0;

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Text type="supporting" xstyle={styles.count}>
          {t('places.loading')}
        </Text>
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile') {
    return (
      <Page gap={4}>
        <AppHeader />
        <Notice
          notice="service_not_available"
          title={t('directory.signedOut.title')}
          body={t('directory.signedOut.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <BigButton label={t('signin.title')} href="/signin/" />
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

  if (!isSuperAdmin) {
    // A plain statement of what this screen is, and a way back — not a scolding
    // and not a blank page (§0).
    return (
      <Page gap={4}>
        <AppHeader roleLabel={t(`role.${session.session.role}`)} />
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <TextLink label={t('admin.back')} href="/" />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={t('role.super_admin')}
        trailing={
          <HStack gap={1} align="center" wrap="nowrap">
            {/*
              The filter, in the header, where the fact it changes belongs: what
              kind of person this whole list is about.
            */}
            <Selector
              label={t('directory.filter')}
              isLabelHidden
              variant="ghost"
              size="lg"
              value={filter}
              options={FILTERS.map((option) => ({
                value: option,
                label: t(`directory.filter.${option}`),
              }))}
              onChange={(next) => setFilter(next as Filter)}
              xstyle={styles.filter}
            />
            {notifications.status === 'ready' ? (
              <NotificationBell
                href="/notifications/"
                label={t('notify.title')}
                unreadCount={unread}
                unreadLabel={t('notify.unread', { count: unread })}
              />
            ) : null}
          </HStack>
        }
      />

      <PageTitle
        title={t('directory.title')}
        subtitle={
          directory.status === 'ready'
            ? t('directory.count', { count: directory.people.length })
            : undefined
        }
        backHref="/"
        backLabel={t('nav.back.home')}
      />

      {directory.status === 'loading' ? (
        <Text type="supporting" xstyle={styles.count}>
          {t('places.loading')}
        </Text>
      ) : null}

      {directory.status === 'empty' ? (
        <Notice
          notice="no_caseload_members"
          title={t('directory.empty.title')}
          body={t('directory.empty.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {directory.status === 'error' ? (
        <Notice
          notice={directory.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[directory.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[directory.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {directory.status === 'ready' ? (
        <VStack gap={3}>
          {directory.people.map((person, index) => {
            const when = whenLastActive(person.lastActiveAt, locale);
            return (
              <ScrollReveal key={person.id} index={index}>
              <Card xstyle={styles.card}>
                <VStack gap={2}>
                  <HStack gap={3} align="center">
                    {/*
                      The initial, never a photo: a photo is not among the five
                      facts this screen is entitled to, and fetching one would
                      widen the contract by a column.
                    */}
                    <Avatar size="lg" name={person.firstName ?? '?'} />
                    <VStack gap={0.5}>
                      <Heading level={3} xstyle={styles.name}>
                        {person.firstName ?? '—'}
                      </Heading>
                      <Text type="supporting" xstyle={styles.meta}>
                        {t(`role.${person.role}`)}
                        {person.regionName ? ` · ${person.regionName}` : ''}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack gap={2} wrap="wrap" align="center">
                    {person.accessStatus === 'suspended' ? (
                      <Badge variant="error" label={t('admin.status.suspended')} />
                    ) : null}
                    {person.accessStatus === 'limited' ? (
                      <Badge variant="warning" label={t('admin.status.limited')} />
                    ) : null}
                    <Text type="supporting" xstyle={styles.meta}>
                      {when ? t('admin.lastActive', { when }) : t('admin.lastActive.never')}
                    </Text>
                  </HStack>
                </VStack>
              </Card>
              </ScrollReveal>
            );
          })}
        </VStack>
      ) : null}

    </Page>
  );
}
