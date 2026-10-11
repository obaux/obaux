import { afterEach, describe, expect, it } from 'vitest';
import { setDemoAccount } from './examples';
import { newMessageFrom } from './placeMessages';

/** A place's "New message" row (D-305) reads the member's example conversations. */
describe('newMessageFrom', () => {
  afterEach(() => setDemoAccount(false));

  it('finds the unanswered message from a place whose program wrote last', () => {
    setDemoAccount(true);
    const learning = newMessageFrom('Example Learning Center');
    expect(learning).not.toBeNull();
    expect(learning!.href).toMatch(/^\/messages\/thread\/\?id=/);
    expect(learning!.count).toBeGreaterThan(0);
    expect(learning!.preview).toBe('Of course. Friday at 10. See you then.');
    expect(newMessageFrom('Example Food Pantry')).not.toBeNull();
  });

  it('says nothing to a real account, which has no example conversations (Will, 11 October)', () => {
    expect(newMessageFrom('Example Learning Center')).toBeNull();
    expect(newMessageFrom('Example Food Pantry')).toBeNull();
  });

  it('says nothing for a place with no program contact or no conversation', () => {
    setDemoAccount(true);
    expect(newMessageFrom('Example Library Tech Lab')).toBeNull();
    expect(newMessageFrom('Example Workforce Center')).toBeNull();
  });
});
