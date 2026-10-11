import { describe, expect, it, vi } from 'vitest';
import { handle, tokenOf, type Deps } from '../../../supabase/functions/calendar-feed/handler.ts';
import { buildCalendar, escapeText, fold, type Feed } from '../../../supabase/functions/calendar-feed/ics.ts';

/**
 * A member's Pam visits as a calendar file at a secret address (D-538): discreet unless the member
 * says otherwise, and nothing in it but the fields below. Fake database; nothing leaves the test.
 */
const NOW = new Date('2026-10-12T15:00:00Z');
const VISIT = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  starts_at: '2026-10-14T14:00:00Z',
  ends_at: '2026-10-14T15:30:00Z',
  place_id: '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a',
};
const DISCREET: Feed = { show_details: false, visits: [{ ...VISIT, name: null, address: null }] };
const DETAILS: Feed = { show_details: true, visits: [{ ...VISIT, name: 'Fresh Start Kitchen', address: '1234 Market St, Philadelphia' }] };
/** The lines of a file, with folded ones joined back (RFC 5545 3.1). */
const lines = (text: string) => text.replace(/\r\n /g, '').split('\r\n');

describe('the file, discreet (the default)', () => {
  const text = buildCalendar(DISCREET, NOW);
  it('says only "Pam visit", the time, and a link to the visits screen', () => {
    expect(lines(text)).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Pam//Visits//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Pam visits',
      'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
      'X-PUBLISHED-TTL:PT12H',
      'BEGIN:VEVENT',
      'UID:aaaaaaaa-0000-0000-0000-000000000001@joinpam.org',
      'DTSTAMP:20261012T150000Z',
      'DTSTART:20261014T140000Z',
      'DTEND:20261014T153000Z',
      'SUMMARY:Pam visit',
      'URL:https://app.joinpam.org/trips/',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ]);
  });
  it('carries no program, no address and no place id', () => {
    expect(text).not.toMatch(/Fresh Start|Market|LOCATION|4c0f6b64/);
  });
});

describe('the file, with details (the member\'s switch)', () => {
  const text = buildCalendar(DETAILS, NOW);
  it('adds the program\'s name and address and a link to its page', () => {
    expect(lines(text)).toContain('SUMMARY:Pam visit: Fresh Start Kitchen');
    expect(lines(text)).toContain('LOCATION:1234 Market St\\, Philadelphia');
    expect(lines(text)).toContain(
      'URL:https://app.joinpam.org/place/?id=4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a&from=trips&trip=aaaaaaaa-0000-0000-0000-000000000001',
    );
  });
  it('still carries nothing about the member, a note, attendance or points', () => {
    expect(text).not.toMatch(/ATTENDEE|ORGANIZER|DESCRIPTION|COMMENT|points|attend/i);
  });
});

describe('the pieces', () => {
  it('uses an hour when a visit has no end, and skips one with a time that is not a time', () => {
    const text = buildCalendar({ show_details: false, visits: [{ ...VISIT, ends_at: null }, { ...VISIT, id: 'x', starts_at: 'later' }] }, NOW);
    expect(text).toContain('DTEND:20261014T150000Z');
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
  it('escapes backslashes, semicolons, commas and line breaks', () => {
    expect(escapeText('a;b,c\\d\ne')).toBe('a\;b\\,c\\\\d\\ne');
  });
  it('folds a long line at 75 octets without cutting a character', () => {
    const folded = fold('SUMMARY:' + 'é'.repeat(80));
    for (const part of folded.split('\r\n')) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe('SUMMARY:' + 'é'.repeat(80));
  });
  it('is empty of events when the member has no visits, still a calendar', () => {
    const text = buildCalendar({ show_details: false, visits: [] }, NOW);
    expect(text).toContain('BEGIN:VCALENDAR');
    expect(text).not.toContain('VEVENT');
  });
});

const TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ'; // 43 characters
async function hashOf(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

function world(answer: Feed | null | 'error') {
  const asked: { url: string; body: string }[] = [];
  const deps: Deps = {
    get: (name) => ({ SUPABASE_URL: 'https://stub.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key' })[name],
    now: () => NOW,
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      asked.push({ url: String(input), body: String(init?.body ?? '') });
      return answer === 'error' ? new Response('boom', { status: 500 }) : new Response(JSON.stringify(answer), { status: 200 });
    }) as typeof fetch,
  };
  return { deps, asked };
}
const get = (path: string, method = 'GET') => new Request(`https://x.supabase.co/functions/v1/calendar-feed/${path}`, { method });

describe('the address', () => {
  it('finds the token in the last part of the path, which must end in .ics and be 43 URL-safe characters', () => {
    expect(tokenOf(`https://x/functions/v1/calendar-feed/${TOKEN}.ics`)).toBe(TOKEN);
    expect(tokenOf(`https://x/functions/v1/calendar-feed/${TOKEN}`)).toBeNull();
    expect(tokenOf('https://x/functions/v1/calendar-feed/short.ics')).toBeNull();
    expect(tokenOf(`https://x/functions/v1/calendar-feed/${TOKEN}x.ics`)).toBeNull();
  });
});

describe('the function', () => {
  it('answers a good address with the calendar, asking the database with the hash and never the token', async () => {
    const { deps, asked } = world(DETAILS);
    const response = await handle(get(`${TOKEN}.ics`), deps);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/calendar; charset=utf-8');
    expect(await response.text()).toContain('SUMMARY:Pam visit: Fresh Start Kitchen');
    expect(asked).toHaveLength(1);
    expect(asked[0]!.url).toBe('https://stub.supabase.co/rest/v1/rpc/calendar_feed_read');
    expect(JSON.parse(asked[0]!.body)).toEqual({ p_token_hash: await hashOf(TOKEN) });
    expect(asked[0]!.body).not.toContain(TOKEN);
  });

  it('answers an unknown, a malformed and a turned-off address with the same bare 404, and a bad one never reaches the database', async () => {
    const unknown = world(null);
    const a = await handle(get(`${TOKEN}.ics`), unknown.deps);
    const bad = world(DETAILS);
    const b = await handle(get('nope.ics'), bad.deps);
    const c = await handle(get(TOKEN), bad.deps);
    for (const r of [a, b, c]) expect(r.status).toBe(404);
    expect(await a.text()).toBe(await b.text());
    expect(bad.asked).toHaveLength(0);
  });

  it('refuses anything but GET and HEAD, and HEAD has no body', async () => {
    expect((await handle(get(`${TOKEN}.ics`, 'POST'), world(DETAILS).deps)).status).toBe(405);
    const head = await handle(get(`${TOKEN}.ics`, 'HEAD'), world(DETAILS).deps);
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
  });

  it('says nothing about who asked: no CORS headers, and the answer is marked private', async () => {
    const response = await handle(get(`${TOKEN}.ics`), world(DISCREET).deps);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
  });

  it('fails loudly when the database does, without the token in the message', async () => {
    const error = await handle(get(`${TOKEN}.ics`), world('error').deps).catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain(TOKEN);
  });

  it('writes nothing to the log on a good request', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await handle(get(`${TOKEN}.ics`), world(DISCREET).deps);
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
