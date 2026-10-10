'use client';

import { Suspense } from 'react';
import { TripsScreen } from '../../screens/TripsView';
import { TabGate } from '../TabGate';

/**
 * Trips (D-210, D-213): the map of the visits somebody has agreed to make,
 * with the drawer listing them. Routed so the real Google map can be seen on
 * a deployment (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`); Storybook keeps the drawn
 * preview.
 */
export default function TripsPage() {
  // Suspense: TripsScreen reads `?added=` (D-241).
  return (
    <TabGate>
      <Suspense fallback={null}>
        <TripsScreen />
      </Suspense>
    </TabGate>
  );
}
