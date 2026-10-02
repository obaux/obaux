'use client';

import { HeaderActions } from '../../screens/HeaderActions';
import { TripsScreen } from '../../screens/TripsView';

/**
 * Trips (D-210, D-213): the map of the visits somebody has agreed to make,
 * with the drawer listing them. Routed so the real Google map can be seen on
 * a deployment (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`); Storybook keeps the drawn
 * preview.
 */
export default function TripsPage() {
  return <TripsScreen headerActions={<HeaderActions />} />;
}
