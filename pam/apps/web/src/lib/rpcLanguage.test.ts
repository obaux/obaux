import { describe, expect, it, vi } from 'vitest';
import { FUNCTION_NOT_FOUND, rpcWithLanguage } from './rpcLanguage';

/**
 * Migration 0085 is applied by hand, so for a while the app may be live before
 * the database can take `p_language` (D-424). Asking must not break either way.
 */
const ok = { error: null };
const notFound = { error: { code: FUNCTION_NOT_FOUND } };

describe('asking with a language', () => {
  it('names the language when the database takes it, and asks once', async () => {
    const rpc = vi.fn(async () => ok);
    await rpcWithLanguage({ rpc }, 'request_staff_access', { p_city: 'Philadelphia' }, 'ru');
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('request_staff_access', { p_city: 'Philadelphia', p_language: 'ru' });
  });

  it('asks again without it when the database has no such function yet (0085 not applied)', async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce(notFound)
      .mockResolvedValueOnce(ok);
    const result = await rpcWithLanguage({ rpc }, 'request_invite_link', { p_code: 'A', p_email: 'a@b.co' }, 'ar');
    expect(result).toEqual(ok);
    expect(rpc).toHaveBeenNthCalledWith(1, 'request_invite_link', { p_code: 'A', p_email: 'a@b.co', p_language: 'ar' });
    expect(rpc).toHaveBeenNthCalledWith(2, 'request_invite_link', { p_code: 'A', p_email: 'a@b.co' });
  });

  it('does not hide a real failure: any other error is returned as it is, and nothing is asked twice', async () => {
    const refused = { error: { code: '42501' } };
    const rpc = vi.fn(async () => refused);
    const result = await rpcWithLanguage({ rpc }, 'request_staff_access', {}, 'es');
    expect(result).toEqual(refused);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('reports the second answer when even the plain call fails', async () => {
    const rpc = vi.fn().mockResolvedValueOnce(notFound).mockResolvedValueOnce({ error: { code: '23505' } });
    const result = await rpcWithLanguage({ rpc }, 'request_staff_access', {}, 'es');
    expect(result.error?.code).toBe('23505');
  });
});
