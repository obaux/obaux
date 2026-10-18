'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import type { Role } from '@pam/config';
import { NotificationBell } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useNotifications, unreadCount } from '@/lib/useNotifications';
import { isFreshAccount } from '@/lib/programSetup';
import { useExamplesOn } from '@/lib/useExamplesOn';

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
 * come back empty, the same way `SavedStripLazy` defers —
 * this component sits on every signed-in screen including Home, and the day
 * `@pam/config/dummy-notifications` loaded statically here cost the first
 * load 1.2 kB nobody using a real, populated caseload would ever need.
 *
 * `isDemo` (0057) widens the same fallback: an account a super admin has put
 * in the demo view sees the example count even when its real list is not
 * empty. Optional and only threaded through the screens that already read
 * `useDemoView` themselves — everywhere else still reads `role` alone, the
 * same as before this existed.
 *
 * `hideWhenNothingNew` (Will, 12 October: "only show Notifications bell for members
 * Explore page, when notifications exist"; again 18 October: "I still see the
 * notification bell even though there are no active notifications") draws
 * nothing unless something in the list is unread. "Active" is stricter than the
 * 12 October reading, which kept the bell for a list of read rows: a member
 * whose every row was read has no bell on Explore, and reaches the list from
 * Profile (or Messages), which keep it. It starts hidden and stays hidden until
 * the list arrives with something unread, so the slot never flashes in and
 * out. Where examples are on, it follows what the bell itself would count: the
 * example set for the role, none for a fresh account.
 */
/**
 * `hideWhenNothingNew` and the page not moving (Iris's W3): where the answer to "any notifications?" is
 * a second away, the bell arriving widens the header's corner and, on a narrow phone, the role chip
 * drops under the logo and everything below moves down a thumb's width. So the phone keeps one
 * note about itself, "the bell was there last time", and holds the bell's place (unseen, unreachable)
 * until the answer comes: the bell then arrives without anything moving. A phone that has never had a
 * bell, or whose last answer was none, holds nothing, so a member with no notifications has no empty
 * slot. The first time a bell appears on a phone it still moves the page once. The note is a single
 * `1` in this phone's storage, never sent.
 */
const HAD_BELL = 'pam.explore.bell';

function readHadBell(): boolean {
  try {
    return window.localStorage.getItem(HAD_BELL) === '1';
  } catch {
    return false;
  }
}

function writeHadBell(had: boolean): void {
  try {
    if (had) window.localStorage.setItem(HAD_BELL, '1');
    else window.localStorage.removeItem(HAD_BELL);
  } catch {
    // No storage: the page may move once more, which is all.
  }
}

const styles = stylex.create({
  // Takes the bell's room and nothing else: not seen, not tapped, not read out.
  held: { display: 'inline-flex', visibility: 'hidden', pointerEvents: 'none' },
});

export function HeaderBell({
  enabled,
  role,
  isDemo = false,
  appearance,
  hideWhenNothingNew = false,
}: {
  readonly enabled: boolean;
  readonly role?: Role | null;
  readonly isDemo?: boolean;
  /** `round` for the redesigned headers (D-210). */
  readonly appearance?: 'filled' | 'round';
  /** Nothing is drawn unless something the bell opens is unread. */
  readonly hideWhenNothingNew?: boolean;
}) {
  const { t, tPlain } = useI18n();
  const { state } = useNotifications(enabled);
  const [dummyUnread, setDummyUnread] = useState<number | null>(null);
  // Read after the first render, so what the server drew and what the phone draws first are the same.
  const [hadBell, setHadBell] = useState(false);
  useEffect(() => {
    if (hideWhenNothingNew) setHadBell(readHadBell());
  }, [hideWhenNothingNew]);

  // Example alerts are for Storybook and demo accounts only; a real account's bell counts its real ones.
  const examples = useExamplesOn();
  const needsDummy = examples && state.status === 'ready' && (state.items.length === 0 || isDemo) && Boolean(role);

  useEffect(() => {
    if (!needsDummy) return;
    let cancelled = false;
    void (async () => {
      // A fresh account (D-361) has no example alerts: the bell is quiet.
      if (isFreshAccount()) return;
      const { DUMMY_NOTIFICATIONS } = await import('@pam/config/dummy-notifications');
      if (cancelled) return;
      setDummyUnread(DUMMY_NOTIFICATIONS[role as Role].filter((item) => item.isNew).length);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsDummy, role]);

  // Whether anything is unread, once that is known. With examples, the example set is waited for.
  const known = state.status === 'ready' && !(needsDummy && dummyUnread === null && !isFreshAccount());
  const hasNew = known ? (needsDummy ? (dummyUnread ?? 0) > 0 : unreadCount(state) > 0) : null;

  useEffect(() => {
    if (hideWhenNothingNew && hasNew !== null) writeHadBell(hasNew);
  }, [hideWhenNothingNew, hasNew]);

  if (state.status !== 'ready') {
    if (hideWhenNothingNew && hadBell) return <HeldBell appearance={appearance} href="/notifications/" label={t('notify.title')} />;
    return null;
  }

  if (hideWhenNothingNew) {
    // The example set stands in only where `/notifications/` shows it; a fresh account has none (D-361).
    if (hasNew === null) {
      return hadBell ? <HeldBell appearance={appearance} href="/notifications/" label={t('notify.title')} /> : null;
    }
    if (!hasNew) return null;
  }

  const unread = needsDummy && dummyUnread !== null ? dummyUnread : unreadCount(state);

  return (
    <NotificationBell
      appearance={appearance}
      href="/notifications/"
      label={t('notify.title')}
      unreadCount={unread}
      unreadLabel={tPlain('notify.unread', { count: unread })}
    />
  );
}

/** The bell's room, held until the answer comes (see `HAD_BELL`). */
function HeldBell({
  appearance,
  href,
  label,
}: {
  readonly appearance?: 'filled' | 'round' | undefined;
  readonly href: string;
  readonly label: string;
}) {
  return (
    <span {...stylex.props(styles.held)} aria-hidden="true" inert>
      <NotificationBell appearance={appearance} href={href} label={label} unreadCount={0} unreadLabel={label} />
    </span>
  );
}
