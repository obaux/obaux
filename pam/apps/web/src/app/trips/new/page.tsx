'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { NewTripView } from '../../../screens/NewTripView';

/**
 * New trip (D-225): where, when, check. Opened from a place's "Schedule a
 * visit" (D-235) it carries that place, and starts at When.
 */
function NewTrip() {
  const params = useSearchParams();
  const id = params.get('place');
  const name = params.get('name');
  const category = params.get('category');
  const address = params.get('address');
  // From a place's "Change appointment" (D-281).
  const change = params.get('change');
  const seed = useMemo(() => (id ? { id, name, category, address } : null), [id, name, category, address]);
  return <NewTripView initialPlace={seed} changing={change} />;
}

export default function NewTripPage() {
  return (
    <Suspense fallback={<NewTripView />}>
      <NewTrip />
    </Suspense>
  );
}
