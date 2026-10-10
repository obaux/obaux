'use client';

import { Suspense } from 'react';
import { HomeScreen } from '../../screens/HomeScreen';
import { TabGate } from '../TabGate';

/** A program's list of who wants in is its Home now (D-212), so its old address opens it. */
export default function InterestedPage() {
  return (
    <TabGate>
      <Suspense fallback={null}>
        <HomeScreen />
      </Suspense>
    </TabGate>
  );
}
