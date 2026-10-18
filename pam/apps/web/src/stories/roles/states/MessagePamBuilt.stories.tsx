import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * Message Pam, the person's side (Will, 18 October 2026, D-605): the conversation every account has from the first load,
 * starting with Pam's welcome; the automatic reply outside Pam's hours; and a message that did not go. Each is a story so
 * the language-fit audit measures it in every language at 320 (D-422).
 */
const meta = { title: 'Member/Created/States/Message Pam' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const PAM = 'c0000000-0000-4000-8000-0000000000a1';

function pam(name: string, pamThread: 'welcome' | 'away' | 'notSent', pathname = '/messages/thread/', query: Record<string, string> = { id: PAM }): Story {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname}`);
  return { ...asRole('member', pathname, query, { pamThread }), name, render: () => <>{route.render()}</> };
}

/** Messages with Pam's row on top, its first line the welcome. */
export const Row: Story = { ...asRole('member', '/messages/'), name: 'Messages — Pam first', render: () => <>{REDESIGN_ROUTES['/messages/']?.render()}</> };
export const Welcome: Story = pam('The conversation — Pam\'s welcome', 'welcome');
export const AfterHoursReply: Story = pam('The conversation — outside Pam\'s hours', 'away');
export const NotSent: Story = {
  ...pam('The conversation — a message that did not go', 'notSent'),
  play: async ({ canvasElement }) => {
    const box = await new Promise<HTMLElement>((resolve) => {
      const look = () => {
        const el = canvasElement.querySelector<HTMLElement>('.astryx-chat-composer-input [contenteditable="true"]');
        if (el) resolve(el);
        else setTimeout(look, 100);
      };
      look();
    });
    box.focus();
    document.execCommand('insertText', false, 'Can someone call me about my program?');
    await new Promise((resolve) => setTimeout(resolve, 300));
    canvasElement.querySelector<HTMLElement>('button[aria-label^="Send"], button[aria-label*="send" i]')?.click();
  },
};
