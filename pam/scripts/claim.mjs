#!/usr/bin/env node
/**
 * Claim a number, or a place in line, without colliding with another session.
 *
 *   pnpm claim decision  "Staff email on invites"      → docs/decisions/D-442-staff-email-on-invites.md
 *   pnpm claim amendment "Sessions read the record"    → docs/amendments/A26-sessions-read-the-record.md
 *   pnpm claim migration "audit log keeps six months"  → packages/db/migrations/20261010031209_audit_log_keeps_six_months.sql
 *   pnpm claim changelog "Staff are asked for an email"→ docs/changelog/unreleased/20261010031209-staff-are-asked-for-an-email.md
 *   pnpm claim session   "staff email"                 → docs/sessions/2026-10-10-0312-staff-email.md
 *   pnpm claim test      "a lead switches programs"    → packages/db/test/45_a_lead_switches_programs_test.sql
 *   pnpm claim status                                  → what is claimed where
 *
 * A decision, an amendment or a database test is numbered: the script fetches, reads the numbers
 * already used on `main` and on every other pushed branch, takes the next one,
 * writes the file, commits only that file and pushes — so the claim is visible
 * to every other session within seconds. Then it looks again and tells you if
 * somebody got the same number in the meantime (docs/lanes.md explains why).
 *
 * A migration, a changelog fragment and a session log are named by the day and
 * time (UTC, to the second), so they do not need a number and are not committed:
 * you write them and commit them with your work.
 *
 * `--no-push` writes the file and stops (use it offline; claim again online).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEDGERS,
  amendmentFileName,
  amendmentTemplate,
  changelogFileName,
  changelogTemplate,
  claimedFromAllocationsRow,
  DB_TEST_DIR,
  dbTestFileName,
  dbTestNumberFromFileName,
  dbTestTemplate,
  decisionFileName,
  decisionTemplate,
  migrationFileName,
  migrationTemplate,
  nextNumber,
  numberFromFileName,
  numbersFromHeadings,
  sessionLogFileName,
  sessionLogTemplate,
} from './lib/claims.mjs';

const PAM = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [command, ...words] = args.filter((a) => !a.startsWith('--'));
const text = words.join(' ').trim();

function git(gitArgs, { allowFail = false } = {}) {
  try {
    return execFileSync('git', gitArgs, { cwd: PAM, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    if (allowFail) return '';
    throw new Error(`git ${gitArgs.join(' ')}\n${error.stderr || error.message}`);
  }
}

const die = (message, code = 1) => {
  console.error(`\n${message}\n`);
  process.exit(code);
};

const branch = () => git(['rev-parse', '--abbrev-ref', 'HEAD']).trim();

function fetchAll() {
  try {
    execFileSync('git', ['fetch', 'origin', '--prune', '--quiet'], { cwd: PAM, stdio: 'ignore', timeout: 90_000 });
    return true;
  } catch {
    console.warn('! Could not reach GitHub. The number below is only the highest THIS checkout can see; another session may have taken it.');
    return false;
  }
}

/** Branches to look at: this checkout, main, and every other pushed branch. */
function refs() {
  const names = git(['for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes/origin'])
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && s !== 'origin' && s !== 'origin/HEAD');
  return [...new Set(['HEAD', ...names])];
}

/** number → the refs that hold it, for one numbered ledger. */
function claimed(ledger) {
  const found = new Map();
  const add = (n, ref) => {
    if (!found.has(n)) found.set(n, new Set());
    found.get(n).add(ref);
  };
  const headingPattern = `^#{1,3} ${ledger.prefix}[0-9]+\\b`;

  for (const ref of refs()) {
    const files = git(['ls-tree', '-r', '--name-only', ref, '--', ledger.dir], { allowFail: true }).split('\n');
    for (const file of files) {
      const n = file ? numberFromFileName(file, ledger.prefix) : null;
      if (n) add(n, ref);
    }
    const headings = git(['grep', '-h', '-E', headingPattern, ref, '--', ledger.legacyFile], { allowFail: true });
    for (const n of numbersFromHeadings(headings, ledger.legacyHeading)) add(n, ref);

    // Branches that have not merged these rules still bump the old table.
    const table = git(['show', `${ref}:./docs/allocations.md`], { allowFail: true });
    const floor = claimedFromAllocationsRow(table, ledger.legacyAllocationsRow);
    if (floor > 0) add(floor, `${ref} (allocations table)`);
  }

  // Files in this working tree that are not committed yet.
  const here = join(PAM, ledger.dir);
  if (existsSync(here)) {
    for (const file of readdirSync(here)) {
      const n = numberFromFileName(file, ledger.prefix);
      if (n) add(n, 'working tree');
    }
  }
  return found;
}

/** number → the refs that hold it, for the database tests (two digits, by file name). */
function claimedDbTests() {
  const found = new Map();
  const add = (n, ref) => {
    if (!found.has(n)) found.set(n, new Set());
    found.get(n).add(ref);
  };
  for (const ref of refs()) {
    for (const file of git(['ls-tree', '-r', '--name-only', ref, '--', DB_TEST_DIR], { allowFail: true }).split('\n')) {
      const n = file ? dbTestNumberFromFileName(file) : null;
      if (n) add(n, ref);
    }
  }
  const here = join(PAM, DB_TEST_DIR);
  if (existsSync(here)) {
    for (const file of readdirSync(here)) {
      const n = dbTestNumberFromFileName(file);
      if (n) add(n, 'working tree');
    }
  }
  return found;
}

function writeNew(relativePath, contents) {
  const full = join(PAM, relativePath);
  if (existsSync(full)) die(`${relativePath} already exists.`);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents);
  return full;
}

function needText(what) {
  if (!text) die(`Say what it is in a few words:\n  pnpm claim ${command} "${what}"`);
}

function claimNumbered(kind) {
  const ledger = LEDGERS[kind];
  needText('a few words');
  const current = branch();
  if (current === 'main' || current === 'HEAD') {
    die('Switch to your own branch first. Claims are pushed, and nothing is pushed to main from here.');
  }
  const online = flags.has('--no-push') ? false : fetchAll();
  const number = nextNumber([...claimed(ledger).keys()]);
  const date = new Date().toISOString().slice(0, 10);
  const name = kind === 'decision' ? decisionFileName(number, text) : amendmentFileName(number, text);
  const template = kind === 'decision' ? decisionTemplate : amendmentTemplate;
  const relativePath = `${ledger.dir}/${name}`;
  writeNew(relativePath, template({ number, title: text, date, branch: current }));
  const label = `${ledger.prefix}${number}`;

  if (flags.has('--no-push')) {
    console.log(`Wrote ${relativePath}. NOT pushed: claim ${label} again online before relying on it.`);
    return;
  }

  git(['add', '--', relativePath]);
  git(['commit', '-m', `Claim ${label} — ${text}`, '--only', '--', relativePath]);
  try {
    execFileSync('git', ['push', '-u', 'origin', 'HEAD'], { cwd: PAM, stdio: 'inherit', timeout: 120_000 });
  } catch {
    die(
      `Claimed ${label} in ${relativePath} and committed it, but the push failed.\n` +
        `Until it is pushed another session can take ${label}. Push this branch (git push -u origin HEAD).`,
      2,
    );
  }

  // The race: two sessions fetch in the same few seconds. Look once more.
  if (online) {
    fetchAll();
    const holders = [...(claimed(ledger).get(number) ?? [])].filter((ref) => !['HEAD', current, `origin/${current}`, 'working tree'].includes(ref));
    if (holders.length > 0) {
      die(
        `${label} was claimed by another branch at the same moment: ${holders.join(', ')}.\n` +
          `Yours is ${relativePath}. Delete it and claim again, or the numbering check will fail on merge.`,
        3,
      );
    }
  }
  console.log(`Claimed ${label}: ${relativePath}\nPushed to origin/${current}. Write the entry in that file and cite it as ${label}.`);
}

/**
 * A database test, numbered like a decision: fetch, take the next number after every
 * pushed branch, write, commit only that file, push, and look again for a twin.
 */
function claimDbTest() {
  needText('what it tests');
  const current = branch();
  if (current === 'main' || current === 'HEAD') {
    die('Switch to your own branch first. Claims are pushed, and nothing is pushed to main from here.');
  }
  const online = flags.has('--no-push') ? false : fetchAll();
  const number = nextNumber([...claimedDbTests().keys()]);
  const relativePath = `${DB_TEST_DIR}/${dbTestFileName(number, text)}`;
  writeNew(relativePath, dbTestTemplate({ number, title: text, date: new Date().toISOString().slice(0, 10), branch: current }));
  const label = `test ${String(number).padStart(2, '0')}`;

  if (flags.has('--no-push')) {
    console.log(`Wrote ${relativePath}. NOT pushed: claim ${label} again online before relying on it.`);
    return;
  }

  git(['add', '--', relativePath]);
  git(['commit', '-m', `Claim ${label} — ${text}`, '--only', '--', relativePath]);
  try {
    execFileSync('git', ['push', '-u', 'origin', 'HEAD'], { cwd: PAM, stdio: 'inherit', timeout: 120_000 });
  } catch {
    die(
      `Claimed ${label} in ${relativePath} and committed it, but the push failed.\n` +
        `Until it is pushed another session can take ${label}. Push this branch (git push -u origin HEAD).`,
      2,
    );
  }
  if (online) {
    fetchAll();
    const holders = [...(claimedDbTests().get(number) ?? [])].filter((ref) => !['HEAD', current, `origin/${current}`, 'working tree'].includes(ref));
    if (holders.length > 0) {
      die(
        `${label} was claimed by another branch at the same moment: ${holders.join(', ')}.\n` +
          `Yours is ${relativePath}. Delete it and claim again, or the numbering check will fail on merge.`,
        3,
      );
    }
  }
  console.log(`Claimed ${label}: ${relativePath}\nPushed to origin/${current}. Write the checks in that file.`);
}

function claimStamped(kind) {
  needText('a few words');
  const date = new Date();
  if (kind === 'migration') {
    const rel = `packages/db/migrations/${migrationFileName(date, text)}`;
    writeNew(rel, migrationTemplate({ date, name: text, branch: branch() }));
    console.log(`Wrote ${rel}\nWrite the SQL, run \`pnpm --filter @pam/db test\`, and commit it with the change that needs it.`);
  } else if (kind === 'changelog') {
    const rel = `docs/changelog/unreleased/${changelogFileName(date, text)}`;
    writeNew(rel, changelogTemplate({ title: text }));
    console.log(`Wrote ${rel}\nSay what a person using Pam notices. The merge desk gives it a version.`);
  } else {
    const rel = `docs/sessions/${sessionLogFileName(date, text)}`;
    writeNew(rel, sessionLogTemplate({ date: date.toISOString().slice(0, 10), title: text, branch: branch() }));
    console.log(`Wrote ${rel}`);
  }
}

function status() {
  fetchAll();
  const cutoff = Date.now() / 1000 - 14 * 24 * 3600;
  const recent = new Set(
    git(['for-each-ref', '--format=%(refname:short) %(committerdate:unix)', 'refs/heads', 'refs/remotes/origin'])
      .split('\n')
      .map((line) => line.split(' '))
      .filter(([, when]) => Number(when) >= cutoff)
      .map(([name]) => name),
  );
  for (const ledger of Object.values(LEDGERS)) {
    const all = claimed(ledger);
    const numbers = [...all.keys()].sort((a, b) => a - b);
    const top = numbers.at(-1) ?? 0;
    console.log(`\n${ledger.label}: highest claimed ${ledger.prefix}${top}, next ${ledger.prefix}${nextNumber(numbers)}`);
    const onMain = new Set(
      [...all].filter(([, held]) => [...held].some((r) => r === 'origin/main' || r === 'main')).map(([n]) => n),
    );
    // A branch nobody has touched for two weeks is history, not work in flight.
    const alive = (ref) => ref === 'HEAD' || ref === 'working tree' || recent.has(ref.replace(/ \(allocations table\)$/, ''));
    for (const n of numbers.filter((x) => !onMain.has(x))) {
      const holders = [...all.get(n)].filter((r) => r !== 'HEAD' && alive(r)).map((r) => r.replace(/^origin\//, ''));
      if (holders.length > 0) console.log(`  ${ledger.prefix}${n}  in flight on ${holders.join(', ')}`);
    }
  }
  const tests = claimedDbTests();
  const testNumbers = [...tests.keys()].sort((a, b) => a - b);
  console.log(`\nDatabase test: highest claimed ${String(testNumbers.at(-1) ?? 0).padStart(2, '0')}, next ${String(nextNumber(testNumbers)).padStart(2, '0')}`);
  for (const n of testNumbers) {
    const held = [...tests.get(n)];
    if (held.some((r) => r === 'origin/main' || r === 'main')) continue;
    const holders = held.filter((r) => r !== 'HEAD' && (r === 'working tree' || recent.has(r))).map((r) => r.replace(/^origin\//, ''));
    if (holders.length > 0) console.log(`  ${String(n).padStart(2, '0')}  in flight on ${holders.join(', ')}`);
  }
  const rel = relative(PAM, join(PAM, 'packages/db/migrations'));
  const ahead = git(['diff', '--name-only', 'origin/main...HEAD', '--', rel], { allowFail: true }).trim();
  console.log(`\nMigrations this branch adds to main:${ahead ? '\n  ' + ahead.split('\n').join('\n  ') : ' none'}`);
}

switch (command) {
  case 'decision':
  case 'amendment':
    claimNumbered(command);
    break;
  case 'test':
    claimDbTest();
    break;
  case 'migration':
  case 'changelog':
  case 'session':
    claimStamped(command);
    break;
  case 'status':
    status();
    break;
  default:
    die(
      'Usage:\n' +
        '  pnpm claim decision  "short title"\n' +
        '  pnpm claim amendment "short title"\n' +
        '  pnpm claim migration "what it does"\n' +
        '  pnpm claim changelog "what a person notices"\n' +
        '  pnpm claim session   "short slug"\n' +
        '  pnpm claim test      "what the database test checks"\n' +
        '  pnpm claim status\n' +
        'Add --no-push to write the file without committing or pushing (offline).',
    );
}

