import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * A member a case manager invited (D-254, D-325): they arrive by a link,
 * so Sign in says who invited them and About you asks for no code and no
 * "which one fits you best". Only those screens are here; everything else
 * is under Member › Created.
 */
const meta = { title: 'Member/Invited by case manager' } satisfies Meta;

export default meta;
type Story = StoryObj;

const INVITE = { invite: 'PAM-7Q4K', as: 'member' };

export const SignIn: Story = screen('member', 'Sign in — invited', '/prototype/signin/', INVITE);
export const AboutYou: Story = screen('member', 'About you — no code to type', '/prototype/join/', {
  kind: 'member',
  invite: 'PAM-7Q4K',
  step: 'details',
});
export const WholeWay: Story = screen('member', 'The whole way in', '/prototype/signin/', { ...INVITE, next: 'join' });
