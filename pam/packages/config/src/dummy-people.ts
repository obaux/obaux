import type { AccessStatus, Role } from './index.js';

/**
 * Sample people — for every list of humans that has nobody in it yet.
 *
 * Will, 16 September: "so we can add fake avatars to people lists... feed
 * these in the different views for each type... show what the app can do."
 * A case manager screen with a real invite system and zero invited people, a
 * provider screen for a feature that is not built yet, a directory with one
 * real account in it — none of that demonstrates anything to somebody looking
 * at PAM for the first time.
 *
 * Notifications and saved places have their own files —
 * `dummy-notifications.ts`, `dummy-places.ts` — even though they read like
 * they belong here. `HeaderBell` and `useSavedPlaces` are both on Home, which
 * is what §12's bundle budget is measured against, and neither of them needs
 * a single row from this file; see those files' own comments for the 1.6 kB
 * this being one file actually cost.
 *
 * ## The rule this file exists to keep
 *
 * **Real data always wins, silently.** Every screen that draws from here
 * checks its real query first and reaches for this file only when the real
 * answer is empty — the exact pattern `hours.ts` set on 16 September for
 * placeholder opening hours. The day a case manager actually invites members,
 * `useCaseload` stops returning `'empty'`, and every dummy row on that screen
 * disappears without anybody touching this file or the screen it renders on.
 * Nothing here is ever preferred over something real, and nothing here is
 * ever mixed into a real list — it is one or the other, per screen, never both.
 *
 * **Every screen that shows these people says so.** A list of names presented
 * with nothing marking it as an example is a list somebody could mistake for
 * real accounts — the same reasoning D-044 applied to "Example Learning
 * Center" on a sample place card. Each screen using this file pairs it with a
 * caption through `admin.example.note` / `directory.example.note` /
 * `interested.example.note` / `person.example.note`.
 *
 * ## Why initials, not photos
 *
 * "Fake avatars" here means Astryx's own initials-and-colour fallback —
 * `<Avatar name="…">` with no `src` — the same avatar every real person in
 * PAM already gets. A case manager's `PersonCard` already deliberately never
 * fetches a photo: "a member's photo is not on the §4.1 list of what an admin
 * may see, and fetching it here would widen the contract by a column." A
 * placeholder photo for a *fictional* person would not widen anybody's real
 * contract, but it would teach every list in the product to expect a `src`
 * that real rows do not have and are not supposed to grow — the demo would
 * stop looking like the product the day real people start appearing in it.
 * Distinct names are what make a list of initials read as a busy roster
 * rather than a wall of grey circles; that is the whole trick here.
 *
 * ## Turning it off
 *
 * Flip `USE_DUMMY_PEOPLE` in `dummy-flag.ts` and every screen in this file's
 * audience falls back to its own real empty state — "Nobody on your list
 * yet", "Nobody of that kind yet" — exactly as it did before this existed.
 */

export interface DummyPerson {
  readonly id: string;
  readonly firstName: string;
  readonly role: Role;
  readonly regionName: string;
  readonly accessStatus: AccessStatus;
  /** ISO timestamp, or null for "has not opened PAM yet". */
  readonly lastActiveAt: string | null;
  /** Members only. */
  readonly points?: number;
  /** Programs only — the organisation they run, not a person's own name. */
  readonly orgName?: string;
}

const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/** For a case manager's caseload, and folded into the super admin directory. */
export const DUMMY_MEMBERS: readonly DummyPerson[] = [
  {
    id: 'dummy-m1',
    firstName: 'Jordan',
    role: 'member',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: hoursAgo(4),
    points: 175,
  },
  {
    id: 'dummy-m2',
    firstName: 'Keisha',
    role: 'member',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: daysAgo(1),
    points: 420,
  },
  {
    id: 'dummy-m3',
    firstName: 'Miguel',
    role: 'member',
    regionName: 'Philadelphia',
    accessStatus: 'limited',
    lastActiveAt: daysAgo(3),
    points: 50,
  },
  {
    id: 'dummy-m4',
    firstName: 'Aaliyah',
    role: 'member',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: daysAgo(6),
    points: 300,
  },
  {
    id: 'dummy-m5',
    firstName: 'Devon',
    role: 'member',
    regionName: 'Philadelphia',
    accessStatus: 'suspended',
    lastActiveAt: daysAgo(14),
    points: 25,
  },
  {
    id: 'dummy-m6',
    firstName: 'Priya',
    role: 'member',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: null,
    points: 0,
  },
];

/** "Program leads" — providers, for the case manager and the directory. */
export const DUMMY_PROGRAM_LEADS: readonly DummyPerson[] = [
  {
    id: 'dummy-p1',
    firstName: 'Sandra',
    role: 'provider',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: hoursAgo(2),
    orgName: 'Example Learning Center',
  },
  {
    id: 'dummy-p2',
    firstName: 'Marcus',
    role: 'provider',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: daysAgo(2),
    orgName: 'Example Workforce Center',
  },
  {
    id: 'dummy-p3',
    firstName: 'Renee',
    role: 'provider',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: daysAgo(5),
    orgName: 'Example Food Pantry',
  },
  {
    id: 'dummy-p4',
    firstName: 'Omar',
    role: 'provider',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: null,
    orgName: 'Example Trade School',
  },
];

/** Other case managers, for the super admin directory. */
export const DUMMY_CASE_MANAGERS: readonly DummyPerson[] = [
  {
    id: 'dummy-a1',
    firstName: 'Teresa',
    role: 'admin',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: hoursAgo(6),
  },
  {
    id: 'dummy-a2',
    firstName: 'Chris',
    role: 'admin',
    regionName: 'Philadelphia',
    accessStatus: 'active',
    lastActiveAt: daysAgo(2),
  },
];

/** Everyone in this file, for the super admin's filterable directory. */
export const DUMMY_EVERYONE: readonly DummyPerson[] = [
  ...DUMMY_MEMBERS,
  ...DUMMY_PROGRAM_LEADS,
  ...DUMMY_CASE_MANAGERS,
];

export interface DummyInterest {
  readonly person: DummyPerson;
  /** Which of the provider's own programs — a label, not a foreign key. */
  readonly programLabel: string;
  readonly interestedAt: string;
}

/**
 * "People interested in your program" — the provider screen §6 always meant
 * to build and never has. Every provider previewing this sees the same set:
 * there is no real notion yet of which program a member expressed interest
 * in, so there is nothing to filter this list by.
 */
export const DUMMY_INTERESTED: readonly DummyInterest[] = [
  { person: DUMMY_MEMBERS[0]!, programLabel: 'GED classes', interestedAt: hoursAgo(5) },
  { person: DUMMY_MEMBERS[1]!, programLabel: 'Computer skills', interestedAt: daysAgo(1) },
  { person: DUMMY_MEMBERS[3]!, programLabel: 'GED classes', interestedAt: daysAgo(4) },
];

export interface DummySelf {
  readonly firstName: string;
  readonly regionName: string;
  readonly orgName?: string;
}

/**
 * Who "you" are, for a role nobody has actually signed up as yet.
 *
 * The account screen shows the *signed-in* person's own name, role and city —
 * and until a real member, program or case manager account exists, a super
 * admin previewing one of those roles from Home was shown their own name
 * under somebody else's role badge, which is a worse demonstration than
 * showing nobody at all. `super_admin` has no entry: a super admin previewing
 * "Super admin" is just looking at their own real account, which needs no
 * stand-in.
 */
export const DUMMY_SELF: Partial<Record<Role, DummySelf>> = {
  member: { firstName: 'Jordan', regionName: 'Philadelphia' },
  provider: { firstName: 'Sandra', regionName: 'Philadelphia', orgName: 'Example Learning Center' },
  admin: { firstName: 'Teresa', regionName: 'Philadelphia' },
};
