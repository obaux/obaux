import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { CONVO_ID } from '../../journeys/fixtures';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * A limited account (Will, 9 October, D-413, D-426): the member can read their
 * messages but not send or start one, and the terms promise "Pam tells you it
 * is off and who to call" (terms.s.limits.p3).
 *
 * Messages drops the New message button and says what is off; a conversation
 * keeps every message and puts the notice, with the call button, where the
 * composer would be. Same pretend database as every other story, with the
 * member's `access_status` set to `limited`.
 */
const meta = { title: 'Member/Created/States/Limited account' } satisfies Meta;

export default meta;
type Story = StoryObj;

function limited(name: string, pathname: string, query: Record<string, string> = {}): Story {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  return { ...asRole('member', pathname, query, { limited: true }), name, render: () => <>{route.render()}</> };
}

export const Messages: Story = limited('Messages', '/messages/');
export const Conversation: Story = limited('A conversation', '/messages/thread/', { id: CONVO_ID });
export const ConversationSpanish: Story = { ...Conversation, name: 'A conversation — Spanish', globals: { locale: 'es' } };
