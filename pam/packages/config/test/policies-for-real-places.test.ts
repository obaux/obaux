import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DUMMY_PLACES_BY_ID } from '../src/dummy-places';
import { placeAsksForPolicies } from '../src/dummy-policies';

/**
 * A member is never shown policies a program did not write. The policies are
 * example data (`DUMMY_POLICIES`) that every *example* place borrows; a place
 * from the catalogue has none in Pam yet (D-313's second step), so it must ask
 * for nothing — else "Sign 4 policies for <place>" puts the example program's
 * rules in front of a real person.
 */
describe('placeAsksForPolicies', () => {
  it('asks nothing of a place from the catalogue, whatever its id', () => {
    expect(placeAsksForPolicies('4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11')).toBe(false);
    expect(placeAsksForPolicies('4C0F6B64-3A0E-4B8E-9D6C-7A1F0F3C2B11')).toBe(false);
  });

  it('still asks of the example places, so Storybook shows a program with policies', () => {
    expect(placeAsksForPolicies('dummy-place-learning')).toBe(true);
    expect(Object.keys(DUMMY_PLACES_BY_ID).filter(placeAsksForPolicies).length).toBeGreaterThan(0);
  });

  it('keeps the example food pantry as the one that asks for nothing', () => {
    expect(placeAsksForPolicies('dummy-place-food')).toBe(false);
  });
});

/**
 * Every screen that shows a member policies to sign goes through that one gate.
 * The Trips list once drew them without it (a real place read "Sign 4 policies"),
 * and nothing failed, so the screens that matter are named here.
 */
describe('the member screens that show policies', () => {
  const web = join(__dirname, '../../../apps/web/src');
  for (const file of ['app/place/page.tsx', 'screens/NewTripView.tsx', 'screens/TripsView.tsx', 'screens/MemberPoliciesView.tsx']) {
    // Since D-485 the gate is `usePlacePolicies`: a real place asks for what its program keeps
    // in the database (nothing when it has put none), an example place for the example set.
    it(`${file} asks usePlacePolicies before showing any`, () => {
      const source = readFileSync(join(web, file), 'utf8');
      expect(source).toContain('usePlacePolicies()');
      expect(source).not.toContain('usePolicies()');
    });
  }
});
