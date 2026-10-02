import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * A program lead's app, screen by screen (D-217). Home is the people
 * interested in their program (D-212); each opens onto their page, with a
 * way to message them.
 */
const meta = { title: 'Program lead/Screens' } satisfies Meta;

export default meta;
type Story = StoryObj;

export const Home: Story = screen('provider', 'Home — interested', '/');
export const Messages: Story = screen('provider', 'Messages', '/messages/');
export const Profile: Story = screen('provider', 'Profile', '/profile/');
export const Member: Story = screen('provider', 'A member', '/person/', { id: 'dummy-m1' });
export const Notifications: Story = screen('provider', 'Notifications', '/notifications/');
export const Place: Story = screen('provider', 'A place', '/place/', { id: 's1', from: 'explore' });
export const Reminders: Story = screen('provider', 'Text reminders', '/reminders/');
export const GetHelp: Story = screen('provider', 'Get help', '/help/');
