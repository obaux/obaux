'use client';

import { Suspense } from 'react';
import { AddMyProgramScreen } from '../../../screens/AddMyProgramScreen';
import { TabGate } from '../../TabGate';

/** A member asks to add a program (D-525). Behind the tab gate: signed out goes to Sign in. */
export default function AddMyProgramPage() {
  return (
    <TabGate>
      <Suspense fallback={null}>
        <AddMyProgramScreen />
      </Suspense>
    </TabGate>
  );
}
