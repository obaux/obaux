'use client';

import { DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useCaseload } from '@/lib/useCaseload';
import { useI18n } from '@/lib/i18n';

/**
 * A member's first name for a page about them (Connect, Already went —
 * D-231, D-234): from the example cast, or from the case manager's own
 * caseload list. Nothing about a real member is fetched that the caseload
 * does not already show (§4.1).
 */
export function usePersonName(id: string): string {
  const { t } = useI18n();
  const isExample = DUMMY_EVERYONE.some((p) => p.id === id);
  const { state: caseload } = useCaseload(!isExample);
  return (
    DUMMY_EVERYONE.find((p) => p.id === id)?.firstName ??
    (caseload.status === 'ready' ? caseload.members.find((m) => m.id === id)?.firstName : undefined) ??
    t('messages.thread.someone')
  );
}
