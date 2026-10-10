import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bundle from '../../../supabase/functions/dispatch-sms/templates.json';
import { render, type Bundle } from '../../../supabase/functions/dispatch-sms/render.ts';
import { SUPPORTED_LOCALES } from '../src/i18n.js';

/**
 * The day-before reminder, rehearsed through the real dispatcher (D-473).
 *
 * The database half is `packages/db/test/36_day_before_reminder_rehearsal_test.sql`:
 * who is queued, when the claim hands it over, and who never gets one. This is
 * the other half — what `dispatch()` does with a claimed row: the words, in the
 * member's language, the length limit, and the one call to Twilio — with the
 * network faked at the HTTP boundary. No real send, no real number: the number
 * below is a fictional 555 number and the Twilio account is made up.
 */

const REAL = bundle as unknown as Bundle;

interface Row {
  id: string;
  member_id: string | null;
  phone: string;
  locale: string;
  template_key: string;
  vars: Record<string, string>;
}

/** What the database hands over for the day-before text: the three ingredients the trigger fills. */
const reminder = (locale: string, vars: Record<string, string> = {}): Row => ({
  id: `row-${locale}`,
  member_id: 'member-1',
  phone: '+12675550100',
  locale,
  template_key: 'appointment_24h',
  vars: { time: '10:00 AM', address: '1234 Market Street', link: APP_LINK, ...vars },
});

/** The live setting at the time of writing (migration 0054); the trigger adds `/trips/`. */
const APP_LINK = 'https://web-ten-umber-88.vercel.app/trips/';

/** Streets and place names as the trigger leaves them: at most 34 characters, as wide as real ones get. */
const LONG_PLACES = [
  '2600 Benjamin Franklin Parkway Bui', // an address cut at 34
  'Center for Employment Opportunitie', // a name cut at 34
  'Philadelphia Works Career Center a', // 34 of the widest letters
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // as wide as Latin letters go
  '北京路一百二十三号费城社区服务中心大楼第二层一二三四五六', // a long Chinese address
  'ул. Большая Морская, дом 12, корпус 3', // Russian
  'شارع الملك فهد الشمالي مبنى رقم ١٢٣٤', // Arabic
];

const WORST_TIME = '12:30 PM';

let dispatch: (limit?: number) => Promise<{ claimed: number; sent: number; failures: { id: string; reason: string }[] }>;

interface Call {
  url: string;
  form?: URLSearchParams;
  headers?: Record<string, string>;
  json?: unknown;
}
let calls: Call[];
let queue: Row[];
let twilioStatus: number;

function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input);
  const headers = (init?.headers ?? {}) as Record<string, string>;
  if (url.includes('/rest/v1/rpc/claim_outbound_messages')) {
    calls.push({ url, headers });
    return Promise.resolve(new Response(JSON.stringify(queue), { status: 200 }));
  }
  if (url.includes('/rest/v1/rpc/mark_outbound_failed')) {
    calls.push({ url, json: JSON.parse(String(init?.body)) });
    return Promise.resolve(new Response(null, { status: 204 }));
  }
  if (url.startsWith('https://api.twilio.com/')) {
    calls.push({ url, form: new URLSearchParams(String(init?.body)), headers });
    return Promise.resolve(
      new Response(JSON.stringify(twilioStatus === 201 ? { sid: 'SMfake' } : { message: 'refused' }), {
        status: twilioStatus,
      }),
    );
  }
  throw new Error(`the rehearsal reached an address it should never reach: ${url}`);
}

const twilioCalls = () => calls.filter((c) => c.url.startsWith('https://api.twilio.com/'));
const sentBodies = () => twilioCalls().map((c) => c.form!.get('Body')!);

beforeAll(async () => {
  // The function file starts a server when it loads; give it a Deno that does nothing.
  vi.stubGlobal('Deno', { env: { get: (name: string) => env[name] }, serve: () => undefined });
  ({ dispatch } = await import('../../../supabase/functions/dispatch-sms/index.ts'));
});

const env: Record<string, string | undefined> = {};
let warnings: string[];

beforeEach(() => {
  calls = [];
  queue = [];
  twilioStatus = 201;
  warnings = [];
  Object.assign(env, {
    SUPABASE_URL: 'https://fake-project.supabase.test',
    SUPABASE_SERVICE_ROLE_KEY: 'fake-service-key',
    TWILIO_ACCOUNT_SID: 'ACfakefakefakefakefakefakefakefake',
    TWILIO_AUTH_TOKEN: 'fake-token',
    TWILIO_FROM_NUMBER: '+12675550199',
    TWILIO_MESSAGING_SERVICE_SID: undefined,
  });
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
  vi.spyOn(console, 'warn').mockImplementation((m: string) => {
    warnings.push(String(m));
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('the day-before reminder, from claimed row to Twilio', () => {
  it('sends one text, to the member, exactly as the signed English reads, with the visit filled in', async () => {
    queue = [reminder('en')];
    const result = await dispatch();
    expect(result).toEqual({ claimed: 1, sent: 1, failures: [] });
    expect(twilioCalls()).toHaveLength(1);
    const call = twilioCalls()[0]!;
    expect(call.form!.get('To')).toBe('+12675550100');
    expect(call.form!.get('From')).toBe('+12675550199');
    expect(call.form!.get('Body')).toBe(
      `Pam: You have a visit tomorrow at 10:00 AM. 1234 Market Street. Tap for directions: ${APP_LINK}`,
    );
    // Twilio is told by account, with the credentials as a header, never in the body.
    expect(call.url).toBe('https://api.twilio.com/2010-04-01/Accounts/ACfakefakefakefakefakefakefakefake/Messages.json');
    expect(call.headers!.Authorization).toMatch(/^Basic /);
    expect(call.form!.toString()).not.toContain('fake-token');
  });

  it('sends nothing at all when nothing is due', async () => {
    queue = [];
    expect(await dispatch()).toEqual({ claimed: 0, sent: 0, failures: [] });
    expect(twilioCalls()).toHaveLength(0);
  });

  it('asks the database for the due messages with the service key and nothing else', async () => {
    await dispatch(25);
    const claim = calls.find((c) => c.url.includes('claim_outbound_messages'))!;
    expect(claim.url).toBe('https://fake-project.supabase.test/rest/v1/rpc/claim_outbound_messages');
    expect(claim.headers!.apikey).toBe('fake-service-key');
  });

  for (const locale of SUPPORTED_LOCALES) {
    it(`reads in ${locale}, fits its limit with a long place name, and is never swapped for English`, async () => {
      for (const address of LONG_PLACES) {
        calls = [];
        warnings = [];
        queue = [reminder(locale, { address, time: WORST_TIME })];
        const result = await dispatch();
        expect(result.failures, `${locale}: ${address}`).toEqual([]);
        const [body] = sentBodies();
        expect(body, `${locale}: ${address}`).toBeDefined();
        expect(body!.startsWith('Pam: ')).toBe(true);
        // The place is in the text (cut to the room it has), and so are the time and the link.
        expect(body).toContain(WORST_TIME);
        expect(body).toContain(APP_LINK);
        // D-431: the limit is 160 for a Latin text, 134 for two segments of a wide script.
        const wide = locale === 'zh-CN' || locale === 'zh-HK' || locale === 'ru' || locale === 'ar';
        expect(body!.length, `${locale}: ${address}`).toBeLessThanOrEqual(wide ? 134 : 160);
        // The dispatcher falls back to English when the member's language will not fit.
        // For a reminder that would be the wrong language arriving without anyone noticing.
        expect(warnings, `${locale} fell back to English`).toEqual([]);
        // And it is the member's language: the signed English sentence is not what went out.
        if (locale !== 'en') expect(body).not.toContain('You have a visit tomorrow');
      }
    });
  }

  it('tells the member their own language: each language says its own words', async () => {
    const seen = new Map<string, string>();
    for (const locale of SUPPORTED_LOCALES) {
      queue = [reminder(locale)];
      calls = [];
      await dispatch();
      seen.set(locale, sentBodies()[0]!);
    }
    expect(new Set(seen.values()).size).toBe(SUPPORTED_LOCALES.length);
    expect(seen.get('es')).toContain('Tiene una visita mañana a las 10:00 AM.');
    expect(seen.get('pt-BR')).toContain('Voce tem uma visita amanha as 10:00 AM.');
    expect(seen.get('zh-CN')).toContain('您明天10:00 AM有预约');
    expect(seen.get('zh-HK')).toContain('你明天10:00 AM有一次到訪');
    expect(seen.get('ru')).toContain('Завтра в 10:00 AM у вас визит');
    expect(seen.get('ar')).toContain('لديك زيارة غدا في 10:00 AM');
  });

  it('texts a language nobody has signed in English, never in a draft', async () => {
    queue = [reminder('fr')];
    await dispatch();
    expect(sentBodies()[0]).toContain('You have a visit tomorrow');
  });

  it('puts a visit named in the trip into no extra words: the signed text has no place for one', async () => {
    queue = [reminder('en', { service: 'Resume help' })];
    await dispatch();
    const [body] = sentBodies();
    expect(body).not.toContain('Resume help');
    expect(body).toBe(`Pam: You have a visit tomorrow at 10:00 AM. 1234 Market Street. Tap for directions: ${APP_LINK}`);
  });

  it('has room to spare for a longer link, and the tightest language is Russian', () => {
    // The link is the app's own address plus /trips/. This worst case (34 of the widest letters, 12:30 PM)
    // is how many more characters the link may have before the reminder stops fitting its limit and goes
    // out in English instead. The runbook (docs/sms-setup.md) quotes it: a custom domain must stay short.
    const spare: Record<string, number> = {};
    for (const locale of SUPPORTED_LOCALES) {
      const body = render(REAL, 'appointment_24h', locale, {
        time: WORST_TIME,
        address: 'W'.repeat(34),
        link: APP_LINK,
      });
      const wide = locale === 'zh-CN' || locale === 'zh-HK' || locale === 'ru' || locale === 'ar';
      spare[locale] = (wide ? 134 : 160) - body.length;
    }
    expect(Math.min(...Object.values(spare))).toBeGreaterThanOrEqual(8);
    expect(Object.entries(spare).sort((a, b) => a[1] - b[1])[0]![0]).toBe('ru');
  });

  it('puts the failure back on the queue and sends nothing when Twilio refuses', async () => {
    twilioStatus = 400;
    queue = [reminder('en')];
    const result = await dispatch();
    expect(result.sent).toBe(0);
    expect(result.failures).toHaveLength(1);
    const reported = calls.filter((c) => c.url.includes('mark_outbound_failed'));
    expect(reported).toHaveLength(1);
    expect(reported[0]!.json).toMatchObject({ p_id: 'row-en' });
    expect(twilioCalls()).toHaveLength(1);
  });

  it('sends nothing and says why when Twilio is not set up', async () => {
    env.TWILIO_ACCOUNT_SID = undefined;
    queue = [reminder('en')];
    const result = await dispatch();
    expect(twilioCalls()).toHaveLength(0);
    expect(result.sent).toBe(0);
    expect(result.failures[0]!.reason).toMatch(/not configured/);
  });

  it('keeps going: one failed text does not hold back the next member’s reminder', async () => {
    queue = [{ ...reminder('en'), id: 'bad', template_key: 'no_such_template' }, { ...reminder('es'), id: 'good' }];
    const result = await dispatch();
    expect(result.sent).toBe(1);
    expect(result.failures.map((f) => f.id)).toEqual(['bad']);
    expect(sentBodies()).toHaveLength(1);
  });

  it('can send through a messaging service instead of a number, which is how a registered campaign sends', async () => {
    env.TWILIO_FROM_NUMBER = undefined;
    env.TWILIO_MESSAGING_SERVICE_SID = 'MGfakefakefakefakefakefakefakefake';
    queue = [reminder('en')];
    await dispatch();
    const form = twilioCalls()[0]!.form!;
    expect(form.get('MessagingServiceSid')).toBe('MGfakefakefakefakefakefakefakefake');
    expect(form.get('From')).toBeNull();
  });
});
