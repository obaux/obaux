import type { Meta, StoryObj } from '@storybook/nextjs';
import type { ReactNode } from 'react';
import type { TabKey } from '@pam/ui/TabBar';
import PlacesPage from '../../app/places/page';
import SavedPage from '../../app/saved/page';
import MessagesPage from '../../app/messages/page';
import { ProfileView } from '../../screens/ProfileView';
import { TripsView } from '../../screens/TripsView';
import { asRole } from '../journeys/journey';
import { HeaderActions } from './HeaderActions';
import { LocalTabBar } from './LocalTabBar';

/**
 * The member app in the redesign's frame (D-210): a screen, signed in as a
 * member against the pretend database, above the new bottom bar.
 *
 * Profile and Trips are the redesigned screens. Explore, Saved and Messages
 * still show today's screens (their own header, their own Help) — the next
 * ones Will is sending references for.
 */
function MemberApp({ screen, tab }: { readonly screen: () => ReactNode; readonly tab: TabKey }) {
  return (
    <>
      {screen()}
      <LocalTabBar current={tab} />
    </>
  );
}

const meta = {
  title: 'Shell/Member app',
  component: MemberApp,
} satisfies Meta<typeof MemberApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Profile: Story = {
  ...asRole('member', '/profile/'),
  name: 'Profile',
  args: {
    tab: 'profile',
    screen: () => (
      <ProfileView
        name="Marcus"
        role="member"
        points={400}
        savedCount={3}
        connectionsCount={2}
        remindersOn={false}
        headerActions={<HeaderActions />}
      />
    ),
  },
};
export const Trips: Story = {
  ...asRole('member', '/trips/'),
  name: 'Trips',
  args: { tab: 'trips', screen: () => <TripsView headerActions={<HeaderActions />} /> },
};
export const Explore: Story = {
  ...asRole('member', '/places/'),
  name: 'Explore (today’s Places)',
  args: { tab: 'explore', screen: () => <PlacesPage /> },
};
export const Saved: Story = {
  ...asRole('member', '/saved/'),
  name: 'Saved (today’s screen)',
  args: { tab: 'saved', screen: () => <SavedPage /> },
};
export const Messages: Story = {
  ...asRole('member', '/messages/'),
  name: 'Messages (today’s screen)',
  args: { tab: 'messages', screen: () => <MessagesPage /> },
};
