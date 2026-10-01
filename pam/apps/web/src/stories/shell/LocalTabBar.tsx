'use client';

import { TabBar, type TabKey } from '@pam/ui/TabBar';
import { useI18n } from '../../lib/i18n';

/** `TabBar` with its words from the active language, as the app would pass them. */
export function LocalTabBar({ current }: { readonly current: TabKey | null }) {
  const { t } = useI18n();
  return (
    <TabBar
      current={current}
      label={t('tab.label')}
      helpLabel={t('nav.help')}
      labels={{
        home: t('tab.home'),
        places: t('tab.places'),
        people: t('tab.people'),
        plan: t('tab.plan'),
        me: t('tab.me'),
      }}
    />
  );
}
