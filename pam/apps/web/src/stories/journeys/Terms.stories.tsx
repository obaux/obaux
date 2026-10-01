import type { Meta, StoryObj } from '@storybook/nextjs';
import TermsPage from '../../app/terms/page';
import { asRole } from './journey';

/** Plain-language terms. */
const meta = {
  title: 'Journeys/19 Terms',
  component: TermsPage,
} satisfies Meta<typeof TermsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = asRole('signed-out', '/terms/');
