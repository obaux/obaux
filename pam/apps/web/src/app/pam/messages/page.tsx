'use client';

import { Suspense } from 'react';
import { PamInboxScreen } from '../../../screens/PamInboxScreen';

/** Messages to Pam (card a100), for the Pam team. `?from=home` from Home's row; `?show=closed` for the closed ones. */
export default function PamMessagesPage() {
  return (
    <Suspense fallback={null}>
      <PamInboxScreen />
    </Suspense>
  );
}
