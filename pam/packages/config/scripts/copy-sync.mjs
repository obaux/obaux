#!/usr/bin/env node
/**
 * Keeping the other six languages in step with the English (A24, D-424).
 *
 *   pnpm --filter @pam/config copy:status            what is stale, new or missing (exit 1 if anything)
 *   pnpm --filter @pam/config copy:draft             ask a model for drafts of what needs translating
 *   pnpm --filter @pam/config copy:ack               record what has been answered
 *
 * Options
 *   --locales ru,ar        only these languages
 *   --keep a.key,b.key     (ack) the English changed but the translation is still right
 *   --everything           (ack) record every key as it is — for creating the ledger, nothing else
 *   --since <git rev>      (draft) where "the English used to be" is read from (default HEAD)
 *   --model <id>           (draft) default claude-sonnet-5-5
 *   --dry-run              (draft) print the requests, send nothing
 *
 * `draft` needs ANTHROPIC_API_KEY in the environment — never in a file in this
 * repository. Drafts are written into the language files and are only drafts:
 * the tests still apply, `ack` records them, and a native reader still reads
 * what is a promise (docs/before-launch.md).
 *
 * Runs on Node 22 directly (type stripping), so the logic is in src/copy-sync.ts
 * and this file only reads, writes and calls the network.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  acknowledge,
  draftLocale,
  driftOf,
  serializeLedger,
  sourceKeyOf,
  LOCALE_BRIEFS,
} from '../src/copy-sync.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '../src/locales');
const ledgerPath = path.join(dir, 'ledger.json');
const LOCALES = ['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'];

const [command = 'status', ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
const flag = (name) => rest.includes(`--${name}`);
const only = opt('locales', '')?.split(',').filter(Boolean);

const read = (locale) => JSON.parse(readFileSync(path.join(dir, `${locale}.json`), 'utf8'));
const bundles = Object.fromEntries(LOCALES.map((l) => [l, read(l)]));
const english = bundles.en;
const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : { version: 1, locales: {} };

function report() {
  const result = driftOf(english, bundles, ledger);
  const byLocale = new Map();
  const add = (locale, line) => (byLocale.get(locale) ?? byLocale.set(locale, []).get(locale)).push(line);
  for (const { locale, key } of result.missing) add(locale, `missing    ${key}`);
  for (const { locale, key, kind } of result.drift) add(locale, `${kind.padEnd(10)} ${key}`);
  for (const { locale, key } of result.orphaned) add(locale, `orphaned   ${key}`);
  for (const [locale, lines] of byLocale) {
    if (only?.length && !only.includes(locale)) continue;
    console.log(`\n${locale}  (${lines.length})`);
    for (const line of lines.slice(0, 60)) console.log(`  ${line}`);
    if (lines.length > 60) console.log(`  … and ${lines.length - 60} more`);
  }
  if (result.clean) console.log('All languages are in step with the English.');
  return result;
}

function gitShow(rev, file) {
  try {
    return JSON.parse(execFileSync('git', ['show', `${rev}:${path.relative(execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here }).toString().trim(), file)}`], { cwd: here, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  } catch {
    return null;
  }
}

// ANTHROPIC_BASE_URL exists so the request can be pointed at a stand-in server in a
// test (packages/config/test/copy-sync-cli.test.ts); in real use it is not set.
const API = (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com').replace(/\/$/, '');

async function ask(model, key, system, user) {
  const response = await fetch(`${API}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 8000, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const body = await response.json();
  return body.content?.map((part) => part.text ?? '').join('') ?? '';
}

if (command === 'status') {
  process.exitCode = report().clean ? 0 : 1;
} else if (command === 'ack') {
  const next = acknowledge(english, bundles, ledger, {
    keep: opt('keep', '')?.split(',').filter(Boolean),
    locales: only?.length ? only : undefined,
    everything: flag('everything'),
  });
  writeFileSync(ledgerPath, serializeLedger(next));
  console.log('Ledger written.');
  const left = driftOf(english, bundles, next);
  if (!left.clean) {
    console.log('\nStill to answer (stale = the English changed and the translation did not):');
    process.exitCode = 1;
    report();
  }
} else if (command === 'draft') {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key && !flag('dry-run')) {
    console.error('Set ANTHROPIC_API_KEY in your environment (never in a file in the repository), or use --dry-run.');
    process.exit(2);
  }
  const model = opt('model', 'claude-sonnet-5-5');
  const rev = opt('since', 'HEAD');
  const result = driftOf(english, bundles, ledger);
  const todo = new Map();
  for (const { locale, key: k } of result.missing) (todo.get(locale) ?? todo.set(locale, new Set()).get(locale)).add(k);
  // The keys that are stale themselves — a plural form (`key.few`) is its own key, answered
  // in its own words, not something the base sentence's translation covers.
  for (const { locale, key: k, kind } of result.drift) {
    if (kind === 'stale') (todo.get(locale) ?? todo.set(locale, new Set()).get(locale)).add(k);
  }
  for (const [locale, keys] of todo) {
    if (only?.length && !only.includes(locale)) continue;
    if (!LOCALE_BRIEFS[locale]) continue;
    const before = gitShow(rev, path.join(dir, 'en.json'));
    const items = [...keys].sort().map((k) => {
      const source = sourceKeyOf(k, english);
      return {
        key: k,
        english: english[source],
        form: source === k ? undefined : k.slice(source.length + 1),
        was: before && before[source] !== undefined && before[source] !== english[source] ? before[source] : undefined,
        current: bundles[locale][k],
      };
    });
    const screens = new Set(items.map((i) => i.key.split('.').slice(0, 2).join('.')));
    const examples = Object.keys(english)
      .filter((k) => !keys.has(k) && screens.has(k.split('.').slice(0, 2).join('.')) && bundles[locale][k])
      .slice(0, 12)
      .map((k) => ({ key: k, english: english[k], translation: bundles[locale][k] }));
    console.log(`${locale}: ${items.length} to draft${flag('dry-run') ? ` (${items.slice(0, 4).map((i) => i.key).join(', ')}${items.length > 4 ? ', …' : ''})` : ''}`);
    if (flag('dry-run') || items.length === 0) continue;
    const { accepted, rejected } = await draftLocale((s, u) => ask(model, key, s, u), { locale, items, examples });
    Object.assign(bundles[locale], accepted);
    const sorted = Object.fromEntries(Object.keys(english).concat(Object.keys(bundles[locale]).filter((k) => !(k in english))).filter((k, i, a) => a.indexOf(k) === i && k in bundles[locale]).map((k) => [k, bundles[locale][k]]));
    writeFileSync(path.join(dir, `${locale}.json`), `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`  wrote ${Object.keys(accepted).length}; rejected ${rejected.length}`);
    for (const r of rejected) console.log(`    ${r.key}: ${r.reason}`);
  }
  console.log(
    flag('dry-run')
      ? '\nDry run: nothing was sent and nothing was written.'
      : '\nDrafts are written. Read them, run the tests, then `copy:ack`.',
  );
} else {
  console.error(`Unknown command "${command}". Use status, draft or ack.`);
  process.exit(2);
}
