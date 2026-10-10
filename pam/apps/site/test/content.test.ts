import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSIGNMENT_ROWS, LIVE_ASSIGNMENT_ROWS } from '../src/content/assignments';
import { ALL_POSTS, POSTS, anyPostBySlug, formatDate, postBySlug } from '../src/content/posts';

// The data, and the words written straight into every post's component and page.
const SRC = join(__dirname, '..', 'src');
const written = ['content', 'screens', 'components']
  .flatMap((d) => readdirSync(join(SRC, d)).map((f) => readFileSync(join(SRC, d, f), 'utf8')))
  .join('\n');
const everyWord = (JSON.stringify([ASSIGNMENT_ROWS, ALL_POSTS]) + written).toLowerCase();

describe('public site content', () => {
  it('never uses the words Pam never displays (pam/CLAUDE.md)', () => {
    for (const word of ['prisoner', 'ex-offender', 'inmate', 'convict']) {
      expect(everyWord).not.toContain(word);
    }
  });

  it('carries no pointers to a conversation the reader was not in', () => {
    expect(everyWord).not.toMatch(/see question|question \d/);
  });

  it('has the seven rows of the assignments table, each answered for both roles', () => {
    expect(ASSIGNMENT_ROWS).toHaveLength(7);
    for (const row of ASSIGNMENT_ROWS) {
      for (const cell of [row.caseManager, row.superAdmin]) {
        expect(cell.answer ?? cell.note).toBeTruthy();
      }
    }
  });

  it('quotes the privacy policy as the app words it', () => {
    const reason = ASSIGNMENT_ROWS.find((r) => r.action === 'Reason');
    expect(reason?.caseManager.note).toContain('They have to write down why.');
  });

  it('finds a post by slug and formats its date', () => {
    expect(postBySlug('case-manager-assignments')?.title).toBe('Case manager assignments');
    expect(postBySlug('nope')).toBeUndefined();
    expect(formatDate('2026-10-09')).toBe('October 9, 2026');
  });

  it('keeps a draft off the site: not in the published list, not found by slug', () => {
    const drafts = ALL_POSTS.filter((p) => p.status === 'draft');
    expect(drafts.length).toBeGreaterThan(0);
    for (const d of drafts) {
      expect(POSTS).not.toContain(d);
      expect(postBySlug(d.slug)).toBeUndefined();
      expect(anyPostBySlug(d.slug)).toBe(d); // Storybook can still review it
    }
  });

  it('has a body for every post, draft or not, and a unique slug', () => {
    expect(new Set(ALL_POSTS.map((p) => p.slug)).size).toBe(ALL_POSTS.length);
    // Read as text: the bodies are StyleX components, which vitest does not compile.
    const bodies = readFileSync(join(SRC, 'content', 'bodies.tsx'), 'utf8');
    for (const p of ALL_POSTS) expect(bodies, p.slug).toContain(`'${p.slug}':`);
  });

  it('promises nothing Pam cannot do yet: held rows stay out of the live list and the post', () => {
    const held = ASSIGNMENT_ROWS.filter((r) => !r.live);
    for (const r of held) expect(LIVE_ASSIGNMENT_ROWS).not.toContain(r);
    const post = readFileSync(join(SRC, 'content', 'CaseManagerAssignments.tsx'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '') // the comment above the post names what is held
      .toLowerCase();
    // Nothing the held rows describe may appear in what the reader sees.
    // (Single words like "Reason" and "Undo" are too common to match; the phrases below cover them.)
    for (const r of held.filter((r) => r.action.split(' ').length >= 3)) {
      expect(post, r.action).not.toContain(r.action.toLowerCase());
    }
    for (const phrase of ['turn back on', 'unassign', 'hand a member', 'take on']) {
      expect(post, phrase).not.toContain(phrase);
    }
  });
});
