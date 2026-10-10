import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { MarqueeText } from '@pam/ui/MarqueeText';

/**
 * One line of words that slides to show its end when it is cut off (D-407):
 * Stuff shared's titles, so a long file name can be read to the end. Once
 * each time it comes into view, five seconds at most (WCAG 2.2.2); never
 * with reduced motion. Words that fit do not move.
 */
const styles = stylex.create({
  column: { width: '260px' },
  name: { fontSize: '18px', lineHeight: 1.35 },
});

const meta = {
  title: 'Components/Text/MarqueeText',
  tags: ['autodocs'],
  component: MarqueeText,
  args: { children: 'Marcus Johnson resume for the warehouse job at the North Philadelphia distribution center.docx' },
  render: (args) => (
    <VStack gap={3} xstyle={styles.column}>
      <MarqueeText {...args} xstyle={styles.name} />
    </VStack>
  ),
} satisfies Meta<typeof MarqueeText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cut off: it slides left to show "…center.docx", holds, and slides back. */
export const CutOff: Story = {};

/** Fits: nothing moves. */
export const Fits: Story = { args: { children: 'ID office letter.pdf' } };
