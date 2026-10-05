'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePersonName } from '@/lib/usePersonName';
import { PastTripsView } from '../../../screens/PastTripsView';

/** Already went (D-234): a member's past visits, from their page. */
function Past() {
  const id = useSearchParams().get('id') ?? '';
  const name = usePersonName(id);
  return <PastTripsView personId={id} name={name} />;
}

export default function PastTripsPage() {
  return (
    <Suspense fallback={null}>
      <Past />
    </Suspense>
  );
}
