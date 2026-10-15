import { HELP_EMAIL } from '../lib/links';

/**
 * The Home page's words, in one file (Will's Figma "Pam — Website", Home, 11 October; Mira's rules the same day).
 * The default is Will's wording. A line that is not true today, or is a new promise, is HELD: `HELD` lists it
 * with the true sentence the page shows instead, and a test fails if a held line appears in `HOME`. To release one,
 * Will's card has to come back; then move its `wanted` text into `HOME` and delete its entry.
 * Sentences that are new on the page go to Sage to sign (A29); Will signs promises and anything legal.
 */
export interface HeldLine {
  readonly id: string;
  /** What the Figma says. */
  readonly wanted: string;
  /** What the page says instead. */
  readonly shown: string;
  readonly reason: string;
}

export const HOME = {
  hero: {
    before: 'Pam is ',
    green1: 'how',
    middle: ' modern cities offer public services ',
    green2: 'to actually help!',
    lead:
      'We’re raising the bar for how people engage with city services; great news for programs, case managers, and those looking for help.',
    pictures: 'Pam in pictures',
  },
  band: {
    label: 'Who is Pam for?',
    // The green card is a switcher (Will, 12 October, Figma "Callout card" 18:517): each name shows its own picture and line.
    views: [
      {
        id: 'residents',
        label: 'Residents',
        line: 'Find help, plan your visit, and talk to a real person.',
        alt: 'An isometric picture of Philadelphia with City Hall at the centre and map pins on the buildings.',
      },
      {
        id: 'providers',
        label: 'Program Providers',
        line: 'Your policies, signed before they arrive. Check in and go!',
        alt: 'A person walks through the warm, lit doorway of a city building.',
      },
      {
        id: 'managers',
        label: 'Case managers',
        line: 'Their plans, your guidance, in one place.',
        alt: 'A smiling person with a duffel bag looks at a phone in a bright community room.',
      },
    ],
  },
  rows: [
    {
      id: 'residents',
      head: 'One app. Real places. Real people.',
      body: 'See Learning, Earning, and Family Support near you, book a visit, and message your case manager.',
      chips: ['Work and money', 'Home and family', 'School and training'],
      cta: { label: 'Explore Philadelphia', href: 'app' },
      image: 'explore',
      alt: 'Pam’s Explore screen: a search box, filters for kinds of help, your next visit, and programs near you.',
    },
    {
      id: 'programs',
      head: 'Your services, built around people.',
      body: 'Residents find your program and plan a visit. They sign your policies before they visit, and you see who’s coming on your calendar.',
      cta: { label: 'Add your program', href: 'add-program' },
      image: 'calendar',
      alt: 'A program lead’s calendar in Pam: the week by day, with each person who is coming and a check-in button.',
    },
    {
      id: 'case-managers',
      head: 'Walk with them, one visit at a time.',
      body: 'Invite the people you work with, cheer on every step, and message them in Pam along the way.',
      cta: { label: 'Join as a case manager', href: '/support/cant-sign-in/' },
      image: 'conversation',
      alt: 'A conversation in Pam between a case manager and the person they work with, with documents shared in the chat.',
      bubble: 'Thursday at 2. I have the letter',
    },
  ],
  callouts: [
    {
      eyebrow: 'Privacy first',
      text: 'Pam was designed for privacy, so anyone, regardless of background or history can feel safe using it.',
      cta: { label: 'Read Privacy & Terms', href: 'privacy' },
    },
    {
      eyebrow: 'Support',
      text: `Use Pam in English, Spanish and five more languages. Write to ${HELP_EMAIL}: a person at Pam reads every message.`,
      cta: { label: 'Go to Support', href: '/support/' },
    },
  ],
  nav: { support: 'Support', signIn: 'Sign in' },
  footer: {
    links: ['Support', 'About Pam', 'Privacy', 'Terms', 'Contact'],
    copyright: '© 2026 Pam. All rights reserved.',
    tagline: 'City services in your pocket',
  },
} as const;

export const HELD: readonly HeldLine[] = [
  {
    id: '24-7',
    wanted: 'We’re here to help. Get 24/7 member support in English, Spanish, and five other languages',
    shown: HOME.callouts[1].text,
    reason: 'Will, 12 October (a65): hold until launch, because the website has to be translated first. Today the help desk is email with no hours.',
  },
  {
    id: 'case-manager-link',
    wanted: 'Join as a case manager, sending the person to sign in.',
    shown: HOME.rows[2].cta.label,
    reason: 'Will, 12 October (a65): the middle buttons go to sign in. Not this one yet: signing in would make a case manager a member account. It stays on the help post until Ava’s case-manager request page exists, then points there.',
  },
];
