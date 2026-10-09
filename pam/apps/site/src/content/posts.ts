/** The support posts, newest first. Each has a page of its own at /support/<slug>/. */
export interface SupportPost {
  readonly slug: string;
  readonly title: string;
  /** One sentence for the Support list and the page's description. */
  readonly summary: string;
  /** ISO date; shown as "Updated 9 October 2026". */
  readonly updated: string;
}

export const POSTS: readonly SupportPost[] = [
  {
    slug: 'case-manager-assignments',
    title: 'Case manager assignments',
    summary:
      'Who can take on a member, hand one over, or limit and pause an account, and what is always written down.',
    updated: '2026-10-09',
  },
];

export function postBySlug(slug: string): SupportPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
