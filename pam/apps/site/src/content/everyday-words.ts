/**
 * The words people use for the same thing, so Support search can treat them as one. A person types the word
 * they know ("my CM", "log in", "my appointment"); a post uses Pam's word ("case manager", "sign in",
 * "visit"). Each group is words that mean the same thing to someone who is stuck; search (Wren, `lib/search.ts`)
 * reads a typed word as any word in its group.
 *
 * Sage (Voice & UX copy) owns the words; Wren owns how search uses them. Mira, 11 October, from Will's
 * smarter-search job. English only for now.
 *
 * Rules for a group:
 * - The first word is Pam's own word, the one the posts use.
 * - Lower case. A group may hold short phrases ("log in", "real person").
 * - A word belongs to one group only (a test checks), so a typed word never pulls in two meanings.
 * - Words people really type, misspellings included ("pasword", "appoinment").
 * - Words a person may use about their own situation are fine to search on, even where Pam never says them on a
 *   screen ("po", "probation officer"). They are never shown.
 */
export interface WordGroup {
  /** Pam's word first, then the everyday ones. */
  readonly words: readonly string[];
  /** Why the group exists, or a word that is close but kept out on purpose. Never shown. */
  readonly note?: string;
}

export const EVERYDAY_WORDS: readonly WordGroup[] = [
  // Signing in
  { words: ['code', 'sign-in code', 'verification', 'verify', 'pin', 'passcode', 'one time code', 'otp', 'pasword', 'password'],
    note: 'Pam has no password; people still type it when the code does not work.' },
  { words: ['sign in', 'log in', 'login', 'signin', 'logon', 'get in', 'access'] },
  { words: ['sign out', 'log out', 'logout', 'signout'] },
  { words: ['join', 'sign up', 'signup', 'register', 'enroll', 'enrol', 'create account', 'new account'] },
  { words: ['invite', 'invitation', 'invite link', 'link'] },
  { words: ['expired', 'too old', 'timed out', 'time out', 'stopped working', 'old code', 'old link'] },

  // Texts and messages
  { words: ['text', 'sms', 'txt', 'text message', 'texts'] },
  { words: ['message', 'chat', 'dm', 'inbox', 'conversation', 'write', 'reply'],
    note: 'Chat inside Pam. "text" is its own group: Pam never texts a message.' },

  // People
  { words: ['case manager', 'guide', 'cm', 'caseworker', 'case worker', 'worker', 'counselor', 'counsellor',
    'social worker', 'advocate', 'probation officer', 'parole officer', 'po', 'officer', 'navigator'],
    note: 'Pam says "your guide" in the app and "case manager" on the site and in posts.' },
  { words: ['program lead', 'provider', 'staff', 'program staff', 'front desk', 'coordinator'] },
  { words: ['member', 'resident', 'client', 'participant', 'user'] },
  { words: ['real person', 'someone', 'human', 'person', 'talk to someone', 'operator', 'agent'] },

  // Places and visits
  { words: ['place', 'program', 'service', 'center', 'centre', 'agency', 'organization', 'organisation', 'org',
    'resource', 'location', 'office', 'site'] },
  { words: ['visit', 'appointment', 'appt', 'appoinment', 'trip', 'booking', 'book', 'schedule', 'meeting', 'plan'] },
  { words: ['cancel', 'cant go', 'cant make it', 'call off', 'reschedule', 'move my visit', 'change time'] },
  { words: ['closed', 'shut', 'moved', 'gone', 'wrong address', 'not there', 'out of business'] },
  { words: ['saved', 'save', 'bookmark', 'favorite', 'favourite', 'starred', 'star'] },

  // Kinds of help (Pam's three, and what people ask for)
  { words: ['learning', 'school', 'class', 'classes', 'ged', 'training', 'course', 'education'] },
  { words: ['earning', 'job', 'jobs', 'work', 'employment', 'hiring', 'career', 'money'] },
  { words: ['family support', 'family', 'kids', 'children', 'childcare', 'parenting'] },
  { words: ['food', 'pantry', 'meals', 'groceries', 'eat'] },

  // The account
  { words: ['account', 'profile', 'my info', 'my details', 'settings', 'me'] },
  { words: ['paused', 'locked', 'blocked out', 'suspended', 'turned off', 'disabled', 'limited', 'restricted',
    'frozen account'] },
  { words: ['delete', 'remove my account', 'close my account', 'leave pam', 'deactivate'] },
  { words: ['phone number', 'number', 'cell', 'new phone', 'new number', 'mobile'] },
  { words: ['language', 'spanish', 'espanol', 'español', 'idioma', 'english', 'translate', 'translation',
    'portuguese', 'chinese', 'russian', 'arabic'] },

  // Privacy
  { words: ['who can see', 'private', 'privacy', 'see', 'watch', 'track', 'tracking', 'spy', 'monitor', 'share',
    'shared', 'report to'] },

  // Signing a program's rules
  { words: ['policy', 'policies', 'rules', 'form', 'forms', 'paperwork', 'agreement', 'waiver', 'sign', 'signature',
    'consent'] },

  // Points
  { words: ['points', 'badges', 'badge', 'rewards', 'level', 'score', 'prize'] },

  // Something is wrong
  { words: ['not working', 'broken', 'doesnt work', 'wont work', 'error', 'glitch', 'bug', 'problem', 'issue',
    'wrong', 'stuck', 'frozen', 'blank', 'wont load', 'loading', 'crash', 'happening'],
    note: 'Leads to start-here once it exists.' },

  // Help
  { words: ['help', 'support', 'assistance', 'call', 'phone pam', 'contact', 'hotline', 'helpline'] },
  { words: ['unsafe', 'safety', 'danger', 'scared', 'threat', 'harass', 'harassment', 'bothering', 'creepy'] },
  { words: ['block', 'report', 'mute', 'stop messages'] },
];

/** Every word or phrase, lower-cased, with the group it belongs to. */
export function wordIndex(): ReadonlyMap<string, WordGroup> {
  const index = new Map<string, WordGroup>();
  for (const g of EVERYDAY_WORDS) for (const w of g.words) index.set(w.toLowerCase(), g);
  return index;
}
