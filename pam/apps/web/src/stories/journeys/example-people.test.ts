// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { CASELOAD } from './fixtures';
import { installSupabaseMock } from './mockSupabase';

/**
 * Iris's b63 re-test, P4: a circle on a program lead's Home story opened "We could not find that person". The story's people are the
 * example caseload, linked to the example program, so the mock's `program_member_card` answers for each of them, with their name, and for
 * nobody else. This calls the mock the way the app does.
 */
const card = async (memberId: string) => {
  const res = await fetch('https://stub.supabase.co/rest/v1/rpc/program_member_card', { method: 'POST', body: JSON.stringify({ p_member_id: memberId }) });
  return (await res.json()) as { member_id: string; first_name: string } | null;
};

describe('the example caseload on the lead stories', () => {
  installSupabaseMock('provider');

  it('opens a card for every person the lead Home draws, with their name', async () => {
    expect(CASELOAD.length).toBeGreaterThanOrEqual(2);
    for (const person of CASELOAD) {
      const answer = await card(person.id);
      expect(answer, person.first_name).not.toBeNull();
      expect(answer?.first_name).toBe(person.first_name);
    }
  });

  it('knows nobody else', async () => {
    expect(await card('someone-else')).toBeNull();
  });
});
