import type { StoryObj } from '@storybook/nextjs';
import { PrototypeApp, prototypeRouter } from '../prototype/PrototypeApp';
import { REDESIGN_ROUTES, TODAY_ROUTES, redesignChrome } from '../prototype/routes';
import { ROLES, type JourneyRole } from './fixtures';
import { installSupabaseMock } from './mockSupabase';

/**
 * One screen, signed in as one kind of person. The loader runs before the
 * screen mounts, so its first query already meets the pretend database.
 *
 * Every journey is clickable (D-212): the screen opens as the story draws it,
 * inside the prototype's router, so a tap on a card, a link or Back goes to
 * the app's next screen instead of a 404. Walking the whole app from one
 * place is still `Prototype/*`; this is so no journey is a dead end either.
 */
export function asRole(
  role: JourneyRole,
  pathname: string,
  query: Record<string, string> = {},
  redesign = false,
): StoryObj {
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
      (Story) =>
        redesign ? (
          <PrototypeApp routes={REDESIGN_ROUTES} start={start} first={<Story />} chrome={redesignChrome(role)} />
        ) : (
          <PrototypeApp routes={TODAY_ROUTES} start={start} first={<Story />} />
        ),
    ],
    parameters: {
      nextjs: { appDirectory: true, navigation: { pathname, query, ...prototypeRouter } },
    },
  };
}

/**
 * A redesigned screen (D-210, D-212): as `asRole`, but its taps lead through
 * the redesign's routes, under the new bottom bar.
 */
export function asRedesign(role: JourneyRole, pathname: string, query: Record<string, string> = {}): StoryObj {
  return asRole(role, pathname, query, true);
}
