import type { Meta, StoryObj } from '@storybook/nextjs';
import JoinPage from '../../app/join/page';
import { asRole } from './journey';

/** Five steps, an invite code optional. */
const meta = {
  title: 'Journeys/02 Sign up',
  component: JoinPage,
} satisfies Meta<typeof JoinPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = asRole('signed-out', '/join/');
