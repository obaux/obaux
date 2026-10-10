import { describe, expect, it } from 'vitest';
import { handle, intentOf, type Deps } from '../../../supabase/functions/sms-inbound/handler.ts';
import { sameSignature, twilioSignature } from '../../../supabase/functions/sms-inbound/signature.ts';

/**
 * What a person texts back (D-460): only Twilio may say it, only STOP and START
 * change anything, nothing is answered, nothing is logged. Run against a fake
 * database; nothing leaves the test.
 */
const URL_ = 'https://project.supabase.co/functions/v1/sms-inbound';
const TOKEN = 'twilio-auth-token';

describe('Twilio’s signature', () => {
  it('matches the worked example in Twilio’s own documentation', async () => {
    const params = {
      CallSid: 'CA1234567890ABCDE',
      Caller: '+14158675310',
      Digits: '1234',
      From: '+14158675310',
      To: '+18005551212',
    };
    expect(await twilioSignature('12345', 'https://mycompany.com/myapp.php?foo=1&bar=2', params)).toBe('GvWf1cFY/Q7PnoempGyD5oXAezc=');
  });

  it('sorts the fields and covers the address, so changing either breaks it', async () => {
    const a = await twilioSignature(TOKEN, URL_, { From: '+1', Body: 'STOP' });
    expect(await twilioSignature(TOKEN, URL_, { Body: 'STOP', From: '+1' })).toBe(a);
    expect(await twilioSignature(TOKEN, `${URL_}x`, { From: '+1', Body: 'STOP' })).not.toBe(a);
    expect(await twilioSignature(TOKEN, URL_, { From: '+1', Body: 'START' })).not.toBe(a);
    expect(await twilioSignature('other', URL_, { From: '+1', Body: 'STOP' })).not.toBe(a);
  });

  it('compares without caring where they differ', () => {
    expect(sameSignature('abc=', 'abc=')).toBe(true);
    expect(sameSignature('abc=', 'abd=')).toBe(false);
    expect(sameSignature('abc=', 'abc')).toBe(false);
    expect(sameSignature('', 'abc')).toBe(false);
  });
});

describe('what a reply means', () => {
  it('reads STOP in the words Twilio does, in any case, and only as the whole message', () => {
    for (const body of ['STOP', 'stop', ' Stop. ', 'STOPALL', 'unsubscribe', 'Cancel', 'END', 'quit', 'STOP!']) {
      expect(intentOf({ Body: body }), body).toBe('stop');
    }
    for (const body of ['please stop', 'do not stop', 'stop it', 'stopping by at 3', 'I will quit smoking', '']) {
      expect(intentOf({ Body: body }), body).toBe('other');
    }
  });

  it('reads START and UNSTOP, and not YES, which is a different job', () => {
    expect(intentOf({ Body: 'START' })).toBe('start');
    expect(intentOf({ Body: 'Unstop' })).toBe('start');
    expect(intentOf({ Body: 'YES' })).toBe('other');
    expect(intentOf({ Body: 'NO' })).toBe('other');
    expect(intentOf({ Body: 'HELP' })).toBe('other');
  });

  it('trusts Twilio’s own opt-out type over the words', () => {
    expect(intentOf({ Body: 'hello', OptOutType: 'STOP' })).toBe('stop');
    expect(intentOf({ Body: 'hello', OptOutType: 'START' })).toBe('start');
    expect(intentOf({ Body: 'STOP', OptOutType: 'HELP' })).toBe('other');
  });
});

function world(env: Record<string, string | undefined> = {}, answer: unknown = true, status = 200) {
  const calls: { name: string; phone: string; authorization: string | null }[] = [];
  const e: Record<string, string | undefined> = {
    SMS_INBOUND: 'on',
    TWILIO_AUTH_TOKEN: TOKEN,
    SMS_INBOUND_URL: URL_,
    SUPABASE_URL: 'https://stub.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    ...env,
  };
  const deps: Deps = {
    get: (name) => e[name],
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({
        name: String(input).split('/rpc/')[1]!,
        phone: JSON.parse(String(init?.body)).p_phone,
        authorization: (init?.headers as Record<string, string>)['Authorization'] ?? null,
      });
      return new Response(JSON.stringify(answer), { status });
    }) as typeof fetch,
  };
  /** A request as Twilio would send it, correctly signed unless told otherwise. */
  const send = async (fields: Record<string, string>, opts: { signature?: string; method?: string } = {}) => {
    const signature = opts.signature ?? (await twilioSignature(TOKEN, URL_, fields));
    return handle(
      new Request(URL_, {
        method: opts.method ?? 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': signature },
        ...(opts.method === 'GET' ? {} : { body: new URLSearchParams(fields).toString() }),
      }),
      deps,
    );
  };
  return { deps, calls, send };
}

const STOP = { From: '+12675550301', To: '+12675550100', Body: 'STOP', MessageSid: 'SM1' };

describe('the receiver is off until it is switched on', () => {
  it('answers an empty reply and touches nothing, signature or not', async () => {
    for (const value of [undefined, '', 'true', '1']) {
      const w = world({ SMS_INBOUND: value });
      const r = await w.send(STOP, { signature: 'not a signature' });
      expect(r.status).toBe(200);
      expect(await r.text()).toContain('<Response/>');
      expect(w.calls).toEqual([]);
    }
  });
});

describe('only Twilio may say somebody replied', () => {
  it('refuses a request with no signature, a wrong one, or one for other fields', async () => {
    const w = world();
    expect((await w.send(STOP, { signature: '' })).status).toBe(403);
    expect((await w.send(STOP, { signature: 'GvWf1cFY/Q7PnoempGyD5oXAezc=' })).status).toBe(403);
    const forStart = await twilioSignature(TOKEN, URL_, { ...STOP, Body: 'START' });
    expect((await w.send(STOP, { signature: forStart })).status).toBe(403);
    expect(w.calls).toEqual([]);
  });

  it('will not run without the token or the address it was told to expect', async () => {
    for (const env of [{ TWILIO_AUTH_TOKEN: undefined }, { SMS_INBOUND_URL: undefined }]) {
      const w = world(env);
      expect((await w.send(STOP)).status).toBe(503);
      expect(w.calls).toEqual([]);
    }
  });

  it('answers only a POST', async () => {
    const w = world();
    expect((await w.send(STOP, { method: 'GET' })).status).toBe(405);
  });
});

describe('what it records', () => {
  it('records a STOP against the number it came from, with the service key', async () => {
    const w = world();
    const r = await w.send(STOP);
    expect(r.status).toBe(200);
    expect(await r.text()).toBe('<?xml version="1.0" encoding="UTF-8"?><Response/>');
    expect(w.calls).toEqual([{ name: 'record_sms_stop', phone: '+12675550301', authorization: 'Bearer service-key' }]);
  });

  it('records a START, and uses Twilio’s own opt-out type when it sends one', async () => {
    const w = world();
    await w.send({ ...STOP, Body: 'START' });
    await w.send({ ...STOP, Body: 'anything', OptOutType: 'STOP' });
    expect(w.calls.map((c) => c.name)).toEqual(['record_sms_start', 'record_sms_stop']);
  });

  it('ignores HELP, YES, NO and every reply in words, and answers none of them', async () => {
    const w = world();
    for (const body of ['HELP', 'YES', 'NO', 'I can not make it', 'stop texting me please']) {
      const r = await w.send({ ...STOP, Body: body });
      expect(r.status, body).toBe(200);
      expect(await r.text(), body).toContain('<Response/>');
    }
    expect(w.calls).toEqual([]);
  });

  it('does not run on a request with no number', async () => {
    const w = world();
    await w.send({ Body: 'STOP' });
    expect(w.calls).toEqual([]);
  });

  it('is a failure Twilio can see when the database cannot be reached', async () => {
    const w = world({}, 'down', 500);
    await expect(w.send(STOP)).rejects.toThrow(/record_sms_stop: 500/);
  });

  it('never writes a phone number or a word of what was said to its logs', async () => {
    const logged: string[] = [];
    const orig = [console.log, console.warn, console.error];
    console.log = console.warn = console.error = (...a: unknown[]) => void logged.push(a.map(String).join(' '));
    try {
      const w = world();
      await w.send(STOP);
      await w.send({ ...STOP, Body: 'START' });
      await w.send(STOP, { signature: 'bad' });
      await world({}, 'down', 500).send(STOP).catch(() => undefined);
    } finally {
      [console.log, console.warn, console.error] = orig as typeof orig;
    }
    const all = logged.join('\n');
    expect(all).not.toContain('2675550301');
    expect(all).not.toMatch(/STOP|START/);
    expect(logged.length).toBeGreaterThan(0);
  });
});
