import { describe, expect, it } from 'vitest';
import {
  amendmentFileName,
  changelogFileName,
  claimedFromAllocationsRow,
  decisionFileName,
  decisionTemplate,
  foldFragments,
  isRealStamp,
  migrationFileName,
  nextNumber,
  numberFromFileName,
  numbersFromHeadings,
  sessionLogFileName,
  slugify,
  snake,
  stamp,
  stampToText,
} from '../../../scripts/lib/claims.mjs';

/**
 * The parts of `pnpm claim` that do not touch git (scripts/lib/claims.mjs).
 * The numbers they choose are what stand between two sessions and one number.
 */
const at = new Date(Date.UTC(2026, 9, 10, 3, 12, 9)); // 10 October 2026, 03:12:09 UTC

describe('time-stamped names', () => {
  it('uses the day and the time, UTC, to the second', () => {
    expect(stamp(at)).toBe('20261010031209');
    expect(stampToText('20261010031209')).toBe('2026-10-10 03:12:09 UTC');
  });

  it('tells two things made on the same day apart', () => {
    expect(stamp(new Date(Date.UTC(2026, 9, 10, 3, 12, 9)))).not.toBe(stamp(new Date(Date.UTC(2026, 9, 10, 3, 12, 10))));
  });

  it('accepts only a date and time that exist', () => {
    expect(isRealStamp('20261010031209')).toBe(true);
    expect(isRealStamp('20261310031209')).toBe(false); // month 13
    expect(isRealStamp('20260230031209')).toBe(false); // 30 February
    expect(isRealStamp('20261010256109')).toBe(false); // hour 25
    expect(isRealStamp('2026101003120')).toBe(false); // 13 digits
  });

  it('names a migration, a changelog fragment and a session log', () => {
    expect(migrationFileName(at, 'Audit log keeps six months')).toBe('20261010031209_audit_log_keeps_six_months.sql');
    expect(changelogFileName(at, 'Staff are asked for an email')).toBe('20261010031209-staff-are-asked-for-an-email.md');
    expect(sessionLogFileName(at, 'staff email')).toBe('2026-10-10-0312-staff-email.md');
  });

  it('sorts migrations in the order they were written', () => {
    const earlier = migrationFileName(new Date(Date.UTC(2026, 9, 10, 3, 12, 9)), 'b');
    const later = migrationFileName(new Date(Date.UTC(2026, 9, 10, 15, 0, 0)), 'a');
    expect([later, earlier].sort()).toEqual([earlier, later]);
    // ...and after every four-digit migration, which all begin with a 0.
    expect(['0086_x.sql', earlier].sort()).toEqual(['0086_x.sql', earlier]);
  });
});

describe('words in a file name', () => {
  it('makes a short kebab-case slug', () => {
    expect(slugify('  Staff: email on invites!  ')).toBe('staff-email-on-invites');
    expect(slugify('Café — près de l’église')).toBe('cafe-pres-de-l-eglise');
    expect(slugify('x'.repeat(100)).length).toBeLessThanOrEqual(48);
  });

  it('refuses a title with nothing to name it by', () => {
    expect(() => slugify('  !!! ')).toThrow(/few words/);
  });

  it('writes a migration name in snake_case', () => {
    expect(snake('Audit log: keeps 6 months')).toBe('audit_log_keeps_6_months');
  });
});

describe('numbers', () => {
  it('reads the number out of a file name', () => {
    expect(numberFromFileName('D-442-staff-email.md', 'D-')).toBe(442);
    expect(numberFromFileName('docs/decisions/D-1000-a.md', 'D-')).toBe(1000);
    expect(numberFromFileName('A26-read-the-record.md', 'A')).toBe(26);
    expect(numberFromFileName('README.md', 'D-')).toBeNull();
    expect(numberFromFileName('D-442.md', 'D-')).toBeNull();
  });

  it('takes one more than the highest anywhere', () => {
    expect(nextNumber([])).toBe(1);
    expect(nextNumber([441, 442, 440])).toBe(443);
  });

  it('reads headings out of the old single file', () => {
    const text = '## Open\n### D-440 — a\ntext D-999\n### D-441 — b\n## A25 — nope\n';
    expect(numbersFromHeadings(text, /^#{1,3} D-(\d+)\b/)).toEqual([440, 441]);
  });

  it('honours a branch that still bumps the old allocations table', () => {
    const table = '| Ledger | Next free |\n|---|---|\n| Decision | **D-444** | `DECISIONS.md` |\n| SOP amendment | **A26** | x |\n';
    expect(claimedFromAllocationsRow(table, 'Decision')).toBe(443);
    expect(claimedFromAllocationsRow(table, 'SOP amendment')).toBe(25);
    expect(claimedFromAllocationsRow('no table here', 'Decision')).toBe(0);
  });

  it('puts the number in the file name and the heading', () => {
    expect(decisionFileName(442, 'Staff email on invites')).toBe('D-442-staff-email-on-invites.md');
    expect(amendmentFileName(26, 'Read the record')).toBe('A26-read-the-record.md');
    const body = decisionTemplate({ number: 442, title: 'Staff email', date: '2026-10-10', branch: 'claude/x' });
    expect(body.split('\n')[0]).toBe('# D-442 — Staff email');
  });
});

describe('folding unreleased changes into a release', () => {
  const one = { name: 'a.md', text: '# Staff are asked for an email\n\nWhen you invite a case manager, Pam asks for an email (D-441).\n' };
  const two = { name: 'b.md', text: '# A limited account is told\n\n<!-- comment -->\nIt says what is off and who to call (D-427).\n' };

  it('keeps the title of a lone change', () => {
    const out = foldFragments([one], { version: '0.52.0', date: '2026-10-10' });
    expect(out).toBe('## [0.52.0] — 2026-10-10 · Staff are asked for an email\n\nWhen you invite a case manager, Pam asks for an email (D-441).\n');
  });

  it('needs a title for several, and leads each with its own', () => {
    expect(() => foldFragments([one, two], { version: '0.52.0', date: '2026-10-10' })).toThrow(/--title/);
    const out = foldFragments([one, two], { version: '0.52.0', date: '2026-10-10', title: 'Staff and limits' });
    expect(out).toContain('## [0.52.0] — 2026-10-10 · Staff and limits');
    expect(out).toContain('**Staff are asked for an email.** When you invite');
    expect(out).toContain('**A limited account is told.** It says what is off');
    expect(out).not.toContain('comment');
  });

  it('refuses a fragment nobody wrote', () => {
    expect(() => foldFragments([{ name: 'c.md', text: '# Title\n\n<!-- todo -->\n' }], { version: '0.52.0', date: '2026-10-10' })).toThrow(/write what/);
    expect(() => foldFragments([{ name: 'd.md', text: 'no title\n' }], { version: '0.52.0', date: '2026-10-10' })).toThrow(/Title/);
    expect(() => foldFragments([], { version: '0.52.0', date: '2026-10-10' })).toThrow(/No unreleased/);
  });
});
