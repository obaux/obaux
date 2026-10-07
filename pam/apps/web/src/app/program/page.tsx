'use client';

import { Suspense } from 'react';
import { ProgramScreen } from '../../screens/ProgramView';

/** Program (D-218): a program lead's own listing, with Edit — or Add a program while they have none (D-361). */
export default function ProgramPage() {
  return (
    <Suspense fallback={null}>
      <ProgramScreen />
    </Suspense>
  );
}
