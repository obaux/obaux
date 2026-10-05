import type { Meta, StoryObj } from '@storybook/nextjs';
import { LocalTabBar } from './LocalTabBar';

/**
 * The bottom navigation (D-210, D-218). A member: Explore, Saved, Trips,
 * Messages, Profile. A case manager: Home, Saved, Messages, Profile. A program
 * lead: Home, Program, Messages, Profile. Help is in each screen's header.
 */
const meta = {
  title: 'Components/TabBar',
  component: LocalTabBar,
  args: { current: 'explore', unread: true },
  argTypes: {
    current: { control: 'inline-radio', options: ['explore', 'saved', 'trips', 'program', 'messages', 'profile', null] },
    role: { control: 'inline-radio', options: ['member', 'admin', 'provider'] },
  },
} satisfies Meta<typeof LocalTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnExplore: Story = {};
export const OnSaved: Story = { args: { current: 'saved' } };
export const OnTrips: Story = { args: { current: 'trips' } };
export const OnMessages: Story = { args: { current: 'messages', unread: false } };
export const OnProfile: Story = { args: { current: 'profile' } };
export const NothingUnread: Story = { args: { unread: false } };
export const CaseManager: Story = { args: { role: 'admin', current: 'saved', name: 'Dana' } };
export const ProgramLead: Story = { args: { role: 'provider', current: 'program', name: 'Alice' } };
