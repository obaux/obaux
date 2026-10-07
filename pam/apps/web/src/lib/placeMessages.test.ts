import { describe, expect, it } from 'vitest';
import { newMessageFrom } from './placeMessages';

/** A place's "New message" row (D-305) reads the member's example conversations. */
describe('newMessageFrom', () => {
  it('finds the unanswered message from a place whose program wrote last', () => {
    const learning = newMessageFrom('Example Learning Center');
    expect(learning).not.toBeNull();
    expect(learning!.href).toMatch(/^\/messages\/thread\/\?id=/);
    expect(learning!.count).toBeGreaterThan(0);
    expect(learning!.preview).toBe('Of course. Friday at 10. See you then.');
    expect(newMessageFrom('Example Food Pantry')).not.toBeNull();
  });

  it('says nothing for a place with no program contact or no conversation', () => {
    expect(newMessageFrom('Example Library Tech Lab')).toBeNull();
    expect(newMessageFrom('Example Workforce Center')).toBeNull();
  });
});
