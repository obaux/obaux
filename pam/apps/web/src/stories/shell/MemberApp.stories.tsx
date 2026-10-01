import type { Meta, StoryObj } from '@storybook/nextjs';
import type { ComponentType } from 'react';
import type { TabKey } from '@pam/ui/TabBar';
import HomePage from '../../app/page';
import PlacesPage from '../../app/places/page';
import MessagesPage from '../../app/messages/page';
import AccountPage from '../../app/account/page';
import { asRole } from '../journeys/journey';
import { LocalTabBar } from './LocalTabBar';

/**
 * The whole member app: a real screen, signed in as a member against the
 * pretend database, inside the dock. Each story is one tab.
 *
 * Open question this makes visible: screens still draw their own Help (the
 * block `HelpBar`), which the dock now also carries. Once the dock ships,
 * those come off the screens it covers.
 */
function MemberApp({ screen: Screen, tab }: { readonly screen: ComponentType; readonly tab: TabKey }) {
  return (
    <>
      <Screen />
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

export const Home: Story = { ...asRole('member', '/'), name: 'Home', args: { screen: HomePage, tab: 'home' } };
export const Places: Story = { ...asRole('member', '/places/'), name: 'Places', args: { screen: PlacesPage, tab: 'places' } };
export const People: Story = { ...asRole('member', '/messages/'), name: 'People', args: { screen: MessagesPage, tab: 'people' } };
export const Me: Story = { ...asRole('member', '/account/'), name: 'Me', args: { screen: AccountPage, tab: 'me' } };
