import type { TopicId } from './topics';

/** The support posts, newest first. Each has a page of its own at /support/<slug>/. */
export interface SupportPost {
  readonly slug: string;
  /** Which topic it is filed under on the Support page (`content/topics.ts`). */
  readonly topic: TopicId;
  /** Words people might type that the title does not say. Searched, not shown. */
  readonly keywords: readonly string[];
  readonly title: string;
  /** One sentence for the Support list and the page's description. */
  readonly summary: string;
  /** ISO date; shown as "Updated 9 October 2026". */
  readonly updated: string;
  /**
   * `draft` is written and reviewed but not published: it is left out of the
   * site's pages, the Support index and search, and appears only in Storybook's
   * Website journey (with a Draft banner). Remove the line to publish.
   */
  readonly status?: 'draft';
}

const ALL: readonly SupportPost[] = [
  {
    slug: 'keeping-your-listing-up-to-date',
    topic: 'programs',
    title: 'Keeping your program’s listing up to date',
    summary:
      'When you run a program on Pam, you can fix a phone number in a minute. Changing the name or address gets a quick check first.',
    updated: '2026-10-10',
    keywords: ['listing', 'edit', 'name', 'address', 'phone', 'website', 'category', 'description', 'review', 'approve', 'checked'],
    // Held until the feature ships (D-447, branch claude/places-programs-load-own-program).
    status: 'draft',
  },
  {
    slug: 'case-manager-assignments',
    topic: 'case-managers',
    keywords: ['assign', 'unassigned', 'hand over', 'limit', 'pause', 'suspend', 'reason', 'audit', 'super admin', 'turn back on'],
    title: 'Case manager assignments',
    summary:
      'Who can take on a member, hand one over, or limit and pause an account, and what is always written down.',
    updated: '2026-10-09',
  },
];

/** What the site publishes: every post that is not a draft. */
export const POSTS: readonly SupportPost[] = ALL.filter((p) => p.status !== 'draft');
/** Everything, drafts included — for Storybook's review only; never for the site. */
export const ALL_POSTS: readonly SupportPost[] = ALL;

export function postBySlug(slug: string): SupportPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** As `postBySlug`, but finds drafts too (Storybook). */
export function anyPostBySlug(slug: string): SupportPost | undefined {
  return ALL.find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
