'use client';

import dynamic from 'next/dynamic';

/** The Reported filter's list, loaded only when a reviewer taps the chip (D-189). */
export const ReportedPlacesLazy = dynamic(
  () => import('./ReportedPlaces').then((mod) => mod.ReportedPlaces),
  { ssr: false },
);
