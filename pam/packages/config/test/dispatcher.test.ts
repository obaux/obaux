import { describe, expect, it } from 'vitest';
import bundle from '../../../supabase/functions/dispatch-sms/templates.json';
import {
  render,
  assertSafe,
  localeOf,
  UnsendableError,
  type Bundle,
} from '../../../supabase/functions/dispatch-sms/render.ts';
import {
  SMS_TEMPLATES,
  SERVICE_FLAG_REASONS,
  STOP_SUFFIX,
  renderSms,
  type SmsTemplateKey,
} from '../src/sms-templates.js';
import { SUPPORTED_LOCALES, type Locale } from '../src/i18n.js';

/**
 * The dispatcher is the last thing between a queued row and somebody's phone.
 * These tests run the real renderer against the real bundle, so a template
 * whose copy nobody signed off cannot send, and a bundle that has drifted from
 * the reviewed source fails here rather than in a text message.
 */
const REAL = bundle as unknown as Bundle;

/** The same bundle with every template signed off, to test what happens after. */
const REVIEWED: Bundle = {
  ...REAL,
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

/**
 * The four alert texts nobody has signed (10 October 2026). They are in the
 * bundle on purpose — the dispatcher refuses them, which is the point — and
 * these tests hold them to exactly that. `sms.test.ts` keeps the list honest.
 */
const AWAITING_SIGNATURE = [];
// (Empty since Will approved the four Text alerts texts on 10 October 2026; kept so a template may be added unsigned on purpose.)
const signedKeys = (templates: Record<string, unknown>) => Object.keys(templates).filter((k) => !AWAITING_SIGNATURE.includes(k));

describe('the shipped bundle', () => {
  it('carries exactly the templates and reasons the reviewed source defines', () => {
    // The bundle is generated. If it drifts, the dispatcher is sending words
    // that were never reviewed, tested, or length-checked.
    expect(Object.keys(REAL.templates).sort()).toEqual(Object.keys(SMS_TEMPLATES).sort());
    expect(Object.keys(REAL.reasons).sort()).toEqual(Object.keys(SERVICE_FLAG_REASONS).sort());
    for (const [key, template] of Object.entries(REAL.templates)) {
      expect(template.en).toBe(SMS_TEMPLATES[key as keyof typeof SMS_TEMPLATES].en);
      expect(template.es).toBe(SMS_TEMPLATES[key as keyof typeof SMS_TEMPLATES].es);
      // The later languages, with who signed them: a bundle that is behind the
      // source would send a wording the source no longer has.
      expect(template.more ?? {}).toEqual(SMS_TEMPLATES[key as keyof typeof SMS_TEMPLATES].more ?? {});
    }
    expect(REAL.reasons).toEqual(JSON.parse(JSON.stringify(SERVICE_FLAG_REASONS)));
    expect(REAL.stop).toEqual(STOP_SUFFIX);
    expect(Object.keys(REAL.forbidden).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('carries the sign-off, so the dispatcher will actually send', () => {
    // Flipped on 13 September 2026, when Will approved the copy. The bundle is
    // generated from the reviewed source, so a name missing here means the
    // bundle is stale — and a stale bundle is how words nobody read reach a
    // phone.
    for (const template of Object.values(REAL.templates).filter((t) => !AWAITING_SIGNATURE.includes(t.key))) {
      expect(template.reviewedBy, `${template.key} has no name against it`).not.toBe('');
    }
    for (const key of signedKeys(REAL.templates)) {
      expect(() => render(REAL, key, 'en', VARS)).not.toThrow();
    }
    // The unsigned ones are refused, in every language, and say why.
    for (const key of AWAITING_SIGNATURE) {
      for (const locale of SUPPORTED_LOCALES) {
        expect(() => render(REAL, key, locale, VARS), `${key} ${locale}`).toThrow(/reviewedBy|signed off/);
      }
    }
  });

  it('still refuses a template whose name has been taken off', () => {
    // The gate itself, on a copy of the bundle. It has to keep working now that
    // the real catalogue no longer exercises it.
    const unsigned: Bundle = {
      ...REAL,
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
      expect(body.startsWith('Pam: ')).toBe(true);
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

  it('knows every language a member can pick, and falls back to English for the rest', () => {
    expect(localeOf('pt')).toBe('en');
    expect(localeOf(null)).toBe('en');
    expect(localeOf('es')).toBe('es');
    for (const code of SUPPORTED_LOCALES) expect(localeOf(code)).toBe(code);
  });
});

describe('a language is used while it carries an approval, and English when it does not', () => {
  // Will approved the later languages on 9 October 2026 to learn from (fail first,
  // then fix on feedback). Emptying a language's approval is how it is pulled: the
  // person is then texted in English, never in a draft.
  const keys = signedKeys(REAL.templates);
  const later = SUPPORTED_LOCALES.filter((l) => l !== 'en' && l !== 'es');

  /** The shipped bundle with every later-language approval emptied. */
  const WITHDRAWN: Bundle = {
    ...REAL,
    templates: Object.fromEntries(
      Object.entries(REAL.templates).map(([key, t]) => [
        key,
        { ...t, more: Object.fromEntries(Object.entries(t.more ?? {}).map(([l, d]) => [l, { ...d, reviewedBy: '' }])) },
      ]),
    ),
  };
  /** saved_place_closed asks for its reason by key, as the queue does. */
  const varsFor = (key: string) => (key === 'saved_place_closed' ? { link: 'https://pam.to/a1b2c3d', reason_key: 'closed' } : VARS);

  it('carries Will’s approval on every draft in the shipped bundle', () => {
    for (const template of Object.values(REAL.templates).filter((t) => !AWAITING_SIGNATURE.includes(t.key))) {
      for (const [locale, draft] of Object.entries(template.more ?? {})) {
        // 9 October for the first drafts; 10 October for the four Text alerts texts.
        expect(draft.reviewedBy, `${template.key} ${locale}`).toMatch(/^Will \(Oba\), (9|10) October 2026/);
      }
    }
  });

  it('writes the text in the person’s language wherever there is a wording, and in English where there is none', () => {
    let inTheirLanguage = 0;
    for (const key of keys) {
      for (const locale of later) {
        const body = render(REAL, key, locale, varsFor(key));
        const english = render(REAL, key, 'en', varsFor(key));
        if (REAL.templates[key]!.more?.[locale]) {
          expect(body, `${key} ${locale}`).not.toBe(english);
          expect(body.startsWith('Pam: ')).toBe(true);
          inTheirLanguage += 1;
        } else {
          expect(body, `${key} ${locale}`).toBe(english);
        }
      }
    }
    // 53, plus the three appointment reminders in the four scripts (D-431) = 65,
    // plus the four Text alerts texts in all five later languages (10 October) = 85.
    expect(inTheirLanguage).toBe(85);
  });

  it('writes every one in English once the approvals are emptied, for every template', () => {
    for (const key of keys) {
      for (const locale of later) {
        expect(render(WITHDRAWN, key, locale, varsFor(key)), `${key} ${locale}`).toBe(render(WITHDRAWN, key, 'en', varsFor(key)));
      }
    }
  });

  it('pulls one language and leaves the others', () => {
    const pulled: Bundle = {
      ...REAL,
      templates: {
        ...REAL.templates,
        verify_code: {
          ...REAL.templates['verify_code']!,
          more: { ...REAL.templates['verify_code']!.more, ru: { ...REAL.templates['verify_code']!.more!['ru']!, reviewedBy: '' } },
        },
      },
    };
    expect(render(pulled, 'verify_code', 'ru', VARS)).toBe(render(pulled, 'verify_code', 'en', VARS));
    expect(render(pulled, 'verify_code', 'ar', VARS)).toContain('رمزك');
  });

  it('falls back for the whole message when a reason has no phrase in the language', () => {
    const noPhrase: Bundle = {
      ...REAL,
      reasons: { ...REAL.reasons, closed: { en: REAL.reasons['closed']!['en']!, es: REAL.reasons['closed']!['es']! } },
    };
    const vars = { reason_key: 'closed', link: 'https://pam.to/a1b2c3d' };
    expect(render(noPhrase, 'saved_place_closed', 'zh-CN', vars)).toBe(render(noPhrase, 'saved_place_closed', 'en', vars));
    // And with the phrase present, the language is used.
    expect(render(REAL, 'saved_place_closed', 'zh-CN', vars)).toContain('已关闭');
  });
});

describe('the dispatcher and the config package say the same words', () => {
  // The dispatcher cannot import the config package, so it carries its own
  // renderer. This is what keeps the two from drifting: every template, in every
  // language it has a wording for, once signed, rendered both ways.
  const SIGNED: Bundle = {
    ...REAL,
    templates: Object.fromEntries(
      Object.entries(REAL.templates).map(([key, t]) => [
        key,
        {
          ...t,
          // Signed here only so the two renderers can be compared on every text, the unsigned ones included.
          reviewedBy: 'a test reader',
          more: Object.fromEntries(Object.entries(t.more ?? {}).map(([l, d]) => [l, { ...d, reviewedBy: 'a native reader' }])),
        },
      ]),
    ),
  };
  const varsFor = (locale: Locale): Record<string, string> => {
    const gsm = locale === 'en' || locale === 'es' || locale === 'pt-BR';
    return {
      link: gsm ? 'https://pam.to/a1b2c3d' : 'https://web-ten-umber-88.vercel.app/',
      code: '123456',
      adminFirstName: 'Cassandra',
      time: '10:00 AM',
      address: '18200 Northwest Martin Luther King Junior Memorial Boulevard',
      supportPhone: '+12673095265',
    };
  };

  it.each(Object.keys(SIGNED.templates))('%s', (key) => {
    for (const locale of SUPPORTED_LOCALES) {
      const template = SIGNED.templates[key]!;
      const has = locale === 'en' || locale === 'es' || template.more?.[locale];
      if (!has) continue;
      const base = varsFor(locale);
      const vars: Record<string, string> = key === 'saved_place_closed' ? { ...base, reason_key: 'moved' } : base;
      const configVars: Record<string, string> =
        key === 'saved_place_closed'
          ? { ...base, reason: (SERVICE_FLAG_REASONS.moved as Record<string, string>)[locale]! }
          : base;
      const fromDispatcher = render(SIGNED, key, locale, vars);
      const fromConfig = renderSms({ key: key as SmsTemplateKey, locale, vars: configVars, allowUnreviewed: true });
      expect(fromDispatcher, `${key} ${locale}`).toBe(fromConfig);
    }
  });

  it('holds a script with 70 characters to 70, and a Latin one to 160', () => {
    const long = {
      ...SIGNED,
      templates: {
        ...SIGNED.templates,
        verify_code: {
          ...SIGNED.templates['verify_code']!,
          more: { ru: { body: `Pam: ${'я'.repeat(70)}`, reviewedBy: 'a native reader' } },
        },
      },
    };
    // Over 70 in Russian: the check catches it (and says why), and the person is texted
    // in English instead of not at all.
    const why: string[] = [];
    expect(render(long, 'verify_code', 'ru', VARS, (r) => why.push(r))).toBe(render(long, 'verify_code', 'en', VARS));
    expect(why[0]).toMatch(/over the 70 limit/);
    // The same length in English is one cheap message.
    expect(render(long, 'verify_code', 'en', VARS).length).toBeLessThanOrEqual(160);
  });

  it('lets a template with two segments run to 134 in a wide script, and no further', () => {
    const withTwo = (body: string) => ({
      ...SIGNED,
      templates: {
        ...SIGNED.templates,
        verify_code: {
          ...SIGNED.templates['verify_code']!,
          ucs2Segments: 2 as const,
          more: { ru: { body, reviewedBy: 'a native reader' } },
        },
      },
    });
    // 5 for "Pam: " and 129 more: exactly two segments, sent in Russian.
    const exact = `Pam: ${'я'.repeat(129)}`;
    expect(exact.length).toBe(134);
    expect(render(withTwo(exact), 'verify_code', 'ru', VARS)).toBe(exact);
    // One character over: the person is texted in English, and the log says why.
    const why: string[] = [];
    const over = `${exact}я`;
    expect(render(withTwo(over), 'verify_code', 'ru', VARS, (r) => why.push(r))).toBe(
      render(withTwo(over), 'verify_code', 'en', VARS),
    );
    expect(why[0]).toMatch(/over the 134 limit/);
    // A template without the allowance stays at 70, however long its neighbour may run.
    const one = { ...withTwo(exact) };
    one.templates.verify_code = { ...one.templates.verify_code, ucs2Segments: undefined } as never;
    const why2: string[] = [];
    render(one, 'verify_code', 'ru', VARS, (r) => why2.push(r));
    expect(why2[0]).toMatch(/over the 70 limit/);
  });

  it('applies the language’s own forbidden words as the last check', () => {
    const bad = {
      ...SIGNED,
      templates: {
        ...SIGNED.templates,
        verify_code: {
          ...SIGNED.templates['verify_code']!,
          more: {
            ru: { body: 'Pam: Условно-досрочное {code}', reviewedBy: 'a native reader' },
            'zh-CN': { body: 'Pam: 假释 {code}', reviewedBy: 'a native reader' },
          },
        },
      },
    };
    // Each is caught, named without quoting the word, and the person is texted in English.
    for (const locale of ['ru', 'zh-CN'] as const) {
      const why: string[] = [];
      expect(render(bad, 'verify_code', locale, VARS, (r) => why.push(r)), locale).toBe(render(bad, 'verify_code', 'en', VARS));
      expect(why, locale).toEqual(['message would reveal justice involvement']);
    }
    // And the check itself, on the words, still refuses them.
    expect(() => assertSafe('Pam: Условно-досрочное 123456', 'ru', REAL.forbidden)).toThrow(UnsendableError);
    expect(() => assertSafe('Pam: 假释 123456', 'zh-CN', REAL.forbidden)).toThrow('reveal justice involvement');
  });

  it('keeps a plain English reminder at 160 when the address has a curly apostrophe', () => {
    const body = render(SIGNED, 'appointment_24h', 'en', { ...varsFor('en'), address: 'Rev. Dr. Martin’s Plaza' });
    expect(body.length).toBeLessThanOrEqual(160);
  });
});

describe('the last safety check', () => {
  it('stops a message that would reveal justice involvement', () => {
    expect(() => assertSafe('Pam: Your parole meeting is at 10am.')).toThrow(UnsendableError);
    expect(() => assertSafe('Pam: Your case manager sent a note.')).toThrow(UnsendableError);
  });

  it('never quotes the offending words back into a log line', () => {
    // A failure reason is written to the database and read by staff. Repeating
    // the word there is the same disclosure somewhere else.
    try {
      assertSafe('Pam: Your probation officer called.');
      throw new Error('should have thrown');
    } catch (error) {
      expect((error as Error).message).not.toMatch(/probation/i);
    }
  });

  it('stops emoji, an unbranded message, and an over-long one', () => {
    expect(() => assertSafe('Pam: Nice work! \u{1F389}')).toThrow(UnsendableError);
    expect(() => assertSafe('You have a visit tomorrow.')).toThrow(UnsendableError);
    expect(() => assertSafe(`Pam: ${'a'.repeat(200)}`)).toThrow(UnsendableError);
  });
});

describe('a signed language never stops a text from going out', () => {
  // Signing a language off decides which language the person is texted in. It
  // is never a reason for them not to be texted: if the wording in their
  // language cannot be sent safely at the moment of sending, the English goes.
  const sign = (bundle: Bundle, key: string, locale: Locale, body?: string): Bundle => ({
    ...bundle,
    templates: {
      ...bundle.templates,
      [key]: {
        ...bundle.templates[key]!,
        more: {
          ...bundle.templates[key]!.more,
          [locale]: { ...bundle.templates[key]!.more![locale]!, ...(body ? { body } : {}), reviewedBy: 'Will, a test' },
        },
      },
    },
  });

  it('sends the English when the signed wording is too long for its segment', () => {
    const signed = sign(REAL, 'staff_request_approved', 'zh-CN');
    const why: string[] = [];
    // A link much longer than the 36 characters the wording was written for.
    const vars = { ...VARS, link: `https://pam.example.org/${'x'.repeat(60)}` };
    const body = render(signed, 'staff_request_approved', 'zh-CN', vars, (r) => why.push(r));
    expect(body).toBe(render(REAL, 'staff_request_approved', 'en', vars));
    expect(why).toHaveLength(1);
    expect(why[0]).toMatch(/characters, over the 70 limit/);
  });

  it('sends the English when the signed wording trips a word list, and does not quote the word', () => {
    const signed = sign(REAL, 'verify_code', 'ru', 'Pam: Условно-досрочное {code}');
    const why: string[] = [];
    const body = render(signed, 'verify_code', 'ru', VARS, (r) => why.push(r));
    expect(body).toBe(render(REAL, 'verify_code', 'en', VARS));
    expect(why.join()).toBe('message would reveal justice involvement');
  });

  it('does the same for a signed Spanish text that has gone wrong', () => {
    const broken: Bundle = {
      ...REAL,
      templates: { ...REAL.templates, verify_code: { ...REAL.templates['verify_code']!, es: `Pam: ${'a'.repeat(200)} {code}` } },
    };
    const why: string[] = [];
    expect(render(broken, 'verify_code', 'es', VARS, (r) => why.push(r))).toBe(render(REAL, 'verify_code', 'en', VARS));
    expect(why).toHaveLength(1);
  });

  it('says nothing when the person’s language worked, and when it was English to begin with', () => {
    const signed = sign(REAL, 'verify_code', 'ru');
    const why: string[] = [];
    expect(render(signed, 'verify_code', 'ru', VARS, (r) => why.push(r))).toContain('Ваш код');
    render(REAL, 'verify_code', 'en', VARS, (r) => why.push(r));
    expect(why).toEqual([]);
  });

  it('still throws when English cannot be sent either: nothing to say is not a text', () => {
    const signed = sign(REAL, 'appointment_24h', 'pt-BR');
    expect(() => render(signed, 'appointment_24h', 'pt-BR', { time: '10:00 AM' })).toThrow(UnsendableError);
    expect(() => render(REAL, 'no_such_template', 'ru', VARS)).toThrow(UnsendableError);
  });
});
