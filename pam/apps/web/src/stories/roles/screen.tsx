import type { StoryObj } from '@storybook/nextjs';
import { asRole } from '../journeys/journey';
import type { JourneyRole } from '../journeys/fixtures';
import { PrototypeApp } from '../prototype/PrototypeApp';
import { REDESIGN_ROUTES, redesignChrome } from '../prototype/routes';

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

/**
 * One screen whose state is picked with the story's controls (D-305): `toQuery`
 * turns the controls into the screen's address, and the prototype starts
 * there again whenever a control changes — so one story shows each version
 * of a screen rather than one story per version.
 */
export function screenWithControls<A extends Record<string, unknown>>(
  role: JourneyRole,
  name: string,
  pathname: string,
  controls: { readonly args: A; readonly argTypes: StoryObj['argTypes'] },
  toQuery: (args: A) => Record<string, string>,
): StoryObj {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  const base = asRole(role, pathname, toQuery(controls.args));
  return {
    ...base,
    name,
    args: controls.args,
    argTypes: controls.argTypes,
    decorators: [
      (Story, context) => {
        const query = toQuery(context.args as A);
        const search = new URLSearchParams(query).toString();
        const start = `${pathname}${search ? `?${search}` : ''}`;
        return (
          <PrototypeApp
            key={start}
            routes={REDESIGN_ROUTES}
            start={start}
            first={<Story />}
            chrome={redesignChrome(role)}
          />
        );
      },
    ],
    render: () => <>{route.render()}</>,
  };
}
