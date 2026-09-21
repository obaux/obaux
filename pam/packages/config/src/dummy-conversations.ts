import type { Role } from './index.js';

/**
 * Example conversations, for `/messages/` and `/messages/thread/` while a
 * super admin is previewing a role (D-172, D-180, D-183) or a real
 * account's own list is genuinely empty — the same "real always wins,
 * silently" rule `dummy-people.ts` set on 16 September.
 *
 * ## One cast, written once
 *
 * The people are `dummy-people.ts`'s: Jordan (`dummy-m1`), Keisha
 * (`dummy-m2`) and Miguel (`dummy-m3`) are members; Teresa (`dummy-a1`) is
 * the case manager; Sandra (`dummy-p1`) runs Example Learning Center — the
 * same program the D-175 badge already puts on Jordan and Miguel. Four
 * threads connect them, and each thread is written **once**, from the
 * conversation's own point of view (`from: 'member' | 'staff'`), never per
 * role. Whichever role is previewing, `dummyThreadFor()` flips `mine` for
 * their side of it — so Teresa's conversation with Jordan seen as Teresa
 * and seen as Jordan is the same eight messages, and cannot drift into two
 * different stories (D-183).
 *
 * ## Ids carry the pair
 *
 * A conversation id is `dummy-conv-<memberId>-<staffId>`. The thread screen
 * recognises the prefix (`isDummyConversationId`, the same shape `/place/`
 * uses for `dummy-place-…`) and reads both names back out of the id — which
 * is also what lets a "Start a conversation" row, or `/person/`'s "Message
 * Aaliyah", open an example thread for a pair that has no written thread
 * yet: an empty chat log and a composer, backed by the session-only store in
 * `demoMessages.ts`. Nothing about a `dummy-conv-` id ever reaches
 * `useThread`, `open_direct_conversation()` or `messages`.
 *
 * Split into its own file for the bundle-budget reason `dummy-notifications.ts`
 * gives: nothing on Home needs this, so nothing outside `/messages/` should
 * download it.
 */

const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();
const daysAgo = (n: number, hour = 10) =>
  new Date(Date.now() - n * 86_400_000 - (10 - hour) * 3_600_000).toISOString();

/** The side of a two-person conversation a message came from. */
export type DummySide = 'member' | 'staff';

export interface DummyThreadMessage {
  readonly id: string;
  readonly from: DummySide;
  readonly body: string;
  readonly at: string;
}

const CONVERSATION_PREFIX = 'dummy-conv-';

export function isDummyConversationId(id: string): boolean {
  return id.startsWith(CONVERSATION_PREFIX);
}

/** The example conversation between a member and a staff person, by their `DummyPerson.id`s. */
export function dummyConversationIdBetween(memberId: string, staffId: string): string {
  return `${CONVERSATION_PREFIX}${memberId}-${staffId}`;
}

/** The two `DummyPerson.id`s an example conversation id names, or null. */
export function dummyConversationPair(id: string): { memberId: string; staffId: string } | null {
  if (!isDummyConversationId(id)) return null;
  // `dummy-m1-dummy-a1` — ids are `dummy-<letter><n>`, so split on the second `dummy-`.
  const rest = id.slice(CONVERSATION_PREFIX.length);
  const cut = rest.indexOf('-dummy-');
  if (cut < 0) return null;
  return { memberId: rest.slice(0, cut), staffId: rest.slice(cut + 1) };
}

function thread(pair: string, messages: readonly [DummySide, string, string][]): [string, DummyThreadMessage[]] {
  return [
    pair,
    messages.map(([from, body, at], i) => ({ id: `${pair}-${i + 1}`, from, body, at })),
  ];
}

/**
 * The written threads. Newest message last; the newest is from the *other*
 * side of whoever is more likely to be previewing, so a list has something
 * unread to show. A missed session is handled kindly; nothing here names a
 * conviction or a status — the dignity rules apply to examples too.
 */
export const DUMMY_THREADS: Readonly<Record<string, readonly DummyThreadMessage[]>> = Object.fromEntries([
  // Jordan (member) and Teresa (case manager)
  thread(dummyConversationIdBetween('dummy-m1', 'dummy-a1'), [
    ['staff', 'Hi Jordan, it is Teresa. I put you down for the GED class at Example Learning Center. It starts Monday at 10.', daysAgo(6, 9)],
    ['member', 'Thank you. Which bus goes there?', daysAgo(6, 12)],
    ['staff', 'The 47 stops right outside. It runs every 15 minutes in the morning.', daysAgo(6, 12)],
    ['member', 'Got it. I will be there.', daysAgo(5, 8)],
    ['staff', 'How did Monday go?', daysAgo(4, 16)],
    ['member', 'Good. The room was easy to find and the teacher is patient.', daysAgo(4, 18)],
    ['staff', 'That is great to hear. Your ID appointment is Thursday at 2. Bring the letter I gave you.', daysAgo(2, 11)],
    ['member', 'Thursday at 2. I have the letter.', daysAgo(2, 13)],
    ['staff', 'One more thing: the class moved to room 12 this week. Same time.', hoursAgo(3)],
  ]),
  // Jordan (member) and Sandra (program: Example Learning Center)
  thread(dummyConversationIdBetween('dummy-m1', 'dummy-p1'), [
    ['staff', 'Hi Jordan, this is Sandra at Example Learning Center. Your spot in the GED class is confirmed.', daysAgo(5, 11)],
    ['member', 'Thank you. What should I bring?', daysAgo(5, 14)],
    ['staff', 'Just yourself. We have notebooks and pens. Ask for me at the front desk.', daysAgo(5, 14)],
    ['member', 'I might be a few minutes late Wednesday. The bus was slow last time.', daysAgo(3, 8)],
    ['staff', 'No problem at all. Come in quietly and take any seat.', daysAgo(3, 8)],
    ['staff', 'We missed you Wednesday. Is everything okay?', daysAgo(1, 12)],
    ['member', 'Sorry. My shift ran over. Can I still come Friday?', hoursAgo(20)],
    ['staff', 'Of course. Friday at 10. See you then.', hoursAgo(19)],
  ]),
  // Keisha (member) and Teresa (case manager)
  thread(dummyConversationIdBetween('dummy-m2', 'dummy-a1'), [
    ['staff', 'Hi Keisha, it is Teresa. The food pantry on Broad Street is open Saturdays now, 9 to 1.', daysAgo(4, 10)],
    ['member', 'Good to know. Do I need to sign up first?', daysAgo(4, 15)],
    ['staff', 'No sign-up. Bring a bag if you have one.', daysAgo(4, 15)],
    ['member', 'I went Saturday. They were kind. Thank you.', daysAgo(2, 14)],
    ['staff', 'I am glad. Do you still want help with the computer class?', daysAgo(1, 9)],
    ['member', 'Yes. Evenings are better for me.', hoursAgo(5)],
  ]),
  // Miguel (member) and Sandra (program: Example Learning Center)
  thread(dummyConversationIdBetween('dummy-m3', 'dummy-p1'), [
    ['member', 'Hi. Is the Tuesday session still on?', daysAgo(3, 9)],
    ['staff', 'Yes. 10 in the morning, room 8. Ask for Sandra at the desk.', daysAgo(3, 9)],
    ['member', 'Thank you. I will be there.', daysAgo(3, 10)],
    ['staff', 'You did well today. Same time next week.', daysAgo(2, 12)],
    ['member', 'Can we start at 10:30 next time? My bus gets in late.', hoursAgo(26)],
    ['staff', 'Yes, 10:30 works. I will save you a seat.', hoursAgo(25)],
  ]),
]);

/**
 * What a preview of `role` is looking at: the example conversations that
 * belong to "you" — `DUMMY_SELF` in `dummy-people.ts`: Jordan for a member,
 * Teresa for a case manager, Sandra for a program (D-183).
 */
export const DUMMY_SELF_ID: Readonly<Record<'member' | 'admin' | 'provider', string>> = {
  member: 'dummy-m1',
  admin: 'dummy-a1',
  provider: 'dummy-p1',
};

/** Which side of a conversation `role` sits on. */
export function dummySideFor(role: Role): DummySide {
  return role === 'member' ? 'member' : 'staff';
}

/** An example thread as `role` would read it — the written messages with `mine` flipped for their side. */
export function dummyThreadFor(
  conversationId: string,
  role: Role,
): readonly { id: string; body: string; at: string; mine: boolean }[] {
  const side = dummySideFor(role);
  return (DUMMY_THREADS[conversationId] ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    at: m.at,
    mine: m.from === side,
  }));
}

export interface DummyConversation {
  readonly id: string;
  /** The other person's `DummyPerson.id`. */
  readonly otherId: string;
  readonly lastMessageAt: string | null;
  /** The newest message is from the other side, unread for this viewer. */
  readonly unread: boolean;
  readonly preview: { readonly body: string; readonly mine: boolean } | null;
}

/** The example conversation list for a preview of `role`, newest first (D-183). */
export function dummyConversationsFor(role: 'member' | 'admin' | 'provider'): readonly DummyConversation[] {
  const self = DUMMY_SELF_ID[role];
  const side = dummySideFor(role);
  return Object.entries(DUMMY_THREADS)
    .map(([id, messages]) => {
      const pair = dummyConversationPair(id);
      if (!pair) return null;
      const otherId = side === 'member' ? pair.staffId : pair.memberId;
      const selfId = side === 'member' ? pair.memberId : pair.staffId;
      if (selfId !== self) return null;
      const last = messages[messages.length - 1] ?? null;
      return {
        id,
        otherId,
        lastMessageAt: last?.at ?? null,
        unread: last !== null && last.from !== side,
        preview: last ? { body: last.body, mine: last.from === side } : null,
      };
    })
    .filter((c): c is DummyConversation => c !== null)
    .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
}

/**
 * Who a preview of `role` could *start* a conversation with — people on
 * their example list who have no thread yet. A case manager's caseload
 * beyond the two she is already talking to; a program's other enrolled
 * member. A member (Jordan) already has both of his people in the list
 * above, so his is empty — which is also the real rule: a member's staff
 * are exactly the people already in their conversations.
 */
export const DUMMY_STARTABLE: Readonly<Record<'member' | 'admin' | 'provider', readonly string[]>> = {
  member: [],
  admin: ['dummy-m4', 'dummy-m5'],
  provider: ['dummy-m6'],
};

/**
 * Who a preview of `role` can pick in "New message" (D-186): everyone on
 * their example list — the people already in their conversations plus
 * `DUMMY_STARTABLE` — the way `messageable_people()` lists everyone a real
 * account may reach whether or not a conversation exists yet. Each entry
 * carries the example conversation a pick opens.
 */
export function dummyPickerFor(
  role: 'member' | 'admin' | 'provider',
): readonly { readonly personId: string; readonly conversationId: string }[] {
  const self = DUMMY_SELF_ID[role];
  const inConversations = dummyConversationsFor(role).map((c) => ({ personId: c.otherId, conversationId: c.id }));
  const startable = DUMMY_STARTABLE[role].map((id) => ({
    personId: id,
    conversationId: role === 'member' ? dummyConversationIdBetween(self, id) : dummyConversationIdBetween(id, self),
  }));
  return [...inConversations, ...startable];
}

export interface DummyReport {
  readonly id: string;
  /** Who said it — a `DummyPerson.id`. */
  readonly aboutId: string;
  /** Who said it was not safe — a `DummyPerson.id`. */
  readonly reporterId: string;
  /** A `MESSAGE_REPORT_REASONS` key. */
  readonly reason: string;
  readonly excerpt: string;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
}

/**
 * Reported messages, for the "Reported" section a case manager or super
 * admin preview sees (D-184) — the same cast, and the same two names the
 * example bell rows already use (`dummy-notifications.ts`: "A message from
 * Keisha was reported" for a super admin, "…from Jordan…" for a case
 * manager). The excerpts are plain and mild on purpose: an example of the
 * *mechanism*, not of anybody's worst day.
 */
export const DUMMY_REPORTS: readonly DummyReport[] = [
  {
    id: 'dummy-report-1',
    aboutId: 'dummy-m2',
    reporterId: 'dummy-a1',
    reason: 'unwanted',
    excerpt: 'Can you just give me your home address so I can drop it off.',
    createdAt: daysAgo(1, 15),
    resolvedAt: null,
  },
  {
    id: 'dummy-report-2',
    aboutId: 'dummy-m1',
    reporterId: 'dummy-p1',
    reason: 'other',
    excerpt: 'Stop asking me about Friday. I said I would come.',
    createdAt: daysAgo(2, 9),
    resolvedAt: daysAgo(1, 11),
  },
];
