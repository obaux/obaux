#!/usr/bin/env node
/**
 * Move the "Last updated" date of the Privacy page and/or the Terms (see src/legal-updated.ts).
 *
 *   pnpm --filter @pam/config legal:date privacy 2026-10-14
 *   pnpm --filter @pam/config legal:date all 2026-10-14
 *
 * Use it in the change that makes a Privacy or Terms paragraph go live, with the day it goes live (the day it is merged to `main`,
 * in UTC). It writes the date and a fingerprint of today's English words into `src/legal-updated.json`, and rewrites
 * `privacy.updated` / `terms.updated` in the seven language files. Then run `pnpm --filter @pam/config copy:ack` (the English line
 * changed, and Sage signs it, A29) and the config tests.
 *
 * The same day again is fine (it re-pins the fingerprint after another change that day); an earlier day is refused.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { LEGAL_DOC_IDS, formatUpdated, paragraphsHash } from '../src/legal-updated.ts';
import { MESSAGE_TRANSLATION } from '../src/translation.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '../src/locales');
const file = path.join(here, '../src/legal-updated.json');
const LOCALES = ['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'];

const [which, date] = process.argv.slice(2);
const docs = which === 'all' ? [...LEGAL_DOC_IDS] : LEGAL_DOC_IDS.filter((d) => d === which);
if (!docs.length || !date) {
  console.error('usage: legal:date <privacy|terms|all> <YYYY-MM-DD>');
  process.exit(2);
}
formatUpdated('en', date); // throws on a date that is not real

const en = JSON.parse(readFileSync(path.join(dir, 'en.json'), 'utf8'));
const recorded = JSON.parse(readFileSync(file, 'utf8'));
for (const doc of docs) {
  if (date < recorded[doc].date) {
    console.error(`${doc}: ${date} is earlier than the recorded ${recorded[doc].date}; a date does not go backwards.`);
    process.exit(1);
  }
  recorded[doc] = { date, paragraphs: paragraphsHash(doc, en, MESSAGE_TRANSLATION.enabled) };
  for (const locale of LOCALES) {
    const p = path.join(dir, `${locale}.json`);
    const text = readFileSync(p, 'utf8');
    const line = new RegExp(`^(\\s*"${doc}\\.updated": )"(?:[^"\\\\]|\\\\.)*"`, 'm');
    if (!line.test(text)) throw new Error(`${locale}.json has no ${doc}.updated`);
    writeFileSync(p, text.replace(line, `$1${JSON.stringify(formatUpdated(locale, date))}`));
  }
  console.log(`${doc}: ${date}`);
}
writeFileSync(file, `${JSON.stringify(recorded, null, 2)}\n`);
console.log('Now: pnpm --filter @pam/config copy:ack, then the config tests. Sage signs the English line (A29).');
