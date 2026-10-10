'use client';

import { Suspense } from 'react';
import { SavedScreen } from '../../screens/SavedView';
import { TabGate } from '../TabGate';

/** Saved (D-213): the places a member kept, or the people a case manager starred, on the tab-screen frame. */
export default function SavedPage() {
  return (
    <TabGate>
      <Suspense fallback={null}>
        <SavedScreen />
      </Suspense>
    </TabGate>
  );
}
