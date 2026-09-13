import { describe, expect, it } from 'vitest';
import bundle from '../../../supabase/functions/dispatch-sms/templates.json';
import {
  render,
  assertSafe,
  localeOf,
  UnsendableError,
  type Bundle,
} from '../../../supabase/functions/dispatch-sms/render.ts';
import { SMS_TEMPLATES, SERVICE_FLAG_REASONS } from '../src/sms-templates.js';

/**
 * The dispatcher is the last thing between a queued row and somebody's phone.
 * These tests run the real renderer against the real bundle, so a template
 * whose copy nobody signed off cannot send, and a bundle that has drifted from
 * the reviewed source fails here rather than in a text message.
 */
const REAL = bundle as unknown as Bundle;

/** The same bundle with every template signed off, to test what happens after. */
const REVIEWED: Bundle = {
  reasons: REAL.reasons,
  templates: Object.fromEntries(
    Object.entries(REAL.templates).map(([key, t]) => [key, { ...t, reviewedBy: 'a-human' }]),
  ),
};

const VARS: Record<string, string> = {
  link: 'https://pam.to/a1b2c3d',
  code: '123456',
  adminFirstName: 'Cassandra',
  time: '10:00 AM',
  address: '1234 Market St',
  supportPhone: '555-555-0134',
  reason: 'closed, so there is no need to go',
};

describe('the shipped bundle', () => {
  it('carries exactly the templates and reasons the reviewed source defines', () => {
    // The bundle is generated. If it drifts, the dispatcher is sending words
    // that were never reviewed, tested, or length-checked.
    expect(Object.keys(REAL.templates).sort()).toEqual(Object.keys(SMS_TEMPLATES).sort());
    expect(Object.keys(REAL.reasons).sort()).toEqual(Object.keys(SERVICE_FLAG_REASONS).sort());
    for (const [key, template] of Object.entries(REAL.templates)) {
      expect(template.en).toBe(SMS_TEMPLATES[key as keyof typeof SMS_TEMPLATES].en);
      expect(template.es).toBe(SMS_TEMPLATES[key as keyof typeof SMS_TEMPLATES].es);
    }
  });

  it('carries the sign-off, so the dispatcher will actually send', () => {
    // Flipped on 13 September 2026, when Will approved the copy. The bundle is
    // generated from the reviewed source, so a name missing here means the
    // bundle is stale — and a stale bundle is how words nobody read reach a
    // phone.
    for (const template of Object.values(REAL.templates)) {
      expect(template.reviewedBy, `${template.key} has no name against it`).not.toBe('');
    }
    for (const key of Object.keys(REAL.templates)) {
      expect(() => render(REAL, key, 'en', VARS)).not.toThrow();
    }
  });

  it('still refuses a template whose name has been taken off', () => {
    // The gate itself, on a copy of the bundle. It has to keep working now that
    // the real catalogue no longer exercises it.
    const unsigned: Bundle = {
      reasons: REAL.reasons,
      templates: {
        ...REAL.templates,
        verify_code: { ...REAL.templates['verify_code']!, reviewedBy: '' },
      },
    };
    expect(() => render(unsigned, 'verify_code', 'en', VARS)).toThrow(UnsendableError);
  });
});

describe('rendering a reviewed message', () => {
  it.each(Object.keys(REVIEWED.templates))('%s renders in both languages inside the limit', (key) => {
    for (const locale of ['en', 'es'] as const) {
      const body = render(REVIEWED, key, locale, VARS);
      expect(body.startsWith('PAM: ')).toBe(true);
      expect(body.length).toBeLessThanOrEqual(160);
      expect(body).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
    }
  });

  it('turns a reason key into the member’s own language', () => {
    const en = render(REVIEWED, 'saved_place_closed', 'en', { reason_key: 'moved', link: 'https://pam.to/a' });
    const es = render(REVIEWED, 'saved_place_closed', 'es', { reason_key: 'moved', link: 'https://pam.to/a' });
    expect(en).toContain(SERVICE_FLAG_REASONS.moved.en);
    expect(es).toContain(SERVICE_FLAG_REASONS.moved.es);
    // And never the name of the place (D-076 / migration 0037).
    expect(en).not.toMatch(/\{place\}/);
  });

  it('refuses a reason key it does not recognise rather than sending a gap', () => {
    expect(() =>
      render(REVIEWED, 'saved_place_closed', 'en', { reason_key: 'burned_down', link: 'https://pam.to/a' }),
    ).toThrow(UnsendableError);
  });

  it('refuses a missing variable rather than texting a placeholder', () => {
    expect(() => render(REVIEWED, 'appointment_24h', 'en', { time: '10:00 AM' })).toThrow(
      UnsendableError,
    );
  });

  it('adds the way out to a first message from a number nobody knows', () => {
    expect(render(REVIEWED, 'invite_member', 'en', VARS)).toContain('Reply STOP');
    expect(render(REVIEWED, 'invite_member', 'es', VARS)).toContain('STOP');
  });

  it('falls back to English for a language PAM does not speak', () => {
    expect(localeOf('pt')).toBe('en');
    expect(localeOf(null)).toBe('en');
    expect(localeOf('es')).toBe('es');
  });
});

describe('the last safety check', () => {
  it('stops a message that would reveal justice involvement', () => {
    expect(() => assertSafe('PAM: Your parole meeting is at 10am.')).toThrow(UnsendableError);
    expect(() => assertSafe('PAM: Your case manager sent a note.')).toThrow(UnsendableError);
  });

  it('never quotes the offending words back into a log line', () => {
    // A failure reason is written to the database and read by staff. Repeating
    // the word there is the same disclosure somewhere else.
    try {
      assertSafe('PAM: Your probation officer called.');
      throw new Error('should have thrown');
    } catch (error) {
      expect((error as Error).message).not.toMatch(/probation/i);
    }
  });

  it('stops emoji, an unbranded message, and an over-long one', () => {
    expect(() => assertSafe('PAM: Nice work! \u{1F389}')).toThrow(UnsendableError);
    expect(() => assertSafe('You have a visit tomorrow.')).toThrow(UnsendableError);
    expect(() => assertSafe(`PAM: ${'a'.repeat(200)}`)).toThrow(UnsendableError);
  });
});
