import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DATA_COLLECTED, DORMANT, INPUT_FILES, PURPOSE_COLLECTS } from '../src/data-collected.js';
import { EN } from './_bundles.js';

/**
 * The privacy guard (approved by Will on 10 October, built 16 October).
 *
 * The Privacy page says what Pam keeps. Nothing tied that page to the screens that collect it, so a field could be
 * added and the page would go on saying the old thing. This test reads the app and the list in
 * `src/data-collected.ts` together:
 *
 *  1. every file with a field, a file picker, a signature pad, a microphone or a location request is listed, with
 *     how many it has, and says what it gathers (an entry of `DATA_COLLECTED`) or why nothing personal;
 *  2. every entry either names the Privacy lines that cover it and the words they must still say, or is an open
 *     gap that names who decides;
 *  3. every kind of `TextField` is classified, and a component nobody uses yet stays unused until the page says
 *     what it would collect.
 *
 * It cannot judge whether a line is enough, or true. It makes sure a person decided, in writing, which line.
 */

const PAM = fileURLToPath(new URL('../../../', import.meta.url));
const SCANNED_DIRS = ['apps/web/src', 'packages/ui/src'];
/** Stories, tests, e2e and the component gallery never reach a person. */
const SKIPPED = /(^|\/)(stories|__tests__|e2e|gallery)(\/|$)|\.(test|spec|stories)\.(tsx?|mjs)$/;
/** One match = one field, picker, pad, microphone or location request. */
const COLLECTOR =
  /<(TextField|TextArea|SearchField|SearchPill|CheckboxInput|VoiceInput|SignaturePad|ChatComposerInput|StaffInviteEmailInput|InviteEmailInput|PolicyUploadCard|input|textarea)\b|navigator\.geolocation|SpeechRecognition|getUserMedia|type="file"/g;

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(path.join(PAM, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (SKIPPED.test(rel)) continue;
    if (entry.isDirectory()) out.push(...sourceFiles(rel));
    else if (/\.tsx?$/.test(entry.name)) out.push(rel);
  }
  return out;
}

const read = (rel: string): string => stripComments(readFileSync(path.join(PAM, rel), 'utf8'));
const ALL_FILES = SCANNED_DIRS.flatMap(sourceFiles);
const DORMANT_FILES = new Set(DORMANT.map((d) => d.file));

const counts = new Map<string, number>();
for (const file of ALL_FILES) {
  if (DORMANT_FILES.has(file)) continue;
  const found = read(file).match(COLLECTOR);
  if (found) counts.set(file, found.length);
}

const normalise = (s: string): string => s.replace(/[’‘]/g, "'").toLowerCase();
const IDS = new Set(DATA_COLLECTED.map((d) => d.id));

describe('the privacy guard', () => {
  it('looks at the app (a moved folder cannot make it pass by finding nothing)', () => {
    expect(ALL_FILES.length).toBeGreaterThan(100);
    expect(counts.size).toBeGreaterThan(20);
  });

  it('knows every file that has a field, a picker, a pad, a microphone or a location request, and how many', () => {
    const listed = new Map(INPUT_FILES.map((f) => [f.file, f.fields]));
    const problems: string[] = [];
    for (const [file, n] of counts) {
      if (!listed.has(file)) {
        problems.push(
          `${file} has ${n} (a field, picker, pad or location request) and is not in INPUT_FILES: add it to ` +
            `src/data-collected.ts with what it collects (an entry of DATA_COLLECTED) or why nothing personal.`,
        );
      } else if (listed.get(file) !== n) {
        problems.push(
          `${file} has ${n} now, INPUT_FILES says ${listed.get(file)}: if you added one, say what it collects ` +
            `(and whether a Privacy line covers it); then change the number.`,
        );
      }
    }
    for (const file of listed.keys()) {
      if (!counts.has(file)) problems.push(`${file} is in INPUT_FILES but has no field any more (or moved): remove it.`);
    }
    expect(problems).toEqual([]);
  });

  it('says for each such file what it collects, or why it collects nothing personal', () => {
    const problems: string[] = [];
    for (const f of INPUT_FILES) {
      const collects = f.collects ?? [];
      if (collects.length > 0 && f.notPersonal) problems.push(`${f.file}: say either what it collects or why nothing personal, not both`);
      if (collects.length === 0 && !f.notPersonal?.trim()) problems.push(`${f.file}: say what it collects, or why nothing personal`);
      for (const id of collects) if (!IDS.has(id)) problems.push(`${f.file}: "${id}" is not an entry of DATA_COLLECTED`);
    }
    expect(problems).toEqual([]);
  });

  it('has no entry that nothing gathers', () => {
    const used = new Set<string>([
      ...INPUT_FILES.flatMap((f) => f.collects ?? []),
      ...Object.values(PURPOSE_COLLECTS).flatMap((p) => (p.id ? [p.id] : [])),
    ]);
    expect(DATA_COLLECTED.filter((d) => !used.has(d.id)).map((d) => d.id)).toEqual([]);
  });

  it('points each covered entry at Privacy lines that exist and still say what they were chosen for', () => {
    const problems: string[] = [];
    for (const entry of DATA_COLLECTED) {
      if (!entry.covers) continue;
      const texts: string[] = [];
      for (const key of entry.covers.keys) {
        const text = EN[key];
        if (!text?.trim()) problems.push(`${entry.id}: ${key} is missing or empty in en.json`);
        else texts.push(normalise(text));
      }
      for (const phrase of entry.covers.says) {
        if (!texts.some((t) => t.includes(normalise(phrase)))) {
          problems.push(
            `${entry.id}: none of ${entry.covers.keys.join(', ')} says "${phrase}" any more. If the line was reworded, ` +
              `check it still covers "${entry.what}", then change the words in src/data-collected.ts.`,
          );
        }
      }
      if (entry.covers.keys.length === 0 || entry.covers.says.length === 0) problems.push(`${entry.id}: name the keys and the words`);
      if (entry.gap) problems.push(`${entry.id}: it has covers and a gap; keep one`);
    }
    expect(problems).toEqual([]);
  });

  it('records each open gap with who decides', () => {
    const problems: string[] = [];
    for (const entry of DATA_COLLECTED) {
      if (entry.covers) continue;
      if (!entry.gap?.trim()) problems.push(`${entry.id}: an entry with no Privacy line needs a gap saying what is missing and who decides`);
      else if (!/\bWill\b|\ba\d{2}\b/.test(entry.gap)) problems.push(`${entry.id}: the gap must say "For Will" or name its card (a84...)`);
    }
    expect(problems).toEqual([]);
  });

  it('classifies every purpose a TextField can have', () => {
    const source = read('packages/ui/src/TextField.tsx');
    const union = source.match(/export type FieldPurpose =([\s\S]*?);/);
    expect(union, 'FieldPurpose moved or changed shape: update the guard').not.toBeNull();
    const purposes = [...union![1]!.matchAll(/'(\w+)'/g)].map((m) => m[1]!).sort();
    expect(purposes.length).toBeGreaterThan(5);
    expect(Object.keys(PURPOSE_COLLECTS).sort()).toEqual(purposes);
    for (const [purpose, c] of Object.entries(PURPOSE_COLLECTS)) {
      expect(Boolean(c.id) !== Boolean(c.none), `${purpose}: say what it collects or why nothing, not both`).toBe(true);
      if (c.id) expect(IDS.has(c.id), `${purpose}: "${c.id}" is not an entry of DATA_COLLECTED`).toBe(true);
    }
  });

  it('keeps a component that collects but is used nowhere unused, until the page says what it would collect', () => {
    const users: string[] = [];
    const scan = ['apps/web/src', 'apps/native/src', 'packages/ui/src'].flatMap((d) => (existsSync(path.join(PAM, d)) ? sourceFiles(d) : []));
    for (const item of DORMANT) {
      expect(existsSync(path.join(PAM, item.file)), `${item.file} moved: update DORMANT`).toBe(true);
      const word = new RegExp(`\\b${item.name}\\b`);
      for (const file of scan) {
        if (file === item.file || file === 'packages/ui/src/index.ts') continue;
        if (word.test(read(file))) users.push(`${item.name} is used in ${file}. ${item.why} Write the Privacy line first, then list the file in INPUT_FILES and remove it from DORMANT.`);
      }
    }
    expect(users).toEqual([]);
  });
});

/**
 * What Pam does six months after an account is deleted (`privacy.s.how-long.p3`: "we keep a short record that it existed for six
 * months: what it did in Pam, and what Pam's staff did to it ... After six months we delete that too").
 *
 * "What it did" and "what staff did to it" are audit rows. Three writers name a person only inside `meta` (a conversation's other
 * person, a program lead, the admin who deleted an account: Lena's sweep of 17 October, D-599), so a purge that looks only at
 * `actor_id` and `target_id` leaves those rows behind past the six months the page promises.
 */
describe('the six months after an account is deleted (privacy.s.how-long.p3)', () => {
  it('purges every audit row that names the erased account: as the actor, as the target, or as a value in meta', () => {
    expect(EN['privacy.s.how-long.p3']).toMatch(/six months/);
    expect(EN['privacy.s.how-long.p3']).toMatch(/After six months we delete that too\./);

    const dir = path.join(PAM, 'packages/db/migrations');
    const definition = /create\s+or\s+replace\s+function\s+public\.purge_erased_audit\s*\(\s*\)[\s\S]*?\bas\s+\$\$([\s\S]*?)\$\$\s*;/i;
    const latest = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((file) => ({ file, sql: readFileSync(path.join(dir, file), 'utf8').replace(/--.*$/gm, '') }))
      .filter((m) => definition.test(m.sql))
      .at(-1);
    expect(latest, 'purge_erased_audit is in a migration').toBeDefined();
    const body = latest!.sql.match(definition)![1]!.replace(/\s+/g, ' ');
    expect(body, `${latest!.file}: the actor`).toMatch(/a\.actor_id = e\.profile_id/);
    expect(body, `${latest!.file}: the target`).toMatch(/a\.target_id = e\.profile_id/);
    expect(body, `${latest!.file}: a top-level value of meta`).toMatch(/jsonb_each_text\(a\.meta\)[^)]*\)?[\s\S]*?m\.value = e\.profile_id::text/);
  });
});
