import type { TopicId } from './topics';

/** The support posts, newest first. Each has a page of its own at /support/<slug>/. */
export interface SupportPost {
  readonly slug: string;
  /** Which topic it is filed under on the Support page (`content/topics.ts`). */
  readonly topic: TopicId;
  /** Words people might type that the title does not say. Searched, not shown. */
  readonly keywords: readonly string[];
  readonly title: string;
  /** Who the post is for, shown at the top: "Members", "Case managers", "Everyone"... */
  readonly audience: string;
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
    slug: 'who-is-my-guide',
    topic: 'members',
    audience: 'members',
    title: 'Who is my guide?',
    summary: 'Your guide is the person who invited you, or a staff member who looks after you. You may not have one yet.',
    updated: '2026-10-10',
    keywords: ['guide', 'case manager', 'who', 'invited', 'staff', 'nobody', 'no guide', 'help'],
  },
  {
    slug: 'texts-from-pam',
    topic: 'members',
    audience: 'everyone',
    title: 'Texts from Pam: which ones, and why one didn’t come',
    summary: 'The few texts Pam sends today, the rules for them, and what to do when one does not come.',
    updated: '2026-10-10',
    keywords: ['text', 'sms', 'code', 'sign in', 'reminder', 'stop', 'quiet hours', 'not now', 'did not come', 'no text'],
  },
  {
    slug: 'planning-a-visit',
    topic: 'members',
    audience: 'members',
    title: 'Planning a visit',
    summary: 'Plan a visit to a place, change it, cancel it, and where past visits go.',
    updated: '2026-10-10',
    keywords: ['visit', 'trip', 'plan', 'plan a trip', 'new trip', 'appointment', 'change', 'cancel', 'past visits', 'service', 'book', 'schedule'],
  },
  {
    slug: 'what-others-can-see',
    topic: 'members',
    audience: 'everyone',
    title: 'What your guide, a program and others can see',
    summary: 'One table: what your guide, a program you joined and other members can see about you.',
    updated: '2026-10-10',
    keywords: ['see', 'privacy', 'private', 'who can see', 'messages', 'points', 'visits', 'share', 'table'],
  },
  {
    slug: 'joining-pam',
    topic: 'members',
    audience: 'members',
    title: 'Joining Pam: with a link, a code, or on your own',
    summary: 'The three ways to join, the steps to sign in, and what to do if a link or a code does not work.',
    updated: '2026-10-10',
    keywords: ['join', 'sign up', 'sign in', 'link', 'code', 'invite', 'different phone', 'expired', 'phone number'],
  },
  {
    slug: 'joining-as-staff',
    topic: 'case-managers',
    audience: 'case managers and program leads',
    title: 'Joining Pam as a case manager or program lead',
    summary: 'Staff join with an invite link. Here are the steps, and what to do if you do not have one.',
    updated: '2026-10-10',
    keywords: ['staff', 'case manager', 'program lead', 'invite', 'link', 'join', 'program partner', 'already in pam'],
  },
  {
    slug: 'pam-words',
    topic: 'members',
    audience: 'everyone',
    title: 'Pam words, in plain English',
    summary: 'Guide, case manager, program, policy, points and more: what each word means in Pam.',
    updated: '2026-10-10',
    keywords: ['words', 'glossary', 'meaning', 'what does', 'guide', 'policy', 'program lead', 'level', 'badge', 'limited', 'paused'],
  },
  {
    slug: 'one-phone-two-sides',
    topic: 'programs',
    audience: 'program leads who also use Pam as a member',
    title: 'One phone, two sides: using Pam as a member and as a program',
    summary: 'Keep one account for your own Pam and your program, and switch between them.',
    updated: '2026-10-10',
    keywords: ['use pam as', 'two sides', 'switch', 'member and program', 'my program', 'add program', 'one account'],
  },
  {
    slug: 'sending-an-invite',
    topic: 'case-managers',
    audience: 'case managers, program leads and super admins',
    title: 'Sending an invite',
    summary: 'Make an invite link, send it, and what to do when it expires.',
    updated: '2026-10-10',
    keywords: ['invite', 'link', 'code', 'send', 'expired', 'one number', 'invited people', 'create link'],
  },
  {
    slug: 'messages-in-pam',
    topic: 'members',
    audience: 'members, case managers and program leads',
    title: 'Messages: who can write, and why nothing is texted',
    summary: 'Who can start a chat with whom, how to send and report a message, and why a message does not come by text.',
    updated: '2026-10-10',
    keywords: ['message', 'chat', 'conversation', 'report', 'photo', 'document', 'new message', 'unsafe'],
  },
  {
    slug: 'points-and-badges',
    topic: 'members',
    audience: 'members',
    title: 'Points and badges, today',
    summary: 'How you earn points today, what the levels are, and who can see your points.',
    updated: '2026-10-10',
    keywords: ['points', 'badge', 'level', 'ladder', 'earn', 'rewards', 'returned', 'rooted'],
  },
  {
    slug: 'keeping-your-listing-up-to-date',
    topic: 'programs',
    audience: 'program leads',
    title: 'Keeping your program’s listing up to date',
    summary:
      'When you run a program on Pam, you can fix a phone number in a minute. Changing the name or address gets a quick check first.',
    updated: '2026-10-10',
    keywords: ['listing', 'edit', 'name', 'address', 'phone', 'website', 'category', 'description', 'review', 'approve', 'checked'],
    // Held until the feature ships (D-447, branch claude/places-programs-load-own-program).
    status: 'draft',
  },
  {
    slug: 'staff-requests',
    topic: 'case-managers',
    audience: 'super admins',
    title: 'Staff requests: where they are and what Approve and Deny do',
    summary: 'Where a request to be staff waits, and what Approve and Deny do.',
    updated: '2026-10-10',
    keywords: ['staff requests', 'approve', 'deny', 'requests', 'super admin', 'city'],
    // Held: no screen lets anyone ask to be staff any more (staff join by invite link only, D-369),
    // so the list is empty. Publish only if a way to ask comes back.
    status: 'draft',
  },
  {
    slug: 'case-manager-assignments',
    topic: 'case-managers',
    audience: 'members and case managers',
    keywords: ['assign', 'assigned', 'guide', 'limit', 'limited', 'pause', 'paused', 'suspend', 'reason', 'log', 'audit', 'privacy'],
    title: 'Case manager assignments',
    summary:
      'Who your case manager is, what a case manager can and can’t see, and what is always written down.',
    updated: '2026-10-10',
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
