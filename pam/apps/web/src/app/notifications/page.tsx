'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { AppHeader, BigButton, Notice, NotificationList, Page, PageTitle } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useNotifications } from '@/lib/useNotifications';
import { whenHappened } from '@/lib/when';

/**
 * Everything that has happened and needs somebody.
 *
 * A screen rather than a panel hanging off the bell. A panel is right for a
 * glance and wrong for the job that follows — a list somebody works through,
 * one item at a time, leaving and coming back. On a phone a panel also covers
 * the thing it is about, and closes if you breathe on it.
 *
 * Back is the first thing on the screen, top left, where every other app on the
 * phone puts it (§0: never dead-end). It is a real link, so the browser's own
 * Back does the same thing.
 */

const styles = stylex.create({
  back: { minHeight: '48px', fontSize: '17px' },
  title: { fontSize: '28px', lineHeight: 1.2 },
  count: { fontSize: '17px' },
});

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const signedIn = session.status === 'signed-in';
  const { state, markRead } = useNotifications(signedIn);

  const unread =
    state.status === 'ready' ? state.items.filter((item) => !item.isRead).length : 0;

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
          <Text type="supporting" xstyle={styles.count}>
            {t('places.loading')}
          </Text>
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
              text: t(item.bodyKey, item.bodyVars),
              when: whenHappened(item.createdAt, locale, t),
              isRead: item.isRead,
            }))}
            labels={{ empty: t('notify.none'), markRead: t('notify.markRead') }}
            onMarkRead={(id) => void markRead(id)}
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
