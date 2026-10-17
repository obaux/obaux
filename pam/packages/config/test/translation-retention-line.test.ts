import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUNDLES } from './_bundles.js';
import { MODEL } from '../../../supabase/functions/translate-messages/anthropic.ts';

/**
 * The line on the Privacy page about what happens to a message that is
 * translated (card a70). It once said "It keeps nothing and does not learn from
 * them" about "a company that translates". Neither half was something Pam could
 * promise: Anthropic's published terms delete the words within 30 days, keep a
 * flagged message for up to two years, and keep anything the law requires. The
 * line now says that, and names who gets the words.
 *
 * These checks fail if the English drifts back to a promise the supplier does
 * not make, if a translation loses the numbers or the names, or if the request
 * Pam sends starts to carry more than the words.
 */
const bundles: Record<string, Record<string, string>> = BUNDLES;
const KEY = 'privacy.s.translation.p2';
const en = bundles.en![KEY]!;

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const read = (path: string) => readFileSync(`${REPO}${path}`, 'utf8');

describe('the translation line on the Privacy page', () => {
  it('names who gets the words, and what that company really does with them', () => {
    expect(en).toMatch(/Claude, an AI made by Anthropic/);
    expect(en).toMatch(/gets the words and nothing else/);
    expect(en).toMatch(/does not get your name, your phone number, or who you are talking to/);
    expect(en).toMatch(/deletes the words within 30 days/);
    expect(en).toMatch(/does not use them to train its AI/);
    expect(en).toMatch(/safety checks flag a message/);
    expect(en).toMatch(/up to two years/);
    expect(en).toMatch(/if the law requires it/);
  });

  it('no longer promises what the supplier does not', () => {
    expect(en).not.toMatch(/keeps nothing/i);
    expect(en).not.toMatch(/does not learn/i);
    expect(en).not.toMatch(/a company that translates/i);
  });

  it.each(Object.keys(bundles))('%s keeps both names and the 30 days', (locale) => {
    const text = bundles[locale]![KEY]!;
    expect(text, `${locale}: Claude`).toContain('Claude');
    expect(text, `${locale}: Anthropic`).toContain('Anthropic');
    expect(text, `${locale}: 30`).toMatch(/\b30\b/);
  });

  it('is only on the page while translation is switched on', () => {
    const legal = read('packages/config/src/legal.ts');
    expect(legal).toMatch(/MESSAGE_TRANSLATION\.enabled \? \[section\('privacy', 'translation', 3\)\]/);
  });
});

describe('what Pam sends to Anthropic matches that line', () => {
  const source = read('supabase/functions/translate-messages/anthropic.ts');

  it('sends the words, the language and nothing that says who', () => {
    // The top-level keys of the object handed to JSON.stringify, read by
    // walking the braces so the `{ role, content }` inside `messages` is not
    // mistaken for the end of it.
    const start = source.indexOf('JSON.stringify({') + 'JSON.stringify({'.length;
    let depth = 1;
    let end = start;
    for (; end < source.length && depth > 0; end++) {
      if (source[end] === '{') depth++;
      if (source[end] === '}') depth--;
    }
    const fields: string[] = [];
    depth = 0;
    for (const line of source.slice(start, end - 1).split('\n')) {
      const key = depth === 0 ? /^\s*([a-z_]+)\s*[:,]/.exec(line)?.[1] : undefined;
      if (key) fields.push(key);
      depth += (line.match(/[{[]/g) ?? []).length - (line.match(/[}\]]/g) ?? []).length;
    }
    expect(fields).toEqual(['model', 'max_tokens', 'temperature', 'system', 'messages']);
    expect(source).not.toMatch(/metadata/);
    expect(source).not.toMatch(/\buser_id\b/);
  });

  it('sends only the headers a call needs', () => {
    const headers = /headers: \{([^}]*)\}/s.exec(source)?.[1] ?? '';
    const names = [...headers.matchAll(/'([a-z-]+)':/g)].map((m) => m[1]);
    expect(names).toEqual(['x-api-key', 'anthropic-version', 'content-type']);
  });

  it('uses the model the line was written for', () => {
    // The 30 days is Anthropic's published term for the models Pam can call
    // today; the Covered Models (Fable and Mythos) are held 30 days for
    // everyone. A different model is a different page to read: Anthropic's
    // API and data retention page, and docs/before-launch.md ("Messages in your
    // own language"). Change this line only after reading both.
    expect(MODEL).toBe('claude-haiku-5-5');
  });
});
