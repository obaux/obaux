'use client';

import { NotificationBell } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useNotifications, unreadCount } from '@/lib/useNotifications';

/**
 * The bell, wherever a signed-in screen needs one.
 *
 * Every screen used to fetch its own notifications and count the unread by
 * hand, and most of them simply never did: Places, the place screen, Saved,
 * Points and Reminders carried no bell at all, so a case manager who left
 * Home for anywhere else in the app had no way back to a flagged place except
 * going home first (Will, 16 September — "make sure all pages are properly
 * showing based on the user's permissions"). One component now does the fetch
 * and the count, so a new screen cannot leave it out by forgetting to copy the
 * boilerplate.
 *
 * Renders nothing while loading or on error — the bell is orientation, not
 * something a screen should show a spinner or a notice for — and nothing at
 * all when `enabled` is false, which is every screen's own answer to "is
 * somebody signed in".
 */
export function HeaderBell({ enabled }: { readonly enabled: boolean }) {
  const { t } = useI18n();
  const { state } = useNotifications(enabled);

  if (state.status !== 'ready') return null;

  const unread = unreadCount(state);
  return (
    <NotificationBell
      href="/notifications/"
      label={t('notify.title')}
      unreadCount={unread}
      unreadLabel={t('notify.unread', { count: unread })}
    />
  );
}
