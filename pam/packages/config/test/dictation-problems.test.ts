import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUNDLES, EN } from './_bundles.js';

/**
 * Why the microphone in a conversation did not start (D-603, W4; Sage's ledger a2703793).
 *
 * `apps/web/src/lib/dictationProblem.ts` names the kinds of failure; each has a title and a hint under
 * `messages.thread.dictate.problem.<kind>.*`, shown in Pam's warning banner above the message box. This reads the kinds from
 * that file, so a new kind that nobody has written words for fails here, in every language, rather than showing a blank banner
 * or the key. A person who is told the microphone failed in a language they cannot read is told nothing.
 */

const source = readFileSync(fileURLToPath(new URL('../../../apps/web/src/lib/dictationProblem.ts', import.meta.url)), 'utf8');
const kinds = (source.match(/export type DictationProblem =([^;]+);/)?.[1] ?? '').match(/'(\w+)'/g)?.map((k) => k.slice(1, -1)) ?? [];

describe('the lines that say why speaking a message did not start', () => {
  const locales = Object.keys(BUNDLES).filter((l) => l !== 'en');

  it('the kinds were read from the code', () => {
    expect(kinds.length, 'kinds found in dictationProblem.ts').toBeGreaterThanOrEqual(5);
  });

  for (const kind of kinds) {
    for (const part of ['title', 'hint'] as const) {
      const id = `messages.thread.dictate.problem.${kind}.${part}` as keyof typeof EN;
      it(`${id} is written in every language, is not the English stand-in, and has no placeholder`, () => {
        expect(EN[id], `en has ${id}`).toBeTruthy();
        expect(EN[id], 'en has no placeholder').not.toMatch(/\{\w+\}/);
        for (const locale of locales) {
          const text = (BUNDLES as Record<string, Record<string, string>>)[locale]![id];
          expect(text, `${locale} has ${id}`).toBeTruthy();
          expect(text, `${locale} ${id} is not the English stand-in`).not.toBe(EN[id]);
          expect(text, `${locale} ${id} has no placeholder`).not.toMatch(/\{\w+\}/);
        }
      });
    }
  }

  it('Pam stays Latin in the lines that name it (zh, ru and ar do not translate the name)', () => {
    for (const kind of kinds) {
      const id = `messages.thread.dictate.problem.${kind}.title` as keyof typeof EN;
      if (!EN[id].includes('Pam')) continue;
      for (const locale of locales) {
        expect((BUNDLES as Record<string, Record<string, string>>)[locale]![id], `${locale} ${id}`).toContain('Pam');
      }
    }
  });
});
