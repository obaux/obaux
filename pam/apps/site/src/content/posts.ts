import type { TopicId } from './topics';
import { RULES_SLUG, isRulesSigned } from './rules';

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
  /** `false`: the post carries its own way to a person, so it does not end with "Still stuck?" (Your safety). */
  readonly stillStuck?: false;
}

const ALL: readonly SupportPost[] = [
  {
    slug: 'something-didnt-go-through',
    topic: 'members',
    audience: 'everyone',
    title: 'When something doesn’t go through',
    summary: 'What each message means when something you tap doesn’t work, and what you can do about it.',
    updated: '2026-10-19',
    keywords: ['didn’t go through', 'didn’t work', 'not working', 'error', 'failed', 'offline', 'signed out', 'try again', 'slow', 'something’s wrong', 'couldn’t use that', 'not at this time', 'already changed'],
    // Held until D-618 is live: the site shows only what the live app does (Mira, Sage 19 October).
    status: 'draft',
  },
  {
    slug: 'program-books-a-visit',
    topic: 'members',
    audience: 'everyone',
    title: 'When a program books a visit for you',
    summary: 'A program you wrote to, signed up with or planned a visit at can book a visit for you. Here is where it shows and how to cancel it.',
    updated: '2026-10-17',
    keywords: ['book a visit', 'booked for you', 'program booked', 'booked by', 'cancel', 'trips', 'visit i did not make', 'someone booked', 'who can book', 'appointment'],
  },
  {
    slug: 'cant-sign-in',
    topic: 'members',
    audience: 'everyone',
    title: 'I can’t sign in',
    summary: 'How to get into Pam: who can join on their own, who needs an invite, and what to do when the code or the link doesn’t work.',
    updated: '2026-10-11',
    keywords: ['sign in', 'signin', 'login', 'log in', 'cant login', 'join', 'become a case manager', 'case manager', 'add my program', 'program', 'invite', 'code', 'no code', 'wrong code', 'password', 'locked out', 'get in', 'become a member'],
  },
  {
    slug: 'your-safety',
    topic: 'members',
    audience: 'everyone',
    title: 'Your safety',
    summary: 'What to do if you are in danger, in crisis, or a message feels unsafe.',
    updated: '2026-10-11',
    stillStuck: false,
    keywords: ['safety', 'safe', 'danger', 'emergency', '911', '988', 'crisis', 'unsafe', 'scared', 'afraid', 'threat', 'hurt', 'report', 'suspicious', 'block', 'suicide', 'abuse', 'harassed', 'suicidal', 'kill myself', 'hurt myself', 'self harm', 'violence', 'domestic violence', 'stalking', 'followed'],
  },
  {
    slug: 'start-here',
    topic: 'members',
    audience: 'everyone',
    title: 'When something isn’t working, start here',
    summary: 'The most common reasons Pam gets stuck, and what to do about each one.',
    updated: '2026-10-11',
    keywords: ['not working', 'problem', 'error', 'stuck', 'something went wrong', 'blank', 'empty', 'wont load', 'offline', 'no signal', 'code', 'invite', 'paused', 'missing place', 'broken', 'help'],
  },
  {
    slug: 'talking-to-pam',
    topic: 'members',
    audience: 'everyone',
    title: 'Getting help from Pam',
    summary: 'How to find an answer on the help desk, how to write to a person at Pam, and what to do if you are in danger.',
    updated: '2026-10-11',
    keywords: ['call', 'phone', 'phone number', 'number', 'talk', 'real person', 'human', 'someone', 'write', 'email', 'contact', 'still stuck', '911', '988', 'crisis', 'danger', 'unsafe', 'report'],
  },
  {
    slug: 'your-language',
    topic: 'members',
    audience: 'everyone',
    title: 'Using Pam in your language',
    summary: 'The seven languages Pam speaks, how to pick yours, and what changes when you do.',
    updated: '2026-10-11',
    keywords: ['language', 'languages', 'español', 'spanish', 'portuguese', 'chinese', 'mandarin', 'cantonese', 'russian', 'arabic', 'english', 'translate', 'translation', 'switch'],
  },
  {
    slug: 'is-the-place-told',
    topic: 'members',
    audience: 'residents and programs',
    title: 'Does the place know I’m coming?',
    summary: 'Programs on Pam see your visit. Most places are not told. How to call ahead, and what to do if they didn’t know you were coming.',
    updated: '2026-10-17',
    keywords: ['told', 'know', 'expect', 'expecting', 'coming', 'showed up', 'turned away', 'appointment', 'call ahead', 'front desk', 'list', 'no clue'],
  },
  {
    slug: 'who-is-my-guide',
    topic: 'members',
    audience: 'members',
    title: 'Who is my guide?',
    summary: 'Your guide is the person who invited you, or a staff member who looks after you. You may not have one yet.',
    updated: '2026-10-11',
    keywords: ['guide', 'case manager', 'who', 'invited', 'staff', 'nobody', 'no guide', 'help'],
  },
  {
    slug: 'texts-from-pam',
    topic: 'members',
    audience: 'everyone',
    title: 'Texts from Pam: which ones, and why one didn’t come',
    summary: 'The few texts Pam sends today, the rules for them, and what to do when one does not come.',
    updated: '2026-10-18',
    keywords: ['text', 'sms', 'code', 'sign in', 'reminder', 'stop', 'quiet hours', 'not now', 'did not come', 'no text'],
  },
  {
    slug: RULES_SLUG,
    topic: 'members',
    audience: 'members and programs',
    title: 'Signing a program’s rules',
    summary: 'What a program’s policy is, how you read and sign it in Pam, and what the program sees.',
    updated: '2026-10-16',
    keywords: ['policy', 'policies', 'rules', 'sign', 'signature', 'signing', 'bring id', 'program', 'before a visit', 'draw', 'type my name'],
    // Held until the signing screens are really in the app AND Will signs the English (signed-off.json).
    ...(isRulesSigned('en') ? {} : { status: 'draft' as const }),
  },
  {
    slug: 'planning-a-visit',
    topic: 'members',
    audience: 'members',
    title: 'Planning a visit',
    summary: 'Plan a visit to a place, change it, cancel it, and where past visits go.',
    updated: '2026-10-17',
    keywords: ['visit', 'trip', 'plan', 'plan a trip', 'new trip', 'appointment', 'change', 'cancel', 'past visits', 'service', 'book', 'schedule'],
  },
  {
    slug: 'what-others-can-see',
    topic: 'members',
    audience: 'everyone',
    title: 'What your guide, a program and others can see',
    summary: 'One table: what your guide, a program you joined and other members can see about you.',
    updated: '2026-10-17',
    keywords: ['see', 'privacy', 'private', 'who can see', 'messages', 'points', 'visits', 'share', 'table', 'read my messages'],
  },
  {
    slug: 'joining-pam',
    topic: 'members',
    audience: 'members',
    title: 'Joining Pam: with a link, a code, or on your own',
    summary: 'The three ways to join, the steps to sign in, and what to do if a link or a code does not work.',
    updated: '2026-10-11',
    keywords: ['join', 'sign up', 'sign in', 'link', 'code', 'invite', 'different phone', 'expired', 'phone number'],
  },
  {
    slug: 'joining-as-staff',
    topic: 'case-managers',
    audience: 'case managers and program leads',
    title: 'Joining Pam as a case manager or program lead',
    summary: 'Staff join with an invite link. Here are the steps, and what to do if you do not have one.',
    updated: '2026-10-16',
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
    updated: '2026-10-16',
    keywords: ['invite', 'link', 'code', 'send', 'expired', 'one number', 'invited people', 'create link'],
  },
  {
    slug: 'messages-in-pam',
    topic: 'members',
    audience: 'members, case managers and program leads',
    title: 'Messages: who can write, and why nothing is texted',
    summary: 'Who can start a chat with whom, how to send and report a message, and why a message does not come by text.',
    updated: '2026-10-18',
    keywords: ['message', 'chat', 'conversation', 'report', 'photo', 'document', 'new message', 'unsafe'],
  },
  {
    slug: 'points-and-badges',
    topic: 'members',
    audience: 'members',
    title: 'Points and badges, today',
    summary: 'How you earn points today, what the levels are, and who can see your points.',
    updated: '2026-10-16',
    keywords: ['points', 'badge', 'level', 'ladder', 'earn', 'rewards', 'returned', 'rooted'],
  },
  {
    slug: 'keeping-your-listing-up-to-date',
    topic: 'programs',
    audience: 'program leads',
    title: 'Keeping your program’s listing up to date',
    summary:
      'When you run a program on Pam, you can fix a phone number in a minute. Changing the name or address gets a quick check first.',
    updated: '2026-10-11',
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
    updated: '2026-10-16',
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
    updated: '2026-10-11',
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
