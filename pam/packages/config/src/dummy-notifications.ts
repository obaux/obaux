import type { Role } from './index.js';

/**
 * What each kind of person sees on the bell and on `/notifications/`, when
 * they have nothing real there yet.
 *
 * Split out from the people data (`dummy-people.ts`) on purpose: `HeaderBell`
 * imports only this file and `dummy-flag.ts`, and `HeaderBell` sits on every
 * signed-in screen, including Home — which is exactly what §12's bundle
 * budget measures. Pulling in the member/program/case-manager arrays just to
 * answer "how many are unread" cost 1.6 kB over budget the first time this
 * was one file; this is the fix, not a hypothetical.
 */

const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export interface DummyNotification {
  readonly id: string;
  /** A real locale key wherever one already exists, so the real rendering path is exercised. */
  readonly bodyKey: string;
  readonly bodyVars: Record<string, string>;
  readonly createdAt: string;
  readonly isNew: boolean;
}

/**
 * One example set per role. Members and programs have no real notifications
 * table entries at all yet (0038's triggers write only `service_flagged` and
 * `message_reported`, and only case managers and the super admin receive
 * them) — these are a preview of what each kind of person will see, not a
 * stand-in for existing rows.
 */
export const DUMMY_NOTIFICATIONS: Record<Role, readonly DummyNotification[]> = {
  member: [
    {
      id: 'dummy-n-member-1',
      bodyKey: 'notify.demo.pointsEarned',
      bodyVars: { points: '25', reason: 'finishing setup' },
      createdAt: daysAgo(1),
      isNew: true,
    },
    {
      id: 'dummy-n-member-2',
      bodyKey: 'notify.demo.savedPlaceUpdated',
      bodyVars: { place: 'Example Learning Center' },
      createdAt: daysAgo(3),
      isNew: false,
    },
  ],
  provider: [
    {
      id: 'dummy-n-provider-1',
      bodyKey: 'notify.demo.newInterest',
      bodyVars: { count: '3', program: 'GED classes' },
      createdAt: hoursAgo(5),
      isNew: true,
    },
  ],
  admin: [
    {
      id: 'dummy-n-admin-1',
      bodyKey: 'notify.service_flagged',
      bodyVars: { reason: 'closed', place: 'Example Food Pantry' },
      createdAt: hoursAgo(3),
      isNew: true,
    },
    {
      id: 'dummy-n-admin-2',
      bodyKey: 'notify.message_reported',
      bodyVars: { name: 'Jordan' },
      createdAt: daysAgo(2),
      isNew: false,
    },
  ],
  super_admin: [
    {
      id: 'dummy-n-super-1',
      bodyKey: 'notify.service_flagged',
      bodyVars: { reason: 'wrong_info', place: 'Example Workforce Center' },
      createdAt: hoursAgo(1),
      isNew: true,
    },
    {
      id: 'dummy-n-super-2',
      bodyKey: 'notify.message_reported',
      bodyVars: { name: 'Keisha' },
      createdAt: daysAgo(1),
      isNew: true,
    },
  ],
};
