'use client';

import { Suspense } from 'react';
import { PamStartScreen } from '../../../screens/PamStartScreen';

/** Pam writes first (card a100): `?profile=&name=` for a person from Everyone, `?service=&name=` for a program. */
export default function PamStartPage() {
  return (
    <Suspense fallback={null}>
      <PamStartScreen />
    </Suspense>
  );
}
