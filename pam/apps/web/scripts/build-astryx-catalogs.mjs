/**
 * Astryx owns about 360 strings of its own — mostly screen-reader labels
 * ("Close", "Go to next page"). It ships a translation of them for most
 * languages, but each file carries a translator's description beside every
 * message, which makes it 14 kB gzipped where the messages alone are 3.5.
 * This writes the messages alone, one file per language Pam speaks, into
 * `src/lib/astryx/<pam code>.json`, so the app can load them beside Pam's own
 * words (D-413). Run it again after an Astryx upgrade (`node
 * scripts/build-astryx-catalogs.mjs`); the files are checked in.
 *
 *   Pam code  Astryx catalog   note
 *   es        es-ES
 *   pt-BR     pt-BR
 *   zh-CN     zh-CN
 *   zh-HK     zh-TW            Taiwan's wording is the nearest Astryx ships to
 *                              Hong Kong's written standard (both Traditional).
 *   ru        ru-RU
 *   ar        ar-SA
 * English is built into Astryx and needs no file.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
// The package exports its catalogs (`./locales/*.json`) but not its package.json.
const locales = dirname(require.resolve('@astryxdesign/core/locales/en.json'));
const out = join(here, '..', 'src', 'lib', 'astryx');
mkdirSync(out, { recursive: true });

const MAP = { es: 'es-ES', 'pt-BR': 'pt-BR', 'zh-CN': 'zh-CN', 'zh-HK': 'zh-TW', ru: 'ru-RU', ar: 'ar-SA' };
const en = JSON.parse(readFileSync(join(locales, 'en.json'), 'utf8'));

for (const [code, astryx] of Object.entries(MAP)) {
  const source = JSON.parse(readFileSync(join(locales, `${astryx}.json`), 'utf8'));
  const slim = {};
  let missing = 0;
  for (const key of Object.keys(en)) {
    const entry = source[key];
    if (entry?.defaultMessage) slim[key] = { defaultMessage: entry.defaultMessage };
    else missing += 1; // falls back to English inside Astryx
  }
  writeFileSync(join(out, `${code}.json`), JSON.stringify(slim, null, 1) + '\n');
  console.log(`${code.padEnd(6)} <- ${astryx.padEnd(6)} ${Object.keys(slim).length} messages${missing ? `, ${missing} left to English` : ''}`);
}
