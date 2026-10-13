import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CITY, drawerNudge } from '../lib/tripsMapView';

/** The Google map opens on the whole city and is never fitted to a member's trips (D-536). */
describe('the trips map start view', () => {
  it('is the city at zoom 12, nudged up a fifth of the screen for the half-open drawer', () => {
    expect(CITY).toEqual({ lat: 39.9526, lng: -75.1652 });
    expect(drawerNudge(600)).toBe(120);
  });

  it('is what the Google map is given, in that order, and the view is never fitted to the pins', () => {
    const source = readFileSync(join(__dirname, 'TripsMap.tsx'), 'utf8');
    expect(source).not.toMatch(/fitBounds|LatLngBounds/);
    expect(source).toMatch(/map\.setCenter\(CITY\);\s*map\.setZoom\(12\);\s*map\.panBy\(0, drawerNudge\(window\.innerHeight\)\);/);
    // The pins are still placed: one marker per pin.
    expect(source).toMatch(/new google\.maps\.Marker\(/);
  });
});
