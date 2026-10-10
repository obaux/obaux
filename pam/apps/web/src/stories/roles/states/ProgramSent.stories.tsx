import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProgramReviewView } from '../../../screens/ProgramReviewView';
import { asRole, withSetup } from '../../journeys/journey';

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
  ...withSetup(asRole('provider', '/program/'), { done: ['program'] }),
  name: 'Just sent',
  render: () => <ProgramReviewView isCelebrating />,
};
/** The Program tab, coming back to it while the program is still being checked. */
export const UnderReview: Story = {
  ...withSetup(asRole('provider', '/program/'), { done: ['program'] }),
  name: 'Under review (the Program tab)',
  render: () => <ProgramReviewView status="review" hasPhoto={false} />,
};
/** After three days: honest about the wait, with a way to ask Pam (D-381). */
export const TakingLonger: Story = {
  ...withSetup(asRole('provider', '/program/'), { done: ['program'] }),
  name: 'Taking longer than usual',
  render: () => <ProgramReviewView status="late" hasPhoto={false} />,
};
/** Pam asked for changes (D-381): the step in amber, what to change, one button to fix it. */
export const NeedsChanges: Story = {
  ...withSetup(asRole('provider', '/program/'), { done: ['program'] }),
  name: 'Pam asked for changes',
  render: () => (
    <ProgramReviewView status="changes" changes="Add the street address members should go to, and your opening hours." />
  ),
};
export const Spanish: Story = { ...UnderReview, name: 'Spanish', globals: { locale: 'es' } };
