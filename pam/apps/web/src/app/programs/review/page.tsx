'use client';

import { Suspense } from 'react';
import { ProgramsToCheckScreen } from '../../../screens/ProgramsToCheckScreen';

/** Programs a super admin has still to check (D-386, part 6). `?from=home` from Home's row (Iris, super admin P2). */
export default function ProgramsToCheckPage() {
  return (
    <Suspense fallback={null}>
      <ProgramsToCheckScreen />
    </Suspense>
  );
}
