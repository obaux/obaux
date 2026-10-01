'use client';

import { TabBar, type TabKey } from '@pam/ui/TabBar';
import { useI18n } from '../../lib/i18n';

/** `TabBar` with its words from the active language, as the app would pass them. */
export function LocalTabBar({
  current,
  unread = true,
  name = 'Marcus',
  isHome = false,
}: {
  readonly current: TabKey | null;
  readonly unread?: boolean;
  readonly name?: string;
  /** Staff: the first tab reads Home (D-212). */
  readonly isHome?: boolean;
}) {
  const { t } = useI18n();
  return (
    <TabBar
      current={current}
      label={t('tab.label')}
      name={name}
      unreadLabel={unread ? t('tab.unread') : null}
      isHome={isHome}
      labels={{
        explore: t(isHome ? 'tab.home' : 'tab.explore'),
        saved: t('tab.saved'),
        trips: t('tab.trips'),
        messages: t('tab.messages'),
        profile: t('tab.profile'),
      }}
    />
  );
}
