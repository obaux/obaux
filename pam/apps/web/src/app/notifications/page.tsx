'use client';

import { useEffect } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { AppHeader, Loading, Notice, NotificationList, Page, PageTitle } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useNotifications, unreadCount, type NotificationRow } from '@/lib/useNotifications';
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
 */

/** "closed", from the database, becomes the words a member reads on the flag screen. */
function describe(item: NotificationRow, t: (key: string, vars?: Record<string, string>) => string) {
  if (item.kind === 'service_flagged' && typeof item.bodyVars['reason'] === 'string') {
    return t(item.bodyKey, { ...item.bodyVars, reason: t(`flag.reason.${item.bodyVars['reason']}`) });
  }
  return t(item.bodyKey, item.bodyVars);
}

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const signedIn = session.status === 'signed-in';
  const { state, markAllSeen } = useNotifications(signedIn);
  const unread = unreadCount(state);

  // Once, the moment the list is actually on screen — not on every render, and
  // not because somebody tapped something. See the file comment.
  useEffect(() => {
    if (state.status === 'ready' && unread > 0) void markAllSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  return (
    <Page gap={3}>
        <AppHeader roleLabel={signedIn ? t(`role.${session.session.role}`) : undefined} />

        {/*
          The way back sits beside the title, the way it does on every other
          screen now — it used to be a row of its own above the mark (D-103).
        */}
        <PageTitle
          title={t('notify.title')}
          subtitle={unread > 0 ? t('notify.unread', { count: unread }) : undefined}
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

        {state.status === 'ready' ? (
          <NotificationList
            items={state.items.map((item) => ({
              id: item.id,
              text: describe(item, t),
              when: whenHappened(item.createdAt, locale, t),
              isNew: !item.isRead,
            }))}
            labels={{ empty: t('notify.none'), new: t('notify.new') }}
          />
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
