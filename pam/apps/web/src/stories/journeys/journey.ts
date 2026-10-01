import type { StoryObj } from '@storybook/nextjs';
import { ROLES, type JourneyRole } from './fixtures';
import { installSupabaseMock } from './mockSupabase';

/**
 * One screen, signed in as one kind of person. The loader runs before the
 * screen mounts, so its first query already meets the pretend database.
 */
export function asRole(
  role: JourneyRole,
  pathname: string,
  query: Record<string, string> = {},
): StoryObj {
  return {
    name: ROLES[role].title,
    loaders: [
      async () => {
        installSupabaseMock(role);
        return {};
      },
    ],
    parameters: {
      nextjs: { appDirectory: true, navigation: { pathname, query } },
    },
  };
}
