import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * A member a program brought in (D-322, D-325): the program booked their
 * first visit and Pam texted them a link. Only the screens that path
 * changes are here — the invited Sign in, and the end of signing up, which
 * is that visit. Everything else is under Member › Created.
 */
const meta = { title: 'Member/Invited by program' } satisfies Meta;

export default meta;
type Story = StoryObj;

const INVITE = { invite: 'PAM-7Q4K', as: 'member', trip: 'dummy-trip-1' };

export const SignIn: Story = screen('member', 'Sign in — invited', '/prototype/signin/', INVITE);
export const VisitBooked: Story = screen('member', 'Your visit is booked', '/prototype/join/', {
  kind: 'member',
  invite: 'PAM-7Q4K',
  trip: 'dummy-trip-1',
  step: 'done',
});
export const WholeWay: Story = screen('member', 'The whole way in', '/prototype/signin/', { ...INVITE, next: 'join' });
