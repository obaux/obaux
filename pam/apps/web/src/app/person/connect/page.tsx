'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePersonName } from '@/lib/usePersonName';
import { ConnectView } from '../../../screens/ConnectView';

/**
 * Connect a member to a program (D-231), from their page. The name comes
 * from the example cast, or from the case manager's own caseload list —
 * nothing about a real member is fetched that the caseload does not show.
 */
function Connect() {
  const id = useSearchParams().get('id') ?? '';
  const name = usePersonName(id);
  return <ConnectView personId={id} name={name} />;
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <Connect />
    </Suspense>
  );
}
