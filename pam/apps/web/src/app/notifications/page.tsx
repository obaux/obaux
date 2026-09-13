'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { AppHeader, BigButton, Notice, NotificationList } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
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
  page: { maxWidth: '560px', marginInline: 'auto', paddingInline: '16px', paddingBlock: '20px' },
  back: { minHeight: '48px', fontSize: '17px' },
  title: { fontSize: '28px', lineHeight: 1.2 },
  count: { fontSize: '17px' },
  link: { minHeight: '48px', fontSize: '17px' },
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
    <main {...stylex.props(styles.page)}>
      <VStack gap={3}>
        {/* Top left, before anything else on the screen. */}
        <HStack gap={2} align="center" wrap="wrap">
          <Button
            label={t('admin.back')}
            variant="ghost"
            href="/admin/"
            icon={<Icon icon="chevronLeft" />}
            xstyle={styles.back}
          />
        </HStack>

        <AppHeader roleLabel={signedIn ? t(`role.${session.session.role}`) : undefined} />

        <VStack gap={1}>
          <Heading level={1} xstyle={styles.title}>
            {t('notify.title')}
          </Heading>
          {unread > 0 ? (
            <Text type="supporting" xstyle={styles.count}>
              {t('notify.unread', { count: unread })}
            </Text>
          ) : null}
        </VStack>

        {session.status === 'signed-out' || session.status === 'no-profile' ? (
          <>
            <Notice
              notice="service_not_available"
              title={t('admin.signedOut.title')}
              body={t('admin.signedOut.body')}
              supportPhone={supportPhone}
              callLabel={t('help.callSupport')}
            />
            <BigButton label={t('signin.title')} href="/signin/" />
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

        {/* Never dead-end: a way back, and a way to a person. */}
        <Button label={t('help.title')} variant="ghost" href="/help/" xstyle={styles.link} />
      </VStack>
    </main>
  );
}
