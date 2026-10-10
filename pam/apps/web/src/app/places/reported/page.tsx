'use client';

import { Suspense } from 'react';
import { ReportedPlacesScreen } from '../../../screens/ReportedPlacesScreen';

/** Reported places (D-189, D-213): the places somebody said are closed, moved, full or wrong, for the people who review them. */
export default function ReportedPlacesPage() {
  return (
    <Suspense fallback={null}>
      <ReportedPlacesScreen />
    </Suspense>
  );
}
