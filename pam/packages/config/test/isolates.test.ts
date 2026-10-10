import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_LOCALES,
  directionOf,
  fillTemplate,
  isolate,
  pickTemplate,
  splitIsolated,
  stripIsolates,
  type Locale,
  type TextVars,
} from '../src/i18n.js';
import { SMS_TEMPLATES, renderSms, type SmsTemplateKey } from '../src/sms-templates.js';
import { renderInviteEmail } from '../src/invite-email.js';
import { BUNDLES, EN, placeholders } from './_bundles.js';

/**
 * A name or an address in another script, inside an Arabic sentence (D-435).
 * The browser lays a line of mixed text out as one stream, so an English
 * address came out as "St, North Philadelphia 1231 بالقرب من": the number
 * beside the Arabic words, the rest of the address on the far side. Each text
 * value is wrapped in FIRST STRONG ISOLATE … POP DIRECTIONAL ISOLATE so it is
 * laid out as a piece of its own.
 */
const FSI = '⁨';
const PDI = '⁩';
const ADDRESS = '1231 N Broad St, North Philadelphia';
const ISOLATE_CHARS = /[⁦-⁩]/;

const AR = BUNDLES.ar;
const fillAr = (key: string, vars: TextVars) => fillTemplate(pickTemplate('ar', AR, EN, key, vars), vars, 'rtl');

describe('isolate', () => {
  it('wraps a value once, in the first-strong pair', () => {
    expect(isolate('Ana')).toBe(`${FSI}Ana${PDI}`);
    expect(isolate(ADDRESS)).toBe(`${FSI}${ADDRESS}${PDI}`);
  });

  it('leaves an empty value empty, so an optional piece that is not there leaves no trace', () => {
    expect(isolate('')).toBe('');
  });

  it('keeps an isolate the value itself opened and closed (a sentence built from one)', () => {
    expect(isolate(`x${FSI}y${PDI}z`)).toBe(`${FSI}x${FSI}y${PDI}z${PDI}`);
  });

  it('cannot be closed early, or left open, by what is inside it', () => {
    // A stray close would pair with ours and release the rest of the sentence.
    expect(isolate(`a${PDI}b`)).toBe(`${FSI}ab${PDI}`);
    // An open that is never closed would take our close instead.
    expect(isolate('a⁧b')).toBe(`${FSI}a⁧b${PDI}${PDI}`);
  });
});

describe('stripIsolates', () => {
  it('takes out what isolate puts in, and only that', () => {
    expect(stripIsolates(isolate(ADDRESS))).toBe(ADDRESS);
    expect(stripIsolates(fillAr('places.near', { area: ADDRESS }))).toBe(AR['places.near']!.replace('{area}', ADDRESS));
    // Marks a translator or a name may carry on purpose are left where they are.
    expect(stripIsolates('a‎b‏c؜d')).toBe('a‎b‏c؜d');
  });
});

describe('splitIsolated', () => {
  it('separates the words of the sentence from the values written into it, in order', () => {
    expect(splitIsolated(fillAr('places.near', { area: ADDRESS }))).toEqual([
      { text: 'بالقرب من ', isValue: false },
      { text: ADDRESS, isValue: true },
    ]);
    expect(splitIsolated(fillAr('messages.thread.from', { name: 'Marcus Johnson', time: '3:45 PM' }))).toEqual([
      { text: 'Marcus Johnson', isValue: true },
      { text: ', ', isValue: false },
      { text: '3:45 PM', isValue: true },
    ]);
  });

  it('gives a text with no isolates back as one piece of words, and nothing as nothing', () => {
    expect(splitIsolated('Near City Hall')).toEqual([{ text: 'Near City Hall', isValue: false }]);
    expect(splitIsolated('')).toEqual([]);
  });

  it('keeps an isolate inside a value in the value, and joins back to what it was given', () => {
    const inner = fillAr('places.near', { area: ADDRESS });
    const outer = fillAr('places.changeArea', { area: inner });
    const pieces = splitIsolated(outer);
    expect(pieces.map((p) => p.isValue)).toEqual([false, true]);
    expect(pieces[1]!.text).toBe(inner);
    // Taking the pieces out of an isolate and putting them back is the identity.
    expect(pieces.map((p) => (p.isValue ? isolate(p.text) : p.text)).join('')).toBe(outer);
  });

  it('does not mistake a value that was never closed for words', () => {
    expect(splitIsolated(`a ${FSI}b`)).toEqual([
      { text: 'a ', isValue: false },
      { text: 'b', isValue: true },
    ]);
  });
});

describe('an Arabic sentence with a left-to-right value in it', () => {
  it('lays an address out as its own piece (the 9 October audit: places.near)', () => {
    const out = fillAr('places.near', { area: ADDRESS });
    expect(out).toBe(`بالقرب من ${FSI}${ADDRESS}${PDI}`);
  });

  it('keeps a leading number with the rest of its address, not with the Arabic beside it', () => {
    const out = fillAr('places.near', { area: ADDRESS });
    // Everything that reads left to right is inside the pair; outside it there is only Arabic and spaces.
    const outside = out.replace(new RegExp(`${FSI}[^${PDI}]*${PDI}`, 'g'), '');
    expect(outside).not.toMatch(/[0-9A-Za-z]/);
    expect(out.slice(out.indexOf(FSI) + 1)).toMatch(/^1231 N Broad St/);
  });

  it('does the same for a name, a file name and a number-first name', () => {
    for (const value of ['Marcus Johnson', 'resume_final.pdf', '3rd Street Clinic', '911 Hotline', 'Philadelphia Works, Inc.']) {
      expect(fillAr('places.near', { area: value }), value).toBe(`بالقرب من ${FSI}${value}${PDI}`);
    }
  });

  it('wraps an Arabic value too, so one name never disturbs the next', () => {
    expect(fillAr('places.near', { area: 'فاطمة' })).toBe(`بالقرب من ${FSI}فاطمة${PDI}`);
  });

  it('wraps each value separately when a sentence has two', () => {
    const out = fillAr('messages.thread.from', { name: 'Marcus Johnson', time: '3:45 PM' });
    expect(out).toBe(`${FSI}Marcus Johnson${PDI}, ${FSI}3:45 PM${PDI}`);
  });

  it('leaves a number alone: it has no direction of its own to disagree with the sentence', () => {
    expect(fillAr('step.progress', { current: 2, total: 5 })).toBe(AR['step.progress']!.replace('{current}', '2').replace('{total}', '5'));
    expect(fillAr('points.summary', { count: 30 })).not.toMatch(ISOLATE_CHARS);
  });

  it('shows a placeholder that has no value, as it always did', () => {
    expect(fillAr('places.near', {})).toBe(AR['places.near']);
  });

  it('survives a value that was built from another isolated sentence', () => {
    const inner = fillAr('places.near', { area: ADDRESS });
    const outer = fillAr('places.changeArea', { area: inner });
    expect(outer).toBe(`تغيير المنطقة: ${FSI}${inner}${PDI}`);
    expect(stripIsolates(outer)).toBe(`تغيير المنطقة: بالقرب من ${ADDRESS}`);
  });

  it('wraps every text value in every Arabic template, whatever the sentence', () => {
    let checked = 0;
    for (const [key, template] of Object.entries(AR)) {
      const names = placeholders(template);
      if (names.length === 0) continue;
      const vars: Record<string, string | number> = {};
      for (const name of names) vars[name] = name === 'count' ? 3 : ADDRESS;
      const out = fillTemplate(template, vars, 'rtl');
      const wrapped = names.filter((n) => n !== 'count').length;
      expect(out.split(FSI).length - 1, key).toBe(wrapped);
      expect(out.split(PDI).length - 1, key).toBe(wrapped);
      expect(out, key).not.toMatch(/\{\w+\}/);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(200);
  });
});

describe('English and the other left-to-right languages', () => {
  /** What `fillTemplate` was before D-435, kept here as the thing "unchanged" is measured against. */
  const before = (template: string, vars?: TextVars) =>
    !vars ? template : Object.entries(vars).reduce((out, [name, v]) => out.split(`{${name}}`).join(String(v)), template);

  const LEFT_TO_RIGHT = SUPPORTED_LOCALES.filter((l) => directionOf(l) === 'ltr');
  const VALUES: readonly (string | number)[] = [ADDRESS, 'Marcus Johnson', 'فاطمة', '1231 شارع الملك', '', 3, 0, 1.5, '(555) 123-4567'];

  it('are all but Arabic, which is the only one that reads right to left', () => {
    expect(LEFT_TO_RIGHT).toEqual(SUPPORTED_LOCALES.filter((l) => l !== 'ar'));
  });

  it('read byte for byte as they did, in every sentence, with every kind of value', () => {
    let checked = 0;
    for (const locale of LEFT_TO_RIGHT) {
      const bundle = BUNDLES[locale];
      for (const [key, template] of Object.entries(bundle)) {
        const names = placeholders(template);
        if (names.length === 0) continue;
        for (const value of VALUES) {
          const vars = Object.fromEntries(names.map((n) => [n, value]));
          const expected = before(template, vars);
          expect(fillTemplate(template, vars, directionOf(locale)), `${locale} ${key} ${JSON.stringify(value)}`).toBe(expected);
          expect(fillTemplate(template, vars), `${locale} ${key} (no direction)`).toBe(expected);
          expect(expected).not.toMatch(ISOLATE_CHARS);
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThan(5000);
  });

  it('read the same through the path the app takes: pick the template, then fill it', () => {
    for (const locale of LEFT_TO_RIGHT) {
      const out = fillTemplate(pickTemplate(locale, BUNDLES[locale], EN, 'places.near', { area: ADDRESS }), { area: ADDRESS }, directionOf(locale));
      expect(out, locale).toBe(BUNDLES[locale]['places.near']!.replace('{area}', ADDRESS));
    }
  });
});

describe('text that is not drawn on a screen never carries an isolate', () => {
  it('is not in any bundle: the only place one comes from is fillTemplate, and only for Arabic', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const [key, text] of Object.entries(BUNDLES[locale])) expect(text, `${locale} ${key}`).not.toMatch(ISOLATE_CHARS);
    }
  });

  it('is not in a text message, in any language that has one, with an English street in it', () => {
    let rendered = 0;
    for (const template of Object.values(SMS_TEMPLATES)) {
      for (const locale of SUPPORTED_LOCALES) {
        const vars = Object.fromEntries(template.vars.map((name) => [name, name === 'link' ? 'https://pam.to/a1b2c3d' : '12 N Main St']));
        let body: string;
        try {
          body = renderSms({ key: template.key as SmsTemplateKey, locale: locale as Locale, vars, allowUnreviewed: true, includeStop: true });
        } catch {
          continue; // no wording in this language, or the sample does not fit its length limit
        }
        expect(body, `${template.key} ${locale}`).not.toMatch(ISOLATE_CHARS);
        rendered += 1;
      }
    }
    expect(rendered).toBeGreaterThan(20);
  });

  it('is not in an email, in HTML or plain text, with an English inviter in an Arabic one', () => {
    const email = renderInviteEmail({
      link: 'https://pam.example/join/?code=ABCD',
      role: 'member',
      inviterFirstName: 'Marcus Johnson',
      locale: 'ar',
      appUrl: 'https://pam.example',
      draft: true,
    });
    expect(email.locale).toBe('ar');
    expect(email.html).toContain('Marcus Johnson');
    for (const part of [email.subject, email.html, email.text]) expect(part).not.toMatch(ISOLATE_CHARS);
  });
});
