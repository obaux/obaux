'use client';

import { Suspense } from 'react';
import { HomeScreen } from '../../screens/HomeScreen';
import { TabGate } from '../TabGate';

/**
 * The old Places list is Explore now (D-216): a link to `/places/` — from a
 * screen, a text, a bookmark — lands on the first tab, not the old design.
 */
export default function PlacesPage() {
  return (
    <TabGate>
      <Suspense fallback={null}>
        <HomeScreen />
      </Suspense>
    </TabGate>
  );
}
