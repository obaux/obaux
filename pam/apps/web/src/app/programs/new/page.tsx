'use client';

import { Suspense } from 'react';
import { AddProgramView } from '../../../screens/AddProgramView';

/** Add a program (D-218); `?from=home` from Home's card (D-352). */
export default function AddProgramPage() {
  return (
    <Suspense fallback={null}>
      <AddProgramView />
    </Suspense>
  );
}
