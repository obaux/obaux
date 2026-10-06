/**
 * Pam's user flows — the source of the Figma file "Pam — User flows".
 *
 * Will, 4 October 2026: "create a user flow for the entire app inside Figma
 * … document app changes by also updating user flows … so we have a visual
 * map of how the entire app is designed."
 *
 * Every screen here is a Storybook story, so the map is drawn from the real
 * screens, not redrawn by hand. To update the map after a change, edit this
 * file and run the steps in `docs/user-flows/README.md`; the
 * `.claude/skills/user-flows` skill says when and how.
 *
 * Shape:
 *   flows[]: { key, title, intro, roots[], nodes{}, edges[], changes[] }
 *   node:    { title, story, path, note?, changed?, actions?, image?, wide? }
 *     story   — Storybook story id (iframe.html?id=…)
 *     path    — the app route, shown under the screen
 *     changed — the DECISIONS entry that last changed it ("D-263"); the map
 *               marks it so the newest changes stand out
 *     actions — steps the capture script performs before the screenshot
 *               ({ fill: label, value } | { click: accessible name } |
 *                { press: key } | { wait: ms })
 *     image   — a file instead of a story (the link preview picture)
 *   edge:    [from, to, label, { dashed? }] — dashed for a way back or a
 *            link that leaves the app (a text, an email)
 *   roots    — the first column, top to bottom (a role's tabs, or entry points)
 *   changes  — the newest decisions this flow shows, newest first
 */

export const UPDATED = '2026-10-06';

/** Where each screen opens live — the branch's Storybook on Chromatic. */
export const STORYBOOK_URL = 'https://claude-pam-storybook--6abea9193da46b88ce90890f.chromatic.com';

export const flows = [
  {
    key: 'signin',
    title: 'Sign in & joining',
    intro:
      'How every person arrives. Staff come in by an invite link, which shows a "You\'re invited" picture when it is pasted into a text. Members can sign up from the phone. A link older than 30 days opens its own page, which emails a new one.',
    roots: ['preview', 'signin', 'expired'],
    nodes: {
      preview: {
        title: 'Invite link, pasted into a text',
        image: 'apps/web/public/og/invite.jpg',
        wide: true,
        path: '/signin/?invite=…&as=…',
        changed: 'D-263',
        note: 'Second carousel picture, Pam logo, "You\'re invited"',
      },
      invited: {
        title: 'Sign in — invited',
        story: 'onboarding--case-manager',
        path: '/signin/?invite=…&as=case-manager',
        changed: 'D-254',
        note: 'Black invite line, slides for their role',
      },
      code: {
        title: 'The code we texted',
        story: 'onboarding--case-manager',
        path: '/signin/ (code step)',
        changed: 'D-266',
        note: 'Drawn in: the button matches Send me a code',
        actions: [
          { fill: 'Your phone number', value: '215 555 0100' },
          { click: 'Send me a code' },
          { wait: 600 },
        ],
      },
      join: {
        title: 'About you (joining)',
        story: 'onboarding--case-manager',
        path: '/join/',
        actions: [
          { fill: 'Your phone number', value: '215 555 0100' },
          { click: 'Send me a code' },
          { wait: 600 },
          { fill: 'The code we texted you', value: '123456' },
          { wait: 800 },
          { click: 'Sign in' },
          { wait: 2000 },
        ],
      },
      cmHome: { title: 'Case manager Home', story: 'case-manager-screens--home', path: '/' },
      signin: {
        title: 'Sign in',
        story: 'member-created--sign-in',
        path: '/signin/',
        changed: 'D-266',
        note: 'The card sits flat under the pictures',
      },
      about: {
        title: 'About Pam',
        story: 'onboarding--about',
        path: '/about/',
        changed: 'D-259',
        note: 'A short story for each kind of person',
      },
      memberJoin: { title: 'Sign up (member)', story: 'onboarding--member', path: '/join/' },
      expired: {
        title: 'Link expired',
        story: 'onboarding--expired-link',
        path: '/invite/expired/',
        changed: 'D-263',
        note: 'Who sent it; asks only for an email',
      },
      sent: {
        title: 'Check your email',
        story: 'onboarding--expired-link',
        path: '/invite/expired/ (sent)',
        changed: 'D-263',
        actions: [
          { fill: 'Your email', value: 'andre@example.org' },
          { click: 'Email me a new link' },
          { wait: 800 },
        ],
      },
      email: {
        title: 'Email: your new link',
        story: 'onboarding-invite-email--program',
        path: 'Email (30-day link)',
        changed: 'D-263',
        note: 'Open Pam goes to Sign in (invited). Approved; sends once a provider is set up',
      },
    },
    edges: [
      ['preview', 'invited', 'Tap the link'],
      ['invited', 'code', 'Phone number'],
      ['code', 'join', '6-digit code'],
      ['join', 'cmHome', 'Done'],
      ['signin', 'about', 'About Pam (footer)'],
      ['signin', 'memberJoin', 'Sign up'],
      ['expired', 'sent', 'Email me a new link'],
      ['sent', 'email', 'Arrives by email', { dashed: true }],
    ],
    changes: [
      'D-266 — Sign in: the card sits flat under the pictures; the code step is drawn in to match',
      'D-263 — no phone needed to invite; 30-day links; expired links email a new one; "You\'re invited" preview',
      'D-259 — About Pam from the foot of Sign in',
      'D-254 — invites are links to Sign in',
    ],
  },
  {
    key: 'member',
    title: 'Member',
    intro:
      'Five tabs: Explore, Saved, Trips, Messages, Profile. A member finds a place, plans a visit, and talks to their case manager and programs.',
    roots: ['explore', 'saved', 'trips', 'messages', 'profile'],
    nodes: {
      explore: {
        title: 'Explore',
        story: 'member-created--explore',
        path: '/',
        changed: 'D-275',
        note: 'Area link opens a Location drawer: search, current location, Done',
      },
      place: {
        title: 'A place',
        story: 'member-created--place-profile',
        path: '/place/',
        changed: 'D-305',
        note: 'Place profile, or Visit profile when a visit is booked; "New message" row when the program wrote',
      },
      policies: {
        title: 'Policies to sign',
        story: 'member-created--place-policies',
        path: '/place/policies/',
        changed: 'D-270',
        note: 'Each policy, signed or not; Start signing',
      },
      policy: {
        title: 'A policy — read, then Sign',
        story: 'member-created--place-policy',
        path: '/place/policies/view/',
        changed: 'D-270',
        note: 'First Sign opens a half sheet to draw; after that, one tap',
      },
      newTrip: { title: 'Plan a visit', story: 'member-created--new-trip', path: '/trips/new/' },
      report: { title: 'Report a place', story: 'member-created--report-place', path: '/flag/' },
      saved: { title: 'Saved', story: 'member-created--saved', path: '/saved/' },
      trips: {
        title: 'Trips',
        story: 'member-created--trips',
        path: '/trips/',
        changed: 'D-270',
        note: 'Signatures needed / Policies signed on each trip; Sign policies after booking',
      },
      messages: { title: 'Messages', story: 'member-created--messages', path: '/messages/' },
      thread: {
        title: 'A conversation',
        story: 'member-created--conversation',
        path: '/messages/thread/',
        changed: 'D-276',
        note: 'With a program: the booked visit on top, opening the place; Back returns here',
      },
      options: { title: 'Conversation options', story: 'member-created--conversation-options', path: '/messages/thread/options/' },
      profile: {
        title: 'Profile',
        story: 'member-created--profile',
        path: '/profile/',
        changed: 'D-274',
        note: 'Award level tile (to Points) instead of Past trips; bell for text reminders',
      },
      connections: {
        title: 'Connections',
        story: 'member-created--connections',
        path: '/connections/',
        changed: 'D-272',
        note: 'Each card is the profile: message button, program name links to its place, who connected you',
      },
      alerts: {
        title: 'Text alerts',
        story: 'member-created--text-alerts',
        path: '/alerts/',
        changed: 'D-260',
        note: 'A switch for each kind of text',
      },
      reminders: { title: 'Text reminders (first yes)', story: 'member-created--reminders', path: '/reminders/' },
      language: { title: 'Language', story: 'member-created--language', path: '/language/' },
      help: { title: 'Get help', story: 'member-created--get-help', path: '/help/' },
      helpSafety: { title: 'Your safety', story: 'member-created--help-safety', path: '/help/safety/' },
      legal: { title: 'Legal', story: 'member-created--legal', path: '/legal/' },
      whoSees: { title: 'What others can see', story: 'member-created--what-others-can-see', path: '/legal/privacy/' },
      points: {
        title: 'Points',
        story: 'member-created--points',
        path: '/points/',
        changed: 'D-278',
        note: 'Your level with progress to the next, ways to earn, compact ladder, badge medals',
      },
    },
    edges: [
      ['explore', 'place', 'Tap a place'],
      ['place', 'newTrip', 'Schedule a visit · Change appointment'],
      ['place', 'report', 'Report'],
      ['place', 'policies', 'Policies to sign', { over: true }],
      ['policies', 'policy', 'A policy'],
      ['trips', 'policies', 'Sign policies (just booked)', { dashed: true }],
      ['newTrip', 'trips', 'Trip added', { dashed: true }],
      ['newTrip', 'explore', 'Visit moved: confetti, then home', { dashed: true }],
      ['messages', 'thread', 'Open'],
      ['thread', 'options', '⋯'],
      ['profile', 'connections', 'Connections'],
      ['connections', 'thread', 'Message (round button)', { dashed: true }],
      ['profile', 'reminders', 'Get text reminders'],
      ['reminders', 'alerts', 'Then: switches'],
      ['profile', 'language', 'Language'],
      ['profile', 'help', 'Get help'],
      ['help', 'helpSafety', 'Your safety'],
      ['profile', 'legal', 'Legal'],
      ['legal', 'whoSees', 'Who can see what'],
      ['profile', 'points', 'Points'],
    ],
    changes: [
      'D-305 — one visit tag on Saved and Explore; Place / Visit profile; New message on a place. D-292 — Saved: visit tags open the visit; coloured, glowing icons. D-291 — a place: Get directions, Send a message, Call, Website as rows. D-282 — a moved visit: confetti with the new time, then home. D-281 — a place from a trip: "Your next visit" card, Change appointment, hours before About',
      'D-278 — Points as a journey: level and progress, ways to earn, badge medals. D-279 — signing: pinned button, Done',
      'D-277 — Back returns to the screen you came from, everywhere. D-276 — a conversation shows the booked visit',
      'D-275 — Explore: the area opens a Location drawer (search, current location, Done)',
      'D-274 — Profile: award tile; bell for texts. D-273 — a place from a trip shows the visit',
      'D-272 — Connections cards: message button, program link, "Connected by"; no profile page',
      'D-271 — a place with a visit shows its policies on top: orange to sign, green when signed',
      'D-270 — read and sign a program\'s policies: draw once, then one tap; trips show what is signed',
      'D-265 — Explore: a centred, bolder search, smaller chips and a "Your next visit" card; bell and Help live on Profile',
    ],
  },
  {
    key: 'case-manager',
    title: 'Case manager',
    intro:
      'Four tabs: Home (their members), Saved, Messages, Profile. A case manager invites people, keeps up with their members and connects them to programs.',
    roots: ['home', 'saved', 'messages', 'profile'],
    nodes: {
      home: { title: 'Home — your members', story: 'case-manager-screens--home', path: '/' },
      member: { title: 'A member', story: 'case-manager-screens--member', path: '/person/' },
      past: { title: 'Past trips', story: 'case-manager-screens--member-past-trips', path: '/person/past/' },
      memberSaved: { title: 'Programs they saved', story: 'case-manager-screens--member-saved', path: '/person/saved/' },
      connect: { title: 'Connect to a program', story: 'case-manager-screens--connect-member', path: '/person/connect/' },
      invite: {
        title: 'Invite someone',
        story: 'case-manager-screens--invite',
        path: '/invite/',
        changed: 'D-315',
        note: 'A member, a program, or a case manager (D-315)',
      },
      inviteReady: {
        title: 'The link to send',
        story: 'case-manager-screens--invite',
        path: '/invite/ (link ready)',
        changed: 'D-263',
        actions: [{ click: 'Invite a member' }, { wait: 800 }],
      },
      saved: { title: 'Saved — starred people', story: 'case-manager-screens--saved', path: '/saved/' },
      messages: { title: 'Messages', story: 'case-manager-screens--messages', path: '/messages/' },
      thread: { title: 'A conversation', story: 'case-manager-screens--conversation', path: '/messages/thread/' },
      profile: { title: 'Profile', story: 'case-manager-screens--profile', path: '/profile/' },
      programs: { title: 'All programs', story: 'case-manager-screens--all-programs', path: '/programs/' },
      addProgram: { title: 'Add a program', story: 'case-manager-screens--add-program', path: '/programs/new/' },
      alerts: {
        title: 'Text alerts',
        story: 'case-manager-screens--text-alerts',
        path: '/alerts/',
        changed: 'D-260',
        note: '"Trip" explained by the info button',
      },
    },
    edges: [
      ['home', 'member', 'A member'],
      ['member', 'past', 'Past trips'],
      ['member', 'memberSaved', 'Saved programs'],
      ['member', 'connect', 'Connect'],
      ['home', 'invite', 'Invite someone (floating)'],
      ['invite', 'inviteReady', 'Invite a member / program / case manager'],
      ['messages', 'thread', 'Open'],
      ['profile', 'programs', 'All programs'],
      ['programs', 'addProgram', 'Add'],
      ['profile', 'alerts', 'Text alerts'],
    ],
    changes: ['D-315 — a case manager can invite a case manager', 'D-263 — Invite someone makes the link straight away', 'D-260 — text alert switches'],
  },
  {
    key: 'program-lead',
    title: 'Program lead',
    intro:
      'Four tabs: Home (who is coming in), Program, Messages, Profile. A program lead looks after their listing, the policies participants sign, and the people booked in.',
    roots: ['home', 'program', 'messages', 'profile'],
    nodes: {
      home: {
        title: 'Home — coming in',
        story: 'program-lead-screens--home',
        path: '/',
        changed: 'D-316',
        note: '"Coming in this week ▾"; a circle per visit to check people in; green pen = signed every policy',
      },
      book: {
        title: 'Book a visit for a member',
        story: 'program-lead-screens--book-for-member',
        path: '/program/book/',
        changed: 'D-322',
        note: 'Booked / not booked, when they wrote, the last line; then New trip, "Booking for Jordan"',
      },
      addPerson: {
        title: 'Add a person',
        story: 'program-lead-screens--add-person',
        path: '/program/book/new/',
        changed: 'D-322',
        note: 'Name and number; at the end Pam texts a link that opens on the visit',
      },
      member: {
        title: 'A member',
        story: 'program-lead-screens--member',
        path: '/person/',
        changed: 'D-324',
        note: 'Green pen = signed every policy; "Policies signed · 3 of 4"',
      },
      memberPolicies: {
        title: 'Policies signed',
        story: 'program-lead-screens--member-policies',
        path: '/person/policies/',
        changed: 'D-324',
        note: 'Which are signed; an alert when some are not',
      },
      invite: { title: 'Invite someone', story: 'program-lead-screens--invite', path: '/invite/', changed: 'D-263' },
      program: { title: 'Program', story: 'program-lead-screens--program', path: '/program/' },
      policies: {
        title: 'Policies for participants',
        story: 'program-lead-screens--policies',
        path: '/program/policies/',
        changed: 'D-261',
      },
      policy: {
        title: 'A policy — Preview / Signed',
        story: 'program-lead-screens--policy',
        path: '/program/policies/view/',
        changed: 'D-261',
      },
      messages: { title: 'Messages', story: 'program-lead-screens--messages', path: '/messages/' },
      profile: { title: 'Profile', story: 'program-lead-screens--profile', path: '/profile/' },
      programs: { title: 'Programs in Pam', story: 'program-lead-screens--all-programs', path: '/programs/' },
      alerts: { title: 'Text alerts', story: 'program-lead-screens--text-alerts', path: '/alerts/', changed: 'D-256' },
    },
    edges: [
      ['home', 'member', 'A person'],
      ['member', 'memberPolicies', 'Policies signed'],
      ['home', 'book', '+ Book a visit for a member'],
      ['book', 'addPerson', 'Add a person'],
      ['home', 'invite', '+ Invite someone'],
      ['program', 'policies', 'Policies for participants'],
      ['policies', 'policy', 'A policy'],
      ['profile', 'programs', 'Programs in Pam'],
      ['profile', 'alerts', 'Text alerts'],
    ],
    changes: [
      'D-324 — a member\'s Policies signed page, with an alert when some are not',
      'D-322 — Add a person: name and number, a text with a link, their visit as their first screen',
      'D-316 — check people in from Home; book a visit for somebody who wrote',
      'D-320 — the range is a word beside the title',
      'D-267 — Home opens on the week',
      'D-263 — Invite someone makes the link straight away',
      'D-261 — policies and the verified tick',
    ],
  },
  {
    key: 'super-admin',
    title: 'Super admin',
    intro:
      'Three tabs: Home (requests), Messages, Profile. The person running Pam decides who becomes staff, keeps an eye on every invite, and talks to staff — never to members.',
    roots: ['home', 'messages', 'profile'],
    nodes: {
      home: { title: 'Home — Requests', story: 'super-admin-screens--home', path: '/', changed: 'D-262' },
      requestProgram: {
        title: 'A requested program',
        story: 'super-admin-screens--request-program',
        path: '/requests/program/',
        changed: 'D-262',
      },
      invites: {
        title: 'Invited people',
        story: 'super-admin-screens--invites-log',
        path: '/invites/',
        changed: 'D-315',
        note: 'Active · Link open · Link expired · "+ New invite" top right',
      },
      invite: {
        title: 'Invite someone',
        story: 'super-admin-screens--invite',
        path: '/invite/',
        changed: 'D-315',
        note: 'A member, a program, or a case manager',
      },
      messages: { title: 'Messages', story: 'super-admin-screens--messages', path: '/messages/', changed: 'D-262' },
      thread: {
        title: 'With a case manager',
        story: 'super-admin-screens--thread',
        path: '/messages/thread/',
        changed: 'D-262',
      },
      profile: { title: 'Profile', story: 'super-admin-screens--profile', path: '/profile/' },
      everyone: { title: 'Everyone', story: 'super-admin-screens--everyone', path: '/directory/' },
      person: { title: 'A person', story: 'super-admin-screens--person', path: '/person/' },
      viewAs: { title: 'See the app as', story: 'super-admin-screens--view-as', path: '/view-as/' },
    },
    edges: [
      ['home', 'requestProgram', 'The program they described'],
      ['home', 'invites', 'Invited people (floating)'],
      ['invites', 'invite', '+ New invite'],
      ['profile', 'invite', 'Invite someone'],
      ['messages', 'thread', 'Open'],
      ['profile', 'everyone', 'Everyone'],
      ['everyone', 'person', 'A person'],
      ['profile', 'viewAs', 'See the app as'],
    ],
    changes: [
      'D-315 — Invite someone from Profile and from Invited people; a case manager can be invited by a case manager',
      'D-263 — Invited people log replaces renewal approvals',
      'D-262 — view a requested program, text the requester, message staff',
      'D-257 — Home is Requests',
    ],
  },
];
