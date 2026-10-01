import type { Meta, StoryObj } from '@storybook/nextjs';
import PrivacyPage from '../../app/privacy/page';
import { asRole } from './journey';

/** Plain-language privacy. */
const meta = {
  title: 'Journeys/18 Privacy',
  component: PrivacyPage,
} satisfies Meta<typeof PrivacyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = asRole('signed-out', '/privacy/');
