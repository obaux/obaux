import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { CONVO_ID } from '../../journeys/fixtures';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * Blocking, from a conversation's ⋯ menu (0076, D-206, D-463). A Block row asks
 * first ("Block this person?", one button, "Not now"), says what a block does and
 * that it can be undone from the same place; afterwards, in the conversation, the
 * composer gives way to a notice for whoever blocked and for whoever was blocked.
 * What was said stays on the screen and can still be reported. Same pretend
 * database as every other story; nothing is written.
 */
const meta = { title: 'Member/Created/States/Blocking' } satisfies Meta;

export default meta;
type Story = StoryObj;

function at(name: string, pathname: string, blocked?: 'mine' | 'theirs'): Story {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  return {
    ...asRole('member', pathname, { id: CONVO_ID }, blocked ? { blocked } : {}),
    name,
    render: () => <>{route.render()}</>,
  };
}

/** The ⋯ menu with its Block row; tap it for the confirmation. */
export const Menu: Story = at('The ⋯ menu', '/messages/thread/options/');
/** After blocking: the same row now says Unblock. */
export const MenuBlocked: Story = at('The ⋯ menu — already blocked', '/messages/thread/options/', 'mine');
/** I blocked them: the composer says so and how to undo it. */
export const ConversationBlockedByMe: Story = at('Conversation — I blocked them', '/messages/thread/', 'mine');
/** They blocked me: I can read, and the notice says so plainly. */
export const ConversationBlockedMe: Story = at('Conversation — they blocked me', '/messages/thread/', 'theirs');
