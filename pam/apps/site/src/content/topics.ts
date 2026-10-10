/**
 * The topics on the Support page, one per kind of person Pam is for — the same
 * three as Home's "Who Pam is for" and the app's About page. A topic with no
 * posts says so instead of linking nowhere.
 */
export type TopicId = 'members' | 'case-managers' | 'programs';

export interface Topic {
  readonly id: TopicId;
  readonly title: string;
  readonly blurb: string;
}

export const TOPICS: readonly Topic[] = [
  { id: 'members', title: 'Members', blurb: 'Finding a place, planning a visit, and keeping going.' },
  { id: 'case-managers', title: 'Case managers', blurb: 'Who looks after whom, and what is always written down.' },
  { id: 'programs', title: 'Programs', blurb: 'Who is coming, reminders, and getting people sent your way.' },
];
