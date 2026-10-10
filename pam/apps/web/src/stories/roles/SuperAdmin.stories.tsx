import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * The super admin's app, screen by screen (D-217). Home is the requests
 * waiting on them (D-257); from a request they can look at the program it
 * describes and text the person, and in Messages they talk with staff
 * (D-262). Everyone, Programs and "See the app as" are Profile rows.
 */
const meta = { title: 'Super admin/Screens' } satisfies Meta;

export default meta;
type Story = StoryObj;

export const Home: Story = screen('super-admin', 'Home — Requests', '/');
export const Messages: Story = screen('super-admin', 'Messages', '/messages/');
export const Profile: Story = screen('super-admin', 'Profile', '/profile/');
export const Everyone: Story = screen('super-admin', 'Everyone', '/directory/');
export const Requests: Story = screen('super-admin', 'Staff requests', '/requests/');
export const RequestReview: Story = screen('super-admin', 'A request to review', '/requests/review/', { id: 'r-2' });
export const RequestProgram: Story = screen('super-admin', 'A requested program', '/requests/program/', { id: 'r-2' });
export const Thread: Story = screen('super-admin', 'A conversation with a case manager', '/messages/thread/', {
  id: 'dummy-conv-dummy-a1-dummy-s1',
});
/** From a program's page, "Message Sandra" (D-349): a new thread with its lead. */
export const ThreadWithProgramLead: Story = screen('super-admin', 'A conversation with a program lead', '/messages/thread/', {
  id: 'dummy-conv-dummy-p1-dummy-s1',
  from: 'place',
  place: 'dummy-place-learning',
});
export const InvitesLog: Story = screen('super-admin', 'Invited people', '/invites/');
export const Invite: Story = screen('super-admin', 'Invite someone', '/invite/');
export const InviteOne: Story = screen('super-admin', 'A link for a member', '/invite/new/', { role: 'member' });
export const InviteCaseManager: Story = screen('super-admin', 'A link for a case manager', '/invite/new/', { role: 'admin' });
export const ViewAs: Story = screen('super-admin', 'See the app as', '/view-as/');
export const Person: Story = screen('super-admin', 'A person', '/person/', { id: 'dummy-m1' });
export const Notifications: Story = screen('super-admin', 'Notifications', '/notifications/');
export const Place: Story = screen('super-admin', 'A place', '/place/', { id: 'dummy-place-learning', from: 'explore' });
