import type { Role } from './index.js';

/**
 * Example conversations and example people to message, for `/messages/`
 * while a super admin is previewing a role (D-172) or a real account's own
 * conversations are genuinely empty — the same "real always wins, silently"
 * rule `dummy-people.ts` set on 16 September, applied to messaging.
 *
 * Split into its own file rather than folded into `dummy-people.ts`, for the
 * same bundle-budget reason `dummy-notifications.ts` gives: nothing on Home
 * needs this, only `/messages/`, so nothing outside that route should pay to
 * download it.
 *
 * **These rows are never wired to a real action.** A conversation row opens
 * `/messages/thread/?id=dummy-conv-…`, which the thread screen recognises
 * (`isDummyConversationId`) and answers from `DUMMY_THREADS` below plus a
 * session-only demo store (`demoMessages.ts`) — never from `useThread`, never
 * calling `openConversation` or inserting a real message. The "Start a
 * conversation" rows have no `href` and no `onClick` at all. `/admin/`'s dummy `PersonRow`s
 * *are* tappable, because they only ever navigate to `/person/`, a read-only
 * demo page — nothing on that screen writes anything. Messaging is
 * different: its one real action (`openConversation`, then sending inside
 * the thread it creates) is a write under the caller's real, signed-in
 * account, and D-171 already settled that a super admin must never
 * originate a real message, full stop. A dummy row that *looked* tappable
 * and quietly called that RPC under whichever real account was doing the
 * previewing would be exactly the backdoor D-171 closed. See the file
 * comment in `apps/web/src/app/messages/page.tsx` for how this composes
 * with `viewedRole`.
 */

export interface DummyConversation {
  readonly id: string;
  readonly otherFirstName: string;
  readonly otherRole: Role;
  readonly lastMessageAt: string;
  readonly unread: boolean;
}

const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/** One example set per role that can message at all — member, admin, provider. Nothing for super_admin (D-171). */
export const DUMMY_CONVERSATIONS: Readonly<Record<'member' | 'admin' | 'provider', readonly DummyConversation[]>> = {
  member: [
    { id: 'dummy-conv-1', otherFirstName: 'Teresa', otherRole: 'admin', lastMessageAt: hoursAgo(3), unread: true },
    { id: 'dummy-conv-2', otherFirstName: 'Sandra', otherRole: 'provider', lastMessageAt: daysAgo(2), unread: false },
  ],
  admin: [
    { id: 'dummy-conv-3', otherFirstName: 'Jordan', otherRole: 'member', lastMessageAt: hoursAgo(1), unread: true },
    { id: 'dummy-conv-4', otherFirstName: 'Keisha', otherRole: 'member', lastMessageAt: daysAgo(1), unread: false },
  ],
  provider: [
    { id: 'dummy-conv-5', otherFirstName: 'Miguel', otherRole: 'member', lastMessageAt: hoursAgo(5), unread: false },
  ],
};

export interface DummyMessageablePerson {
  readonly profileId: string;
  readonly firstName: string;
}

/**
 * Who a previewed role's "Start a conversation" list shows. A member's list is
 * their own case manager and program (D-176) — the same two people their
 * example conversations already name, since in the real thing the list and
 * the conversations are the same relationships.
 */
export const DUMMY_STARTABLE: Readonly<Record<'member' | 'admin' | 'provider', readonly DummyMessageablePerson[]>> = {
  member: [
    { profileId: 'dummy-start-4', firstName: 'Chris' },
  ],
  admin: [
    { profileId: 'dummy-start-1', firstName: 'Aaliyah' },
    { profileId: 'dummy-start-2', firstName: 'Devon' },
  ],
  provider: [{ profileId: 'dummy-start-3', firstName: 'Priya' }],
};

export interface DummyThreadMessage {
  readonly id: string;
  /** True when the previewed person said it; false for the other side. */
  readonly mine: boolean;
  readonly body: string;
  readonly at: string;
}

/**
 * What each example conversation holds, for the demo thread screen (D-180).
 * Written from the previewed role's own side — so `member`'s conversation
 * with Teresa reads with Teresa's lines as "theirs", and `admin`'s
 * conversation with Jordan reads with Jordan's lines as "theirs".
 */
export const DUMMY_THREADS: Readonly<Record<string, readonly DummyThreadMessage[]>> = {
  'dummy-conv-1': [
    { id: 'dummy-msg-1a', mine: false, body: 'Hi Jordan — how did the first class go?', at: daysAgo(1) },
    { id: 'dummy-msg-1b', mine: true, body: 'Good. The room was easy to find.', at: daysAgo(1) },
    { id: 'dummy-msg-1c', mine: false, body: 'Great. Same time Thursday. Call me if the bus is late.', at: hoursAgo(3) },
  ],
  'dummy-conv-2': [
    { id: 'dummy-msg-2a', mine: false, body: 'Your spot in the computer class is confirmed for Monday.', at: daysAgo(2) },
    { id: 'dummy-msg-2b', mine: true, body: 'Thank you. What should I bring?', at: daysAgo(2) },
  ],
  'dummy-conv-3': [
    { id: 'dummy-msg-3a', mine: true, body: 'Hi Jordan — checking in. How is the week going?', at: daysAgo(1) },
    { id: 'dummy-msg-3b', mine: false, body: 'Going okay. I got to the class on time.', at: hoursAgo(1) },
  ],
  'dummy-conv-4': [
    { id: 'dummy-msg-4a', mine: true, body: 'Keisha, the food pantry is open Saturdays now.', at: daysAgo(1) },
  ],
  'dummy-conv-5': [
    { id: 'dummy-msg-5a', mine: false, body: 'Is the Tuesday session still on?', at: hoursAgo(6) },
    { id: 'dummy-msg-5b', mine: true, body: 'Yes — 10am, ask for Sandra at the desk.', at: hoursAgo(5) },
  ],
};

export function isDummyConversationId(id: string): boolean {
  return id.startsWith('dummy-conv-');
}

/** The other person in an example conversation, by its id, for the thread title. */
export function dummyConversationById(id: string): DummyConversation | null {
  for (const rows of Object.values(DUMMY_CONVERSATIONS)) {
    const hit = rows.find((c) => c.id === id);
    if (hit) return hit;
  }
  return null;
}
