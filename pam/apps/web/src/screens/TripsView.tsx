'use client';

import type { ReactNode } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Page, TripsIcon } from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { useI18n } from '@/lib/i18n';

/**
 * Trips — a visit somebody planned to a place (D-210). Nothing creates one
 * yet, so this is the empty page Will asked for: it says what will appear
 * here, so the tab is not a dead end in the meantime.
 */
export function TripsView({ headerActions }: { readonly headerActions?: ReactNode }) {
  const { t } = useI18n();
  return (
    <Page gap={4}>
      <LargeTitleHeader title={t('trips.title')} actions={headerActions} />
      <Card padding={5}>
        <EmptyState
          title={t('trips.empty.title')}
          description={t('trips.empty.body')}
          icon={<TripsIcon width={56} height={56} aria-hidden />}
          headingLevel={2}
        />
      </Card>
    </Page>
  );
}
