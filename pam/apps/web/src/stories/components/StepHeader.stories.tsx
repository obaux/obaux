import type { Meta, StoryObj } from '@storybook/nextjs';
import { Page, StepHeader } from '@pam/ui';

/**
 * The top of every step in a multi-step flow (sign-up above all): "Step 2 of
 * 5" as words and as a bar, then the step's plain-language title. Use it so
 * people always know how much is left.
 */
const meta = {
  title: 'Components/Navigation/StepHeader',
  tags: ['autodocs'],
  component: StepHeader,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
  args: {
    current: 2,
    total: 5,
    title: 'Where do you want help?',
    progressLabel: 'Step 2 of 5',
  },
  argTypes: {
    current: { control: { type: 'number', min: 0, max: 10, step: 1 } },
    total: { control: { type: 'number', min: 1, max: 10, step: 1 } },
  },
} satisfies Meta<typeof StepHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FirstStep: Story = {
  args: { current: 1, total: 5, title: 'What should we call you?', progressLabel: 'Step 1 of 5' },
};

export const LastStep: Story = {
  args: { current: 5, total: 5, title: 'Pick a time to meet Jordan', progressLabel: 'Step 5 of 5' },
};

/** A short flow — planning a trip. */
export const ShortFlow: Story = {
  args: { current: 2, total: 3, title: 'When do you want to go?', progressLabel: 'Step 2 of 3' },
};

/** A long title wraps rather than clipping. */
export const LongTitle: Story = {
  args: {
    current: 3,
    total: 5,
    title: 'Which of these would help you most right now?',
    progressLabel: 'Step 3 of 5',
  },
};
