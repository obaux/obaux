import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  acknowledge,
  draftLocale,
  draftPrompt,
  driftOf,
  ledgerValue,
  parseDrafts,
  serializeLedger,
  shortHash,
  sourceKeyOf,
  type Ledger,
} from '../src/copy-sync.js';
import { pseudoBundle, pseudoText } from '../src/pseudo.js';
import { BUNDLES, EN, OTHER_LOCALES } from './_bundles.js';

/**
 * Keeping seven languages in step with the English (A24, D-424).
 *
 * The first block is the check that matters: against the real bundles and the
 * committed ledger, no translation says what the English used to say. The rest
 * attack the mechanism on small bundles, so the guard is known to work before
 * it is trusted.
 */
const ledger = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/locales/ledger.json', import.meta.url)), 'utf8'),
) as Ledger;

describe('the language files are in step with the English', () => {
  const report = driftOf(EN, BUNDLES, ledger);

  it('has no translation that still says what the English used to say', () => {
    const stale = report.drift.filter((d) => d.kind === 'stale');
    const sample = stale.slice(0, 12).map((d) => `${d.locale} ${d.key}`);
    expect(
      stale.length,
      `${stale.length} translation(s) are older than their English — re-translate them ` +
        `(pnpm --filter @pam/config copy:draft), or if the English change keeps the meaning, ` +
        `keep them on purpose (copy:ack --keep key).\n${sample.join('\n')}`,
    ).toBe(0);
  });

  it('has every change answered and recorded', () => {
    const open = report.drift.filter((d) => d.kind !== 'stale');
    const sample = open.slice(0, 12).map((d) => `${d.locale} ${d.key} (${d.kind})`);
    expect(
      open.length,
      `${open.length} new or changed translation(s) are not in the ledger yet — read them, then run ` +
        `pnpm --filter @pam/config copy:ack.\n${sample.join('\n')}`,
    ).toBe(0);
  });

  it('has no ledger entry for a key that no longer exists', () => {
    expect(report.orphaned.slice(0, 12), 'run copy:ack to drop them').toEqual([]);
  });

  it('has every English key in every language', () => {
    expect(report.missing.slice(0, 12)).toEqual([]);
  });

  it('records every language', () => {
    for (const locale of OTHER_LOCALES) expect(Object.keys(ledger.locales[locale] ?? {}).length, locale).toBeGreaterThan(1000);
  });
});

describe('noticing a reworded string', () => {
  const english = { 'a.title': 'Privacy', 'a.body': 'Nobody sees this.', 'a.count': '{count} people' };
  const es = { 'a.title': 'Privacidad', 'a.body': 'Nadie ve esto.', 'a.count': '{count} personas', 'a.count.one': '{count} persona' };
  const ru = { 'a.title': 'Конфиденциальность', 'a.body': 'Никто этого не видит.', 'a.count': '{count} человека', 'a.count.few': '{count} человека', 'a.count.one': '{count} человек' };
  const bundles = { en: english, es, ru };
  const start = acknowledge(english, bundles, { version: 1, locales: {} }, { everything: true });

  const kinds = (en: Record<string, string>, b: Record<string, Record<string, string>>, l: Ledger) =>
    driftOf(en, b, l).drift.map((d) => `${d.locale} ${d.key} ${d.kind}`).sort();

  it('is quiet when nothing changed', () => {
    expect(driftOf(english, bundles, start).clean).toBe(true);
  });

  it('calls a translation stale when only the English changed — in every language that has it', () => {
    const reworded = { ...english, 'a.body': 'Only you see this.' };
    expect(kinds(reworded, bundles, start)).toEqual(['es a.body stale', 'ru a.body stale']);
  });

  it('follows the base key: rewording {count} people makes every plural form stale', () => {
    const reworded = { ...english, 'a.count': '{count} members' };
    expect(kinds(reworded, bundles, start)).toEqual([
      'es a.count stale',
      'es a.count.one stale',
      'ru a.count stale',
      'ru a.count.few stale',
      'ru a.count.one stale',
    ]);
  });

  it('accepts an answer: English and translation both changed', () => {
    const reworded = { ...english, 'a.body': 'Only you see this.' };
    const answered = { ...bundles, es: { ...es, 'a.body': 'Solo usted ve esto.' } };
    expect(kinds(reworded, answered, start)).toEqual(['es a.body changed', 'ru a.body stale']);
    const next = acknowledge(reworded, answered, start);
    // Spanish is recorded; Russian — untouched — is still a failure.
    expect(kinds(reworded, answered, next)).toEqual(['ru a.body stale']);
  });

  it('keeps a stale translation only when told to, by name', () => {
    const typoFixed = { ...english, 'a.title': 'Privacy!' };
    const next = acknowledge(typoFixed, bundles, start);
    expect(kinds(typoFixed, bundles, next)).toEqual(['es a.title stale', 'ru a.title stale']);
    const kept = acknowledge(typoFixed, bundles, start, { keep: ['a.title'] });
    expect(driftOf(typoFixed, bundles, kept).clean).toBe(true);
    // And only one language, if that is all that was checked.
    const some = acknowledge(typoFixed, bundles, start, { keep: ['a.title'], locales: ['es'] });
    expect(kinds(typoFixed, bundles, some)).toEqual(['ru a.title stale']);
  });

  it('notices a new key, and a better word for an unchanged English', () => {
    const grown = { ...english, 'a.new': 'Brand new' };
    expect(kinds(grown, { en: grown, es: { ...es, 'a.new': 'Nuevo' }, ru }, start)).toEqual(['es a.new unrecorded']);
    expect(kinds(english, { ...bundles, es: { ...es, 'a.title': 'Privacidad.' } }, start)).toEqual(['es a.title edited']);
  });

  it('finds what a language is missing and what the ledger remembers for nothing', () => {
    const { 'a.body': _gone, ...fewer } = es;
    const report = driftOf(english, { ...bundles, es: fewer }, start);
    expect(report.missing).toEqual([{ locale: 'es', key: 'a.body' }]);
    expect(report.orphaned).toEqual([{ locale: 'es', key: 'a.body' }]);
  });

  it('writes one entry per line, sorted, so two sessions’ changes merge', () => {
    const text = serializeLedger(start);
    expect(JSON.parse(text)).toEqual(start);
    expect(text.split('\n').filter((l) => l.includes('"a.')).length).toBe(Object.keys(start.locales['es']!).length + Object.keys(start.locales['ru']!).length);
    expect(text).toBe(serializeLedger(JSON.parse(text) as Ledger));
  });

  it('hashes by content, and tells a plural variant its base', () => {
    expect(shortHash('x')).toBe(shortHash('x'));
    expect(shortHash('x')).not.toBe(shortHash('y'));
    expect(ledgerValue('a', 'b')).toMatch(/^[0-9a-f]{6}\.[0-9a-f]{6}$/);
    expect(sourceKeyOf('a.count.few', english)).toBe('a.count');
    expect(sourceKeyOf('a.title', english)).toBe('a.title');
    expect(sourceKeyOf('nope.few', english)).toBeNull();
  });
});

describe('drafting', () => {
  const items = [
    { key: 'a.body', english: 'Only you see this.' },
    { key: 'a.count', english: '{count} members' },
  ];

  it('asks with the rules a translator needs, and never names what Pam never says', () => {
    const { system, user } = draftPrompt({
      locale: 'ru',
      items: [{ ...items[0]!, was: 'Nobody sees this.', current: 'Никто этого не видит.' }],
      examples: [{ key: 'a.title', english: 'Privacy', translation: 'Конфиденциальность' }],
    });
    expect(system).toContain('Russian');
    expect(system).toContain('placeholder');
    expect(system).toMatch(/exactly the keys/);
    expect(user).toContain('(the English used to be: Nobody sees this.)');
    expect(user).toContain('Конфиденциальность');
    // The request is read by a model, not a member, but it is held to the same
    // rule as everything else: it names no word that labels a person by their past.
    for (const word of ['prison', 'inmate', 'offender', 'parole', 'probation', 'felon']) {
      expect((system + user).toLowerCase()).not.toContain(word);
    }
  });

  it('accepts a good answer, and rejects each kind of bad one by name', () => {
    const answer = JSON.stringify({
      'a.body': 'Solo usted ve esto.',
      'a.count': '{count} socios y {extra}', // placeholder invented
    });
    const result = parseDrafts(items, `Here you go:\n${answer}`);
    expect(result.accepted).toEqual({ 'a.body': 'Solo usted ve esto.' });
    expect(result.rejected).toEqual([{ key: 'a.count', reason: expect.stringContaining('placeholders differ') }]);

    expect(parseDrafts(items, 'not json at all').rejected.map((r) => r.reason)).toEqual([
      'missing from the answer',
      'missing from the answer',
    ]);
    expect(parseDrafts(items, JSON.stringify({ 'a.body': '   ', 'a.count': '{count} <b>x</b>' })).rejected.map((r) => r.reason)).toEqual([
      'missing from the answer',
      'adds markup',
    ]);
    expect(parseDrafts([items[0]!], JSON.stringify({ 'a.body': 'x'.repeat(200) })).rejected[0]?.reason).toBe('far longer than the English');
  });

  it('works through a provider in batches, and keeps only what passed', async () => {
    const seen: string[] = [];
    const provider = async (_system: string, user: string) => {
      seen.push(user);
      return JSON.stringify(Object.fromEntries([...user.matchAll(/^(k\d+)\n {2}EN:/gm)].map((m) => [m[1], `T-${m[1]}`])));
    };
    const many = Array.from({ length: 7 }, (_, i) => ({ key: `k${i}`, english: `English ${i}` }));
    const result = await draftLocale(provider, { locale: 'es', items: many, examples: [] }, 3);
    expect(seen).toHaveLength(3);
    expect(Object.keys(result.accepted)).toHaveLength(7);
    expect(result.rejected).toEqual([]);
  });
});

describe('the pseudo-language', () => {
  it('keeps every placeholder exactly, and wraps the text so a cut-off shows', () => {
    const out = pseudoText('Hello, {name}! You have {count} messages.');
    expect(out.startsWith('⟦') && out.endsWith('⟧')).toBe(true);
    expect(out).toContain('{name}');
    expect(out).toContain('{count}');
    expect(out).not.toMatch(/Hello|messages/);
  });

  it('stretches real copy by about 40%, which is what a longer language does', () => {
    const long = Object.values(EN).filter((v) => v.length >= 20);
    const before = long.reduce((n, v) => n + v.length, 0);
    const after = long.reduce((n, v) => n + pseudoText(v).length, 0);
    expect(after / before).toBeGreaterThan(1.3);
    expect(after / before).toBeLessThan(1.6);
  });

  it('covers every key, with the same placeholders', () => {
    const bundle = pseudoBundle(EN);
    expect(Object.keys(bundle)).toEqual(Object.keys(EN));
    for (const [key, text] of Object.entries(EN)) {
      const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).join();
      expect(holes(bundle[key]!), key).toBe(holes(text));
    }
  });
});
