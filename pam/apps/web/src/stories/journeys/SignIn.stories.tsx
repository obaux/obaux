import type { Meta, StoryObj } from '@storybook/nextjs';
import SignInPage from '../../app/signin/page';
import { asRole } from './journey';

/** The front door. One job: a phone number, then a code. */
const meta = {
  title: 'Journeys/01 Sign in',
  component: SignInPage,
} satisfies Meta<typeof SignInPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = asRole('signed-out', '/signin/');
