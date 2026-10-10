'use client';

import { Notice } from '@pam/ui';
import { useI18n } from '@/lib/i18n';

/**
 * What stands where the composer would be in a conversation where somebody
 * blocked (0076, D-463). Everything said stays on the screen and can still be
 * reported; only sending is off, for both.
 *
 * `mine`: I blocked them — it says how to undo it. `theirs`: they blocked me —
 * it says so plainly (the database tells the blocked person: `blocked_me`) and
 * carries the call button, as every notice does.
 */
export function BlockedNotice({
  by,
  supportPhone,
}: {
  readonly by: 'mine' | 'theirs';
  readonly supportPhone: string;
}) {
  const { t } = useI18n();
  return (
    <Notice
      notice="service_not_available"
      title={t(`messages.blocked.${by}.title`)}
      body={t(`messages.blocked.${by}.body`)}
      supportPhone={supportPhone}
      callLabel={t('help.callSupport')}
      quiet
    />
  );
}
