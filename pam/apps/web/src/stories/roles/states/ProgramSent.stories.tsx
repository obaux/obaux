import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProgramReviewView } from '../../../screens/ProgramReviewView';
import { asRole } from '../../journeys/journey';

/**
 * Sent to Pam (D-379): a program a lead has just added, while a super admin
 * checks it. Confetti the moment it is sent; afterwards it is the Program tab
 * until the program is approved. Back goes Home, where Add a program is no
 * longer offered.
 */
const meta = {
  title: 'Program lead/States/Program — sent for review',
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** Right after Add program: the celebration. */
export const JustSent: Story = {
  ...asRole('provider', '/program/'),
  name: 'Just sent',
  render: () => <ProgramReviewView isCelebrating />,
};
/** The Program tab, coming back to it while the program is still being checked. */
export const UnderReview: Story = {
  ...asRole('provider', '/program/'),
  name: 'Under review (the Program tab)',
  render: () => <ProgramReviewView />,
};
export const Spanish: Story = { ...UnderReview, name: 'Spanish', globals: { locale: 'es' } };
