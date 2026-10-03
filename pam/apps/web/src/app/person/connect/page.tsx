'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useCaseload } from '@/lib/useCaseload';
import { useI18n } from '@/lib/i18n';
import { ConnectView } from '../../../screens/ConnectView';

/**
 * Connect a member to a program (D-231), from their page. The name comes
 * from the example cast, or from the case manager's own caseload list —
 * nothing about a real member is fetched that the caseload does not show.
 */
function Connect() {
  const { t } = useI18n();
  const id = useSearchParams().get('id') ?? '';
  const { state: caseload } = useCaseload(!DUMMY_EVERYONE.some((p) => p.id === id));
  const name =
    DUMMY_EVERYONE.find((p) => p.id === id)?.firstName ??
    (caseload.status === 'ready' ? caseload.members.find((m) => m.id === id)?.firstName : undefined) ??
    t('messages.thread.someone');
  return <ConnectView personId={id} name={name} />;
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <Connect />
    </Suspense>
  );
}
