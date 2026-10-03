import type { StoryObj } from '@storybook/nextjs';
import { asRole } from '../journeys/journey';
import type { JourneyRole } from '../journeys/fixtures';
import { REDESIGN_ROUTES } from '../prototype/routes';

/**
 * One screen of the app, as one kind of person sees it (D-217): the route's
 * own screen, signed in against the pretend database, inside the clickable
 * prototype — so every tap from here goes where it would on a phone, on the
 * redesign.
 */
export function screen(
  role: JourneyRole,
  name: string,
  pathname: string,
  query: Record<string, string> = {},
): StoryObj {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  return { ...asRole(role, pathname, query), name, render: () => <>{route.render()}</> };
}
