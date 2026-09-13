import { describe, expect, it } from 'vitest';
import {
  SMS_TEMPLATES,
  SMS_MAX_LENGTH,
  renderSms,
  assertSmsIsSafe,
  UnreviewedTemplateError,
  isGsm7,
  nonGsm7Characters,
  SERVICE_FLAG_REASONS,
  SERVICE_FLAG_REASON_KEYS,
  SmsContentError,
  unreviewedTemplateKeys,
  shortenToFit,
  type SmsTemplate,
  type SmsTemplateKey,
} from '../src/sms-templates.js';

/**
 * Realistic worst-case values. The link length matches a Twilio-shortened
 * https://pam.to/xxxxxxx URL, and the address is a long real-world one, so the
 * length assertion reflects what actually goes out rather than a happy path.
 */
const WORST_CASE_VARS: Readonly<Record<string, string>> = {
  link: 'https://pam.to/a1b2c3d',
  code: '123456',
  adminFirstName: 'Cassandra',
  time: '10:00 AM',
  address: '1234 Martin Luther King Jr Blvd',
  supportPhone: '555-555-0134',
  // A real imported name, at the length where the budget starts clipping it.
  // The longest reason phrase, so the length assertion sees the worst case.
  reason: 'not taking new people, so there is no need to go',
};

const keys = Object.keys(SMS_TEMPLATES) as SmsTemplateKey[];

describe('SMS templates', () => {
  it('has a human recorded against every template', () => {
    // Flipped on 13 September 2026: Will read all thirteen and approved them.
    // The test stays, pointing the other way — a template that loses its name,
    // or a new one added without one, stops the whole catalogue from sending
    // and should fail here first.
    expect(unreviewedTemplateKeys()).toEqual([]);
    for (const key of keys) expect(SMS_TEMPLATES[key].reviewedBy).not.toBe('');
  });

  it('still refuses to render a template whose name has been taken off', () => {
    // The gate is what keeps unread copy off somebody's phone, so it is tested
    // against the real catalogue rather than trusted because it once worked.
    // Readonly is a compile-time promise, so the entry is swapped and restored.
    const catalogue = SMS_TEMPLATES as Record<string, SmsTemplate>;
    const signed = catalogue['invite_member']!;
    catalogue['invite_member'] = { ...signed, reviewedBy: '' };
    try {
      expect(() =>
        renderSms({ key: 'invite_member', locale: 'en', vars: WORST_CASE_VARS }),
      ).toThrow(UnreviewedTemplateError);
      expect(unreviewedTemplateKeys()).toEqual(['invite_member']);
    } finally {
      catalogue['invite_member'] = signed;
    }
  });

  describe.each(keys)('%s', (key) => {
    const template = SMS_TEMPLATES[key];

    it.each(['en', 'es'] as const)('fits in %s within the 160 character limit', (locale) => {
      const body = renderSms({
        key,
        locale,
        vars: WORST_CASE_VARS,
        allowUnreviewed: true,
        // Force the STOP suffix to measure the longest form this can take.
        includeStop: true,
      });
      expect(body.length, `"${body}" is ${body.length} chars`).toBeLessThanOrEqual(SMS_MAX_LENGTH);
    });

    it.each(['en', 'es'] as const)('passes the %s safety gate', (locale) => {
      expect(() =>
        renderSms({ key, locale, vars: WORST_CASE_VARS, allowUnreviewed: true }),
      ).not.toThrow();
    });

    it('declares every placeholder it uses', () => {
      const used = new Set(
        [...template.en.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1] as string),
      );
      const usedEs = new Set(
        [...template.es.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1] as string),
      );
      expect([...used].sort()).toEqual([...template.vars].sort());
      expect([...usedEs].sort()).toEqual([...template.vars].sort());
    });
  });

  it('throws when a required variable is missing', () => {
    expect(() =>
      renderSms({ key: 'appointment_24h', locale: 'en', vars: { time: '10:00 AM' }, allowUnreviewed: true }),
    ).toThrow(SmsContentError);
  });

  it('adds the STOP instruction to first-contact messages', () => {
    const body = renderSms({ key: 'invite_member', locale: 'en', vars: WORST_CASE_VARS, allowUnreviewed: true });
    expect(body).toContain('Reply STOP to stop texts.');
  });
});

describe('assertSmsIsSafe', () => {
  it('rejects a message that reveals justice involvement', () => {
    expect(() => assertSmsIsSafe('PAM: Your parole meeting is at 10am.')).toThrow(SmsContentError);
    expect(() => assertSmsIsSafe('PAM: Check in with your probation officer.')).toThrow(
      SmsContentError,
    );
    expect(() => assertSmsIsSafe('PAM: Your case manager sent a note.')).toThrow(SmsContentError);
  });

  it('rejects a message without the PAM prefix', () => {
    expect(() => assertSmsIsSafe('You have a visit tomorrow.')).toThrow(SmsContentError);
  });

  it('rejects emoji', () => {
    expect(() => assertSmsIsSafe('PAM: Nice work! 🎉')).toThrow(SmsContentError);
  });

  it('rejects an over-length message', () => {
    expect(() => assertSmsIsSafe('PAM: ' + 'a'.repeat(SMS_MAX_LENGTH))).toThrow(SmsContentError);
  });

  it('accepts a compliant message', () => {
    expect(() => assertSmsIsSafe('PAM: You have a visit tomorrow at 10:00 AM.')).not.toThrow();
  });
});

describe('long real-world values', () => {
  /**
   * Regression guard. Spanish `appointment_24h` renders at 159/160 with a
   * 31-character address, so an ordinary longer address used to push the body
   * over the limit and make renderSms throw — silently killing the reminder.
   */
  it('shortens an over-long address instead of failing to send', () => {
    const body = renderSms({
      key: 'appointment_24h',
      locale: 'es',
      vars: {
        time: '10:00 AM',
        address: '18200 Northwest Martin Luther King Junior Memorial Boulevard, Suite 1400',
        link: 'https://pam.to/a1b2c3d',
      },
      allowUnreviewed: true,
      includeStop: true,
    });
    expect(body.length).toBeLessThanOrEqual(SMS_MAX_LENGTH);
    expect(body).toContain('https://pam.to/a1b2c3d');
    // The member still gets enough of the address to recognise the place.
    expect(body).toContain('18200 Northwest Martin');
  });

  it('cuts at a word boundary rather than mid-word', () => {
    expect(shortenToFit('1234 Martin Luther King Junior Boulevard', 20)).toBe('1234 Martin Luther');
  });

  it('leaves a short value untouched', () => {
    expect(shortenToFit('123 Main St', 34)).toBe('123 Main St');
  });
});

describe('every message fits the cheap encoding', () => {
  // One character outside GSM-7 halves the limit from 160 to 70 and splits one
  // message into two — a doubled bill on every reminder. The Spanish copy is
  // written without accents for this reason, and this is what keeps it that way
  // when somebody helpfully "corrects" it.
  it.each(Object.values(SMS_TEMPLATES))('$key stays in GSM-7', (template) => {
    expect(nonGsm7Characters(template.en)).toEqual([]);
    expect(nonGsm7Characters(template.es)).toEqual([]);
  });

  it('allows the characters that are free, and only those', () => {
    // ñ is in the basic set, so "mañana" is spelled correctly at no cost.
    expect(isGsm7('mañana')).toBe(true);
    // These are not, and would double the cost of the message carrying them.
    expect(nonGsm7Characters('código')).toEqual(['ó']);
    expect(nonGsm7Characters('página')).toEqual(['á']);
    expect(isGsm7('sí')).toBe(false);
  });

  it('keeps the reply words the parser listens for', () => {
    // Will's call: the Spanish check-in keeps YES and NO, because those are the
    // words the reply parser matches. Changing the copy without changing the
    // parser would silently drop every Spanish reply.
    expect(SMS_TEMPLATES.attendance_check.es).toContain('YES');
    expect(SMS_TEMPLATES.attendance_check.es).toContain('NO');
  });
});


describe('why a place came out of the catalogue', () => {
  // These phrases end up inside a text message, so they are subject to every
  // §9 rule and belong in the same review pass as the templates.
  it.each(SERVICE_FLAG_REASON_KEYS)('%s reads as plain language in both languages', (key) => {
    const reason = SERVICE_FLAG_REASONS[key];
    for (const phrase of [reason.en, reason.es]) {
      expect(phrase.length).toBeGreaterThan(0);
      expect(nonGsm7Characters(phrase)).toEqual([]);
      // A reason is a fragment dropped into a sentence, not a sentence.
      expect(phrase).not.toMatch(/[.!?]$/);
      expect(phrase[0]).toBe(phrase[0]?.toLowerCase());
    }
  });

  it('never says why in words that blame the place or the reader', () => {
    // A flag means somebody reported the place as gone. It is not a review, and
    // a verdict on an organisation does not belong in a member's messages.
    for (const key of SERVICE_FLAG_REASON_KEYS) {
      const { en, es } = SERVICE_FLAG_REASONS[key];
      expect(`${en} ${es}`.toLowerCase()).not.toMatch(/useless|not useful|bad|poor|inutil|malo/);
    }
  });

  it('fits the message with the longest reason', () => {
    const longest = SERVICE_FLAG_REASON_KEYS.map((k) => SERVICE_FLAG_REASONS[k]);
    for (const locale of ['en', 'es'] as const) {
      for (const reason of longest) {
        const body = renderSms({
          key: 'saved_place_closed',
          locale,
          vars: { ...WORST_CASE_VARS, reason: reason[locale] },
          allowUnreviewed: true,
        });
        expect(body.length).toBeLessThanOrEqual(SMS_MAX_LENGTH);
      }
    }
  });
});
