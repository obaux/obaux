import type { Meta, StoryObj } from '@storybook/nextjs';
import { LocalTabBar } from './LocalTabBar';

/**
 * The member app's bottom dock (D-029, D-039): five tabs and Help in one
 * fixed bar. Not mounted in the app yet — this is where it is being shaped.
 */
const meta = {
  title: 'Shell/TabBar',
  component: LocalTabBar,
  args: { current: 'home' },
  argTypes: {
    current: { control: 'inline-radio', options: ['home', 'places', 'people', 'plan', 'me', null] },
  },
} satisfies Meta<typeof LocalTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnHome: Story = {};
export const OnPlaces: Story = { args: { current: 'places' } };
export const OnPeople: Story = { args: { current: 'people' } };
export const OnMyPlan: Story = { args: { current: 'plan' } };
export const OnMe: Story = { args: { current: 'me' } };
export const NoTabSelected: Story = { args: { current: null } };
