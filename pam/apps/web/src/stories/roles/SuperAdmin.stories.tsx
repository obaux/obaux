import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * The super admin's app, screen by screen (D-217). Home is Explore — the
 * catalogue is theirs to look after (D-212). Everyone, staff requests and
 * "See the app as" (the role preview, D-108) are Profile rows.
 */
const meta = { title: 'Super admin/Screens' } satisfies Meta;

export default meta;
type Story = StoryObj;

export const Home: Story = screen('super-admin', 'Home — Explore', '/');
export const Messages: Story = screen('super-admin', 'Messages', '/messages/');
export const Profile: Story = screen('super-admin', 'Profile', '/profile/');
export const Everyone: Story = screen('super-admin', 'Everyone', '/directory/');
export const Requests: Story = screen('super-admin', 'Staff requests', '/requests/');
export const ViewAs: Story = screen('super-admin', 'See the app as', '/view-as/');
export const Person: Story = screen('super-admin', 'A person', '/person/', { id: 'dummy-m1' });
export const Notifications: Story = screen('super-admin', 'Notifications', '/notifications/');
export const Place: Story = screen('super-admin', 'A place', '/place/', { id: 's1', from: 'explore' });
