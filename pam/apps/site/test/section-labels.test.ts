import { describe, expect, it } from 'vitest';
import { ALL_POSTS } from '../src/content/posts';
import { SECTION_LABELS } from '../src/content/section-labels';

describe('section labels (Sage writes them, the post page shows them)', () => {
  it('keeps every label to four words or fewer', () => {
    for (const [slug, labels] of Object.entries(SECTION_LABELS))
      for (const [title, label] of Object.entries(labels))
        expect(label.trim().split(/\s+/).length, `${slug} › ${title}: “${label}”`).toBeLessThanOrEqual(4);
  });
  it('names only posts that exist', () => {
    const slugs = new Set(ALL_POSTS.map((p) => p.slug));
    for (const slug of Object.keys(SECTION_LABELS)) expect(slugs.has(slug), slug).toBe(true);
  });
});
