import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SMS_TEMPLATES, type SmsTemplateKey } from '../src/sms-templates.js';

/**
 * A text that tells you someone did something in Pam says only that something is waiting (Will, 18 October 2026, 15:19: the app explains
 * too many things that belong on the Privacy page; card a102). The promise is the one four rows of the Text alerts screen used to make
 * ("Only that a message is waiting. Never what it says." and its three kin), and it is a property of code, so it is held here, not in a
 * sentence on a screen:
 *
 *   1. the six templates a text of this kind uses carry no variable but the link, in any language (a name, a time, a reason or a reply
 *      cannot be put into them);
 *   2. the database queues them with `{ link }` and nothing else, and the link is a page of the app (`/messages/` or `/`), never a thread,
 *      a person or a visit;
 *   3. the reminder before a visit says the time, the address and a link, and no name (the second line Lena drafted).
 *
 * What is NOT in this list, because it says more on purpose: `facilitation_member` (the first name of the person who introduced you),
 * `support_reply` (the reply itself; unsigned), `appointment_*` (time and address), `attendance_*`, `saved_place_closed` (why a place is shut),
 * `staff_request_*` (the decision) and `access_limited_notice`. The Privacy line is worded for the six and for nothing broader.
 */

const ALERT_TEMPLATES: readonly SmsTemplateKey[] = [
  'message_waiting',
  'connection_request',
  'visit_booked',
  'booking_changed',
  'trip_planned',
  'facilitation_provider',
];
const REMINDERS: readonly SmsTemplateKey[] = ['appointment_24h', 'appointment_2h', 'appointment_morning_of'];

const placeholders = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
/** Every wording of a template, in every language it has. */
function wordings(key: SmsTemplateKey): { locale: string; body: string }[] {
  const t = SMS_TEMPLATES[key];
  return [
    { locale: 'en', body: t.en },
    { locale: 'es', body: t.es },
    ...Object.entries(t.more ?? {}).map(([locale, draft]) => ({ locale, body: draft!.body })),
  ];
}

describe('a text about something in Pam says only that something is waiting', () => {
  for (const key of ALERT_TEMPLATES) {
    it(`${key} has the link and nothing else to fill, in every language`, () => {
      expect([...SMS_TEMPLATES[key].vars]).toEqual(['link']);
      for (const { locale, body } of wordings(key)) {
        expect(placeholders(body), `${key} (${locale}) names something to fill besides the link`).toEqual(['link']);
      }
    });
  }

  const PAM = fileURLToPath(new URL('../../../', import.meta.url));
  const DIR = path.join(PAM, 'packages/db/migrations');
  const sql = readdirSync(DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(path.join(DIR, f), 'utf8').replace(/--.*$/gm, ''))
    .filter((s) => /queue_text_alert/.test(s))
    .join('\n');

  it('the database queues an alert with the link and no other variable', () => {
    const inserts = [...sql.matchAll(/insert into public\.outbound_messages\s*\(member_id, template_key, vars, send_at\)\s*values\s*\(([^;]*?)\)\s*;/gi)];
    expect(inserts.length, 'queue_text_alert inserts one outbound message').toBeGreaterThan(0);
    for (const m of inserts) expect(m[1]).toContain("jsonb_build_object('link', p_link)");
    expect(sql).not.toMatch(/jsonb_build_object\('link', p_link,/);
  });

  it('the link is a page of the app, never a conversation, a person or a visit', () => {
    const links = [...sql.matchAll(/perform public\.queue_text_alert\(\s*[^,]+,\s*[^,]+,\s*([^)]+)\)/g)].map((m) => m[1]!.trim());
    expect(links.length, 'three places queue an alert').toBeGreaterThanOrEqual(3);
    for (const link of links) expect(link, 'a link with an id in it').toMatch(/^base \|\| '\/(messages\/)?'$/);
  });

  it('the reminder before a visit says the time, the address and a link, and no name (the second line)', () => {
    for (const key of REMINDERS) {
      expect([...SMS_TEMPLATES[key].vars].sort()).toEqual(['address', 'link', 'time']);
      for (const { locale, body } of wordings(key)) {
        expect(placeholders(body).sort(), `${key} (${locale})`).toEqual(expect.arrayContaining(['address', 'link', 'time']));
        expect(placeholders(body).every((p) => ['address', 'link', 'time'].includes(p)), `${key} (${locale}) names something else`).toBe(true);
      }
    }
  });
});
