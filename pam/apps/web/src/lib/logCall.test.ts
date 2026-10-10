import { describe, expect, it, vi } from 'vitest';

const rpc = vi.fn(async () => ({ data: true, error: null }));
vi.mock('./supabase', () => ({ createClient: () => ({ rpc }) }));

import { logCall } from './logCall';
import type { SessionState } from './useSession';

const signedIn = (role: string, isDemo = false): SessionState =>
  ({ status: 'signed-in', session: { userId: 'u1', role, isDemo } }) as unknown as SessionState;

const REAL = '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11';

describe('logCall', () => {
  it('tells the database when a real member calls a real place', async () => {
    rpc.mockClear();
    logCall(signedIn('member'), REAL);
    await vi.waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
    expect(rpc).toHaveBeenCalledWith('log_call', expect.objectContaining({ p_service_id: REAL }));
  });

  it('says nothing for an example place, a demo account, staff, or nobody', async () => {
    rpc.mockClear();
    logCall(signedIn('member'), 'dummy-place-learning');
    logCall(signedIn('member', true), REAL);
    logCall(signedIn('provider'), REAL);
    logCall({ status: 'signed-out' } as SessionState, REAL);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(rpc).not.toHaveBeenCalled();
  });
});
