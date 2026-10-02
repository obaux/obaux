import type { Meta, StoryObj } from '@storybook/nextjs';
import { CONVO_ID } from '../journeys/fixtures';
import { screen } from './screen';

/**
 * A case manager's app, screen by screen (D-217). Home is their caseload
 * (D-212); a member opens onto their page; inviting someone moved from the
 * old home's tiles to a Profile row.
 */
const meta = { title: 'Case manager/Screens' } satisfies Meta;

export default meta;
type Story = StoryObj;

export const Home: Story = screen('case-manager', 'Home — your members', '/');
export const Messages: Story = screen('case-manager', 'Messages', '/messages/');
export const Profile: Story = screen('case-manager', 'Profile', '/profile/');
export const Member: Story = screen('case-manager', 'A member', '/person/', { id: 'dummy-m1' });
export const Invite: Story = screen('case-manager', 'Invite someone', '/admin/');
export const Conversation: Story = screen('case-manager', 'A conversation', '/messages/thread/', { id: CONVO_ID });
export const Notifications: Story = screen('case-manager', 'Notifications', '/notifications/');
export const Place: Story = screen('case-manager', 'A place', '/place/', { id: 's1', from: 'explore' });
export const Reminders: Story = screen('case-manager', 'Text reminders', '/reminders/');
export const GetHelp: Story = screen('case-manager', 'Get help', '/help/');
