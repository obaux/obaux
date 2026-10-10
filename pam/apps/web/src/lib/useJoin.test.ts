import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The language travels with the request (0085, D-424). A staff request that is
 * denied has no profile, and an expired invite link is mailed to an address
 * nothing is known about, so the only place their language can come from is
 * the person, as they ask.
 */
const rpc = vi.fn(async (_name: string, _args: Record<string, unknown>) => ({ error: null }));
vi.mock('./supabase', () => ({ createClient: () => ({ rpc }) }));

const { submitDetails } = await import('./useJoin');
const { requestInviteLink } = await import('./useInviteLinks');

beforeEach(() => rpc.mockClear());

const DETAILS = { firstName: ' Vera ', lastName: 'Ivanova', city: 'Philadelphia' };

describe('asking in a language', () => {
  it('sends the language a member signs up in', async () => {
    await submitDetails({ ...DETAILS, kind: 'member', language: 'pt-BR' });
    expect(rpc).toHaveBeenCalledWith('start_membership', expect.objectContaining({ p_language: 'pt-BR' }));
  });

  it('sends the language a staff request is made in', async () => {
    const outcome = await submitDetails({ ...DETAILS, kind: 'admin', language: 'ru' });
    expect(outcome).toEqual({ result: 'staff' });
    expect(rpc).toHaveBeenCalledWith(
      'request_staff_access',
      expect.objectContaining({ p_wants_role: 'admin', p_first_name: 'Vera', p_language: 'ru' }),
    );
  });

  it('sends the language an expired invite link is asked for in', async () => {
    await requestInviteLink('PAM7Q4KX', ' andre@example.org ', 'ar');
    expect(rpc).toHaveBeenCalledWith('request_invite_link', {
      p_code: 'PAM7Q4KX',
      p_email: 'andre@example.org',
      p_language: 'ar',
    });
  });

  it('asks in English when nobody says otherwise, as before', async () => {
    await requestInviteLink('PAM7Q4KX', 'andre@example.org');
    expect(rpc).toHaveBeenCalledWith('request_invite_link', expect.objectContaining({ p_language: 'en' }));
  });
});
