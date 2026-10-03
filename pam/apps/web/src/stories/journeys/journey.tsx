import type { StoryObj } from '@storybook/nextjs';
import { PrototypeApp, prototypeRouter } from '../prototype/PrototypeApp';
import { REDESIGN_ROUTES, redesignChrome } from '../prototype/routes';
import { ROLES, type JourneyRole } from './fixtures';
import { installSupabaseMock } from './mockSupabase';

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
