'use client';

import type { Role } from '@pam/config';
import { TabBar, type TabKey } from '@pam/ui/TabBar';
import { useI18n } from '@/lib/i18n';
import { firstTabIsHome, tabsFor } from '@/lib/tabs';

/** `TabBar` with its words from the active language and the tabs for `role` (D-218). */
export function RoleTabBar({
  current,
  unread = true,
  name = 'Marcus',
  photoUrl = null,
  role = 'member',
}: {
  readonly current: TabKey | null;
  readonly unread?: boolean;
  readonly name?: string;
  readonly photoUrl?: string | null;
  readonly role?: Role;
}) {
  const { t } = useI18n();
  const isHome = firstTabIsHome(role);
  return (
    <TabBar
      current={current}
      label={t('tab.label')}
      name={name}
      photoUrl={photoUrl}
      unreadLabel={unread ? t('tab.unread') : null}
      isHome={isHome}
      homeIcon={role === 'provider' ? 'calendar' : role === 'admin' ? 'people' : 'house'}
      tabs={tabsFor(role)}
      labels={{
        explore: t(isHome ? 'tab.home' : 'tab.explore'),
        saved: t('tab.saved'),
        trips: t('tab.trips'),
        program: t('tab.program'),
        messages: t('tab.messages'),
        profile: t('tab.profile'),
      }}
    />
  );
}
