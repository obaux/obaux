'use client';

import { Suspense } from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { TabGate } from './TabGate';

/**
 * The first tab (D-212): Explore for a member, the caseload for a case manager,
 * who is coming in for a program, the staff requests for a super admin. The
 * screen that was here, Home with its tiles, strips and role switch, is the
 * redesign's now (D-213, D-217); a signed-out visitor still goes straight to
 * Sign in, now by `TabGate`.
 */
export default function HomePage() {
  // Suspense: the screens under it read `?…` params in a static export.
  return (
    <TabGate>
      <Suspense fallback={null}>
        <HomeScreen />
      </Suspense>
    </TabGate>
  );
}
