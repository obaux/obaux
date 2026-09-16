'use client';

import { useEffect, useState } from 'react';
import type { Role } from '@pam/config';
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
 *
 * `role`, when passed, is what makes the count match `/notifications/`'s own
 * demo fallback (see that file): when the real list is genuinely empty — not
 * "nothing unread", nothing at all — the count comes from
 * `@pam/config/dummy-notifications` instead, the same set that screen shows,
 * so the bell is never lit about something the list underneath it cannot
 * show. That import is dynamic, loaded only once the real list has actually
 * come back empty, the same way `SavedStripLazy` and `RoleSwitchLazy` defer —
 * this component sits on every signed-in screen including Home, and the day
 * `@pam/config/dummy-notifications` loaded statically here cost the first
 * load 1.2 kB nobody using a real, populated caseload would ever need.
 */
export function HeaderBell({
  enabled,
  role,
}: {
  readonly enabled: boolean;
  readonly role?: Role | null;
}) {
  const { t } = useI18n();
  const { state } = useNotifications(enabled);
  const [dummyUnread, setDummyUnread] = useState<number | null>(null);

  const needsDummy = state.status === 'ready' && state.items.length === 0 && Boolean(role);

  useEffect(() => {
    if (!needsDummy) return;
    let cancelled = false;
    void (async () => {
      const { USE_DUMMY_PEOPLE } = await import('@pam/config/dummy-flag');
      if (!USE_DUMMY_PEOPLE) return;
      const { DUMMY_NOTIFICATIONS } = await import('@pam/config/dummy-notifications');
      if (cancelled) return;
      setDummyUnread(DUMMY_NOTIFICATIONS[role as Role].filter((item) => item.isNew).length);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsDummy, role]);

  if (state.status !== 'ready') return null;

  const unread = needsDummy && dummyUnread !== null ? dummyUnread : unreadCount(state);

  return (
    <NotificationBell
      href="/notifications/"
      label={t('notify.title')}
      unreadCount={unread}
      unreadLabel={t('notify.unread', { count: unread })}
    />
  );
}
