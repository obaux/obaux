'use client';

import { Suspense } from 'react';
import { ProfileScreen } from '../../screens/ProfileScreen';
import { TabGate } from '../TabGate';

/** Profile (D-217): for whoever is signed in, the last tab. The Account screen it replaces is `/account/`. */
export default function ProfilePage() {
  return (
    <TabGate>
      <Suspense fallback={null}>
        <ProfileScreen />
      </Suspense>
    </TabGate>
  );
}
