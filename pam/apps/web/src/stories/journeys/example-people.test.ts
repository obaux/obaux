import { describe, expect, it } from 'vitest';
import { CASELOAD, programMemberCardFor } from './fixtures';

/** Iris's b63 re-test, P4: a circle on a program lead's Home story opened "We could not find that person". */
describe('the example caseload on the lead stories', () => {
  it('opens a card for every person the lead Home draws, with their name', () => {
    expect(CASELOAD.length).toBeGreaterThanOrEqual(2);
    for (const person of CASELOAD) {
      const card = programMemberCardFor(person.id, []);
      expect(card, person.first_name).not.toBeNull();
      expect(card?.first_name).toBe(person.first_name);
    }
  });
  it('knows nobody else', () => {
    expect(programMemberCardFor('someone-else', [])).toBeNull();
    expect(programMemberCardFor(null, [])).toBeNull();
  });
});
