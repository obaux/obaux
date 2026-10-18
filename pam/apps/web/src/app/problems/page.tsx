'use client';

import { Suspense } from 'react';
import { ProblemsScreen } from '../../screens/ProblemsScreen';

/** Problems (D-616): what broke in the app, for the super admin. */
export default function ProblemsPage() {
  return (
    <Suspense fallback={null}>
      <ProblemsScreen />
    </Suspense>
  );
}
