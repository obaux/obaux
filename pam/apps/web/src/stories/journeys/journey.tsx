import type { StoryObj } from '@storybook/nextjs';
import { PrototypeApp, prototypeRouter } from '../prototype/PrototypeApp';
import { REDESIGN_ROUTES, redesignChrome } from '../prototype/routes';
import { ROLES, type JourneyRole } from './fixtures';
import { installSupabaseMock } from './mockSupabase';
import { markFreshAccount, markSetupDone, type SetupStep } from '../../lib/programSetup';
import { addTrip, type AddedTrip } from '../../lib/addedTrips';

/**
 * One screen, signed in as one kind of person. The loader runs before the
 * screen mounts, so its first query already meets the pretend database.
 *
 * Every screen is clickable (D-212) and on the redesign (D-217): it opens
 * inside the prototype's router, under the new bottom bar where the screen
 * is a tab, so a tap on a card, a link or Back goes to the app's next screen
 * as it now looks — never to the old design, and never to a 404.
 */
export function asRole(role: JourneyRole, pathname: string, query: Record<string, string> = {}): StoryObj {
  const search = new URLSearchParams(query).toString();
  const start = `${pathname}${search ? `?${search}` : ''}`;
  return {
    name: ROLES[role].title,
    loaders: [
      async () => {
        installSupabaseMock(role);
        return {};
      },
    ],
    decorators: [
      (Story) => (
        <PrototypeApp routes={REDESIGN_ROUTES} start={start} first={<Story />} chrome={redesignChrome(role)} />
      ),
    ],
    parameters: {
      nextjs: { appDirectory: true, navigation: { pathname, query, ...prototypeRouter } },
    },
  };
}

/** The same as `asRole` — kept so the older stories read as they did. */
export const asRedesign = asRole;

/**
 * A program lead part-way through getting started (D-352): a fresh account
 * (no example data), the steps it has done, and any visits it has booked —
 * set after the pretend database is installed, which clears the tab first.
 */
export function withSetup(
  story: StoryObj,
  state: { readonly done?: readonly SetupStep[]; readonly booked?: readonly AddedTrip[] },
): StoryObj {
  return {
    ...story,
    loaders: [
      ...((story.loaders as StoryObj['loaders'][] | undefined) ?? []).flat(),
      async () => {
        markFreshAccount();
        for (const step of state.done ?? []) markSetupDone(step);
        for (const trip of state.booked ?? []) addTrip(trip);
        return {};
      },
    ],
  } as StoryObj;
}
