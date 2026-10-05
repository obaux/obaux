import type { Meta, StoryObj } from '@storybook/nextjs';
import { CONVO_ID } from '../journeys/fixtures';
import { screen } from './screen';

/**
 * A case manager's app, screen by screen (D-217, D-218). Their bar is Home
 * (their caseload, a star on each person, Invite someone floating above the
 * bar), Saved (starred people and saved programs), Messages and Profile.
 * All programs and Add a program are a Profile row away.
 */
const meta = { title: 'Case manager/Screens' } satisfies Meta;

export default meta;
type Story = StoryObj;

export const Home: Story = screen('case-manager', 'Home — your members', '/');
export const Saved: Story = screen('case-manager', 'Saved — starred people', '/saved/');
export const Messages: Story = screen('case-manager', 'Messages', '/messages/');
export const Profile: Story = screen('case-manager', 'Profile', '/profile/');
export const Member: Story = screen('case-manager', 'A member', '/person/', { id: 'dummy-m1' });
export const MemberWithNewMessages: Story = screen('case-manager', 'A member with new messages', '/person/', {
  id: 'dummy-m2',
});
export const MemberPastTrips: Story = screen('case-manager', 'A member’s past trips', '/person/past/', {
  id: 'dummy-m1',
});
export const MemberSaved: Story = screen('case-manager', 'Programs a member saved', '/person/saved/', {
  id: 'dummy-m1',
});
export const ConnectMember: Story = screen('case-manager', 'Connect a member to a program', '/person/connect/', {
  id: 'dummy-m1',
});
export const Invite: Story = screen('case-manager', 'Invite someone', '/invite/');
export const AllPrograms: Story = screen('case-manager', 'All programs', '/programs/');
export const AddProgram: Story = screen('case-manager', 'Add a program', '/programs/new/');
export const Conversation: Story = screen('case-manager', 'A conversation', '/messages/thread/', { id: CONVO_ID });
export const Notifications: Story = screen('case-manager', 'Notifications', '/notifications/');
export const Place: Story = screen('case-manager', 'A place', '/place/', { id: 'dummy-place-learning', from: 'explore' });
export const TextAlerts: Story = screen('case-manager', 'Text alerts', '/alerts/');
export const GetHelp: Story = screen('case-manager', 'Get help', '/help/');
