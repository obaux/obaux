'use client';

import { Suspense } from 'react';
import { WaitingCitiesScreen } from '../../../screens/WaitingCitiesScreen';

/** Cities people are waiting for (D-593), for a super admin. `?from=home` from Home's row. */
export default function WaitingCitiesPage() {
  return (
    <Suspense fallback={null}>
      <WaitingCitiesScreen />
    </Suspense>
  );
}
