/**
 * The pure parts of `pnpm claim` (scripts/claim.mjs): reading a number out of a
 * file name or a heading, choosing the next one, naming the new file.
 *
 * Kept free of git and the file system so a test can attack it
 * (packages/config/test/claims.test.ts) — the part that touches git is a thin
 * shell around these.
 *
 * Why this exists: numbers used to be handed out by whichever session wrote
 * next, from the table in docs/allocations.md, and each session saw only its
 * own branch. Decision numbers collided five times in two days. A number is now
 * a *file*: the claim is the file existing on a pushed branch, and the script
 * looks at every pushed branch before it picks.
 */

/** The ledgers whose numbers are sequential, and where each one lives. */
export const LEDGERS = {
  decision: {
    label: 'Decision',
    dir: 'docs/decisions',
    prefix: 'D-',
    // Everything up to D-441 was written into one file before this existed.
    legacyFile: 'DECISIONS.md',
    legacyHeading: /^#{1,3} D-(\d+)\b/,
    legacyAllocationsRow: 'Decision',
  },
  amendment: {
    label: 'SOP amendment',
    dir: 'docs/amendments',
    prefix: 'A',
    legacyFile: 'docs/sop-amendments.md',
    legacyHeading: /^#{1,3} A(\d+)\b/,
    legacyAllocationsRow: 'SOP amendment',
  },
};

/** `2026-10-10T03:12:09Z` → `20261010031209`. UTC, to the second, like Supabase's own versions. */
export function stamp(date = new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return (
    p(date.getUTCFullYear(), 4) +
    p(date.getUTCMonth() + 1) +
    p(date.getUTCDate()) +
    p(date.getUTCHours()) +
    p(date.getUTCMinutes()) +
    p(date.getUTCSeconds())
  );
}

/** `20261010031209` → `2026-10-10 03:12:09 UTC`. */
export function stampToText(s) {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(s);
  if (!m) throw new Error(`Not a timestamp: ${s}`);
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]} UTC`;
}

/** True for a real calendar date and time (so `20269999999999` is refused). */
export function isRealStamp(s) {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d, h, mi, se] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi, se));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d &&
    date.getUTCHours() === h &&
    date.getUTCMinutes() === mi &&
    date.getUTCSeconds() === se
  );
}

/** Words in, `kebab-case` out, short enough for a file name. */
export function slugify(text, max = 64) {
  const full = String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  // Cut at a word, not in the middle of one.
  let slug = full.slice(0, max);
  if (full.length > max && full[max] !== '-' && slug.includes('-')) slug = slug.slice(0, slug.lastIndexOf('-'));
  slug = slug.replace(/-+$/g, '');
  if (!slug) throw new Error(`Say what it is in a few words (got "${text}")`);
  return slug;
}

/** A migration's name is snake_case, like every one before it. */
export function snake(text, max = 60) {
  return slugify(text, max).replace(/-/g, '_');
}

/** `D-442-staff-email.md` → 442 (or null). */
export function numberFromFileName(name, prefix) {
  const base = name.split('/').pop() ?? name;
  const m = new RegExp(`^${prefix}(\\d+)-.+\\.md$`).exec(base);
  return m ? Number(m[1]) : null;
}

/**
 * A database test: `packages/db/test/NN_words_test.sql`, two digits. The runner
 * (packages/db/scripts/test-db.sh) takes them in name order on one database, so a
 * number used twice runs in whatever order its words sort (10 October 2026: four
 * collisions in one afternoon, each fixed by hand at merge).
 */
export const DB_TEST_DIR = 'packages/db/test';

export function dbTestNumberFromFileName(name) {
  const base = name.split('/').pop() ?? name;
  const m = /^(\d{2})_[a-z0-9_]+\.sql$/.exec(base);
  return m ? Number(m[1]) : null;
}

export function dbTestFileName(number, title) {
  if (number > 99) throw new Error('Database tests are numbered with two digits; 99 is the last. Renumber before going on.');
  const words = slugify(title, 48).replace(/-/g, '_').replace(/_test$/, '');
  return `${String(number).padStart(2, '0')}_${words}_test.sql`;
}

export function dbTestTemplate({ number, title, date, branch }) {
  return `-- ${asTitle(title)} (test ${String(number).padStart(2, '0')}).
--
-- Claimed ${date} on \`${branch}\` with \`pnpm claim test\`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\\set ON_ERROR_STOP on
\\set QUIET on
set client_min_messages to notice;
`;
}

/** Every `D-nnn` heading in a document. */
export function numbersFromHeadings(text, headingPattern) {
  const numbers = [];
  for (const line of text.split('\n')) {
    const m = headingPattern.exec(line);
    if (m) numbers.push(Number(m[1]));
  }
  return numbers;
}

/**
 * The old allocations table said "Next free | **D-442**". Branches that have
 * not merged the new rules still bump it, so the highest *claimed* number there
 * is one below. Returns 0 when the row is gone (the new world).
 */
export function claimedFromAllocationsRow(text, label) {
  const row = text.split('\n').find((line) => line.startsWith(`| ${label} |`));
  const cell = row?.split('|')[2]?.replace(/\*/g, '').trim();
  const digits = cell ? /(\d+)/.exec(cell)?.[1] : undefined;
  return digits ? Number(digits) - 1 : 0;
}

export function nextNumber(claimed) {
  return claimed.reduce((max, n) => Math.max(max, n), 0) + 1;
}

export function decisionFileName(number, title) {
  return `D-${number}-${slugify(title)}.md`;
}

export function amendmentFileName(number, title) {
  return `A${number}-${slugify(title)}.md`;
}

export function migrationFileName(date, name) {
  return `${stamp(date)}_${snake(name)}.sql`;
}

export function changelogFileName(date, title) {
  return `${stamp(date)}-${slugify(title)}.md`;
}

export function sessionLogFileName(date, slug) {
  const iso = date.toISOString();
  return `${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}-${slugify(slug)}.md`;
}

/** A line of a title that was typed on a command line, made fit for a heading. */
const asTitle = (text) => String(text).trim().replace(/\s+/g, ' ');

export function decisionTemplate({ number, title, date, branch }) {
  return `# D-${number} — ${asTitle(title)}

**Date:** ${date} · **Branch:** \`${branch}\`

<!--
Claimed with \`pnpm claim decision\`. Replace this comment with the decision:
what was decided and who decided it (Will's own words, dated), why, what it
replaces, and what a later session would reasonably want to reverse. Cite it
from code and copy as D-${number}.
-->
`;
}

export function amendmentTemplate({ number, title, date, branch }) {
  return `# A${number} — ${asTitle(title)}

**Date:** ${date} · **Branch:** \`${branch}\`

<!--
Claimed with \`pnpm claim amendment\`. A change to the build SOP: what the SOP
said, what it says now, and who decided.
-->
`;
}

export function changelogTemplate({ title }) {
  return `# ${asTitle(title)}

<!--
What a person using Pam notices, in plain words. Replace this comment. No
version number and no date: the merge desk gives these when it cuts a release
(\`pnpm records:release <version>\`). End with the decision, like (D-442).
-->
`;
}

export function migrationTemplate({ date, name, branch }) {
  return `-- ${snake(name)} — <one line: what changes and why> (D-???).
--
-- Claimed ${stampToText(stamp(date))} on \`${branch}\` with \`pnpm claim migration\`.
-- The file name is the order: migrations run oldest first.
--
-- EXPAND OR CONTRACT? (docs/lanes.md, "Database changes in two steps")
--   expand   — adds a table, column, function or policy. The app that is live
--              right now must keep working after this runs. This is the default.
--   contract — removes or renames something, or makes a column stricter. Only
--              once no live app reads or writes it. Say so on a line starting
--              "-- contract:" naming the release that stopped using it; the
--              migration check refuses a removal without one.
--
-- The connector hangs on a DROP statement (D-387). If this needs one, put it in
-- its own migration so the rest can be applied without it.

`;
}

export function sessionLogTemplate({ date, title, branch }) {
  return `# ${date} — ${asTitle(title)}

**Branch:** \`${branch}\` · **Lane:** <see docs/lanes.md>

## What changed

## What was wrong, and what missed it

## Decisions made

## Verified

## Left undone

## Needs a human
`;
}

/**
 * Release notes folded from fragments. One fragment keeps its own title; several
 * need a title for the release, and each is led by its own.
 */
export function foldFragments(fragments, { version, date, title }) {
  if (fragments.length === 0) throw new Error('No unreleased changes to fold');
  const parsed = fragments.map(({ name, text }) => {
    const lines = text.replace(/<!--[\s\S]*?-->/g, '').trim().split('\n');
    const first = lines.shift() ?? '';
    const heading = /^#\s+(.+)$/.exec(first)?.[1]?.trim();
    if (!heading) throw new Error(`${name}: the first line must be "# Title"`);
    const body = lines.join('\n').trim();
    if (!body) throw new Error(`${name}: write what a person notices under the title`);
    return { heading, body };
  });
  if (parsed.length > 1 && !title) {
    throw new Error(`${parsed.length} changes are waiting: pass --title "<what this release is>"`);
  }
  const releaseTitle = title ?? parsed[0].heading;
  const body =
    parsed.length === 1
      ? parsed[0].body
      : parsed.map((p) => `**${p.heading.replace(/[.]+$/, '')}.** ${p.body}`).join('\n\n');
  return `## [${version}] — ${date} · ${releaseTitle}\n\n${body}\n`;
}
