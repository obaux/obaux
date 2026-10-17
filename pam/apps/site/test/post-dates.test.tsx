import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// The posts' words are rendered to text here, outside Next, so StyleX has no compiler: stand in for it. Only the text matters.
vi.mock('@stylexjs/stylex', () => {
  const id = (x: unknown) => x;
  const vars: unknown = new Proxy({}, { get: (_t, k) => (k === 'then' ? undefined : 'x') });
  return {
    create: id,
    createTheme: () => ({}),
    defineVars: () => vars,
    defineConsts: () => vars,
    keyframes: () => 'k',
    props: () => ({}),
    attrs: () => ({}),
    types: new Proxy({}, { get: () => id }),
    when: new Proxy({}, { get: () => () => '' }),
    firstThatWorks: id,
    viewTransitionClass: () => '',
    positionTry: () => '',
    env: {},
  };
});

import { BODIES } from '../src/content/bodies';
import { ALL_POSTS, type SupportPost } from '../src/content/posts';

/**
 * A post's "Updated" date moves when its words do (Iris's b52 re-test: "What others can see" changed in b52 and still said
 * 10 October; Mira, 17 October 2026). The same idea as the Privacy date (`packages/config/test/legal-updated.test.ts`).
 *
 * `src/content/post-updated.json` holds, for every post, the day its words last went live and a fingerprint of them: the title,
 * the summary, the text of the body and the alt text of its pictures, as they are rendered. This fails when the words change and
 * the fingerprint does not, and when `updated` in `posts.ts` is not the recorded day. The fix is one command, which records the
 * fingerprint and writes `updated` in `posts.ts` (the day the change goes live, in UTC):
 *
 *   pnpm --filter @pam/site posts:date <slug>=<YYYY-MM-DD> [<slug>=<YYYY-MM-DD> ...]
 *
 * A new post has no record: run it for the new slug. Keywords, topic and layout are not words a person reads, so they do not move it.
 */
const RECORD_URL = new URL('../src/content/post-updated.json', import.meta.url);
const POSTS_URL = new URL('../src/content/posts.ts', import.meta.url);
type Record = { date: string; words: string };

/** The words a person reads or hears: title, summary, the body's text and its pictures' alt text, whitespace squeezed. */
export function wordsOf(post: Pick<SupportPost, 'title' | 'summary'>, html: string): string {
  const alts = [...html.matchAll(/\salt="([^"]*)"/g)].map((m) => m[1]);
  const text = html.replace(/<[^>]*>/g, ' ');
  return [post.title, post.summary, text, ...alts].join(' ').replace(/\s+/g, ' ').trim();
}
export const hashOf = (words: string) => createHash('sha256').update(words).digest('hex');

function fingerprint(post: SupportPost): string {
  const body = BODIES[post.slug];
  if (!body) throw new Error(`no body for ${post.slug}`);
  return hashOf(wordsOf(post, renderToStaticMarkup(createElement(body))));
}

const WRITE = process.env['POST_DATES_WRITE'];
if (WRITE) {
  // `posts:date`: slug=date pairs; `*=keep` records every other post at the date it already shows.
  it('records the fingerprints and writes `updated`', () => {
    const wanted = new Map<string, string>(WRITE.split(',').map((p) => p.split('=') as [string, string]));
    const record: { [slug: string]: Record } = JSON.parse(readFileSync(RECORD_URL, 'utf8'));
    let posts = readFileSync(POSTS_URL, 'utf8');
    for (const post of ALL_POSTS) {
      const date = wanted.get(post.slug) ?? (wanted.get('*') === 'keep' && !record[post.slug] ? post.updated : undefined);
      if (!date) continue;
      expect(date, `${post.slug}: "${date}" is not a day (YYYY-MM-DD)`).toMatch(/^\d{4}-\d\d-\d\d$/);
      expect(Number.isNaN(Date.parse(`${date}T12:00:00Z`)), `${post.slug}: "${date}" is not a real day`).toBe(false);
      record[post.slug] = { date, words: fingerprint(post) };
      const slugText = post.slug === 'signing-a-programs-rules' ? 'RULES_SLUG' : `'${post.slug}'`;
      const at = posts.indexOf(`slug: ${slugText},`);
      expect(at, `${post.slug}: not found in posts.ts`).toBeGreaterThan(-1);
      const rest = posts.slice(at).replace(/updated: '\d{4}-\d\d-\d\d'/, `updated: '${date}'`);
      posts = posts.slice(0, at) + rest;
    }
    for (const slug of wanted.keys()) if (slug !== '*') expect(ALL_POSTS.some((p) => p.slug === slug), `no post "${slug}"`).toBe(true);
    const sorted = Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(RECORD_URL, `${JSON.stringify(sorted, null, 2)}\n`);
    writeFileSync(POSTS_URL, posts);
  });
} else {
  const RECORD: { [slug: string]: Record } = JSON.parse(readFileSync(fileURLToPath(RECORD_URL), 'utf8'));

  describe('a post’s "Updated" date follows its words', () => {
    for (const post of ALL_POSTS) {
      it(`${post.slug}: the words are the recorded ones, and "updated" is the recorded day`, () => {
        const rec = RECORD[post.slug];
        expect(rec, `${post.slug} has no record. Run: pnpm --filter @pam/site posts:date ${post.slug}=<the day it goes live, YYYY-MM-DD>`).toBeDefined();
        expect(
          fingerprint(post),
          `The words of "${post.slug}" changed and its date did not. Run: pnpm --filter @pam/site posts:date ${post.slug}=<the day the change goes live, YYYY-MM-DD> (Sage signs new words first).`,
        ).toBe(rec!.words);
        expect(post.updated, `"updated" in posts.ts is not the recorded day for ${post.slug}: run posts:date, do not edit it by hand`).toBe(rec!.date);
      });
    }

    it('has no record for a post that is gone', () => {
      expect(Object.keys(RECORD).filter((s) => !ALL_POSTS.some((p) => p.slug === s))).toEqual([]);
    });

    it('is not blind: a changed word, an added or removed one, or a different picture description changes the fingerprint', () => {
      const post = { title: 'T', summary: 'S' };
      const html = '<p>Pam shows you <b>who</b> can see what.</p><img alt="A table" src="x">';
      const before = hashOf(wordsOf(post, html));
      expect(hashOf(wordsOf(post, html.replace('who', 'whom')))).not.toBe(before);
      expect(hashOf(wordsOf(post, `${html}<p>New.</p>`))).not.toBe(before);
      expect(hashOf(wordsOf(post, html.replace('can see what.', 'can see.')))).not.toBe(before);
      expect(hashOf(wordsOf(post, html.replace('A table', 'A list')))).not.toBe(before);
      expect(hashOf(wordsOf({ ...post, summary: 'S2' }, html))).not.toBe(before);
      // Markup, class names and spacing are not words.
      expect(hashOf(wordsOf(post, '<div class="a"><p>Pam shows you   <i>who</i> can see what.</p></div>\n<img src="y" alt="A table">'))).toBe(before);
    });
  });
}
