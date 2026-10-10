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
  segmentLimitFor,
  usableSmsLocale,
  unsignedSmsDrafts,
  smsTermHits,
  STOP_SUFFIX,
  SMS_MAX_LENGTH_UCS2,
  SMS_MAX_LENGTH_UCS2_TWO_SEGMENTS,
  SMS_WORST_CASE_LINK_LENGTH,
  APPROVED_TO_LEARN_FROM,
  APPROVED_TO_LEARN_FROM_ALERTS,
  type MoreLocale,
  type SmsTemplate,
  type SmsTemplateKey,
} from '../src/sms-templates.js';
import { SUPPORTED_LOCALES, type Locale } from '../src/i18n.js';

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

/**
 * Templates that may stand unsigned. The four Text alerts texts were here from
 * 10 October 2026 until Will approved them the same day ("Text alerts:
 * approved"). Listing a template here is the only way one may stand unsigned: a
 * template that loses its name, or a new one added without being listed, fails
 * the test below. Signing one means removing it from this list in the same
 * commit.
 */
const AWAITING_SIGNATURE: SmsTemplateKey[] = [];
/** The four Text alerts texts, approved by Will on 10 October 2026. */
const ALERT_KEYS: SmsTemplateKey[] = ['message_waiting', 'visit_booked', 'booking_changed', 'trip_planned'];

describe('SMS templates', () => {
  it('has a human recorded against every template', () => {
    // Flipped on 13 September 2026: Will read all thirteen and approved them.
    // The test stays, pointing the other way — a template that loses its name,
    // or a new one added without one, stops the whole catalogue from sending
    // and should fail here first.
    expect(unreviewedTemplateKeys().sort()).toEqual([...AWAITING_SIGNATURE].sort());
    for (const key of keys.filter((k) => !AWAITING_SIGNATURE.includes(k))) expect(SMS_TEMPLATES[key].reviewedBy).not.toBe('');
    // ...and while unsigned, none of them renders, in any language.
    for (const key of AWAITING_SIGNATURE) {
      for (const locale of SUPPORTED_LOCALES) {
        expect(() => renderSms({ key, locale, vars: WORST_CASE_VARS }), `${key} ${locale}`).toThrow(UnreviewedTemplateError);
      }
    }
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
      expect(unreviewedTemplateKeys().sort()).toEqual(['invite_member', ...AWAITING_SIGNATURE].sort());
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
    expect(() => assertSmsIsSafe('Pam: Your parole meeting is at 10am.')).toThrow(SmsContentError);
    expect(() => assertSmsIsSafe('Pam: Check in with your probation officer.')).toThrow(
      SmsContentError,
    );
    expect(() => assertSmsIsSafe('Pam: Your case manager sent a note.')).toThrow(SmsContentError);
  });

  it('rejects a message without the Pam prefix', () => {
    expect(() => assertSmsIsSafe('You have a visit tomorrow.')).toThrow(SmsContentError);
  });

  it('rejects emoji', () => {
    expect(() => assertSmsIsSafe('Pam: Nice work! 🎉')).toThrow(SmsContentError);
  });

  it('rejects an over-length message', () => {
    expect(() => assertSmsIsSafe('Pam: ' + 'a'.repeat(SMS_MAX_LENGTH))).toThrow(SmsContentError);
  });

  it('accepts a compliant message', () => {
    expect(() => assertSmsIsSafe('Pam: You have a visit tomorrow at 10:00 AM.')).not.toThrow();
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


/**
 * Texts in the newer languages (A24).
 *
 * Every wording below is a draft: nobody who reads the language has signed it,
 * so none of it may reach a phone. What these tests hold is everything short of
 * the signature — that each draft would be safe to send the moment a person
 * signs it — and that, until then, the person is texted in English.
 */
const MORE_LOCALES = SUPPORTED_LOCALES.filter((l): l is MoreLocale => l !== 'en' && l !== 'es');

/** The longest phrase for why a place came out, in `locale`, as a message would carry it. */
function longestReason(locale: Locale): string {
  const phrases = SERVICE_FLAG_REASON_KEYS.map((k) => (SERVICE_FLAG_REASONS[k] as Record<string, string>)[locale] ?? '');
  return phrases.reduce((a, b) => (b.length > a.length ? b : a), '');
}

/** The link a worst-case text carries: the live app_url for the scripts with only 70 characters. */
function varsFor(locale: Locale): Record<string, string> {
  const gsm = locale === 'en' || locale === 'es' || locale === 'pt-BR';
  return {
    ...WORST_CASE_VARS,
    link: gsm ? WORST_CASE_VARS['link']! : 'https://web-ten-umber-88.vercel.app/',
    supportPhone: '+12673095265',
    adminFirstName: 'Maximilianoo',
    reason: longestReason(locale),
  };
}

const drafts = keys.flatMap((key) =>
  MORE_LOCALES.flatMap((locale) => {
    const draft = SMS_TEMPLATES[key].more?.[locale];
    return draft ? [{ key, locale, draft }] : [];
  }),
);

describe('texts in the newer languages', () => {
  it('has a draft for most of the catalogue, and says which it does not', () => {
    // A template with no text in a language is one that does not fit a single
    // message in it. That is a finding to look at, not a number to protect, but
    // a sudden drop would mean somebody deleted drafts to make a test pass.
    expect(drafts.length).toBeGreaterThanOrEqual(50);
    for (const locale of MORE_LOCALES) {
      expect(drafts.filter((d) => d.locale === locale).length, locale).toBeGreaterThanOrEqual(5);
    }
  });

  it('carries Will’s approval on every draft, worded for what it is', () => {
    // 9 October 2026: "approve new languages for now ... fail first then fix it ...
    // adjust languages based on feedback." The wording says so plainly: approved to
    // learn from, no native reader yet. Nothing else has signed them.
    expect(APPROVED_TO_LEARN_FROM).toMatch(/^Will \(Oba\), 9 October 2026/);
    expect(APPROVED_TO_LEARN_FROM).toContain('no native reader yet');
    // The four Text alerts texts carry the same words, dated the day Will approved them.
    for (const { key, locale, draft } of drafts.filter((d) => !AWAITING_SIGNATURE.includes(d.key))) {
      expect(draft.reviewedBy, `${key} (${locale})`).toBe(ALERT_KEYS.includes(key) ? APPROVED_TO_LEARN_FROM_ALERTS : APPROVED_TO_LEARN_FROM);
    }
    expect(APPROVED_TO_LEARN_FROM_ALERTS).toMatch(/^Will \(Oba\), 10 October 2026/);
    expect(APPROVED_TO_LEARN_FROM_ALERTS).toContain('no native reader yet');
    for (const key of ALERT_KEYS) expect(SMS_TEMPLATES[key].reviewedBy, key).toBe('Will (Oba), 10 October 2026');
    for (const { key, draft } of drafts.filter((d) => AWAITING_SIGNATURE.includes(d.key))) {
      expect(draft.reviewedBy, key).toBe('');
    }
    expect(unsignedSmsDrafts().every((d) => AWAITING_SIGNATURE.includes(d.key))).toBe(true);
  });

  it('takes a language back to English the moment its approval is emptied — for every draft', () => {
    // The brake. Emptying the approval is how a language is pulled after feedback.
    const catalogue = SMS_TEMPLATES as Record<string, SmsTemplate>;
    for (const { key, locale } of drafts) {
      const original = catalogue[key]!;
      catalogue[key] = { ...original, more: { ...original.more, [locale]: { ...original.more![locale]!, reviewedBy: '' } } };
      try {
        expect(usableSmsLocale(key, locale), `${key} (${locale})`).toBe('en');
        expect(() => renderSms({ key, locale, vars: varsFor(locale) })).toThrow(UnreviewedTemplateError);
      } finally {
        catalogue[key] = original;
      }
    }
  });

  it('uses a language while it carries an approval, and only that one', () => {
    const catalogue = SMS_TEMPLATES as Record<string, SmsTemplate>;
    const original = catalogue['verify_code']!;
    catalogue['verify_code'] = {
      ...original,
      more: { ...original.more, ru: { ...original.more!['ru']!, reviewedBy: '' } },
    };
    try {
      expect(usableSmsLocale('verify_code', 'ru')).toBe('en');
      expect(usableSmsLocale('verify_code', 'ar')).toBe('ar');
    } finally {
      catalogue['verify_code'] = original;
    }
    expect(usableSmsLocale('verify_code', 'ru')).toBe('ru');
    expect(renderSms({ key: 'verify_code', locale: 'ru', vars: varsFor('ru') })).toContain('Ваш код');
  });

  it('gives the three appointment reminders two segments, and nothing else', () => {
    // Will, 9 October 2026 (D-431): "allow two segments for those three reminders
    // only." Everything else in these scripts stays at one segment (70).
    const twoSegments = keys.filter((k) => SMS_TEMPLATES[k].ucs2Segments === 2);
    expect(twoSegments.sort()).toEqual(['appointment_24h', 'appointment_2h', 'appointment_morning_of']);
    expect(SMS_MAX_LENGTH_UCS2_TWO_SEGMENTS).toBe(134);
    // And each has a text in every script, now: nobody who reads one of them is
    // texted a reminder in English for want of room.
    for (const key of twoSegments) {
      for (const locale of ['zh-CN', 'zh-HK', 'ru', 'ar'] as const) {
        expect(SMS_TEMPLATES[key].more?.[locale], `${key} (${locale})`).toBeDefined();
        expect(usableSmsLocale(key, locale), `${key} (${locale})`).toBe(locale);
      }
    }
  });

  it('keeps the cheap encoding at one segment even for a template that has two', () => {
    // The allowance is for the wide encoding only: the English, Spanish and
    // Portuguese reminders are one 160-character message, as registered.
    expect(segmentLimitFor('Pam: Hello {time}', 2)).toBe(SMS_MAX_LENGTH);
    expect(segmentLimitFor('Pam: 您好 {time}', 2)).toBe(134);
    expect(segmentLimitFor('Pam: 您好 {time}', 1)).toBe(70);
  });

  it.each(['appointment_24h', 'appointment_2h', 'appointment_morning_of'] as const)(
    '%s fits two segments in every script with the longest time, address and link it can be sent with',
    (key) => {
      const template = SMS_TEMPLATES[key];
      for (const locale of ['zh-CN', 'zh-HK', 'ru', 'ar'] as const) {
        const draft = template.more![locale]!;
        // The variable budgets are the ceiling, not the typical value: an address
        // clipped at its budget, a ten-character time, and the live 36-character link.
        const budget = draft.maxVarLengths?.['address'] ?? template.maxVarLengths!['address']!;
        const body = renderSms({
          key,
          locale,
          vars: { time: '10:00 a.m.', address: 'x'.repeat(budget + 20), link: 'https://web-ten-umber-88.vercel.app/' },
        });
        expect(body.length, `${key} (${locale}): "${body}"`).toBeLessThanOrEqual(SMS_MAX_LENGTH_UCS2_TWO_SEGMENTS);
        // A little room is left over for a longer time than ten characters.
        expect(SMS_MAX_LENGTH_UCS2_TWO_SEGMENTS - body.length, `${key} (${locale})`).toBeGreaterThanOrEqual(8);
      }
    },
  );

  it('still falls back to English for a template with no text in the language at all', () => {
    // Any template that is not allowed two segments and cannot be said in 70
    // characters stays English on purpose. Removing a draft is how that is chosen.
    const catalogue = SMS_TEMPLATES as Record<string, SmsTemplate>;
    const original = catalogue['verify_code']!;
    const { ru: _ru, ...rest } = original.more!;
    catalogue['verify_code'] = { ...original, more: rest };
    try {
      expect(usableSmsLocale('verify_code', 'ru')).toBe('en');
    } finally {
      catalogue['verify_code'] = original;
    }
  });

  describe.each(drafts)('$key in $locale', ({ key, locale, draft }) => {
    const template = SMS_TEMPLATES[key];

    it('says the same things the English does, with the same placeholders', () => {
      const used = [...draft.body.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1] as string);
      expect([...new Set(used)].sort()).toEqual([...template.vars].sort());
    });

    it('starts with "Pam: " and has no emoji', () => {
      expect(draft.body.startsWith('Pam: ')).toBe(true);
      expect(() => renderSms({ key, locale, vars: varsFor(locale), allowUnreviewed: true })).not.toThrow();
    });

    it('fits one message when it is as long as it can get', () => {
      const wording = draft.body;
      // Longest form: with the STOP line, which a monthly reminder adds to anything.
      // In a script with only 70 characters it cannot ride on a message that
      // already carries a link — the reminder is a text of its own there — so
      // only the first-contact texts, which always carry it, are held to it.
      if (segmentLimitFor(wording, template.ucs2Segments) === SMS_MAX_LENGTH || template.isFirstContact) {
        const withStop = renderSms({ key, locale, vars: varsFor(locale), allowUnreviewed: true, includeStop: true });
        const limit = segmentLimitFor(wording + STOP_SUFFIX[locale], template.ucs2Segments);
        expect(withStop.length, `"${withStop}" is ${withStop.length} of ${limit}`).toBeLessThanOrEqual(limit);
      }
      // As sent, leave room: a link or a name a little longer than the one
      // measured must not turn a reminder into one that cannot send.
      const asSent = renderSms({ key, locale, vars: varsFor(locale), allowUnreviewed: true });
      const room = segmentLimitFor(wording + (template.isFirstContact ? STOP_SUFFIX[locale] : ''), template.ucs2Segments) - asSent.length;
      expect(room, `"${asSent}"`).toBeGreaterThanOrEqual(4);
    });
  });

  it.each(drafts.filter((d) => d.locale === 'pt-BR'))(
    'Portuguese $key stays in the cheap encoding, as the Spanish does',
    ({ draft }) => {
      expect(nonGsm7Characters(draft.body)).toEqual([]);
      expect(segmentLimitFor(draft.body)).toBe(160);
    },
  );

  it.each(drafts.filter((d) => d.locale !== 'pt-BR'))(
    '$locale $key is held to what its script and its template allow',
    ({ key, draft }) => {
      expect(isGsm7(draft.body.replace(/\{[a-zA-Z0-9_]+\}/g, '')), 'a script GSM-7 cannot carry').toBe(false);
      // 70 characters, or 134 for the reminders that were given two segments (D-431).
      const segments = SMS_TEMPLATES[key].ucs2Segments;
      expect(segmentLimitFor(draft.body, segments)).toBe(segments === 2 ? SMS_MAX_LENGTH_UCS2_TWO_SEGMENTS : SMS_MAX_LENGTH_UCS2);
    },
  );

  it('keeps the reply words the parser listens for, in every language', () => {
    for (const locale of MORE_LOCALES) {
      const body = SMS_TEMPLATES.attendance_check.more?.[locale]?.body ?? '';
      expect(body, locale).toContain('YES');
      expect(body, locale).toContain('NO');
    }
  });

  it('has the way out in every language, and STOP is still STOP', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(STOP_SUFFIX[locale], locale).toContain('STOP');
      for (const key of keys.filter((k) => SMS_TEMPLATES[k].isFirstContact)) {
        const wording = locale === 'en' || locale === 'es' ? SMS_TEMPLATES[key][locale] : SMS_TEMPLATES[key].more?.[locale]?.body;
        if (!wording) continue;
        const body = renderSms({ key, locale, vars: varsFor(locale), allowUnreviewed: true });
        expect(body.endsWith(STOP_SUFFIX[locale]), `${key} ${locale}`).toBe(true);
      }
    }
  });

  it('measures the link it was written against', () => {
    expect(varsFor('ru')['link']!.length).toBe(SMS_WORST_CASE_LINK_LENGTH);
    expect(varsFor('pt-BR')['link']!.length).toBe(22);
  });
});

describe('the reasons a place came out, in the newer languages', () => {
  it.each(SERVICE_FLAG_REASON_KEYS)('%s has a phrase wherever saved_place_closed has a text', (reason) => {
    for (const { locale } of drafts.filter((d) => d.key === 'saved_place_closed')) {
      const phrase = (SERVICE_FLAG_REASONS[reason] as Record<string, string>)[locale];
      expect(phrase, `${reason} in ${locale}`).toBeTruthy();
      // A fragment dropped into a sentence, never a sentence of its own.
      expect(phrase).not.toMatch(/[.!?。！？]$/);
    }
  });

  it('fits the message with the longest reason, in each language that has one', () => {
    for (const { locale } of drafts.filter((d) => d.key === 'saved_place_closed')) {
      for (const reason of SERVICE_FLAG_REASON_KEYS) {
        const phrase = (SERVICE_FLAG_REASONS[reason] as Record<string, string>)[locale]!;
        const body = renderSms({
          key: 'saved_place_closed',
          locale,
          vars: { ...varsFor(locale), reason: phrase },
          allowUnreviewed: true,
        });
        const limit = segmentLimitFor(SMS_TEMPLATES.saved_place_closed.more![locale]!.body);
        expect(body.length, `${locale} ${reason}`).toBeLessThanOrEqual(limit);
      }
    }
  });
});

describe('a text never reveals justice involvement, in any language it is written in', () => {
  // The lists used to be English only: a Spanish text saying "libertad
  // condicional" passed every check. Each language has its own now.
  it.each([
    ['es', 'Pam: Su reunion de libertad condicional es manana.'],
    ['es', 'Pam: Hable con su gestor de caso.'],
    ['pt-BR', 'Pam: Sua liberdade condicional comeca amanha.'],
    ['pt-BR', 'Pam: Sua reuniao na prisão é hoje.'],
    ['zh-CN', 'Pam: 您的假释会面在明天。'],
    ['zh-HK', 'Pam: 你的假釋面見在明日。'],
    ['zh-HK', 'Pam: 請聯絡你的個案經理。'],
    ['ru', 'Pam: Ваше условно-досрочное освобождение завтра.'],
    ['ar', 'Pam: موعد الإفراج المشروط غدا.'],
    ['ar', 'Pam: تواصل مع ضابط مراقبة السلوك.'],
  ] as const)('stops %s: %s', (locale, body) => {
    expect(smsTermHits(body, locale).length).toBeGreaterThan(0);
    expect(() => assertSmsIsSafe(body, undefined, locale, 160)).toThrow(SmsContentError);
  });

  it('catches an English word left in a translated text', () => {
    expect(() => assertSmsIsSafe('Pam: Su probation termina hoy.', undefined, 'es')).toThrow(SmsContentError);
  });

  it('reads past accents and marks: the texts are written without them on purpose', () => {
    expect(smsTermHits('Pam: Sua prisao termina hoje.', 'pt-BR')).not.toEqual([]);
    expect(smsTermHits('Pam: Sua prisão termina hoje.', 'pt-BR')).not.toEqual([]);
    expect(smsTermHits('Pam: Tu libertad condicional.', 'es')).not.toEqual([]);
  });

  it('does not flag ordinary words that happen to share letters', () => {
    expect(smsTermHits('Pam: Voce tem uma visita amanha as 10:00 AM. Toque para ver o caminho', 'pt-BR')).toEqual([]);
    expect(smsTermHits('Pam: Su visita es hoy a las 10:00 AM. Toque para llegar', 'es')).toEqual([]);
    expect(smsTermHits('Pam: Ссылка для входа: https://example.org', 'ru')).toEqual([]);
  });

  it('lets a text over its limit through the cheap encoding but not the other', () => {
    expect(() => assertSmsIsSafe('Pam: ' + 'a'.repeat(100), undefined, 'en', 160)).not.toThrow();
    expect(() => assertSmsIsSafe('Pam: ' + '字'.repeat(70), undefined, 'zh-CN', SMS_MAX_LENGTH_UCS2)).toThrow(SmsContentError);
  });

  it('keeps a plain English reminder at 160 even when a street name has a curly apostrophe', () => {
    // The limit follows the template's own words, not what an address contains:
    // a member's reminder must not be refused because of how their street is spelled.
    const body = renderSms({
      key: 'appointment_24h',
      locale: 'en',
      vars: { time: '10:00 AM', address: 'Rev. Dr. Martin’s Plaza', link: 'https://pam.to/a1b2c3d' },
      allowUnreviewed: true,
    });
    expect(body.length).toBeLessThanOrEqual(SMS_MAX_LENGTH);
  });
});

describe('the text that approves a program lead (D-496)', () => {
  // A lead with no program yet is sent to Add your program on the live app: the longest link this text carries.
  const LINK = 'https://app.joinpam.org/programs/new/';

  it.each(['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'] as const)('fits one message in %s with that link', (locale) => {
    const body = renderSms({ key: 'staff_request_approved', locale, vars: { link: LINK }, allowUnreviewed: true });
    const gsm = locale === 'en' || locale === 'es' || locale === 'pt-BR';
    expect(body.length, `"${body}" is ${body.length} chars`).toBeLessThanOrEqual(gsm ? SMS_MAX_LENGTH : SMS_MAX_LENGTH_UCS2);
    expect(body).toContain(LINK);
  });
});
