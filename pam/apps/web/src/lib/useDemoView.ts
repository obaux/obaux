import type { SessionState } from './useSession';

/**
 * Whether this signed-in account has the demo view a super admin can grant
 * from the Everyone list (0057).
 *
 * A screen that already shows its example/dummy data set when its real query
 * comes back genuinely empty (`USE_DUMMY_PEOPLE`, `@pam/config/dummy-flag`)
 * ORs this in alongside that check, so the account sees the same example
 * data whether or not it has anything real yet. Not a new data set of its
 * own — the example content is the one thing this reuses.
 */
export function useDemoView(session: SessionState): boolean {
  return session.status === 'signed-in' && session.session.isDemo;
}
