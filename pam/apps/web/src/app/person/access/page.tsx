'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ManageAccessView } from '../../../screens/ManageAccessView';

/**
 * Limit or pause a member, or turn them back on (D-446), from their page. The
 * name and status come from the example cast or the case manager's own
 * caseload; the database decides whether the change is theirs to make.
 */
function ManageAccess() {
  const id = useSearchParams().get('id') ?? '';
  return <ManageAccessView personId={id} />;
}

export default function ManageAccessPage() {
  return (
    <Suspense fallback={null}>
      <ManageAccess />
    </Suspense>
  );
}
