import type { Meta, StoryObj } from '@storybook/nextjs';
import { LocalTabBar } from './LocalTabBar';

/**
 * The bottom navigation (D-210): Explore, Saved, Trips, Messages, Profile.
 * Help is in each screen's header now, not in this bar.
 */
const meta = {
  title: 'Components/TabBar',
  component: LocalTabBar,
  args: { current: 'explore', unread: true },
  argTypes: {
    current: { control: 'inline-radio', options: ['explore', 'saved', 'trips', 'messages', 'profile', null] },
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
