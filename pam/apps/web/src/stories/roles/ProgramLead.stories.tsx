import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * A program lead's app, screen by screen (D-217, D-218). Their bar is Home
 * (who is coming in — day, week or month — with Invite someone in its + menu),
 * Program (their listing, with Edit), Messages and Profile. All programs and
 * Add a program are a Profile row away.
 */
const meta = { title: 'Program lead/Screens' } satisfies Meta;

export default meta;
type Story = StoryObj;

export const Home: Story = screen('provider', 'Home — coming in', '/');
export const Program: Story = screen('provider', 'Program', '/program/');
export const Policies: Story = screen('provider', 'Policies for participants', '/program/policies/');
export const Policy: Story = screen('provider', 'A policy', '/program/policies/view/', { id: 'policy-confidentiality' });
export const Messages: Story = screen('provider', 'Messages', '/messages/');
export const Profile: Story = screen('provider', 'Profile', '/profile/');
export const Member: Story = screen('provider', 'A member', '/person/', { id: 'dummy-m1' });
export const Invite: Story = screen('provider', 'Invite someone', '/invite/');
export const AllPrograms: Story = screen('provider', 'All programs', '/programs/');
export const AddProgram: Story = screen('provider', 'Add a program', '/programs/new/');
export const Notifications: Story = screen('provider', 'Notifications', '/notifications/');
export const Place: Story = screen('provider', 'A place', '/place/', { id: 'dummy-place-learning', from: 'explore' });
export const TextAlerts: Story = screen('provider', 'Text alerts', '/alerts/');
export const GetHelp: Story = screen('provider', 'Get help', '/help/');
