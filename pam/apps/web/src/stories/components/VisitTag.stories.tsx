import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { VisitTag } from '@pam/ui/VisitTag';

const styles = stylex.create({
  picture: {
    position: 'relative',
    width: '160px',
    height: '120px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-background-muted)',
  },
});

/** A booked visit's day and time as one small chip — use it wherever a place is shown with a visit, inline or pinned to a picture's corner. */
const meta = {
  title: 'Components/Feedback/VisitTag',
  tags: ['autodocs'],
  component: VisitTag,
  args: {
    label: 'Oct 7 · 10:00 AM',
    isOverlay: false,
  },
} satisfies Meta<typeof VisitTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Pinned in a picture's top-left corner, as on Saved (needs a positioned parent). */
export const Overlay: Story = {
  args: { isOverlay: true },
  decorators: [
    (Story) => (
      <VStack xstyle={styles.picture}>
        <Story />
      </VStack>
    ),
  ],
};

/** A longer label stays on one line and ends in "…" when space runs out. */
export const LongLabel: Story = { args: { label: 'Wednesday, October 14 · 10:00 AM' } };
