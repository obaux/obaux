#!/usr/bin/env node
/**
 * Cut a release: fold the changelog fragments into CHANGELOG.md.
 *
 *   pnpm records:release 0.52.0
 *   pnpm records:release 0.52.0 --title "Staff are asked for an email"
 *   pnpm records:release 0.52.0 --date 2026-10-12
 *
 * Sessions do not write into CHANGELOG.md. Each writes a small file in
 * docs/changelog/unreleased/ (`pnpm claim changelog "..."`), so two branches
 * never edit the same lines. The merge desk (docs/lanes.md) runs this when it
 * merges a batch to main: the version number is chosen here, once, by one
 * session, which is why two sessions can no longer take the same one.
 *
 * Several fragments need `--title`, the name of the release; one keeps its own.
 */
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { foldFragments } from './lib/claims.mjs';

const PAM = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(PAM, 'docs/changelog/unreleased');
const changelog = join(PAM, 'CHANGELOG.md');

const args = process.argv.slice(2);
const option = (name) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};
const version = args.find((a) => /^\d+\.\d+\.\d+$/.test(a));
const die = (message) => {
  console.error(`\n${message}\n`);
  process.exit(1);
};

if (!version) die('Usage: pnpm records:release <x.y.z> [--title "…"] [--date YYYY-MM-DD]');

const current = readFileSync(changelog, 'utf8');
if (current.includes(`## [${version}]`)) die(`CHANGELOG.md already has ${version}.`);

const names = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md').sort() : [];
const fragments = names.map((name) => ({ name, text: readFileSync(join(dir, name), 'utf8') }));

let section;
try {
  section = foldFragments(fragments, {
    version,
    date: option('date') ?? new Date().toISOString().slice(0, 10),
    title: option('title'),
  });
} catch (error) {
  die(error.message);
}

// Newest first, directly under the heading.
const marker = '# Changelog\n';
const at = current.indexOf(marker);
if (at < 0) die('CHANGELOG.md has no "# Changelog" heading to put it under.');
const head = at + marker.length;
writeFileSync(changelog, `${current.slice(0, head)}\n${section}${current.slice(head)}`);
for (const name of names) rmSync(join(dir, name));

console.log(`CHANGELOG.md: ${version} from ${names.length} change${names.length === 1 ? '' : 's'}.\n  ${names.join('\n  ')}`);
