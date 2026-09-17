'use client';

import { useEffect } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';
import { AppHeader, Loading, Notice, NotificationList, Page, PageTitle } from '@pam/ui';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { DUMMY_NOTIFICATIONS } from '@pam/config/dummy-notifications';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useNotifications, unreadCount } from '@/lib/useNotifications';
import { useRoleView } from '@/lib/useViewedRole';
import { useDemoView } from '@/lib/useDemoView';
import { RoleSwitchControl } from '../RoleSwitchControl';
import { whenHappened } from '@/lib/when';

/**
 * Everything that has happened, as a log.
 *
 * A screen rather than a panel hanging off the bell. A panel is right for a
 * glance and wrong for a list this long — on a phone it covers the thing it is
 * about, and closes if you breathe on it.
 *
 * Back is the first thing on the screen, top left, where every other app on the
 * phone puts it (§0: never dead-end). It is a real link, so the browser's own
 * Back does the same thing.
 *
 * Nothing on this screen is a task (Will, 16 September): no row is a button,
 * nothing here is marked read one line at a time. The whole list is marked
 * seen the moment it is on screen, which is what clears the bell for next
 * time — see `useNotifications`'s `markAllSeen`.
 *
 * **A genuinely empty list shows the example set for whoever is looking**
 * (Will, 16 September — "the notifications screen should also resemble
 * dummy notifications for the respective members, to show what the app can
 * do"). Members and programs have no real notification rows at all yet — see
 * `@pam/config/dummy-people` — and a case manager or super admin who has never
 * had anything flagged sees the same empty list they would once they have.
 * `markAllSeen` never runs against the example set: there is nothing real to
 * mark, and it is meant to look the same on every visit until it is real.
 */

const styles = stylex.create({
  note: { fontSize: '15px', lineHeight: 1.5 },
});

/**
 * "closed", from the database or from `@pam/config/dummy-people`, becomes the
 * words a member reads on the flag screen — for a real row and a dummy one
 * alike, since the dummy `admin`/`super_admin` set intentionally reuses the
 * real `notify.service_flagged` key rather than inventing a parallel one.
 */
function describe(
  bodyKey: string,
  bodyVars: Record<string, string>,
  t: (key: string, vars?: Record<string, string>) => string,
) {
  if (bodyKey === 'notify.service_flagged' && typeof bodyVars['reason'] === 'string') {
    return t(bodyKey, { ...bodyVars, reason: t(`flag.reason.${bodyVars['reason']}`) });
  }
  if (bodyKey === 'notify.staff_request_pending' && typeof bodyVars['role'] === 'string') {
    return t(bodyKey, { ...bodyVars, role: t(`role.${bodyVars['role']}`) });
  }
  return t(bodyKey, bodyVars);
}

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const signedIn = session.status === 'signed-in';
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, setViewAs } = useRoleView(trueRole);
  const { state, markAllSeen } = useNotifications(signedIn);
  const unread = unreadCount(state);
  const isDemo = useDemoView(session);

  const showDummy =
    USE_DUMMY_PEOPLE &&
    state.status === 'ready' &&
    (state.items.length === 0 || isDemo) &&
    Boolean(viewedRole);
  const dummyItems = showDummy ? DUMMY_NOTIFICATIONS[viewedRole!] : [];
  const dummyUnread = dummyItems.filter((item) => item.isNew).length;
  const shownUnread = showDummy ? dummyUnread : unread;

  // Once, the moment the list is actually on screen — not on every render, and
  // not because somebody tapped something. See the file comment. Never fires
  // against the example set: there is nothing real behind it to mark.
  useEffect(() => {
    if (state.status === 'ready' && !showDummy && unread > 0) void markAllSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, showDummy]);

  return (
    <Page gap={3}>
        <AppHeader
          roleLabel={signedIn ? t(`role.${viewedRole}`) : undefined}
          roleControl={
            trueRole === 'super_admin' ? (
              <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
            ) : undefined
          }
        />

        {/*
          The way back sits beside the title, the way it does on every other
          screen now — it used to be a row of its own above the mark (D-103).
        */}
        <PageTitle
          title={t('notify.title')}
          subtitle={shownUnread > 0 ? t('notify.unread', { count: shownUnread }) : undefined}
          backHref="/"
          backLabel={t('nav.back.home')}
        />
        <VStack gap={1}>
        </VStack>

        {session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended' ? (
          <>
            <NotIn status={session.status} title={t('admin.signedOut.title')} body={t('admin.signedOut.body')} />
          </>
        ) : null}

        {state.status === 'loading' && signedIn ? (
          <Loading label={t('common.loading')} variant="inline" />
        ) : null}

        {state.status === 'error' ? (
          <Notice
            notice="something_went_wrong"
            title={t('notice.something_went_wrong.title')}
            body={t('notice.something_went_wrong.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        ) : null}

        {state.status === 'ready' && !showDummy ? (
          <NotificationList
            items={state.items.map((item) => ({
              id: item.id,
              text: describe(item.bodyKey, item.bodyVars, t),
              when: whenHappened(item.createdAt, locale, t),
              isNew: !item.isRead,
            }))}
            labels={{ empty: t('notify.none'), new: t('notify.new') }}
          />
        ) : null}

        {showDummy ? (
          <VStack gap={2}>
            <NotificationList
              items={dummyItems.map((item) => ({
                id: item.id,
                text: describe(item.bodyKey, item.bodyVars, t),
                when: whenHappened(item.createdAt, locale, t),
                isNew: item.isNew,
              }))}
              labels={{ empty: t('notify.none'), new: t('notify.new') }}
            />
            <Text type="supporting" xstyle={styles.note}>
              {t('notify.example.note')}
            </Text>
          </VStack>
        ) : null}

        {/*
          No help link here (Will, 14 September). The way back is the arrow
          beside the title, and every notice in this list is either something to
          read or something to act on — none of them is a problem support can
          solve. Help is one tap away on the screen this came from.
        */}
    </Page>
  );
}
