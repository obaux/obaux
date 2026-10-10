'use client';

import { Suspense } from 'react';
import { AddProgramView } from '../../../screens/AddProgramView';
import { TabGate } from '../../TabGate';

/**
 * Add a program (D-218); `?from=home` from Home's card (D-352).
 *
 * Behind the tab gate (D-496): this is the address the text that approves a
 * program lead carries, so it is opened from a cold link. Signed out, that goes
 * to Sign in and then Home, whose getting-started card is the same step; it
 * never shows a signed-out visitor a form that saves nothing.
 */
export default function AddProgramPage() {
  return (
    <TabGate>
      <Suspense fallback={null}>
        <AddProgramView />
      </Suspense>
    </TabGate>
  );
}
