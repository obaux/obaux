/**
 * Where the Google map in Trips opens (D-536): on the whole city, never fitted to
 * the member's trips. The tiles Google serves are the part of the map in view, so a
 * view fitted to one trip is a single block, which with the phone's IP address says
 * roughly where the member is going. The pins are still placed; zooming in is the
 * member's own choice.
 */
export const CITY = { lat: 39.9526, lng: -75.1652 } as const;

/** Pixels to move the view down so the half-open drawer does not sit on the middle of the city. */
export function drawerNudge(viewportHeight: number): number {
  return Math.round(viewportHeight * 0.2);
}
