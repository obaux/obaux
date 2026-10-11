import { POSTS, anyPostBySlug } from './posts';
import { RULES_SLUG } from './rules';

/**
 * What people type into Support search when they are stuck, in their own words, and the post that
 * answers each one. Will, 11 October 2026: "We want the help desk search to catch phrases like 'why is
 * this happening?', outline use cases, and find keywords to help map them to the posts; if no posts
 * exist and user hits an empty page, document this and push it to Wren and Sage for collaboration."
 *
 * Sage (Voice & UX copy) writes the phrases; Wren (website) builds the matching and tests it against
 * this list. A phrase with no post (`answer: null`), or whose post is still a draft, is a gap: the two
 * of them write that post together. English only for now (Will: languages come after a website change
 * merges).
 *
 * How to write a phrase: the way a person types it on a phone when something has gone wrong. Lower
 * case, no full stop, short, sometimes without the apostrophe ("didnt"), sometimes a question. Never
 * tidy it into Pam's own words: the point is to catch theirs.
 */
export interface SearchPhrase {
  /** What someone types. */
  readonly phrase: string;
  /** Who is most likely typing it. Website words (D-505). */
  readonly who: 'resident' | 'provider' | 'case manager' | 'anyone';
  /** The slug of the post that answers it best, or `null` when no post does yet. */
  readonly answer: string | null;
  /** Other posts that are fine to show under the best one. */
  readonly also?: readonly string[];
  /** For a gap: what the missing post needs to say, in a line. */
  readonly gap?: string;
}

export const SEARCH_PHRASES: readonly SearchPhrase[] = [
  // Signing in and codes
  { phrase: 'why didnt i get a code', who: 'anyone', answer: 'texts-from-pam', also: ['joining-pam'] },
  { phrase: 'code not coming', who: 'anyone', answer: 'texts-from-pam' },
  { phrase: 'the code doesnt work', who: 'anyone', answer: 'joining-pam', also: ['texts-from-pam'] },
  { phrase: 'cant sign in', who: 'anyone', answer: 'joining-pam', also: ['texts-from-pam'] },
  { phrase: 'it says that code is too old', who: 'resident', answer: 'joining-pam', also: ['sending-an-invite'] },
  { phrase: 'my link expired', who: 'anyone', answer: 'joining-pam', also: ['sending-an-invite', 'joining-as-staff'] },
  { phrase: 'code is for a different phone', who: 'resident', answer: 'joining-pam' },
  {
    phrase: 'i got a new phone number',
    who: 'anyone',
    answer: null,
    gap: 'Changing your phone number: call Pam, and what happens to your account and texts.',
  },

  // Joining
  { phrase: 'how do i join', who: 'resident', answer: 'joining-pam' },
  { phrase: 'i dont have a code', who: 'resident', answer: 'joining-pam' },
  { phrase: 'pam is not in my city', who: 'resident', answer: 'joining-pam' },
  { phrase: 'how do i join as staff', who: 'case manager', answer: 'joining-as-staff' },
  { phrase: 'i didnt get my invite email', who: 'provider', answer: 'joining-as-staff' },

  // Texts
  { phrase: 'how do i stop the texts', who: 'anyone', answer: 'texts-from-pam' },
  { phrase: 'i want texts again', who: 'anyone', answer: 'texts-from-pam' },
  { phrase: 'why didnt i get a reminder', who: 'resident', answer: 'texts-from-pam', also: ['planning-a-visit'] },
  { phrase: 'pam didnt text me', who: 'anyone', answer: 'texts-from-pam' },

  // Who can see what
  { phrase: 'who can see this', who: 'resident', answer: 'what-others-can-see' },
  { phrase: 'can my case manager read my messages', who: 'resident', answer: 'what-others-can-see', also: ['messages-in-pam'] },
  { phrase: 'does my probation officer see this', who: 'resident', answer: 'what-others-can-see', also: ['case-manager-assignments'] },
  { phrase: 'is this private', who: 'resident', answer: 'what-others-can-see' },
  { phrase: 'what does the program see', who: 'resident', answer: 'what-others-can-see', also: [RULES_SLUG] },

  // Guides and case managers
  { phrase: 'who is my guide', who: 'resident', answer: 'who-is-my-guide' },
  { phrase: 'i dont have a case manager', who: 'resident', answer: 'who-is-my-guide', also: ['case-manager-assignments'] },
  { phrase: 'change my case manager', who: 'resident', answer: 'case-manager-assignments' },
  { phrase: 'why cant i send messages', who: 'resident', answer: 'case-manager-assignments', also: ['messages-in-pam'] },
  { phrase: 'my account is paused', who: 'resident', answer: 'case-manager-assignments' },
  { phrase: 'i cant find my client', who: 'case manager', answer: 'case-manager-assignments' },

  // Visits
  { phrase: 'how do i plan a visit', who: 'resident', answer: 'planning-a-visit' },
  { phrase: 'cancel my appointment', who: 'resident', answer: 'planning-a-visit' },
  { phrase: 'change the time of my visit', who: 'resident', answer: 'planning-a-visit' },
  { phrase: 'where are my old visits', who: 'resident', answer: 'planning-a-visit' },
  {
    phrase: 'does the place know im coming',
    who: 'resident',
    answer: null,
    also: ['planning-a-visit'],
    gap: 'Is the place told about my visit? Only a place with a program lead on Pam sees it; a place from a public list is not told (D-498).',
  },
  {
    phrase: 'they said i missed it',
    who: 'resident',
    answer: null,
    also: ['what-others-can-see', 'planning-a-visit'],
    gap: 'A visit marked missed: who marks it, who sees it, and what to do if it is wrong.',
  },

  // A program's rules
  { phrase: 'what am i signing', who: 'resident', answer: RULES_SLUG },
  { phrase: 'do i have to sign', who: 'resident', answer: RULES_SLUG },
  { phrase: 'how do i sign the rules', who: 'resident', answer: RULES_SLUG },

  // Messages and safety
  { phrase: 'how do i message my case manager', who: 'resident', answer: 'messages-in-pam' },
  { phrase: 'someone is bothering me', who: 'anyone', answer: 'messages-in-pam' },
  { phrase: 'block someone', who: 'anyone', answer: 'messages-in-pam' },
  { phrase: 'report a message', who: 'anyone', answer: 'messages-in-pam' },
  { phrase: 'i feel unsafe', who: 'anyone', answer: 'messages-in-pam' },

  // Points
  { phrase: 'how do i get points', who: 'resident', answer: 'points-and-badges' },
  { phrase: 'what are points for', who: 'resident', answer: 'points-and-badges' },
  { phrase: 'what does guide mean', who: 'anyone', answer: 'pam-words' },

  // Something is wrong (Will's example)
  {
    phrase: 'why is this happening',
    who: 'anyone',
    answer: null,
    gap: 'When something isn’t working, start here: the common reasons (a code, a link, a paused account, no connection), each with what to do, then how to call Pam.',
  },
  { phrase: 'something went wrong', who: 'anyone', answer: null, gap: 'Same post as “why is this happening”.' },
  { phrase: 'the page is blank', who: 'anyone', answer: null, gap: 'Same post as “why is this happening”.' },
  { phrase: 'it wont load', who: 'anyone', answer: null, gap: 'Same post as “why is this happening”.' },

  // Talking to a person, language, account
  {
    phrase: 'how do i talk to a real person',
    who: 'anyone',
    answer: null,
    gap: 'Talking to someone at Pam: the number, Monday to Friday 9am to 5pm, the call is free, and what to do when we are closed.',
  },
  { phrase: 'pam phone number', who: 'anyone', answer: null, gap: 'Same post as “how do i talk to a real person”.' },
  {
    phrase: 'change my language',
    who: 'anyone',
    answer: null,
    gap: 'Using Pam in your language: the seven languages, how to switch, and that texts follow your choice.',
  },
  { phrase: 'en español', who: 'anyone', answer: null, gap: 'Same post as “change my language”.' },
  {
    phrase: 'delete my account',
    who: 'anyone',
    answer: null,
    gap: 'Deleting your account, or getting a copy of what Pam keeps: call Pam, we check it is you.',
  },

  // Finding places
  {
    phrase: 'where can i find food',
    who: 'resident',
    answer: null,
    gap: 'Finding a place: Explore, the kinds of help (Learning, Earning, Family Support), the map, and saving a place.',
  },
  { phrase: 'find a job', who: 'resident', answer: null, gap: 'Same post as “where can i find food”.' },
  {
    phrase: 'this place is closed',
    who: 'resident',
    answer: null,
    gap: 'Telling Pam a place is wrong: open the place, tap “Something is wrong here”, and what happens next.',
  },

  // Providers
  { phrase: 'how do i add my program', who: 'provider', answer: 'keeping-your-listing-up-to-date', also: ['joining-as-staff', 'one-phone-two-sides'] },
  { phrase: 'my program is still in review', who: 'provider', answer: 'keeping-your-listing-up-to-date' },
  { phrase: 'change our address', who: 'provider', answer: 'keeping-your-listing-up-to-date' },
  { phrase: 'use pam for myself and my program', who: 'provider', answer: 'one-phone-two-sides' },
  {
    phrase: 'who is coming to my program',
    who: 'provider',
    answer: null,
    gap: 'Your calendar: who is coming, by day, and checking people in when they arrive.',
  },
  {
    phrase: 'why wasnt i told about a visit',
    who: 'provider',
    answer: null,
    gap: 'Same post as “does the place know im coming”, from the program’s side: visits show on your calendar only for a program you added.',
  },

  // Case managers
  { phrase: 'how do i invite someone', who: 'case manager', answer: 'sending-an-invite' },
  { phrase: 'invite link expired', who: 'case manager', answer: 'sending-an-invite' },
  { phrase: 'what can i see about my people', who: 'case manager', answer: 'case-manager-assignments', also: ['what-others-can-see'] },
  { phrase: 'approve a staff request', who: 'anyone', answer: 'staff-requests' },
];

/** True when the phrase's post exists and is published on the site (not a draft). */
export function isAnswered(p: SearchPhrase): boolean {
  return p.answer !== null && POSTS.some((post) => post.slug === p.answer);
}

/**
 * The gaps: phrases no published post answers yet. A phrase whose post is a draft counts, because the
 * site does not show drafts. Wren and Sage write these posts together.
 */
export const SEARCH_GAPS: readonly SearchPhrase[] = SEARCH_PHRASES.filter((p) => !isAnswered(p));

/** Every slug named here must be a real post, published or draft (checked by a test). */
export function unknownSlugs(): readonly string[] {
  const named = SEARCH_PHRASES.flatMap((p) => [p.answer, ...(p.also ?? [])]).filter((s): s is string => s !== null);
  return [...new Set(named)].filter((slug) => !anyPostBySlug(slug));
}
