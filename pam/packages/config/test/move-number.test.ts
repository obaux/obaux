import { describe, expect, it } from 'vitest';
import { handle, type Deps } from '../../../supabase/functions/move-number/handler.ts';

/**
 * The function that moves an approved account to its new number (D-567), against a fake Auth and a fake
 * database. What matters: it moves only what the database offers the caller, in the right order, with
 * the service key only for the admin calls, and it never logs a number.
 */
const URL_ = 'https://stub.supabase.co';
const JWT = 'approver.jwt';
const SERVICE = 'service-role-key';
const ANON = 'anon-key';
const APPROVER = 'aaaaaaaa-0000-4000-8000-00000000000a';
const REQUEST = '11111111-1111-4111-8111-111111111111';
const TEMP = '22222222-2222-4222-8222-222222222222';
const ACCOUNT = '33333333-3333-4333-8333-333333333333';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly authorization: string | null;
  readonly body: unknown;
}

function world(opts: { offered?: boolean; requester?: string | null; deleteStatus?: number; putStatus?: number; signedIn?: boolean } = {}) {
  const calls: Call[] = [];
  const deps: Deps = {
    get: (name) => ({ SUPABASE_URL: URL_, SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SERVICE })[name],
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      calls.push({
        url,
        method: init?.method ?? 'GET',
        authorization: headers.get('Authorization'),
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });
      const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
      if (url.endsWith('/auth/v1/user')) return opts.signedIn === false ? json(401, {}) : json(200, { id: APPROVER });
      if (url.endsWith('/rpc/number_change_to_move'))
        return json(200, opts.offered === false ? [] : [{ requester_id: opts.requester === undefined ? TEMP : opts.requester, profile_id: ACCOUNT, new_phone: '+12675550111' }]);
      if (url.includes('/auth/v1/admin/users/') && init?.method === 'DELETE') return json(opts.deleteStatus ?? 200, {});
      if (url.includes('/auth/v1/admin/users/') && init?.method === 'PUT') return json(opts.putStatus ?? 200, {});
      if (url.endsWith('/rpc/number_change_moved')) return new Response(null, { status: 204 });
      return json(404, {});
    }) as typeof fetch,
  };
  return { calls, deps };
}

const ask = (body: unknown = { requestId: REQUEST }, jwt: string | null = JWT) =>
  new Request('https://fn/move-number', {
    method: 'POST',
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    body: JSON.stringify(body),
  });

describe('move-number', () => {
  it('removes the temporary sign-in, moves the account, then records it — in that order', async () => {
    const { calls, deps } = world();
    const res = await handle(ask(), deps);
    expect(res.status).toBe(200);
    const steps = calls.map((c) => `${c.method} ${c.url.replace(URL_, '')}`);
    expect(steps).toEqual([
      'GET /auth/v1/user',
      'POST /rest/v1/rpc/number_change_to_move',
      `DELETE /auth/v1/admin/users/${TEMP}`,
      `PUT /auth/v1/admin/users/${ACCOUNT}`,
      'POST /rest/v1/rpc/number_change_moved',
    ]);
    expect(calls[1]!.body).toEqual({ p_id: REQUEST, p_caller: APPROVER });
    expect(calls[3]!.body).toEqual({ phone: '12675550111', phone_confirm: true });
  });

  it('asks who the caller is with their own sign-in, and uses the service key only for the rest', async () => {
    const { calls, deps } = world();
    await handle(ask(), deps);
    expect(calls[0]!.authorization).toBe(`Bearer ${JWT}`);
    for (const c of calls.slice(1)) expect(c.authorization).toBe(`Bearer ${SERVICE}`);
  });

  it('touches nothing when the database offers nothing to this caller', async () => {
    const { calls, deps } = world({ offered: false });
    const res = await handle(ask(), deps);
    expect(res.status).toBe(404);
    expect(calls.some((c) => c.url.includes('/admin/'))).toBe(false);
    expect(calls.some((c) => c.url.endsWith('number_change_moved'))).toBe(false);
  });

  it('needs a sign-in and a request id', async () => {
    expect((await handle(ask(undefined, null), world().deps)).status).toBe(401);
    expect((await handle(ask({ requestId: 'nope' }), world().deps)).status).toBe(400);
    expect((await handle(ask(), world({ signedIn: false }).deps)).status).toBe(401);
  });

  it('a temporary sign-in already gone is fine; one that would not go stops the move', async () => {
    expect((await handle(ask(), world({ deleteStatus: 404 }).deps)).status).toBe(200);
    const blocked = world({ deleteStatus: 500 });
    expect((await handle(ask(), blocked.deps)).status).toBe(502);
    expect(blocked.calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  it('if the sign-in will not move, the record is not marked moved (the same call can be made again)', async () => {
    const { calls, deps } = world({ putStatus: 500 });
    expect((await handle(ask(), deps)).status).toBe(502);
    expect(calls.some((c) => c.url.endsWith('number_change_moved'))).toBe(false);
  });

  it('answers the browser preflight', async () => {
    const res = await handle(new Request('https://fn/move-number', { method: 'OPTIONS' }), world().deps);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});
