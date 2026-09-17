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
 * **These rows are never wired to a real action.** `/messages/` renders them
 * with no `href` and no `onClick` — no tap opens a thread, starts a
 * conversation, or calls `openConversation`. `/admin/`'s dummy `PersonRow`s
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

/** Who a previewed case manager or program admin's "Start a conversation" list shows — staff roles only. */
export const DUMMY_STARTABLE: Readonly<Record<'admin' | 'provider', readonly DummyMessageablePerson[]>> = {
  admin: [
    { profileId: 'dummy-start-1', firstName: 'Aaliyah' },
    { profileId: 'dummy-start-2', firstName: 'Devon' },
  ],
  provider: [{ profileId: 'dummy-start-3', firstName: 'Priya' }],
};
